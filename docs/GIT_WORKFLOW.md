# Git Workflow

How we work together without stepping on each other. Read this once, then use
the [Daily loop](#the-daily-loop) as a checklist until it's muscle memory.

**The one rule:** nobody commits directly to `main`. Everything goes through a
branch and a pull request. `main` should always be code that runs.
I do have a ruleset in GitHub that will block any pushes directly to `main`,
and it forces you to open a pull request in a separate branch.

---

## The daily loop

Every time you start a piece of work:

```bash
# 1. Start from an up-to-date main
git checkout main
git pull

# 2. Branch
git checkout -b feature/activity-voting

# 3. Work. Commit as you go.
git add .
git commit -m "Add vote count to activity card"

# 4. Push
git push -u origin feature/activity-voting

# 5. Open a pull request on GitHub, get a review, merge.

# 6. Clean up
git checkout main
git pull
git branch -d feature/activity-voting
```

Step 1 matters more than it looks. Branching from a stale `main` is the main
cause of ugly merge conflicts later.

---

## Branch names

`type/short-description`, lowercase, hyphens.

| Type       | Use for                       | Example                     |
| ---------- | ----------------------------- | --------------------------- |
| `feature/` | New functionality             | `feature/expense-splitting` |
| `fix/`     | Bug fixes                     | `fix/date-picker-timezone`  |
| `chore/`   | Tooling, config, dependencies | `chore/add-vitest-config`   |
| `docs/`    | Documentation only            | `docs/api-endpoints`        |

Keep branches **small and short-lived**, and ideally merged within a few days. A
branch open for three weeks becomes a merge nightmare and blocks everyone
else's work from building on it.

---

## Commit messages

Present tense, describing what the commit does:

```
Add settlement calculation to expense service
Fix timezone offset in itinerary day grouping
Update Prisma schema with PackingItem model
```

Not: `stuff`, `fixes`, `asdf`, `final version FINAL`.

You don't need to be precious about this, but you will genuinely need to read
this history when hunting a bug later in the semester, and `git log --oneline` full of
`stuff` is useless.

Commit **often** because small commits are easier to review and easier to undo. Don't
save up a day's work into one giant commit.

---

## Pull requests

### Before you open one

```bash
npm run format
npm run lint
npm run typecheck
```

CI runs these anyway. Catching failures locally takes seconds; waiting on CI
takes minutes.

### Writing it

Fill out the template. It's short on purpose:

- **What this does** - one or two sentences.
- **How to test it** - steps a reviewer can actually follow.
- **Checklist** - especially the migration and `.env.example` items.
  If your PR touches more than about 400 lines, consider splitting it to avoid the urge to skim during review.

### Getting it reviewed

**One approval before merge.** Post in the team chat (iMessage or Discord) when your PR is ready and please
don't assume anyone noticed the GitHub notification.

If you're blocked waiting on a review, say so. A PR sitting for two days is
worse than a slightly rushed review.

### Reviewing someone else's

Aim for a real read and try not to skim because we can all learn from each other.

Look for:

- Does it do what the description says?
- Would you understand this code in two months?
- Are error cases handled, or does it assume everything works?
- Does it follow patterns already in the codebase?
  Ask questions rather than issuing orders. "What happens if the array is empty?"
  lands better than "this is broken," and it's often you who misread.

**Approve when it's good enough, not when it's perfect.** Blocking a PR over
style preferences wastes everyone's time. That's what the Prettier extension is for.

### Merging

Merge your own PR after approval, then delete the branch (GitHub offers a
button). Don't merge someone else's without asking.

---

## Coordination rules

These exist because breaking them costs the whole team time.

### Changed `schema.prisma`? Tell everyone.

Post in the team chat. Everyone else needs to run:

```bash
npm run db:migrate
npm run db:generate
```

Commit your migration files in `server/prisma/migrations/`. Never edit a
migration that's already been pushed; instead, write a new one.

### Added an environment variable? Update `.env.example`.

Same commit. Then tell the team so they can add the real value locally.

### Added a dependency? Commit `package-lock.json`.

It's how CI installs the exact same versions you have. `npm ci` fails if the
lockfile is missing or out of sync.

### Never commit `.env`

If it happens, say so immediately. Every credential in it has to be rotated if this is the case.
Removing the file in a later commit does **not** remove it from Git history.

---

## Merge conflicts

They're normal, not a sign you did something wrong. Git found two changes to
the same lines and needs you to decide.

```bash
git checkout main
git pull
git checkout your-branch
git merge main
```

Git marks conflicts in the files:

```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> main
```

Open the file, decide what the code should actually be, delete all three marker
lines, then:

```bash
git add .
git commit
```

VS Code's merge editor (it appears automatically) is much easier than editing
markers by hand.

**If a conflict looks scary, ask before guessing.** Resolving one wrong can
silently delete a teammate's work, and that's much harder to spot than a
conflict you left alone.

**`package-lock.json` conflicts:** don't resolve by hand. Take either version,
then run `npm install` and commit the result.

---

## Escape hatches

Things you'll eventually need.

**Undo the last commit, keep the changes:**

```bash
git reset --soft HEAD~1
```

**Throw away all uncommitted changes** (destructive. they're gone):

```bash
git restore .
```

**Stash work to switch branches quickly:**

```bash
git stash
git checkout other-branch
# ... later ...
git checkout your-branch
git stash pop
```

**Committed to `main` by accident?** Don't push. Move the commit to a branch:

```bash
git branch feature/my-work
git reset --hard origin/main
git checkout feature/my-work
```

**Already pushed something broken to `main`?** Don't force-push because that rewrites
history for everyone. Revert instead:

```bash
git revert <commit-hash>
```

---

## Branch protection

**Settings → Branches → Add branch ruleset** for
`main`. Require a pull request before merging, and require the
`Typecheck, lint, test, build` status check to pass.

Without this, CI is decoration because a red build doesn't stop anyone merging. Two
minutes of setup prevents the classic disaster of broken code on `main` the
night before a demo with nobody sure which commit caused it.

---

## Dividing work

Our features are split so people mostly touch different files:

**NOTE: This isn't final**

| Area      | Owns                                                  |
| --------- | ----------------------------------------------------- |
| Itinerary | Calendar, activities, scheduling, voting              |
| Expenses  | Tracking, splitting, settlement, financial dashboard  |
| Travel    | Map, locations, weather, reservations                 |
| Platform  | Auth, users, permissions, notifications, file uploads |

Two things to watch:

**Shared files are conflict magnets.** `schema.prisma`, `app.ts`, and routing
files get touched by everyone. Keep those edits small and merge them quickly
rather than sitting on them.

**Platform is on the critical path.** Auth and permissions block everything
else, so that work needs to land early or three people end up stuck.

We still review each other's code regardless of area. Owning an area means
you write it, not that nobody else understands it.
