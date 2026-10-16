# TripSquad: Team Responsibilities

**Updated Friday 16 October.** Sprint 1 begins Monday 19 October.

Everyone should read all of this file, not just their
own section; knowing what the person next to you owns is how we avoid
duplicate work and surprise conflicts.

**Section 2 is your feature's spec.** `docs/conventions.md` tells you _how_ to
build; this file tells you _what_. If something in your spec is unclear, ask in
the chat before you build it - that is what the spec is for.

---

## How we're working

**Each person owns one feature, end to end.** Database queries, API routes,
React pages, and basic tests. You build the whole vertical slice, not a layer
of it.

Why this way: you learn the full stack on a small surface instead of half the
stack on a large one, you never wait on someone else to finish their half, and
at the defense you can point at something and say you built it.

**Within your feature, build the API first.** Routes and validation, verified
with your `.http` file, before any React. If something breaks later you'll know
immediately whether it's the backend or the frontend. If you build both at
once, you won't.

**Each feature ships as five pull requests**, in this order:

1. Read API: `GET` list, `GET` one
2. Write API: `POST`, `PATCH`, `DELETE`
3. Read UI: the list page
4. Detail modal: clicking a row
5. Write UI: create, edit, delete from the interface

Most features then have a sixth for their own particular behaviour. Section 2
says what yours is. **The sixth never comes before the first five.**

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

- `docs/conventions.md` - all of it, once, then keep it open
- `docs/git-workflow.md`, `docs/database.md`
- The auth code: `server/src/middleware/auth.ts`,
  `server/src/routes/userRoutes.ts`, `client/src/lib/api.ts`
- The Prisma models for your own feature in `server/prisma/schema.prisma`

Write down any field in your models you don't understand and ask in the next
meeting. A schema misunderstanding found now is a conversation; found in
November it's a migration.

---

## Josh Iehle: Platform, Expenses, Invitations, Maps, Integration

**Foundation - complete.** Initial migration, `requireTripRole`, seed data,
Trip CRUD as the reference slice, app shell and routing, shared components,
production deployment, `docs/conventions.md`.

**Then Expenses.** Expense CRUD, equal splitting, balance calculation, and the
settlement algorithm.

**Native behaviour - splitting and settlement.** An expense has one payer and a
set of participants. Every amount is **integer cents**, everywhere, with no
exceptions. An equal split of 6200 cents across 3 people is 2067 / 2067 / 2066 - the
remainder is distributed one cent at a time, not rounded, so the shares
always sum to exactly the total. Balances are derived, never stored: for each
member, sum what they paid minus sum of their shares. The group's balances must
net to exactly zero; that's the test. Settlement turns those balances into the
smallest set of payments that clears them - repeatedly match the largest debtor
to the largest creditor.

**Uneven splits are the first thing cut** if Sprint 3 is tight. Equal split
alone is a complete, demonstrable feature.

### Also Josh: Invitations, end to end

Invitations do not follow `conventions.md`, which is why they are not anyone
else's. Every other feature mounts at `/api/trips/:tripId/...` behind
`requireTripRole()`, and that guard is what lets its controllers skip permission
checks entirely. Invitations break it in two places: the person **accepting** an
invite is not a member of the trip yet, and the dashboard's Trip Invites tab has
to list your invitations _before_ you have joined anything. Neither route can
sit behind the trip guard.

```
POST   /api/trips/:tripId/invitations      create   (OWNER)
GET    /api/trips/:tripId/invitations      list     (OWNER)
DELETE /api/trips/:tripId/invitations/:id  revoke   (OWNER)

GET    /api/invitations                    mine     (requireAuth only)
POST   /api/invitations/:token/accept      accept   (requireAuth only)
POST   /api/invitations/:token/decline     decline  (requireAuth only)
```

Plus the interface: the invite form modal, the Trip Invites tab on the
dashboard, and the pending-invitations list.

**Invitations work through a copyable link, not email.** We are not building
email sending. The token in the link is the authorisation: anyone who has the
link can join. The email on the invite is what makes it show up in the right
person's Trip Invites tab, and it is not a security boundary - say that plainly
if it comes up at the defense.

**Accepting creates a `trip_members` row** with role `MEMBER`, which is the one
place this feature reaches into Yahya's table. Different controller, different
file, no merge conflict - but if the member roster ever shows someone who never
accepted anything, this is where to look.

### Also Josh: maps in detail views (Sprint 3)

A `MapView` component showing a pin, dropped into the Activity, Reservation and
Itinerary detail modals. Josh wires it into all three after their PR 4s have
merged at the end of Sprint 2.

**Brandon, Antony, Chris: do not put a map in your detail modal.** It is not
your card and it would collide with this one. Your detail modal shows the
address as text; the map arrives on top of it later.

**Use the Mapbox Static Images API, not Mapbox GL JS.** A static map is a
single `<img>` with the coordinates in the URL:

```
https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/
  pin-s+2563eb(<lng>,<lat>)/<lng>,<lat>,13/600x300@2x?access_token=...
```

An interactive GL map inside a `<dialog>` is a trap: the container has to be
measured and sized before `new mapboxgl.Map()` runs, a modal that starts hidden
reports zero height, and you have to call `map.remove()` on unmount or you leak
a WebGL context every time someone opens a row. None of that buys anything in a
read-only detail view. A static image renders instantly, needs no library, and
cannot leak.

Pair it with a plain "Open in Maps" link for directions, which is what anyone
would actually want from a detail view.

**Only render it when both `latitude` and `longitude` are non-null.** They are
nullable on every model, and a URL with `undefined` in it returns a 422 image.

**`Trip` has no coordinate columns** - only `destination` as text - so the trip
overview gets no map unless we migrate. Not worth it; the trip-level map, if we
ever build one, fits the activity and reservation pins instead.

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

### Native behaviour - voting (your PR 6)

**One vote per member per activity.** Not a score, not a weight, not a
downvote. A unique constraint on `(activityId, userId)` is what enforces it -
check it's in `schema.prisma` and tell Josh if it isn't.

Two endpoints, both on the activity:

```
POST   /api/trips/:tripId/activities/:activityId/vote    -> 201
DELETE /api/trips/:tripId/activities/:activityId/vote    -> 204
```

There is no "change your vote" because there is nothing to change - you have
one or you don't. Voting twice should not create a second row; let the unique
constraint reject it and return 409.

**Your list response needs two fields, not one.** `voteCount` is how many
people voted. `hasVoted` is whether _you_ did, which is what decides how the
button looks. Get the second one in the same query rather than a second
request:

```ts
select: {
  // ...
  _count: { select: { votes: true } },
  votes: { where: { userId: req.user.id }, select: { id: true } },
}
```

Then `hasVoted: activity.votes.length > 0`.

**Sorting by votes is not a normal `orderBy`** - see the note in
`conventions.md` PR 1 Step 3b. It needs the relation count form.

For the button, invalidate the list on success like any other mutation. If it
feels sluggish, come to Josh about optimistic updates - don't reach for them
first.

---

## Antony Benitez: Reservations

Confirmed bookings: flights, hotels, rental cars, restaurants, attractions.

- Reservation CRUD across all types
- Confirmation number, provider, start and end times, cost
- Location fields using the shared location picker
- List grouped by type, with a detail view

This is the cleanest feature in the project: real CRUD, no cross-entity logic,
no algorithms. It's the right place to learn the full stack properly. Get it
solid and you'll understand every other feature in the codebase.

### Native behaviour - the type field (your PR 6 if not already done, and it's small)

**Every reservation type uses the same fields.** One form, one table, one set
of columns. The type is a dropdown on the form, a filter in the toolbar, and a
grouping in the list - that's all it does.

This is a deliberate decision and it's the one to defend. "Flights need a
flight number, hotels need a room type" is true of a real product and would
turn one feature into six, each with its own form and its own validation. For
our MVP the confirmation number and the provider carry that information.

So: a `ReservationType` enum, a `type` column, and a group-by in the list page.
Nothing conditional in the form.

**If someone asks at the defense**, the answer is that per-type fields were
scoped out on purpose as a schema-complexity tradeoff, and the generic record
covers every type we support.

---

## Christopher Soliman: Itinerary

The actual day-by-day schedule for the trip.

- Itinerary event CRUD with start and end times
- List grouped by day across the trip's date range
- Standalone events first (an event not tied to an activity or reservation)
- Later: optional links to an activity or reservation

Build standalone events first. The links come in Sprint 3, once Brandon's and
Antony's APIs exist - that ordering means you're never waiting on them.

There's real backend thinking in grouping events by day across a date range,
which matches your interest in backend work.

### Native behaviour - grouping by day, and linking (your PR 6)

**Grouping happens on the server, not in the browser.** Return the days, not a
flat list:

```ts
{ days: [ { date: "2026-11-12", events: [ ... ] }, ... ] }
```

Build the array from the **trip's** `startDate` to `endDate` and include every
day, even empty ones - an empty Wednesday in the middle of a trip is
information, and a client that has to invent the missing days will get it wrong.
Compare dates as `YYYY-MM-DD` strings; see the date rule in `conventions.md`
section 4.

**Linking points at a record, it does not copy it.** `ItineraryEvent` gets two
optional foreign keys, `activityId` and `reservationId`, and **at most one is
ever set.** Enforce that in your Zod schema with a `.refine()`.

**The event always owns its own start and end time**, even when it's linked.
An activity has a _suggested_ time; the itinerary has the _actual_ time. If
scheduling copied the time, you'd have two sources of truth that drift the
moment someone edits either one. The link is for the name, the location and the
cost - not the time.

Display: if the event is linked, show the linked record's name; if it's
standalone, show the event's own title.

**When a linked activity is deleted, the event survives and becomes
standalone.** Deleting someone's whole schedule slot because someone else
removed a proposal is a nasty surprise. That means `onDelete: SetNull` on both
relations - check `schema.prisma`, and if it says `Cascade`, tell Josh, because
that's a migration.

---

## Yahya Nawaz: Members

Who is on a trip, what role they have, and getting them off it.

- Member roster with roles
- Member detail view
- Change a member's role between OWNER and MEMBER
- Remove a member, and leave a trip yourself

Your feature is the one every other page depends on knowing about - the
permission system reads from your table, and the roster is on screen in every
demo from Sprint 2 onward. It is also the smallest surface in the project,
which means you can get it genuinely finished rather than mostly working.

Getting people _into_ a trip is invitations, and that is Josh's. Members appear
in your table when someone accepts one.

### Your endpoints

```
GET    /api/trips/:tripId/members              list    (any member)
GET    /api/trips/:tripId/members/:userId      one     (any member)
PATCH  /api/trips/:tripId/members/:userId      role    (OWNER)
DELETE /api/trips/:tripId/members/me           leave   (any member)
DELETE /api/trips/:tripId/members/:userId      remove  (OWNER)
```

### Native behaviour - three things no other feature has

**1. There is no POST.** You cannot create a member directly; a member appears
by accepting an invitation. So your PR 2 is `PATCH` and `DELETE` only. When
`conventions.md` PR 2 tells you to write a create endpoint, this is the
exception - skip it, and say so in your PR description so nobody thinks you
forgot.

**2. `/me` must be registered BEFORE `/:userId`.** Express matches routes in
the order you declare them, so if `/:userId` comes first it will happily match
the literal string `"me"` and try to remove a user whose id is `"me"`.

```ts
// This order. Not the other one.
memberRouter.delete('/me', leaveTrip);
memberRouter.delete('/:userId', requireTripRole('OWNER'), removeMember);
```

Two separate routes rather than one route that checks whether you are removing
yourself. Separate guards, no branching in the controller, and the difference
between leaving and being removed is visible in the URL.

**3. The last OWNER cannot be demoted or removed.** Count the owners first:

```ts
const ownerCount = await prisma.tripMember.count({
  where: { tripId, role: 'OWNER' },
});

// This is not a nicety. A trip with no owner can never be renamed, re-dated
// or deleted by anyone, ever - there is no route back from it except editing
// the database by hand.
if (ownerCount === 1 && target.role === 'OWNER') {
  return badRequest(res, 'A trip must always have at least one owner');
}
```

That check belongs in **three** places: the role change, the remove, and the
leave. Write it once as a helper in your controller and call it three times.
Your schema tests cannot cover it - it needs the database - so verify all three
in your `.http` file and say in your PR description that you did.

Your interface should not offer an option the server will reject: if there is
one owner, the roster hides Remove and the role dropdown for that person.

---

## Working agreement

**Push your branch every day you work on it.** Not a pull request, just a
push. Three days of no commits is a standup topic.

**Open a draft pull request within two days of starting a task**, even if it's
one route stub. This is the most important rule here. A draft PR that's half
done can be redirected in five minutes; a week of silence can't.

**Keep pull requests under about 300 lines. 500 at most** Bigger than that should have been
two tasks. Large PRs get skimmed, and a skimmed PR is an unreviewed PR.

**Before every PR:** `npm run typecheck`, `npm run lint`, `npm run format`,
`npm test --workspace=server`. Then merge `main` into your branch and run all
four again.

**Changed `schema.prisma`?** Tell everyone — they need to re-run
`npm run db:migrate`.

**Added an environment variable?** Add the key to `.env.example` in the same
commit, **never the value**.

**Reached something your spec doesn't cover?** Ask in the chat. Don't invent it.

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

| Date           | What                                                               |
| -------------- | ------------------------------------------------------------------ |
| **Sun 1 Nov**  | End of Sprint 1: every feature's API works in its `.http` file     |
| **Sun 15 Nov** | End of Sprint 2: every feature has a list and a detail modal       |
| **Sun 22 Nov** | End of Sprint 3: **feature freeze.** Nothing new starts after this |
| 23–29 Nov      | Thanksgiving: no planned work                                      |
| **Thu 3 Dec**  | Production verified, cross-feature integration done                |
| **Sun 6 Dec**  | Functionally complete, demo rehearsed                              |

Sprint detail in `docs/sprints.md`. Task board is in the projects tab of the repo
