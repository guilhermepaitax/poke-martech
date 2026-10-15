import { USERNAME_PATTERN } from "@/lib/auth-form-errors";
import { formatBaseUrl } from "@/lib/format-base-url";
import {
  MIN_PASSWORD_LENGTH,
  isPasswordValid,
  unmetPasswordMessage,
} from "@/lib/password-policy";
import { container } from "@/server/container";
import { db } from "@/server/infrastructure/db/drizzle/client";
import * as schema from "@/server/infrastructure/db/drizzle/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";

const canonicalUrl = formatBaseUrl(process.env.BETTER_AUTH_URL || "");
const vercelUrl = formatBaseUrl(process.env.VERCEL_URL || "");
const productionUrl = formatBaseUrl(
  process.env.VERCEL_PROJECT_PRODUCTION_URL || "",
);
const formattedBaseUrl = canonicalUrl || productionUrl || vercelUrl;

function readPassword(body: unknown) {
  if (!body || typeof body !== "object" || !("password" in body)) return null;
  return typeof body.password === "string" ? body.password : null;
}

function hasImageUseConsent(body: unknown) {
  return (
    !!body &&
    typeof body === "object" &&
    "imageUseConsent" in body &&
    body.imageUseConsent === true
  );
}

function readString(body: unknown, key: string) {
  if (!body || typeof body !== "object") return "";
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "development-only-secret-change-me",
  baseURL: formattedBaseUrl
    ? formattedBaseUrl
    : {
        allowedHosts: ["localhost", "127.0.0.1"],
        fallback: "http://localhost:3000",
        protocol: "https",
      },
  trustedOrigins: [
    ...new Set(
      [
        formattedBaseUrl,
        vercelUrl,
        productionUrl,
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter((origin) => origin.length > 0),
    ),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      if (!hasImageUseConsent(ctx.body)) {
        throw APIError.from("BAD_REQUEST", {
          code: "IMAGE_USE_CONSENT_REQUIRED",
          message: "Aceite o uso da sua imagem para criar a conta.",
        });
      }
      if (!readString(ctx.body, "name")) {
        throw APIError.from("BAD_REQUEST", {
          code: "INVALID_NAME",
          message: "Informe seu nome.",
        });
      }
      const username = readString(ctx.body, "username").toLowerCase();
      if (!USERNAME_PATTERN.test(username)) {
        throw APIError.from("BAD_REQUEST", {
          code: "INVALID_USERNAME",
          message:
            "Use letras minúsculas, números e hífens. Exemplo: ana-silva",
        });
      }
      const [taken] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.username, username))
        .limit(1);
      if (taken) {
        throw APIError.from("UNPROCESSABLE_ENTITY", {
          code: "USERNAME_ALREADY_EXISTS",
          message: "Esse usuário já está em uso.",
        });
      }
      const password = readPassword(ctx.body);
      if (password !== null && isPasswordValid(password)) return;
      throw APIError.from("BAD_REQUEST", {
        code: "WEAK_PASSWORD",
        message:
          unmetPasswordMessage(password ?? "") ??
          "A senha não atende aos requisitos.",
      });
    }),
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        unique: true,
      },
      bio: {
        type: "string",
        required: false,
        defaultValue: "",
      },
      imageUseConsent: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: true,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage:
        "Esta conta está suspensa. Fale com o suporte se achar que isso é um engano.",
    }),
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (typeof user.username === "string") {
            return { data: { ...user, username: user.username.toLowerCase() } };
          }
          return { data: user };
        },
        after: async (user) => {
          const result = await container.grantSignupBonus.execute({
            userId: user.id,
          });
          if (!result.ok) {
            console.error(result.error.message);
          }
        },
      },
    },
  },
});

export { auth };
