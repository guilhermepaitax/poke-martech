---
name: frontend-component
description: Create React frontend components for the Refinai app following project conventions. Use when creating, editing, or reviewing UI components, hooks, or feature screens. Covers file structure, naming, Tailwind CSS v4, Base UI headless components, CVA variants, TypeScript, and hook-based logic separation.
---

# Frontend Component Creation

## Stack

- **React 19** — no `forwardRef`
- **TypeScript** strict — no `React.FC`, no `any`
- **Tailwind CSS v4** — `@theme` and CSS variables only, no hardcoded colors
- **Base UI React** (`@base-ui/react`) — headless primitives for interactive components
- **CVA** (`class-variance-authority`) — variants
- **`cn`** from `@/lib/utils` — class merging via `tailwind-merge`
- **Lucide React** or **Phosphor Icons** — icons

---

## Rules

- **No comments** of any kind inside component files
- **Named exports only** — never `export default`
- **No barrel files** (`index.ts`) inside component folders
- **No hardcoded colors** — always use CSS variable tokens
- **Props spread last**: `{...props}`
- **`data-slot`** attribute on every root element for targeting

---

## File Naming

- Always lowercase with hyphens: `user-card.tsx`, `use-modal.ts`
- Hooks: `use-[name].ts`
- Types: `[name].types.ts` (when separated)

---

## Component Structure

### Feature Component (specific to a page/feature)

Split into **multiple files** inside a named folder:

```
/components/task-card/
  task-card.tsx       ← main component, assembles parts
  task-card-header.tsx
  task-card-body.tsx
  use-task-card.ts    ← all logic/state/handlers
  task-card.types.ts  ← shared interfaces (if needed)
```

Main component only composes — no logic, no state:

```tsx
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

import { TaskCardHeader } from "./task-card-header";
import { TaskCardBody } from "./task-card-body";
import { useTaskCard } from "./use-task-card";

interface TaskCardProps extends ComponentProps<"div"> {
  taskId: string;
}

function TaskCard({ taskId, className, ...props }: TaskCardProps) {
  const { task, isLoading } = useTaskCard(taskId);

  return (
    <div
      data-slot="task-card"
      className={cn("flex flex-col gap-4 rounded-xl border border-border bg-surface p-6", className)}
      {...props}
    >
      <TaskCardHeader task={task} isLoading={isLoading} />
      <TaskCardBody task={task} />
    </div>
  );
}

export { TaskCard };
```

### Generic UI Component

Single file in `/components/ui/` using **Compound Components**:

```tsx
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("bg-surface flex flex-col gap-6 rounded-xl border border-border p-6 shadow-sm", className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={className} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
```

---

## Hooks

Extract all state, effects, event handlers, and data fetching into custom hooks:

```ts
import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/services/task";

function useTaskCard(taskId: string) {
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTask(taskId),
  });

  return { task, isLoading };
}

export { useTaskCard };
```

- Always `useQuery` / `useMutation` for API calls — never `fetch` inside components
- Expose only what the component needs — no raw query objects unless required
- One hook file per feature component (can call other hooks internally)
- **Never** `useEffect + setState` to sync server data into local state (`react-hooks/set-state-in-effect` will fail). Use the draft-override pattern instead — see [tanstack-query.md](tanstack-query.md)

---

## API Layer Structure

```
src/types/feature-name.ts       ← TypeScript interfaces
src/services/feature-name.ts    ← async fetch functions (throw on error)
src/hooks/use-feature-name.ts   ← useQuery / useMutation wrapping services
```

**Full patterns** (QueryClient setup, editable form pattern, query key factories, do/don't rules): [tanstack-query.md](tanstack-query.md)

---

## CVA Variants

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-foreground",
        secondary: "bg-secondary text-foreground",
        destructive: "bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
```

---

## Base UI Headless Components

```tsx
import * as Dialog from "@base-ui/react/dialog";

function ConfirmDialog({ open, onOpenChange, children }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-lg">
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

Use Base UI for: `Dialog`, `Tabs`, `Select`, `Menu`, `Tooltip`, `Checkbox`, `Switch`, `Slider`.

---

## Tailwind CSS v4 Patterns

```tsx
// Theme tokens — always use these
className="bg-primary text-foreground border-border"
className="text-muted-foreground"
className="ring-ring"

// States via data-attributes
data-disabled={disabled ? "" : undefined}
className="data-disabled:opacity-50 data-selected:bg-primary"

// Focus visible
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

// Icon sizing
<Check className="size-4" />
className="[&_svg]:size-3.5"

// Icon-only buttons require aria-label
<button aria-label="Close"><X className="size-4" /></button>
```

### Color Token Reference

| Token | Use |
|---|---|
| `bg-primary` / `bg-secondary` / `bg-muted` | actions, states |
| `bg-destructive` | errors |
| `text-foreground` | primary text |
| `text-foreground-subtle` | secondary text |
| `text-muted-foreground` | disabled text |
| `border-border` / `border-input` | default borders |
| `border-primary` / `border-destructive` | highlighted borders |
| `ring-ring` | focus ring |

---

## Checklist

### Structure
- [ ] Feature component: folder with multiple files
- [ ] Generic UI: single file, Compound Components in `/components/ui`
- [ ] Logic extracted to `use-[name].ts` hook
- [ ] API: service + type + hook pattern

### Code
- [ ] No comments
- [ ] Lowercase filenames with hyphens
- [ ] Named exports only
- [ ] `ComponentProps<'element'>` + `VariantProps` for props
- [ ] Variants with `cva()`, classes merged with `cn()`
- [ ] `data-slot` on root element
- [ ] States via `data-[state]:` selectors
- [ ] Theme tokens (no hardcoded colors)
- [ ] Focus visible styles on interactive elements
- [ ] `aria-label` on icon-only buttons
- [ ] `{...props}` spread last
