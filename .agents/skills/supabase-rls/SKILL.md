---
name: supabase-rls
description: Lock every new Postgres table in the public schema against the Supabase Data API. Use whenever creating or editing a Drizzle schema, SQL migration, Postgres table, Supabase database change, Better Auth table, or a column that may hold a password, token, access_token, refresh_token, id_token, or secret — even if the user does not mention RLS or security.
---

# Supabase RLS

The Next.js app reads and writes through Drizzle as the `postgres` role (`BYPASSRLS`). The browser never uses the Supabase client. PostgREST still exposes `public` to the `anon` key, so every table in `public` must be closed at the database.

Better Auth is not Supabase Auth. `auth.uid()` does not match `user.id`. Do not add Data API policies. Authorization stays in the use cases.

Copy the pattern in `src/server/infrastructure/db/drizzle/migrations/0009_enable_rls.sql`.

## New table

In the same migration that creates the table:

1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. `ALTER TABLE ... FORCE ROW LEVEL SECURITY`
3. `REVOKE ALL ON TABLE ... FROM anon, authenticated, PUBLIC`

Quote reserved names: `"user"`, `"session"`.

`anon` and `authenticated` exist on Supabase and may be missing on local Postgres. Revoke those roles only when `pg_roles` contains them. Always revoke from `PUBLIC`.

Do not add a policy, including a public `SELECT` for catalog tables (cards, boosters, types). The app serves that data through Next.js routes.

`account`, `session`, `user`, and `verification` stay closed. A column named `password`, `token`, `access_token`, `refresh_token`, `id_token`, or `secret` cannot land on a table that skips the three statements above.

The advisor warning `rls_enabled_no_policy` is the intended deny-all state.

## Checklist

- [ ] The creating migration enables and forces RLS on every new `public` table
- [ ] That migration revokes `anon`, `authenticated`, and `PUBLIC`
- [ ] No policy was added
- [ ] Reserved identifiers are quoted
