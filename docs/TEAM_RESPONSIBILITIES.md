# TripSquad: Team Responsibilities

**Sprint 0 begins Friday 9 October**

Everyone should read all of this file, not just their
own section; knowing what the person next to you owns is how we avoid
duplicate work and surprise conflicts.

---

## How we're working

**Each person owns one feature, end to end.** Database queries, API routes,
React pages, and basic tests. You build the whole vertical slice, not a layer
of it.

Why this way: you learn the full stack on a small surface instead of half the
stack on a large one, you never wait on someone else to finish their half, and
at the defense you can point at something and say you built it.

**Within your feature, build the API first.** Routes and validation, verified
with `api.http`, before any React. If something breaks later you'll know
immediately whether it's the backend or the frontend. If you build both at
once, you won't.

**Josh reviews every pull request** and owns the shared foundation; the
permission middleware, the app shell, shared components, deployment, and
integration. If something outside your feature is blocking you, that's his
problem to solve, not yours to work around. Say so in the chat.

---

## Everyone, before feature work starts

You cannot start your feature until you've done this and shown it in the chat.
This isn't to be annoying, but a teammate who can't run the app can't contribute, and
that gap only gets wider.

1. `docker compose up -d` - database running
2. `npm run db:migrate && npm run db:seed` - tables and sample data
3. Both servers running; sign up and sign in through the UI
4. `npm run db:studio` - find your own row in the `users` table
5. One merged pull request, however small
   **Post a screenshot of step 4.** That's the proof.

Also read, before you write code:

- `docs/git-workflow.md`, `docs/database.md`
- The auth code: `server/src/middleware/auth.ts`, `server/src/routes/userRoutes.ts`,
  `client/src/lib/api.ts`
- The Prisma models for your own feature in `server/prisma/schema.prisma`
  Write down any field in your models you don't understand and ask in the next
  meeting. A schema misunderstanding found now is a conversation; found in
  November it's a migration.

---

## Josh Iehle: Platform, Expenses, Integration

**Sprint 0 foundation**, in this order, because each unblocks someone:

1. Initial migration merged
2. `requireTripRole` permission middleware
3. Seed data: one fully populated trip
4. Trip CRUD: the reference slice everyone copies
5. App shell: navigation, trip layout, protected routing
6. Shared components: location picker, map view, date/time input, modal, form
   field, empty state
7. Test deployment
8. `docs/conventions.md`

**Then Expenses:** expense CRUD, equal splitting, uneven splits, balance
calculation, and the settlement algorithm.

**Throughout:** code review within 24 hours, integration, deployment,
unblocking.

---

## Brandon Douglass: Activities and Voting

Trip members propose things to do; the group upvotes them.

- Activity CRUD: name, description, suggested time, location, estimated cost
- Proposal list, sorted by vote count
- Upvote and un-vote, with live counts
- Location fields using the shared location picker

This is the most frontend-heavy feature, which matches what you said you wanted
to work on. The voting interaction is also the most satisfying thing in the app
to demo.

Nothing else depends on Activities, so you can move at your own pace.

---

## Antony Benitez: Reservations

Confirmed bookings: flights, hotels, rental cars, restaurants, attractions.

- Reservation CRUD across all six types
- Confirmation number, provider, start and end times, cost
- Location fields using the shared location picker
- List grouped by type, with a detail view

This is the cleanest feature in the project: real CRUD, no cross-entity logic,
no algorithms. It's the right place to learn the full stack properly. Get it
solid and you'll understand every other feature in the codebase.

---

## Christopher Soliman: Itinerary

The actual day-by-day schedule for the trip.

- Itinerary event CRUD with start and end times
- List grouped by day across the trip's date range
- Standalone events first (a standalone event is one not tied to an activity or
  reservation)
- Later: optional links to an activity or reservation
  Build standalone events first. The optional links come in Sprint 3, once
  Brandon's and Antony's entities exist; that ordering means you're never
  waiting on them.

There's real backend thinking in grouping events by day across a date range,
which matches your interest in backend work.

---

## Yahya Nawaz: Invitations and Members

Getting people into a trip and showing who's in it.

- Member roster with roles
- Invite by email address, with a generated invite link
- Accept and decline flows
- Pending invitations list
  Self-contained and visible on the trip dashboard from day one, so your work
  shows up in every demo. It also touches the whole stack: token generation,
  email-based lookup, state transitions, without depending on anyone else.

Note: invitations work through a copyable link, not email. We're not building
email sending.

---

## Working agreement

**Push your branch every day you work on it.** Not a pull request, just a
push. Three days of no commits is a standup topic.

**Open a draft pull request within two days of starting a task**, even if it's
one route stub. This is the most important rule here. A draft PR that's half
done can be redirected in five minutes; a week of silence can't.

**Keep pull requests under about 300 lines. 500 at most** Bigger than that should have been
two tasks. Large PRs get skimmed, and a skimmed PR is an unreviewed PR.

**Each feature ships as four pull requests:** read API, write API, read UI,
write UI. In that order.

**Before every PR:** `npm run typecheck`, `npm run lint`, `npm run format`.

**Changed `schema.prisma`?** Tell everyone, they need to re-run
`npm run db:migrate`.

**Added an environment variable?** Add it to `.env.example` in the same commit, but **NOT THE VALUE**.

---

## Standup format

Three questions, twice a week:

1. What did you push since last time?
2. What is your current PR waiting on?
3. What is the next thing you'll type?
   Question three is the useful one. If you can't answer it concretely, you're
   stuck, say so. Being stuck is normal and fixable. Being quietly stuck for a
   week is the thing that sinks group projects.

---

## Dates that matter

| Date           | What                                                     |
| -------------- | -------------------------------------------------------- |
| **Fri 16 Oct** | Everyone set up, one PR merged each, foundation complete |
| **Fri 30 Oct** | Every feature has a working API and a list view          |
| **Fri 13 Nov** | Every feature has create/edit/delete working             |
| **Sun 22 Nov** | **Feature freeze.** Nothing new starts after this.       |
| 23–29 Nov      | Thanksgiving — no planned work                           |
| **Thu 3 Dec**  | Production deployment live                               |
| **Sun 6 Dec**  | Functionally complete, demo rehearsed                    |
