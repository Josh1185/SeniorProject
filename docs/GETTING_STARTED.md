# Getting Started

How to get Trip Squad running on your machine. Follow it top to bottom the
first time, which will take about 30 minutes due to mostly waiting on installs.

If something breaks, check [Troubleshooting](#troubleshooting) at the bottom
before asking. If the answer isn't there and you work it out, **add it**. That
section is the team's memory.

## Table of Contents

- [1. Install the Prerequisites](#1-install-the-prerequisites)
- [2. Clone and Open](#2-clone-and-open)
- [3. Install Dependencies](#3-install-dependencies)
- [4. Get the Environment Files](#4-get-the-environment-files)
- [5. Set up the database](#5-set-up-the-database)
- [6. Run It](#6-run-it)
- [7. Command Reference](#7-command-reference)
- [Troubleshooting](#troubleshooting)

---

## 1. Install the prerequisites

| Tool           | Version         | Check with      |
| -------------- | --------------- | --------------- |
| Node.js        | 22 LTS or newer | `node -v`       |
| npm            | 10 or newer     | `npm -v`        |
| Git            | any recent      | `git --version` |
| VS Code        | any recent      |                 |
| Docker Desktop | any recent      | `docker -v`     |

npm comes with Node. Download the LTS build from [nodejs.org](https://nodejs.org).

**Everyone must be on Node 22+.** We use features older versions handle
differently, and "works on my machine" is the most expensive kind of bug on a
team project.

Docker Desktop must be running before any `docker compose` command, not just installed.

---

## 2. Clone and open

```bash
git clone <repo-url> trip-squad
cd trip-squad
code .
```

VS Code will offer to install the recommended extensions. **Say yes.** If the
prompt doesn't appear, open the Extensions panel and search `@recommended`.

| Extension                 | Why you want it                                                          |
| ------------------------- | ------------------------------------------------------------------------ |
| ESLint                    | Flags real bugs as you type                                              |
| Prettier                  | Formats on save, so we never argue about style                           |
| Tailwind CSS IntelliSense | Autocompletes class names and catches typos that otherwise fail silently |
| Prisma                    | Makes `schema.prisma` readable instead of a grey wall                    |
| Error Lens                | Shows errors inline rather than buried in the Problems panel             |
| REST Client               | Run the requests in `api.http` without installing Postman                |
| GitLens                   | See who wrote a line and why                                             |

---

## 3. Install dependencies

From the **repo root**, never from inside `server/` or `client/`:

```bash
npm install
```

This is an npm **workspaces** monorepo. One install at the root covers both
packages and produces one `package-lock.json`. Installing inside a subfolder
creates a second `node_modules` that shadows the first, and you'll get bizarre
errors like two copies of React.

You'll see warnings. Two are expected and safe:

**`npm audit` reports high-severity issues in Prisma's dependencies.**
**Do not run `npm audit fix --force`**, for it will downgrade you to Prisma 6,
which uses an incompatible schema format and will break the project. These
advisories are in the Prisma CLI, which is a dev dependency that never runs in
production, and they involve a MySQL driver we don't use. To check what actually matters: `npm audit --omit=dev`.

**`npm warn allow-scripts`.** Approve these. Prisma won't work without its
postinstall step:

```bash
npm install-scripts approve prisma
npm install-scripts approve @prisma/engines
npm install-scripts approve esbuild
```

---

## 4. Get the environment files

**Ask the team (Or Josh) for the Supabase credentials.** We share one project. Do not
create your own, or you'll be debugging against different data than everyone
else.

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Windows PowerShell:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Then paste in the shared values.

### Two rules, both important

**Never commit `.env`.** It's gitignored. If you ever commit one by accident,
tell the team immediately because every credential in it has to be rotated.

**When you add a variable, add it to `.env.example` too, in the same commit.**
Otherwise the next person to pull gets a mystery crash instead of a clear
"you're missing this" error.

### The two connection strings

`server/.env` has both `DATABASE_URL` and `DIRECT_URL`. **Locally they're
identical** - both point at your Docker Postgres:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/trip_squad"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/trip_squad"
```

They only differ in production, where the app uses a connection pooler and
migrations need a direct connection. See [docs/DATABASE.md](./DATABASE.md).

Note we use **port 5433**, not Postgres's default 5432, which is usually
already taken by a native install.

### Why the client's variables start with VITE_

Anything prefixed `VITE_` is compiled into the JavaScript bundle and is
**readable by anyone who opens devtools**. That's fine for the Supabase
publishable key, which grants nothing on its own. It is never fine for the
service-role key or a database URL, so those live only in `server/.env`.

Never prefix a secret with `VITE_`. The naming is the safeguard.

---

## 5. Set up the database

You run your own Postgres locally. Supabase handles auth; it is not your
development database. Full detail in [docs/DATABASE.md](./DATABASE.md).

Start it from the repo root (Docker Desktop must be running):

```bash
docker compose up -d
```

First run downloads the Postgres image. Confirm it's healthy:

```bash
docker compose ps
```

Then create the tables and load sample data:

```bash
npm run db:generate   # builds the typed client from the schema
npm run db:migrate    # creates the tables
npm run db:seed       # inserts fixture users
```

Order matters: `db:generate` needs no database, but nothing else compiles
without it.

**Verify:**

```bash
npm run db:studio
```

A browser GUI opens. You should see a `users` table with four rows.

---

## 6. Run it

Two terminals in VS Code (`` Ctrl+` ``, then click the split icon):

```bash
npm run dev:server     # http://localhost:4000
```

```bash
npm run dev:client     # http://localhost:5173
```

Or `npm run dev` from the root to start both at once. Two terminals is easier
to read when something breaks.

### Verify all three layers

1. Visit `http://localhost:4000/api/health`: JSON with `"status": "ok"`.
2. Visit `http://localhost:5173`: the page renders **and is styled**.
3. The API indicator on that page reads `ok`.
   Each one proves something different. If the page loads but looks like raw
   unstyled HTML, Tailwind isn't compiling. If the API says `unreachable`, either
   the server isn't running or the Vite proxy is misconfigured.

To debug with real breakpoints instead of `console.log`, open Run and Debug in
the sidebar and choose **Debug full stack**.

---

## 7. Command reference

Run all of these from the repo root.

| Command                | What it does                                      |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Both servers at once                              |
| `npm run dev:server`   | API only, restarts on save                        |
| `npm run dev:client`   | Vite dev server only                              |
| `npm run typecheck`    | TypeScript across both packages                   |
| `npm run lint`         | ESLint across both packages                       |
| `npm run format`       | Prettier, formats changes                         |
| `npm run format:check` | Prettier, fails instead of writing (CI uses this) |
| `npm test`             | Vitest                                            |
| `docker compose up -d` | Start the local database                          |
| `docker compose down`  | Stop it, keep data                                |
| `npm run db:seed`      | Load sample data                                  |
| `npm run db:reset`     | Drop, re-migrate, re-seed (safe locally)          |
| `npm run build`        | Production build of both                          |
| `npm run db:generate`  | Regenerate the Prisma client                      |
| `npm run db:migrate`   | Create and apply a migration                      |
| `npm run db:studio`    | Browse the database in a GUI                      |

**Before every pull request**, run `npm run typecheck`, `npm run lint`, and
`npm run format`. CI runs the same checks, and catching failures locally is
much faster than waiting on a build.

---

## Troubleshooting

### `Invalid environment variables` when the server starts

The message names the exact variable. You either skipped step 4 or a value is
malformed. `SUPABASE_URL` must include `https://`.

### `Cannot find module './generated/prisma/client'`

Run `npm run db:generate`. That folder is gitignored and doesn't survive a
fresh clone.

### Everything broke right after I pulled

Run these in order:

```bash
docker compose up -d
npm install          # someone added a dependency
npm run db:generate  # someone changed the schema
npm run db:migrate   # someone added a migration
```

This fixes the large majority of post-pull breakage.

### `ERESOLVE unable to resolve dependency tree`

Usually a TypeScript version mismatch between workspaces. **Don't use `--force`
or `--legacy-peer-deps`** because they produce an install that appears to work and
then crashes at runtime.

We pin TypeScript to `~6.0.x` in **both** workspaces on purpose: typescript-eslint
doesn't support TypeScript 7 yet. Check with `npm ls typescript`; you want one
version, everything else marked "deduped."

### `npm ci` fails in CI but `npm install` works locally

`package-lock.json` is out of sync with a `package.json`. Run `npm install`
locally and commit the updated lockfile.

### Nested `node_modules` in `client/` or `server/`

Normal. npm hoists what it can to the root and nests genuine conflicts. Only a
concern if it's a package your tooling resolves against. The check that matters:

```bash
npm ls react
```

One entry. Two copies of React cause "invalid hook call" errors that make no
sense otherwise.

### Windows: a config file I created breaks in CI

PowerShell's `>` and `echo` write UTF-16 with a byte-order mark, which Linux
tools read as garbage characters. Create text files in VS Code instead, and
check the status bar says **UTF-8** (not "UTF-8 with BOM").

To inspect a suspect file: `Format-Hex .nvmrc`

### Tailwind classes aren't doing anything

Tailwind 4 has no `tailwind.config.js`. If you created one following an older
tutorial, delete it. Theme customization goes in the `@theme` block in
`client/src/index.css`.

### Port already in use

Something is still running from a previous session. Find and kill it:

```bash
npx kill-port 4000    # or 5173
```
