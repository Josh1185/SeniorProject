# TripSquad 

A collaborative group trip planning web application. 
Senior capstone, team of 4 ("The Null Pointers"), due December 2026.
 
One workspace per trip, replacing the usual sprawl of group chat + Google Docs +
Venmo + screenshots. Members share an itinerary, propose and vote on activities,
track and split expenses, store reservations, and see locations on a map.

---

## The Team

- Josh Iehle
- Brandon Douglass
- Christopher Soliman
- Yahya Nawaz
- Antony Benitez
 
---
 
## Technology stack 
 
| Layer | Choice |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Data fetching | TanStack Query |
| Routing | React Router 7 |
| Backend | Node 22 + Express 5 + TypeScript |
| ORM | Prisma 7 |
| Database | PostgreSQL 17 (Docker locally, Supabase for production) |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Maps | Mapbox |
| Email | Nodemailer (if notifications ship) |
| CI | GitHub Actions |
| Repo | npm workspaces monorepo: `server/` and `client/` |
 
**Version pins:** TypeScript is held at `~6.0.x` because
typescript-eslint does not yet support TypeScript 7. Prisma stays on 7 rather
than 8 for ecosystem compatibility. Tailwind 4 has no `tailwind.config.js` -
theming lives in a CSS `@theme` block. React Compiler is deliberately not used.
