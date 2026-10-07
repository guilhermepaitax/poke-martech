# TanStack Query Pattern

## File Structure

```
src/
  types/feature-name.ts       ← TypeScript interfaces
  services/feature-name.ts    ← async fetch functions (throws on error)
  hooks/use-feature-name.ts   ← useQuery / useMutation wrapping services
  components/feature/
    feature.tsx               ← component using hooks, no fetch() calls
```

## Query Keys

Centralise key factories in the hook file:

```ts
export const featureKeys = {
  all: ["feature"] as const,
  list: () => [...featureKeys.all, "list"] as const,
  detail: (id: string) => [...featureKeys.all, "detail", id] as const,
};
```

## Service Layer

Services are plain async functions that `throw` on errors (never return `{ error }`):

```ts
async function json<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch("/api/items");
  const data = await json<{ items: Item[] }>(res);
  return data.items;
}

export async function saveItem(input: SaveItemInput): Promise<Item> {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return json<Item>(res);
}
```

## Hook Layer

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchItems, saveItem } from "@/services/feature-name";
import type { SaveItemInput } from "@/types/feature-name";

export function useItems() {
  return useQuery({
    queryKey: featureKeys.list(),
    queryFn: fetchItems,
  });
}

export function useSaveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveItemInput) => saveItem(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: featureKeys.list() });
    },
  });
}
```

Expose only what the component needs — don't leak raw query objects unless required.

## Editable Forms with Server State

**Never** use `useEffect` + `setState` to sync server data into local state (`react-hooks/set-state-in-effect` will error).

Instead, hold only **user overrides** in local state; merge with query data at render:

```tsx
function SettingsForm() {
  const { data, isLoading } = useItems();
  const save = useSaveItem();

  // null = no pending changes; object = user edits not yet saved
  const [draft, setDraft] = useState<Partial<ItemForm> | null>(null);

  const serverValues = { name: data?.name ?? "", value: data?.value ?? "" };
  const form = draft ? { ...serverValues, ...draft } : serverValues;
  const isDirty = draft !== null;

  const update = (patch: Partial<ItemForm>) =>
    setDraft((d) => ({ ...(d ?? serverValues), ...patch }));

  const handleCancel = () => setDraft(null);

  const handleSave = () => {
    save.mutate(form, {
      onSuccess: () => { setDraft(null); toast.success("Saved."); },
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) return <Spinner />;

  return (
    <form>
      <input value={form.name} onChange={(e) => update({ name: e.target.value })} />
      <button onClick={handleSave} disabled={!isDirty || save.isPending}>Save</button>
      <button onClick={handleCancel} disabled={save.isPending}>Cancel</button>
    </form>
  );
}
```

Key rules:
- `draft === null` means no pending edits (Cancel resets to `null`, Save also resets to `null`)
- Display `isDirty` state to disable Save/Cancel when nothing changed
- Disable Save button while `mutation.isPending`
- `onSuccess` / `onError` callbacks on `mutate()` for toast feedback
- Invalidate affected query keys in `useMutation.onSuccess`

## QueryClient Setup

```ts
// src/lib/query-client.ts
"use client";
import { QueryClient } from "@tanstack/react-query";

declare global { var _queryClient: QueryClient | undefined; }

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });
}

export const queryClient = globalThis._queryClient ?? makeQueryClient();
if (process.env.NODE_ENV !== "production") globalThis._queryClient = queryClient;
```

```tsx
// src/components/providers.tsx
"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Wrap root layout: `<Providers>{children}</Providers>`.

## Do / Don't

| Do | Don't |
|----|-------|
| Throw errors in services | Return `{ error }` from services |
| `draft = null` to cancel | `useEffect` + `setState` to sync server → local |
| Invalidate keys in `onSuccess` | Manually update cache unless optimistic |
| `isPending` to disable buttons | Local `loading` state for mutations |
| One hook file per feature | Inline `useQuery` calls in components |
