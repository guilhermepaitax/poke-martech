---
name: backend-architecture
description: Define backend/API architecture patterns using Onion/Clean Architecture inside src/server/. Use when creating, editing, or reviewing API routes, use cases, repositories, services, domain entities, or any server-side code. Covers directory structure, SOLID principles, Result pattern, port/adapter interfaces, dependency injection, and Next.js adapter layer.
---

# Backend Architecture

## Stack

- **TypeScript** strict — no `any`
- **Drizzle ORM** — persistence (PostgreSQL)
- **Zod** — input validation at adapter boundary only

## Golden Rules

- **Framework-agnostic**: nothing inside `src/server/` imports `next/*` or any framework module
- **Dependency rule**: inner layers never import from outer layers (application < infrastructure)
- **Single responsibility**: one file = one class/function/type
- **No throwing in use cases**: return `Result<T, E>` instead
- **Validation at the edge**: Zod schemas live in adapter files, not in use cases
- **All secrets stay on the server**: never return raw tokens to the client

---

## Directory Structure

```
src/
  lib/
    value-objects/           # Shared value objects (client + server)
  server/
    shared/
      result.ts              # Result<T, E> type
      app-error.ts           # Base AppError class + subclasses
    application/
      entities/              # Business entities (pure TS, no deps)
      use-cases/             # One file per use case (SRP)
        jira/
        azure/
      contracts/             # Interfaces (ports)
        repositories/        # Data access abstractions
        services/            # External service abstractions
    infrastructure/
      db/
        drizzle/
          client.ts          # Drizzle DB instance
          schema/            # Table definitions
          migrations/        # SQL files (drizzle-kit)
          repositories/      # Repository implementations
      encryption/            # Encryption service implementation
      services/              # HTTP clients (Jira, Azure, etc.)
    adapters/
      next/
        http-adapter.ts      # Generic Next.js route adapter
    container.ts             # Composition root — wires all dependencies
```

### What goes where

| Layer                          | Contains                                        | May import from                 |
| ------------------------------ | ----------------------------------------------- | ------------------------------- |
| `lib/value-objects/`           | Immutable typed values shared with client       | nothing                         |
| `server/shared/`               | Result, AppError                                | nothing                         |
| `server/application/entities/` | Business entities                               | `shared/`                       |
| `server/application/`          | Use cases, contract interfaces, entities        | `shared/`, `lib/value-objects/` |
| `server/infrastructure/`       | Repository impls, service impls, DB, encryption | `shared/`, `application/`       |
| `server/adapters/`             | Next.js HTTP adapter                            | `shared/`, `application/`       |
| `container.ts`                 | Wiring only                                     | everything in `server/`         |

---

## Result Pattern

Every use case returns `Result<T, E>` — never throws.

```typescript
// src/server/shared/result.ts

type Success<T> = { value: T };
type Failure<E> = { error: false; message: E };
type Result<T, E = AppError> = Success<T> | Failure<E>;

function success<T>(value: T): Success<T> {
  return { value };
}

function err<E>(error: E): Failure<E> {
  return { error: true, message: error };
}
```

---

## AppError

```typescript
// src/server/shared/app-error.ts

class AppError {
  constructor(
    readonly code: string,
    readonly message: string,
    readonly statusCode: number = 500,
  ) {}
}

class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
  }
}
```

---

## Entities

Business entities live in `src/server/application/entities/`. They are pure TypeScript classes with no framework dependencies. Use `readonly` properties for immutability.

```typescript
// src/server/application/entities/jira-connection.ts

export class JiraConnection {
  constructor(
    readonly domain: string,
    readonly project: string,
    readonly encryptedToken: string | null,
  ) {}
}
```

```typescript
// src/server/application/entities/jira-field-mapping.ts

export class JiraFieldMapping {
  constructor(
    readonly refinaiField: string,
    readonly jiraField: string,
    readonly id?: number,
  ) {}
}
```

### Guidelines

- One entity per file
- Entities may have behavior (methods) or remain data-only
- Use cases construct entities before passing to repositories
- Repositories map database rows to/from entity instances
- Use-case outputs remain plain objects (DTOs) to avoid leaking entity internals to the client

---

## Value Objects

Value objects shared between client and server live in `src/lib/value-objects/`. They contain pure functions over typed data.

```typescript
// src/lib/value-objects/jira-domain.ts

export function jiraDomainHostForInput(stored: string): string {
  // ...
}

export function toJiraConnectionDomainUrl(input: string): string {
  // ...
}
```

---

## Contract Interface

Contracts are plain TypeScript interfaces. They define what the application layer needs without specifying how.

```typescript
// src/server/application/contracts/repositories/jira-connection-repository.ts

import type { JiraConnection } from "@/server/application/entities/jira-connection";

interface JiraConnectionRepository {
  findDefault(): Promise<JiraConnection | null>;
  upsertDefault(data: JiraConnection): Promise<void>;
}
```

```typescript
// src/server/application/contracts/services/encryption-service.ts

interface EncryptionService {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}
```

---

## Use Case

One class per use case. Receives dependencies via constructor. Returns `Result`. Constructs entities before passing to repositories. Outputs remain plain objects.

```typescript
// src/server/application/use-cases/jira/get-jira-connection.ts

import type { Result } from "@/server/shared/result";
import { success } from "@/server/shared/result";
import type { JiraConnectionRepository } from "@/server/application/contracts/repositories/jira-connection-repository";

interface GetJiraConnectionOutput {
  domain: string;
  project: string;
  hasToken: boolean;
}

class GetJiraConnection {
  constructor(private repo: JiraConnectionRepository) {}

  async execute(): Promise<Result<GetJiraConnectionOutput>> {
    const connection = await this.repo.findDefault();

    if (!connection) {
      return success({ domain: "", project: "", hasToken: false });
    }

    return success({
      domain: connection.domain,
      project: connection.project,
      hasToken: !!connection.encryptedToken,
    });
  }
}
```

### Use case with multiple dependencies

```typescript
// src/server/application/use-cases/jira/save-jira-connection.ts

import type { Result } from "@/server/shared/result";
import { ok } from "@/server/shared/result";
import { JiraConnection } from "@/server/application/entities/jira-connection";
import type { JiraConnectionRepository } from "@/server/application/contracts/repositories/jira-connection-repository";
import type { EncryptionService } from "@/server/application/contracts/services/encryption-service";

interface SaveJiraConnectionInput {
  domain: string;
  project: string;
  token?: string | null;
}

class SaveJiraConnection {
  constructor(
    private repo: JiraConnectionRepository,
    private encryption: EncryptionService,
  ) {}

  async execute(input: SaveJiraConnectionInput): Promise<Result<void>> {
    let encryptedToken: string | null = null;

    if (input.token === null) {
      encryptedToken = null;
    } else if (input.token) {
      encryptedToken = this.encryption.encrypt(input.token);
    } else {
      const existing = await this.repo.findDefault();
      encryptedToken = existing?.encryptedToken ?? null;
    }

    const entity = new JiraConnection(
      input.domain,
      input.project,
      encryptedToken,
    );
    await this.repo.upsertDefault(entity);

    return ok(undefined);
  }
}
```

---

## Repository Implementation

Implements the contract interface using Drizzle. Maps rows to/from entity instances.

```typescript
// src/server/infrastructure/db/drizzle/repositories/drizzle-jira-connection-repository.ts

import { eq } from "drizzle-orm";
import type { JiraConnectionRepository } from "@/server/application/contracts/repositories/jira-connection-repository";
import { JiraConnection } from "@/server/application/entities/jira-connection";
import { db } from "@/server/infrastructure/db/drizzle/client";
import { jiraConnections } from "@/server/infrastructure/db/drizzle/schema";

class DrizzleJiraConnectionRepository implements JiraConnectionRepository {
  async findDefault(): Promise<JiraConnection | null> {
    const rows = await db
      .select()
      .from(jiraConnections)
      .where(eq(jiraConnections.id, "default"))
      .limit(1);

    if (rows.length === 0) return null;

    return new JiraConnection(
      rows[0].domain,
      rows[0].project,
      rows[0].encryptedToken,
    );
  }

  async upsertDefault(data: JiraConnection): Promise<void> {
    await db
      .insert(jiraConnections)
      .values({
        id: "default",
        domain: data.domain,
        project: data.project,
        encryptedToken: data.encryptedToken,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: jiraConnections.id,
        set: {
          domain: data.domain,
          project: data.project,
          encryptedToken: data.encryptedToken,
          updatedAt: new Date(),
        },
      });
  }
}
```

---

## Composition Root (container)

Wires implementations to use cases. Single import for route adapters.

```typescript
// src/server/container.ts

import { DrizzleJiraConnectionRepository } from "./infrastructure/db/drizzle/repositories/drizzle-jira-connection-repository";
import { AesGcmEncryptionService } from "./infrastructure/encryption/aes-gcm";
import { GetJiraConnection } from "./application/use-cases/jira/get-jira-connection";
import { SaveJiraConnection } from "./application/use-cases/jira/save-jira-connection";

const jiraConnectionRepo = new DrizzleJiraConnectionRepository();
const encryptionService = new AesGcmEncryptionService();

export const container = {
  getJiraConnection: new GetJiraConnection(jiraConnectionRepo),
  saveJiraConnection: new SaveJiraConnection(
    jiraConnectionRepo,
    encryptionService,
  ),
  // ... all other use cases
};
```

---

## Next.js Adapter

The adapter is the **only** place where `next/server` is imported. It handles: request parsing, Zod validation, calling the use case, and mapping `Result` to `NextResponse`.

```typescript
// src/server/adapters/next/http-adapter.ts

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import type { Result } from "@/server/shared/result";
import type { AppError } from "@/server/shared/app-error";

interface AdapterOptions<T> {
  schema?: ZodSchema<T>;
}

function nextRouteAdapter<TInput, TOutput>(
  handler: (input: TInput) => Promise<Result<TOutput, AppError>>,
  options?: AdapterOptions<TInput>,
) {
  return async (req: Request) => {
    try {
      let input = undefined as TInput;

      if (options?.schema) {
        const body = await req.json();
        const parsed = options.schema.safeParse(body);
        if (!parsed.success) {
          const message = parsed.error.issues.map((i) => i.message).join(", ");
          return NextResponse.json({ error: message }, { status: 400 });
        }
        input = parsed.data;
      }

      const result = await handler(input);

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error.message },
          { status: result.error.statusCode },
        );
      }

      return NextResponse.json(result.value ?? { success: true });
    } catch {
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 },
      );
    }
  };
}
```

### Route file after refactoring

```typescript
// src/app/api/settings/jira/route.ts

import { z } from "zod";
import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const saveSchema = z.object({
  domain: z.string().min(1),
  project: z.string(),
  token: z.string().nullable().optional(),
});

export const GET = nextRouteAdapter(() =>
  container.getJiraConnection.execute(),
);

export const POST = nextRouteAdapter(
  (input) => container.saveJiraConnection.execute(input),
  { schema: saveSchema },
);
```

---

## Naming Conventions

| Artifact                | Pattern                                  | Example                                 |
| ----------------------- | ---------------------------------------- | --------------------------------------- |
| Entity file             | `noun.ts`                                | `jira-connection.ts`                    |
| Entity class            | `Noun`                                   | `JiraConnection`                        |
| Value object file       | `noun.ts`                                | `jira-domain.ts`                        |
| Use case file           | `verb-noun.ts`                           | `get-jira-connection.ts`                |
| Use case class          | `VerbNoun`                               | `GetJiraConnection`                     |
| Contract interface file | `noun-repository.ts` / `noun-service.ts` | `jira-connection-repository.ts`         |
| Contract interface      | `NounRepository` / `NounService`         | `JiraConnectionRepository`              |
| Repository impl file    | `drizzle-noun-repository.ts`             | `drizzle-jira-connection-repository.ts` |
| Repository impl class   | `DrizzleNounRepository`                  | `DrizzleJiraConnectionRepository`       |
| Service impl file       | descriptive name                         | `aes-gcm.ts`, `jira-api-client.ts`      |
| Adapter file            | `http-adapter.ts`                        | `http-adapter.ts`                       |

---

## Checklist

### Structure

- [ ] Code inside `src/server/` has zero `next/*` imports
- [ ] Use cases depend only on contracts (interfaces), never on implementations
- [ ] One use case per file with a single `execute()` method
- [ ] Drizzle schema and migrations live in `infrastructure/db/drizzle/`
- [ ] Entities live in `application/entities/` and are pure TypeScript classes
- [ ] Value objects shared with client live in `lib/value-objects/`

### Code

- [ ] Use cases return `Result<T, E>`, never throw
- [ ] Zod validation happens in adapter layer only
- [ ] Repository implementations are in `infrastructure/db/drizzle/repositories/`
- [ ] External API clients are in `infrastructure/services/`
- [ ] `container.ts` is the only file that wires implementations to use cases
- [ ] Route files are thin adapters (< 20 lines of logic)
- [ ] Use-case outputs are plain objects (DTOs), not entity instances
