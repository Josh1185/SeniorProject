# TripSquad: Sprint Plan and Task Board

**Six working weeks left.** Four sprints, Thanksgiving week off, done by Sunday
6 December.

| Sprint | Dates                   | Weeks | Goal                                                     |
| ------ | ----------------------- | ----- | -------------------------------------------------------- |
| **1**  | Mon 19 Oct – Sun 1 Nov  | 2     | Every feature's API works                                |
| **2**  | Mon 2 Nov – Sun 15 Nov  | 2     | Every feature's interface works                          |
| **3**  | Mon 16 Nov – Sun 22 Nov | 1     | Each feature's own behaviour. **Feature freeze Sun 22.** |
| —      | Mon 23 – Sun 29 Nov     | —     | **Thanksgiving. No work planned.**                       |
| **4**  | Mon 30 Nov – Sun 6 Dec  | 1     | Integration, polish, deploy, rehearse                    |

**The cadence is one pull request per week.** If you're ever unsure whether
you're on track, that's the measure. Five PRs plus one for your own behaviour,
six weeks, one a week.

**Card sizes:** S is an evening. M is a few evenings. L is most of a week.

---

## Sprint 1 - API (Mon 19 Oct – Sun 1 Nov)

**Checkpoint Sun 25 Oct:** PR 1 merged.
**Exit gate Sun 1 Nov:** every `.http` file runs clean - 200, 404 on a trip
you're not in, 401 with no token, 422 on bad input.

Nothing in this sprint touches React. If you find yourself in a `.tsx` file,
you've skipped ahead

---

## Sprint 2 - Interface (Mon 2 Nov – Sun 15 Nov)

**Checkpoint Sun 8 Nov:** PR 3 and PR 4 merged. The detail modal is half a day
once the list works, so these land together.
**Exit gate Sun 15 Nov:** every feature has a working list, a working detail
modal, and create / edit / delete from the interface.

---

## Sprint 3 - Your own behavior (Mon 16 Nov – Sun 22 Nov)

**One week, one card each.** This is the part `conventions.md` doesn't cover,
so it's the week you'll need the most help - ask early, not Friday.

**Feature freeze Sunday 22 November.** Nothing new starts after that date. Work
in progress either lands by then or gets cut.

---

## Thanksgiving - Mon 23 to Sun 29 November

**No work planned, no standups, no PRs expected.** Feature freeze was the day
before, deliberately, so nobody spends the break on an unfinished branch.

If you want to work, fix bugs on your own feature. Don't start anything new and
don't touch shared files.

---

## Sprint 4 - Integration and polish (Mon 30 Nov – Sun 6 Dec)

**No new features.** Everything here either connects existing features or makes
them presentable.
