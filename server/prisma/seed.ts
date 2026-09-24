/**
 * FILE: seed.ts
 * DESCRIPTION: Seeds the local development database.
 *              How seeded users relate to real ones:
 *
 *              Supabase Auth owns real identity. When you sign in, the auth
 *              middleware upserts a `User` row keyed by your Supabase user id.
 *              That is the REAL path, and it needs no seeding.
 *
 *              The rows below exist so you can develop features that need users to
 *              already be there, such as a members list, an expense split, without
 *              signing in as six different people. Their ids are made up UUIDs that
 *              match NO REAL account.
 *
 *              To make the seed data show up under YOUR login, put your own Supabase
 *              user id in DEV_USER_ID below. Find it in the Supabase dashboard under
 *              Authentication -> Users
 *
 * RUNS WITH: npm run db:seed --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-09-24 - File Created (Josh Iehle)
 */

// -------------------- Module imports --------------------
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

// -------------------- DB Connection Handling --------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Did you copy server/.env.example to server/.env?');
  process.exit(1);
}

// -------------------- Prisma Client Instance --------------------
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// -------------------- Fixtures --------------------

// Replace this with your own Supabase user id to see seed date under your login
const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

// Fixture users
const FIXTURE_USERS = [
  {
    id: DEV_USER_ID,
    email: 'dev@example.com',
    displayName: 'Dev User',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'brandon@example.com',
    displayName: 'Brandon',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'tommy@example.com',
    displayName: 'Tommy',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'sarah@example.com',
    displayName: 'Sarah',
  },
];

// -------------------- Seeding Function --------------------
async function main() {
  // NOTE: using `upsert` not `create` so that the script doesn't break when running it twice.
  //       If `create` was being used, the script would blow up on a duplicate key

  // -------------------- Users --------------------
  for (const user of FIXTURE_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: { email: user.email, displayName: user.displayName },
    });
  }

  console.log(`Seeded ${FIXTURE_USERS.length} users.`);
  console.log(`Dev user id: ${DEV_USER_ID}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
