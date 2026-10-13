# Deployment

Reference for TripSquad's production setup. Written 13 October 2026.

---

## Architecture

```
Browser
  │
  ├──► Vercel ············· static React bundle
  │
  ├──► Supabase Auth ······ sign up / sign in / token refresh
  │
  └──► Render ············· Express API
            │
            └──► Supabase Postgres
```

Three platforms, three jobs. The browser talks to Vercel for the app, Supabase
for authentication, and Render for data. **The browser never talks to the
database directly**; that is a deliberate architectural choice and it is what
the security section below is about.

| Piece           | Platform | URL                                        |
| --------------- | -------- | ------------------------------------------ |
| Frontend        | Vercel   | `https://senior-project-psi.vercel.app`    |
| API             | Render   | `https://trip-squad-api.onrender.com`      |
| Database + Auth | Supabase | `https://usivgxovisdhfqneffto.supabase.co` |

---

## Platform reference

### Vercel: frontend

| Setting          | Value                     |
| ---------------- | ------------------------- |
| Root Directory   | `client`                  |
| Framework Preset | Vite                      |
| Build Command    | default (`npm run build`) |
| Output Directory | `dist`                    |

**Environment variables:**

| Key                             | Notes                                    |
| ------------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL                     |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public by design; it is in the JS bundle |
| `VITE_API_BASE_URL`             | Render URL **plus `/api`**               |

**`client/vercel.json`** holds the SPA rewrite. Without it every route except
`/` returns 404 on refresh, because `/dashboard` is a client-side route, not a
file.

**Vite env vars are baked in at build time.** Changing one in the dashboard
does nothing until you redeploy.

### Render: API

| Setting           | Value                 |
| ----------------- | --------------------- |
| Root Directory    | _(blank - repo root)_ |
| Runtime           | Node                  |
| Health Check Path | `/api/health`         |
| Instance Type     | Free                  |

**Build Command:**

```
npm ci --include=dev; npm run db:generate --workspace=server; npm run db:deploy --workspace=server
```

**Start Command:**

```
npm run start --workspace=server
```

Three things that are easy to get wrong here:

- **Root Directory is blank.** This is an npm workspaces monorepo; the lockfile
  and hoisted `node_modules` live at the repo root. Pointing Render at
  `server/` installs outside the workspace.
- **`--include=dev` is required.** Render sets `NODE_ENV=production`, npm then
  skips devDependencies, and both `tsx` and `prisma` live there. Without the
  flag the build passes and the start command fails with `tsx: not found`.
- **`db:deploy` runs on every deploy.** That is intentional; `migrate deploy`
  only applies pending migrations and is safe to repeat, so a teammate's new
  migration ships automatically.

**Environment variables:**

| Key                         | Notes                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                  | `production`                                                     |
| `DATABASE_URL`              | Pooler, port **6543**, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL`                | Direct, port **5432**. Migrations only                           |
| `SUPABASE_URL`              | Project URL                                                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret. Never in the client                                      |
| `WEB_ORIGIN`                | Vercel URL, **no trailing slash**                                |

Do not set `PORT` - Render injects it.

### Supabase: database and auth

**Authentication → URL Configuration:**

- Site URL: the Vercel URL
- Redirect URLs: the Vercel URL + `/**`, and `http://localhost:5173/**` so
  local development keeps working
  **Email confirmation is OFF** for development convenience. Turn it on before
  anyone outside the team uses this.

---

## Continuous deployment

Both platforms watch `main` and deploy automatically. **A push to `main` is a
production deploy.** There is no staging environment.

| Trigger                  | Vercel                               | Render            |
| ------------------------ | ------------------------------------ | ----------------- |
| Push to `main`           | Production deploy                    | Production deploy |
| Push to any other branch | Preview deploy, unique URL           | Nothing           |
| Pull request opened      | Preview deploy, URL posted on the PR | Nothing           |

Typical timings: Vercel 1–2 minutes, Render 3–5 minutes (it reinstalls
dependencies and runs migrations).

### Things to know

**Migrations run automatically.** Any merged migration applies to the
production database on the next Render deploy. This is convenient and also
means a bad migration reaches production without a human in the loop. Review
migration files more carefully than other code.

**Vercel previews will not reach the API.** A preview gets a URL like
`trip-squad-git-feature-x.vercel.app`, which does not match `WEB_ORIGIN`, so
CORS blocks every request. Previews are useful for reviewing _layout_, not
behaviour. To make previews work against the live API, change the `cors()`
origin in `app.ts` from a single string to a function that also accepts
`*.vercel.app` - worth doing only if the team actually starts reviewing
previews.

**A broken push to `main` breaks production immediately.** The mitigation is
the CI gate: branch protection requires the status check to pass before
merging. Keep that enabled.

**Rolling back:** both platforms keep deploy history. Render → Deploys → pick
a previous one → _Redeploy_. Vercel → Deployments → _Promote to Production_.
Neither rolls back a database migration - that needs a new forward migration.

### Turning auto-deploy off

If you want to freeze production before a demo:

- Render → Settings → Build & Deploy → Auto-Deploy → **No**
- Vercel → Settings → Git → Ignored Build Step, or disconnect the branch
  Worth doing the morning of a presentation if teammates are still pushing.

---

## Common tasks

**Change an API environment variable:** Render → Environment → edit → saving
triggers a redeploy automatically.

**Change a frontend environment variable:** Vercel → Settings → Environment
Variables → edit → then **Deployments → Redeploy**. Vite bakes these in at
build time; saving alone does nothing.

**Add a database table:** write the migration locally, test against Docker,
commit, merge to `main`. Render applies it on the next deploy. Afterwards,
re-run the `revoke` block above - a new table may have inherited grants.

**Seed the production database:**

```powershell
$env:DATABASE_URL="<production pooler string>"
npm run db:seed --workspace=server
```

Set `DEV_USER_ID` in `prisma/seed.ts` to your real Supabase user id first, or
the seeded trip belongs to accounts nobody can log into.

**Check API logs:** Render → Logs. Live tail, searchable.

---

## Troubleshooting

**`P1013: The provided database string is invalid`**
The connection string does not start with a recognised scheme. Almost always
quotes pasted into the Render env var (`"postgresql://...`), or `DIRECT_URL`
not set at all. Special characters in the password need percent-encoding -
`@` is `%40`, `#` is `%23`.

**`tsx: not found` on start**
The build dropped devDependencies. Confirm `--include=dev` is in the build
command.

**CORS errors in the browser console**
`WEB_ORIGIN` on Render must exactly match the Vercel origin - no trailing
slash. Also check the redeploy finished.

**404 on refresh, but navigation works**
`client/vercel.json` is missing or in the wrong folder. It must sit next to
`client/package.json`.

**First request hangs for a minute**
Normal. Free Render services spin down after 15 minutes of inactivity and take
about a minute to wake.

**Auth redirects land somewhere wrong**
Supabase → Authentication → URL Configuration. Site URL and Redirect URLs need
the Vercel origin.

---

## Known limitations

- **Cold starts.** Free tier, 15-minute spin-down, roughly a minute to wake.
  Before a demo, load the site 10 minutes early to warm it.
- **750 free instance hours per month** per Render workspace. Spin-down is what
  keeps us under the cap.
- **No staging environment.** `main` is production. CI plus branch protection
  is the only gate.
- **Vercel previews cannot reach the API** (CORS). Useful for layout review
  only.
- **Database migrations are not reversible** through the platform. A bad
  migration needs a new forward migration.
- **Supabase free tier pauses projects after a week of inactivity.** If nobody
  touches the project over a long break, the database needs resuming from the
  dashboard. Worth knowing before Thanksgiving.
