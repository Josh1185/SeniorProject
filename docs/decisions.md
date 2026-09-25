- TypeScript pinned to ~6.0.3 across both workspaces, because typescript-eslint's peer range excludes TS 7, and mismatched versions across workspaces defeat npm's hoisting. Revisit after TS 7.1 ships.

- Prisma 7 instead of Prisma 8 (7 is being supported until Jan 2027)

- "Confirm Email" is disabled in Supabase during development because the free tier's email service is rate-limited to a handful of messages per hour.
