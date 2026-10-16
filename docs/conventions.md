# Conventions
 
How to build your feature in TripSquad.
 
**You are not expected to make design decisions.** Every pattern you need already
exists in the Trip feature. This document tells you which file to copy and what
to change.
 
If something here is unclear or doesn't match what you see in the code, say so in
the chat. A wrong guess costs a day; asking costs five minutes.
 
---

## Contents
 
1. [The one rule](#1-the-one-rule)
2. [Where everything lives](#2-where-everything-lives)
3. [Your four pull requests](#3-your-four-pull-requests)
4. [Rules that will break things if you ignore them](#4-rules-that-will-break-things-if-you-ignore-them)
5. [When something goes wrong](#5-when-something-goes-wrong)
6. [Before you open a pull request](#6-before-you-open-a-pull-request)

---

## 1. The one rule
 
**Copy the Trip feature.** It exists so you don't have to invent anything.
 
These eleven files are your reference. Open them before you write code, and
again whenever you're unsure:
 
**Server**
 
| File | What it is |
|---|---|
| `server/prisma/schema.prisma` | your models are already in here |
| `server/src/schemas/tripSchemas.ts` | validation |
| `server/src/schemas/tripSchemas.test.ts` | tests for validation |
| `server/src/controllers/tripController.ts` | the endpoints |
| `server/src/routes/tripRoutes.ts` | the router |
| `server/trip.http` | manual request tests |
 
**Client**
 
| File | What it is |
|---|---|
| `client/src/types/api.ts` | response shapes |
| `client/src/services/tripService.ts` | the fetch calls |
| `client/src/lib/queryKeys.ts` | cache keys |
| `client/src/hooks/trips/*.ts` | one file per query/mutation |
| `client/src/pages/dashboard/MyTripsPage.tsx` | a list page |
 
Every example below uses **Activities** (Brandon's feature). Swap the names for
yours.
 
---

## 2. Where everything lives
 
### Server: a request's journey
 
```
Request  →  app.ts            mounts the router, checks you're signed in
         →  routes/           which function handles this URL?
         →  middleware/       are you allowed to touch this trip?
         →  schemas/          is the request body valid?
         →  controllers/      do the database work, send the response
```
 
### Client: a page's journey
 
```
Page component  →  calls a hook        (never a service, never fetch)
hooks/          →  calls a service     + owns the cache
services/       →  calls lib/api.ts    (no React in here at all)
```
 
**The rule that matters:** a component calls a hook. If you find yourself
importing `lib/api` or a service into a component, you're missing a hook.

### Naming
 
| Thing | Pattern | Example |
|---|---|---|
| Server schema | `<feature>Schemas.ts` | `activitySchemas.ts` |
| Server controller | `<feature>Controller.ts` | `activityController.ts` |
| Server routes | `<feature>Routes.ts` | `activityRoutes.ts` |
| Client service | `<feature>Service.ts` | `activityService.ts` |
| Client hook | `use<Thing>.ts` | `useActivities.ts`, `useCreateActivity.ts` |
| Component | `PascalCase.tsx` | `ActivityCard.tsx` |
| Page | `<Thing>Page.tsx` | `ActivitiesPage.tsx` |
 
Everything is a **named export** (`export function Thing()`), never
`export default`.
 
Every file starts with a header comment. Copy the format from any existing file.
 
---

## 3. Your four pull requests
 
Ship in this order. Each one is reviewable on its own and around 300-500 lines max.
 
### PR 1 - Read API
 
**Goal:** `GET` your list and `GET` one item, working in `.http`.
 
Create:
 
```
server/src/schemas/activitySchemas.ts
server/src/controllers/activityController.ts
server/src/routes/activityRoutes.ts
server/activity.http
```
 
Change: `server/src/app.ts` (one line).
 
**Step 1 - the router mount.** In `app.ts`, beside the trip router:
 
```ts
app.use(
  '/api/trips/:tripId/activities',
  requireAuth,
  requireTripRole(),
  activityRouter,
);
```
 
**Step 2 - the router itself.** Copy `tripRoutes.ts`. One critical difference:
 
```ts
// mergeParams: true is REQUIRED. Without it req.params.tripId is undefined
// in every handler, because :tripId belongs to the mount path above, not to
// this router.
export const activityRouter = Router({ mergeParams: true });
 
activityRouter.get('/', listActivities);
activityRouter.get('/:activityId', getActivityById);
```
 
**Step 3 - the controller.** Copy `listTrips` and `getTripById`. Every
controller function has the same five steps:
 
```ts
export async function listActivities(req: Request, res: Response) {
  // ----- 1. Confirm the user is on the request -----
  // requireAuth guarantees it, but TypeScript can't know that.
  if (!req.user) return unauthorized(res, 'Not signed in');
 
  // ----- 2. Get the trip id -----
  const tripId = req.params.tripId;
  if (typeof tripId !== 'string') return badRequest(res, 'Missing trip id');
 
  // ----- 3. Query, with an explicit select -----
  const activities = await prisma.activity.findMany({
    where: { tripId },
    select: {
      id: true,
      name: true,
      locationName: true,
      estimatedCostCents: true,
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
 
  // ----- 4. Shape the response -----
  const payload = activities.map(({ _count, ...activity }) => ({
    ...activity,
    voteCount: _count.votes,
  }));
 
  // ----- 5. Respond -----
  res.json({ activities: payload });
}
```
 
**You do not write a permission check.** `requireTripRole()` in step 1 of the
mount already did it. By the time your controller runs, the caller is a member
of that trip. `where: { tripId }` is all the scoping you need.
 
**Step 4 - verify.** Copy `trip.http` into `activity.http`, change the URLs, and
run every request. Check at minimum:
 
- 200 with your list
- 404 with a trip id you're not a member of
- 401 with no `Authorization` header
Don't open the PR until those three pass.
 
---

### PR 2 - Write API
 
**Goal:** `POST`, `PATCH`, `DELETE` working in `.http`.
 
Change: your schema file, your controller, your router, your `.http`.
 
**Step 1 - validation.** In `activitySchemas.ts`, copy the shape of
`tripSchemas.ts` exactly:
 
```ts
// The editable fields, with no cross-field rules yet.
//
// Keep this a plain z.object(). .refine() returns a different type that has no
// .partial(), so create and update must BOTH be built from this base.
const activityFields = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  estimatedCostCents: z.number().int().min(0).nullable().optional(),
 
  locationName: z.string().trim().max(200).nullable().optional(),
  locationAddress: z.string().trim().max(300).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});
 
export const createActivitySchema = activityFields;
 
export const updateActivitySchema = activityFields
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });
```
 
**Step 2 - the routes.** Note the different guard on write:
 
```ts
activityRouter.post('/', createActivity);
activityRouter.patch('/:activityId', updateActivity);
activityRouter.delete('/:activityId', deleteActivity);
```
 
Those inherit `requireTripRole()` from the mount, so any member can write. If
something should be owner-only, add `requireTripRole('OWNER')` to that one route; see how `tripRoutes.ts` does it.
 
**Step 3 - the controller.** Copy `createTrip` and `updateTrip`:
 
```ts
const body = createActivitySchema.parse(req.body);
 
const activity = await prisma.activity.create({
  data: { ...body, tripId, createdById: req.user.id },
  select: { id: true, name: true /* ... */ },
});
 
res.status(201).json({ activity });
```
 
`.parse()` throws on bad input, and `app.ts` turns that into a 422 with
field-level detail. **You never write a try/catch around it.**
 
**Step 4 - tests.** Copy `tripSchemas.test.ts`. These are pure functions with no
database, so they're the easiest tests you'll ever write. Cover:
 
- a valid body passes
- a required field missing fails
- an empty PATCH body fails
- one bad value per field (too long, negative, out of range)
```bash
npm test --workspace=server
```
 
**Step 5 - verify.** Add create/update/delete to your `.http` file, including
the ones that should fail with 422.
 
---

### PR 3 - Read UI
 
**Goal:** your list page shows real data.
 
Create:
 
```
client/src/services/activityService.ts
client/src/hooks/activities/useActivities.ts
client/src/components/activities/ActivityList.tsx
```
 
Change: `client/src/types/api.ts`, `client/src/lib/queryKeys.ts`, your page.
 
**Your page already has a route.** `ActivitiesPage.tsx` is wired up in `App.tsx`; you're filling it in, not adding it.
 
**Step 1 - types.** Add a section to `types/api.ts`, matching your controller's
`select` exactly:
 
```ts
// -------------------- Activities --------------------
 
export interface ActivityListItem {
  id: string;
  name: string;
  locationName: string | null;
  estimatedCostCents: number | null;
  voteCount: number;
}
 
export interface ActivityListResponse {
  activities: ActivityListItem[];
}
```
 
If you change your controller's `select` later, change this in the same commit.
A type that lies is worse than no type.
 
**Step 2 - cache keys.** Add to `lib/queryKeys.ts`:
 
```ts
export const activityKeys = {
  all: (tripId: string) => ['trips', tripId, 'activities'] as const,
  lists: (tripId: string) => [...activityKeys.all(tripId), 'list'] as const,
  detail: (tripId: string, activityId: string) =>
    [...activityKeys.all(tripId), 'detail', activityId] as const,
};
```
 
**Never hardcode a key array in a hook.** That's how you get the
"why didn't my list refresh?" bug - one hook writes `['activities']`, another
invalidates `['activity']`, and nothing tells you they disagree.
 
**Step 3 - service.** Copy `tripService.ts`. Plain async functions, no React:
 
```ts
export function fetchActivities(tripId: string): Promise<ActivityListResponse> {
  return get<ActivityListResponse>(`/trips/${tripId}/activities`);
}
```
 
**Step 4 - hook.** Copy `useTrips.ts`. One hook per file:
 
```ts
export function useActivities(tripId: string | undefined) {
  return useQuery({
    queryKey: activityKeys.lists(tripId ?? ''),
    queryFn: () => {
      if (!tripId) throw new Error('useActivities called without a trip id');
      return fetchActivities(tripId);
    },
    // Stops a request firing with `undefined` in the URL on first render.
    enabled: Boolean(tripId),
  });
}
```
 
**Step 5 - the page.** Copy `MyTripsPage.tsx`. It gives you search, filter and
sort for free:
 
```tsx
const ACTIVITY_LIST_DEFAULTS = {
  search: '',
  sort: 'votes:desc',
};
 
export function ActivitiesPage() {
  const { tripId } = useParams();
  const list = useListQueryState({ defaults: ACTIVITY_LIST_DEFAULTS });
  const activities = useActivities(tripId);
 
  // ... toolbar, loading, error, empty, DataList
}
```
 
Use these shared components rather than writing your own:
 
| Component | What for |
|---|---|
| `components/list/ListToolbar` | search box + dropdowns + action button |
| `components/list/DataList` | table on desktop, cards on mobile |
| `components/list/EmptyState` | "nothing here yet" |
| `hooks/useListQueryState` | keeps search/filter/sort in the URL |
 
`DataList` takes a `columns` array and a `renderCard` callback - see
`components/dashboard/TripList.tsx` for the worked example.
 
---

### PR 4 - Write UI
 
**Goal:** create, edit and delete from the interface.
 
Create:
 
```
client/src/hooks/activities/useCreateActivity.ts
client/src/hooks/activities/useUpdateActivity.ts
client/src/hooks/activities/useDeleteActivity.ts
client/src/components/activities/ActivityFormModal.tsx
```
 
**Step 1 - mutation hooks.** Copy `useCreateTrip.ts`. The important part is
`onSuccess`:
 
```ts
export function useCreateActivity(tripId: string) {
  const queryClient = useQueryClient();
 
  return useMutation({
    mutationFn: (body: CreateActivityBody) => createActivity(tripId, body),
 
    // Without this the list does not update after you create something.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: activityKeys.lists(tripId) });
    },
  });
}
```
 
For **delete**, use `removeQueries` on the detail key and `invalidateQueries` on
the list - see `useDeleteTrip.ts`. Invalidating a deleted item refetches it and
hands you a 404.
 
For **update**, invalidate **both** the detail and the list. Forgetting the list
is why a rename sometimes looks like it didn't save until you refresh.
 
**Step 2 - the form.** Copy `components/TripFormModal.tsx`. One component for
create *and* edit: pass the item to edit, omit it to create.
 
Use the shared form controls:
 
| Component | What for |
|---|---|
| `components/form/TextField` | single-line input |
| `components/form/TextArea` | multi-line |
| `components/form/DateTimeInput` | `mode="date"` or `mode="datetime"` |
| `components/LocationPicker` | place search → address + coordinates |
| `components/Modal` | the dialog shell |
| `components/ConfirmDialog` | "are you sure?" before deleting |
 
**Step 3 - the submit action.** This part has a trap in it. Copy
`TripFormModal.tsx` carefully:
 
```tsx
const [state, submitAction, isPending] = useActionState(
  async (_previous: FormState<ActivityValues>, formData: FormData) => {
    const values = readFormValues(formData, FIELD_NAMES);
 
    if (somethingIsWrong) {
      // ALWAYS return `values`. See the warning below.
      return { values, fieldErrors: { name: 'Too short' } };
    }
 
    try {
      await createActivity.mutateAsync(body);
      onClose();
      return { values: initialValues(activity) };
    } catch (error) {
      return {
        values,
        formError: error instanceof Error ? error.message : 'Something went wrong.',
      };
    }
  },
  { values: initialValues(activity) },
);
```
 
> **⚠️ Always return `values` from a submit action, including on success.**
>
> React 19 clears an uncontrolled form after the action finishes, whether it
> succeeded or not. Returning the submitted values and reading
> `defaultValue={state.values.name}` is what keeps the user's typing on screen
> when validation fails. Return a bare error string and every field wipes.
>
> Full explanation in `client/src/lib/formState.ts`.
 
**Step 4 - the location fields.** If your feature stores a place, it has four
columns and they split in two:
 
```tsx
{/* The LOCATION NAME is typed. Mapbox cannot find "Universal Studios" by name. */}
<TextField label="Location Name" name="locationName" required
           defaultValue={state.values.locationName} />
 
{/* The ADDRESS and COORDINATES come from the picker. */}
<LocationPicker
  label="Location"
  searchFor="address"
  value={place}
  onChange={setPlace}
/>
```
 
Then map all four in your submit action:
 
```ts
locationName: values.locationName,
locationAddress: place.label || undefined,
latitude: place.latitude,
longitude: place.longitude,
```
 
Taking the label and forgetting the coordinates is the common mistake, and
nothing warns you - the record saves fine and you just never get a map pin.
 
---

## 4. Rules that will break things if you ignore them
 
**PATCH, never PUT.** Every field optional, omitted fields left alone. PUT means
"replace the whole resource", so a form that only sends what changed would blank
everything else.
 
**Money is a whole number of cents.** `amountCents: 1250`, never `12.50`. Store
cents, do all maths in cents, format to `$12.50` only where it's displayed.
`0.1 + 0.2` is `0.30000000000000004` in JavaScript, and an expense split three
ways won't reconcile.
 
**`@map` on every multi-word Prisma field.** `locationName String?
@map("location_name")`. Postgres lowercases unquoted names, so without it the
column is literally `locationname`.
 
**Always use an explicit `select`** in Prisma. Never return whole rows - you leak
columns you didn't think about, and the payload grows silently when the schema
changes.
 
**Dates with no time stay strings.** `"2026-06-12"` from the input, through the
service, to `z.iso.date()`. Never build a `Date` from a form value.
`new Date("2026-04-20")` is parsed as UTC midnight and
`new Date("2026-04-20T09:00")` as local time - mixing them makes dates land a
day early. Compare two `YYYY-MM-DD` strings with `<` and `>=`; that works.
 
**Every hook runs before any `return`** in a component. React calls hooks in
order, so an `if (...) return` above a `useQuery` changes the hook count between
renders and React throws. All hooks at the top, branching after.
 
**Feature routers need `Router({ mergeParams: true })`.** Otherwise
`req.params.tripId` is `undefined` in every handler.
 
**Non-members get 404, not 403.** `requireTripRole` handles this - don't
"fix" it. A 403 confirms the trip exists, which lets someone walk ids to
discover real trips.
 
**Changed `schema.prisma`? Tell everyone in the chat.** They need
`npm run db:migrate`.
 
**Colours come from the theme.** `brand-600` for buttons and links,
`brand-700` for hover, `ink-900` for text, `ink-700` for secondary text,
`ink-300` for borders, `ink-100` for subtle backgrounds. Never a raw hex or a
default Tailwind colour like `blue-500`.
 
---

## 5. When something goes wrong
 
| What you see | What it usually is |
|---|---|
| `req.params.tripId` is `undefined` | Missing `Router({ mergeParams: true })` |
| 404 on a trip you're definitely in | Wrong trip id, or you're signed in as a different user. Check `db:studio` → `trip_members` |
| 401 on everything | No `Authorization: Bearer` header, or an expired token. Re-run the sign-in request in your `.http` file |
| 422 and you don't know why | The response body has `error.details` with the exact field. Look at it |
| 500 with no useful message | Check the **server terminal** - the real error is printed there |
| The list doesn't update after creating | Missing or mismatched `onSuccess` invalidation in your mutation hook |
| Form fields wipe on a validation error | Your submit action returned a string instead of `{ values, ... }` |
| "Rendered more hooks than during the previous render" | A hook is below an early `return` |
| "Cannot access refs during render" | You read `ref.current` while rendering. Use `useState` instead |
| "Fast refresh only works when a file only exports components" | A `.tsx` file is exporting a helper or a type. Move it to a `.ts` file |
| Prisma: "Unknown argument" | Your generated client is stale. Run `npm run db:migrate` |
| Types suddenly broken everywhere | Run `npm run db:migrate` to regenerate the Prisma client |
 
**If you're stuck for more than an hour, post in the chat.** Include the error
text and what you were doing. Being stuck is normal; being quietly stuck for a
week is what sinks group projects.
 
---

## 6. Before you open a pull request
 
```bash
npm run typecheck
npm run lint
npm run format
npm test --workspace=server
```
 
All four clean. Then:
 
- [ ] Under 300 lines of change (500 maximum, if logic is too heavy, that is fine to go over a bit)
- [ ] Every request in your `.http` file runs and returns what the comment says
- [ ] Did you touch `schema.prisma`? Say so in the PR description
- [ ] Did you add an environment variable? Add the **key only** to
      `.env.example`, never the value
- [ ] File header comments updated with today's date and what changed

**Open a draft PR within two days of starting a task**, even if it's one route
stub. A half-finished draft PR can be redirected in five minutes. A week of
silence can't.
