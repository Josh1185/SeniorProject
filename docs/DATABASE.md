# Database & Migrations

## Table of Contents

- [How this is set up](#how-this-is-set-up)
- [First-time setup](#first-time-setup)
- [Daily commands](#daily-commands)
- [Naming convention](#naming-convention)
- [Changing the schema](#changing-the-schema)
- [Seeding](#seeding)
- [Deploying later](#deploying-later)
- [Troubleshooting](#troubleshooting)

---

## How this is set up

**Each developer runs their own Postgres locally, in Docker.** Supabase hosts
auth now, and will host the staging/production database later.

|                          | Database                            | Auth                    |
| ------------------------ | ----------------------------------- | ----------------------- |
| **Local development**    | Postgres in Docker, on your machine | Shared Supabase project |
| **Staging / production** | Supabase Postgres                   | Same Supabase project   |

### Why local instead of a shared Supabase database

`prisma migrate dev` compares your migration history against the actual
database. If a teammate is on a branch with a different schema, Prisma detects
drift and offers to **reset the database**, which involves wiping everyone's data. With four
people on four branches, that happens fast.

Local databases also let you reset and reseed freely, work offline, and migrate
without coordinating with anyone.

Auth stays shared because we don't migrate it. Supabase owns those tables, and
our `User` table is just a mirror keyed by the Supabase user id. Nothing
foreign-keys across the boundary.

---

## First-time setup

### 1. Install Docker Desktop

[docker.com](https://www.docker.com/products/docker-desktop/). On Windows it may
prompt for a WSL 2 update on first launch - accept it.

**Docker Desktop must be running** before any `docker compose` command. If you
see an error mentioning `dockerDesktopLinuxEngine` or "cannot find the file
specified," that's all it means. Launch it and wait for the whale icon in the
system tray to stop animating.

### 2. Start the database

From the repo root:

```bash
docker compose up -d
```

First run downloads the Postgres image (a minute or two). After that it's
instant.

**We use port 5433, not the default 5432.** Postgres's default is very often
already taken by a native install, and the failure is confusing: Docker's port
mapping silently loses, your client connects to the _other_ Postgres, and you
get an authentication error rather than anything pointing at the real cause.

Confirm it's up:

```bash
docker compose ps
```

Status should be `healthy`.

### 3. Point your environment at it

In `server/.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/trip_squad"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/trip_squad"
```

Both are identical locally. They differ only against Supabase, where the app
uses a connection pooler and migrations need a direct connection.

The credentials are deliberately boring because this is a throwaway local database
with nothing sensitive in it.

### 4. Create the tables and load data

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Order matters. `db:generate` builds the typed client from the schema and needs
no database; without it, TypeScript won't know your models exist and the seed
script won't compile.

### 5. Verify

```bash
npm run db:studio
```

A browser GUI opens. You should see a `users` table with four rows.

---

## Daily commands

| Command                  | What it does                                        |
| ------------------------ | --------------------------------------------------- |
| `docker compose up -d`   | Start the database                                  |
| `docker compose down`    | Stop it, keep data                                  |
| `docker compose down -v` | Stop it and **delete all data**                     |
| `npm run db:migrate`     | Create + apply a migration after editing the schema |
| `npm run db:generate`    | Regenerate the typed client (no DB needed)          |
| `npm run db:seed`        | Load sample data                                    |
| `npm run db:reset`       | Drop everything, re-run migrations, re-seed         |
| `npm run db:studio`      | Browse data in a GUI                                |

`db:reset` is safe and genuinely useful; it's a local database with nothing
precious in it. When something looks wrong, resetting is often faster than
debugging.

---

## Naming convention

**TypeScript uses camelCase. Postgres uses snake_case. `@map` bridges them.**

```prisma
model User {
  id          String   @id @db.Uuid
  email       String   @unique
  displayName String   @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("users")
  @@index([email])
}
```

You write `prisma.user.findMany({ where: { displayName } })` in code, and
`select display_name from users` in psql. Each convention where it belongs.

Without `@map`, Postgres folds unquoted identifiers to lowercase. `displayName`
becomes a `displayname` column, and any hand-written SQL needs `"displayName"`
in double quotes forever.

**Team rules:**

- Every multi-word field gets `@map("snake_case")`.
- Every model gets `@@map("plural_snake_case")` for the table name.
- Single-word fields (`id`, `email`) need neither.
  One person forgetting this produces a table with mixed conventions, so check for
  it in code review. Changing it after a migration means a rename migration for
  every affected column.

---

## Changing the schema

1. Edit `server/prisma/schema.prisma`.
2. Run `npm run db:migrate`. Prisma prompts for a name; please be descriptive, like
   `add_trip_and_members`.
3. Prisma writes a `.sql` file under `server/prisma/migrations/`, applies it,
   and regenerates the client.
4. **Commit the migration file.**
5. **Tell the team in chat.**
   When you pull someone else's schema change:

```bash
npm run db:migrate    # applies any new migrations
npm run db:generate   # if your types look stale
```

### Rules

**Never edit a migration that's been pushed.** Others have already run it. Write
a new migration instead.

**Always commit migration files.** They're the shared history of how the
database reached its current shape. The generated client in
`server/src/generated/` is _not_ committed because everyone regenerates locally.

**Keep schema PRs small and merge them fast.** Two people editing
`schema.prisma` on separate branches produces migration-folder conflicts that
are tedious to untangle.

---

## Seeding

`server/prisma/seed.ts` inserts fixture users so you can build features that
need people to exist without signing in as four different accounts.

**Seeded users are not real login accounts.** Real users are created by the auth
middleware, which upserts a `User` row keyed by the Supabase JWT's `sub` claim
on someone's first authenticated request.

To make seed data appear under your own login, set `DEV_USER_ID` in the seed
script to your Supabase user id (Supabase dashboard -> Authentication -> Users).

Seeds use `upsert`, not `create`, so re-running is safe. Keep it that way as you
add to it.

### Why the seed file makes its own Prisma client

It doesn't import `server/src/lib/prisma.ts` on purpose. That module imports
`env.ts`, which validates _every_ environment variable; including Supabase
ones the seed doesn't need. The seed runs through the Prisma CLI, sometimes in
contexts where those aren't set, so it only requires `DATABASE_URL`.

---

## Deploying later

In production the two URLs are genuinely different:

- **`DATABASE_URL`**: transaction pooler, port **6543**. The running app.
- **`DIRECT_URL`**: session/direct connection, port **5432**. Migrations only.
  The pooler is pgbouncer, which doesn't support the prepared statements Prisma
  Migrate needs. Swapping them produces `prepared statement "s0" already exists`,
  which gives no hint about the real cause.

Production uses `npm run db:deploy`; applies existing migrations only, never
generates new ones.

---

## Troubleshooting

### `error during connect ... dockerDesktopLinuxEngine`

Docker Desktop isn't running. Launch it, wait for the tray icon to settle, then
retry.

### `P1000: Authentication failed against database server`

Almost always a port collision: something _else_ is listening on that port and
rejecting your credentials. Check what's running:

```powershell
docker compose ps
docker compose port db 5432
Get-Service -Name postgresql* -ErrorAction SilentlyContinue
```

If you find a native Postgres service, either stop it or move Docker to another
port. To isolate the problem, connect from inside the container, bypassing the
port entirely:

```bash
docker compose exec db psql -U postgres -d trip_squad -c "select version();"
```

If that works but Prisma still fails, it's the port mapping, not the database.

### I changed the port in `docker-compose.yml` and nothing happened

Editing the file doesn't move the port on a running container:

```bash
docker compose down
docker compose up -d
```

### Credentials still rejected after changing the password

`POSTGRES_PASSWORD` only applies when the data directory is first initialized.
An existing volume keeps the old credentials. Destroy and recreate:

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run db:seed
```

### `Property 'user' does not exist on type 'PrismaClient'`

Run `npm run db:generate`. You edited the schema but the generated types still
describe the old one. If VS Code still complains afterward: Ctrl+Shift+P ->
"TypeScript: Restart TS Server."

### `Cannot find module './generated/prisma/client'`

Same fix. That folder is gitignored and won't exist after a fresh clone.

### `Drift detected` on migrate

Your database doesn't match the migration history; usually from editing the
schema without migrating, or switching branches. Locally, just
`npm run db:reset`.

### Everything is broken and I don't know why

```bash
docker compose down -v
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
```

Nuclear, and completely safe on a local database.
