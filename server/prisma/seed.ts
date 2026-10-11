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
 *              NOTE: users are upserted. The demo trip is DELETED and
 *              rebuilt on every run, which cascades to every child row. That is
 *              simpler than hardcoding a UUID for all ~40 child records, and it
 *              means re-running always lands you in a known-good state.
 *
 * RUNS WITH: npm run db:seed --workspace=server (FROM ROOT DIR OF PROJECT)
 *
 * LAST UPDATED: 2026-10-09 - Seed a full demo trip (Josh Iehle)
 *               2026-09-24 - File Created (Josh Iehle)
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

// Fixed id so the demo trip can be found and rebuilt on every run
const DEMO_TRIP_ID = '00000000-0000-7000-8000-00000000aaaa';

// Fixture users
const FIXTURE_USERS = [
  {
    id: DEV_USER_ID,
    email: 'dev@example.com',
    displayName: 'Dev User',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'john@example.com',
    displayName: 'John',
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
  {
    id: '00000000-0000-4000-8000-000000000005',
    email: 'emily@example.com',
    displayName: 'Emily',
  },
];

// Named handles so the fixture data below reads like English instead of UUIDs
const [DEV, JOHN, TOMMY, SARAH, EMILY] = FIXTURE_USERS.map((u) => u.id) as [
  string,
  string,
  string,
  string,
  string,
];

// -------------------- Date Helpers --------------------

/**
 * Dates are relative to today, not hardcoded, so the demo trip stays in the future forever
 * instead of silently becoming a past trip
 *
 * Everything is built in UTC. @db.Date columns store a calendar day with no time, so constructing
 * them at local midnight would shift the day for anyone west of Greenwich
 */
function dayFromNow(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

function timeOnDay(offsetDays: number, hour: number, minute = 0): Date {
  const d = dayFromNow(offsetDays);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

// The demo trip runs five days, starting a month out
const TRIP_START_OFFSET = 30;
const TRIP_END_OFFSET = 34;

// -------------------- Money Helper --------------------

/**
 * Splits an integer-cent amount as evenly as cents allow, handing the remainder
 * out one cent at a time so the shares always sum back to the exact total. A $10.00 dinner
 * across 3 people becomes 334 / 333 / 333, never 333.33 x 3
 */
function splitEqually(amountCents: number, userIds: string[]) {
  const base = Math.floor(amountCents / userIds.length);
  let remainder = amountCents - base * userIds.length;

  return userIds.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userId, shareCents: base + extra };
  });
}

// -------------------- Seeding Function --------------------
async function main() {
  // -------------------- Users --------------------
  // `upsert` not `create` so the script does not blow up on a duplicate key
  // when run twice. Users are never deleted: expenses and trips reference them
  // with onDelete: Restrict.
  for (const user of FIXTURE_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: { email: user.email, displayName: user.displayName },
    });
  }

  // -------------------- Clear the prev demo trip --------------------
  // Trip -> everything else is onDelete: Cascade, so this one statement
  // removes the members, activities, votes, reservations, itinerary events,
  // expenses, participants and invitations from the last run.
  await prisma.trip.deleteMany({ where: { id: DEMO_TRIP_ID } });

  // -------------------- Trip + Members --------------------
  // Created in one statement so an ownerless trip is impossible
  const trip = await prisma.trip.create({
    data: {
      id: DEMO_TRIP_ID,
      createdById: DEV,
      name: 'Orlando Trip',
      description: 'Five days of theme parks and questionable food decisions.',
      destination: 'Orlando, FL',
      startDate: dayFromNow(TRIP_START_OFFSET),
      endDate: dayFromNow(TRIP_END_OFFSET),
      members: {
        create: [
          { userId: DEV, role: 'OWNER' },
          { userId: JOHN, role: 'MEMBER' },
          { userId: TOMMY, role: 'MEMBER' },
          { userId: SARAH, role: 'MEMBER' },
          { userId: EMILY, role: 'MEMBER' },
        ],
      },
    },
  });

  const everyone = [DEV, JOHN, TOMMY, SARAH, EMILY];

  // -------------------- Activities + Votes --------------------
  // Deliberately uneven vote counts so a list sorted by popularity looks like
  // it is actually doing something.
  const universal = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: JOHN,
      name: 'Universal Studios',
      description: 'Rope drop at Universal, then Islands of Adventure after lunch.',
      suggestedDateTime: timeOnDay(TRIP_START_OFFSET + 1, 9),
      locationName: 'Universal Studios Florida',
      locationAddress: '6000 Universal Blvd, Orlando, FL 32819',
      latitude: 28.4749,
      longitude: -81.4664,
      estimatedCostCents: 18_900,
      votes: { create: everyone.map((userId) => ({ userId })) },
    },
  });

  const beachDay = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: TOMMY,
      name: 'Beach day at Cocoa Beach',
      description: 'About an hour east. Bring the cooler.',
      suggestedDateTime: timeOnDay(TRIP_START_OFFSET + 2, 11),
      locationName: 'Cocoa Beach',
      locationAddress: 'Cocoa Beach, FL 32931',
      latitude: 28.32,
      longitude: -80.6076,
      estimatedCostCents: 0,
      votes: {
        create: [{ userId: DEV }, { userId: TOMMY }, { userId: SARAH }, { userId: EMILY }],
      },
    },
  });

  await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: SARAH,
      name: 'Disney Springs',
      description: 'Shopping and dinner, no park ticket needed.',
      locationName: 'Disney Springs',
      locationAddress: '1486 Buena Vista Dr, Lake Buena Vista, FL 32830',
      latitude: 28.37,
      longitude: -81.519,
      estimatedCostCents: 6_000,
      votes: { create: [{ userId: SARAH }, { userId: JOHN }] },
    },
  });

  await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: EMILY,
      name: 'Mini golf',
      description: 'Filler idea for the rainy afternoon.',
      estimatedCostCents: 2_500,
      votes: { create: [{ userId: EMILY }] },
    },
  });

  // -------------------- Reservations --------------------
  const flight = await prisma.reservation.create({
    data: {
      tripId: trip.id,
      createdById: DEV,
      type: 'FLIGHT',
      name: 'JFK to MCO',
      confirmationNumber: 'JB4471X',
      startDateTime: timeOnDay(TRIP_START_OFFSET, 8, 15),
      endDateTime: timeOnDay(TRIP_START_OFFSET, 11, 5),
      locationName: 'John F. Kennedy International Airport',
      locationAddress: 'Queens, NY 11430',
      latitude: 40.6413,
      longitude: -73.7781,
      costCents: 21_400,
      notes: 'Group booking, five seats together in row 18.',
    },
  });

  const hotel = await prisma.reservation.create({
    data: {
      tripId: trip.id,
      createdById: DEV,
      type: 'HOTEL',
      name: 'Hilton Orlando',
      confirmationNumber: 'HLT-8842190',
      startDateTime: timeOnDay(TRIP_START_OFFSET, 16),
      endDateTime: timeOnDay(TRIP_END_OFFSET, 11),
      locationName: 'Hilton Orlando',
      locationAddress: '6001 Destination Pkwy, Orlando, FL 32819',
      latitude: 28.4257,
      longitude: -81.4426,
      costCents: 120_000,
      notes: 'Two rooms, late checkout requested.',
    },
  });

  await prisma.reservation.create({
    data: {
      tripId: trip.id,
      createdById: JOHN,
      type: 'RENTAL_CAR',
      name: 'Midsize SUV - Enterprise',
      confirmationNumber: 'ENT-5523981',
      startDateTime: timeOnDay(TRIP_START_OFFSET, 12),
      endDateTime: timeOnDay(TRIP_END_OFFSET, 13),
      locationName: 'Orlando International Airport',
      locationAddress: '1 Jeff Fuqua Blvd, Orlando, FL 32827',
      latitude: 28.4312,
      longitude: -81.3081,
      costCents: 34_000,
    },
  });

  // -------------------- Itinerary Events --------------------
  // Six events across the first three days. Two come from a reservation, two
  // from an activity, and two are standalone, so every variant the itinerary
  // view has to render is present in the seed.
  await prisma.itineraryEvent.createMany({
    data: [
      // Day 1
      {
        tripId: trip.id,
        createdById: DEV,
        title: 'Flight to Orlando',
        startDateTime: timeOnDay(TRIP_START_OFFSET, 8, 15),
        endDateTime: timeOnDay(TRIP_START_OFFSET, 11, 5),
        locationName: 'John F. Kennedy International Airport',
        reservationId: flight.id,
      },
      {
        tripId: trip.id,
        createdById: DEV,
        title: 'Hotel check-in',
        startDateTime: timeOnDay(TRIP_START_OFFSET, 16),
        locationName: 'Hilton Orlando',
        locationAddress: '6001 Destination Pkwy, Orlando, FL 32819',
        latitude: 28.4257,
        longitude: -81.4426,
        reservationId: hotel.id,
      },
      // Day 2
      {
        tripId: trip.id,
        createdById: JOHN,
        title: 'Universal Studios',
        description: 'Meet in the lobby at 8:30 sharp.',
        startDateTime: timeOnDay(TRIP_START_OFFSET + 1, 9),
        endDateTime: timeOnDay(TRIP_START_OFFSET + 1, 20),
        locationName: 'Universal Studios Florida',
        locationAddress: '6000 Universal Blvd, Orlando, FL 32819',
        latitude: 28.4749,
        longitude: -81.4664,
        activityId: universal.id,
      },
      {
        tripId: trip.id,
        createdById: TOMMY,
        title: 'Dinner at CityWalk',
        description: 'Standalone event - not tied to an activity or reservation.',
        startDateTime: timeOnDay(TRIP_START_OFFSET + 1, 20, 30),
        locationName: 'Universal CityWalk',
      },
      // Day 3
      {
        tripId: trip.id,
        createdById: TOMMY,
        title: 'Drive to Cocoa Beach',
        description: 'Standalone event - not tied to an activity or reservation.',
        startDateTime: timeOnDay(TRIP_START_OFFSET + 2, 10),
        endDateTime: timeOnDay(TRIP_START_OFFSET + 2, 11),
      },
      {
        tripId: trip.id,
        createdById: TOMMY,
        title: 'Beach day',
        startDateTime: timeOnDay(TRIP_START_OFFSET + 2, 11),
        endDateTime: timeOnDay(TRIP_START_OFFSET + 2, 17),
        locationName: 'Cocoa Beach',
        latitude: 28.32,
        longitude: -80.6076,
        activityId: beachDay.id,
      },
    ],
  });

  // -------------------- Expenses + Participants --------------------
  // Five expenses with three different payers, so the balance view has real
  // numbers to work with. The last one splits across a subset of the group and
  // produces an uneven remainder on purpose.
  const expenses = [
    {
      title: 'Hotel - 5 nights',
      description: 'Two rooms at the Hilton.',
      amountCents: 120_000,
      paidById: DEV,
      expenseDate: dayFromNow(TRIP_START_OFFSET),
      participants: everyone,
      reservationId: hotel.id,
    },
    {
      title: 'Rental car',
      amountCents: 34_000,
      paidById: JOHN,
      expenseDate: dayFromNow(TRIP_START_OFFSET),
      participants: everyone,
    },
    {
      title: 'Universal tickets',
      amountCents: 74_500,
      paidById: DEV,
      expenseDate: dayFromNow(TRIP_START_OFFSET + 1),
      participants: everyone,
      activityId: universal.id,
    },
    {
      title: 'Dinner at CityWalk',
      amountCents: 18_650,
      paidById: TOMMY,
      expenseDate: dayFromNow(TRIP_START_OFFSET + 1),
      participants: everyone,
    },
    {
      // 6200 / 3 = 2066.67, so shares come out 2067 / 2067 / 2066.
      // Proof the remainder is distributed instead of dropped.
      title: 'Gas for the beach run',
      amountCents: 6_200,
      paidById: SARAH,
      expenseDate: dayFromNow(TRIP_START_OFFSET + 2),
      participants: [DEV, JOHN, SARAH],
    },
  ];

  for (const expense of expenses) {
    const { participants, ...rest } = expense;
    await prisma.expense.create({
      data: {
        ...rest,
        tripId: trip.id,
        createdById: rest.paidById,
        participants: { create: splitEqually(rest.amountCents, participants) },
      },
    });
  }

  // -------------------- Pending Invitations --------------------
  // Addressed to emails with no account, which is the realistic case
  await prisma.tripInvitation.createMany({
    data: [
      {
        tripId: trip.id,
        invitedById: DEV,
        email: 'alex@example.com',
        token: 'seed-invite-token-alex',
        status: 'PENDING',
        expiresAt: dayFromNow(7),
      },
      {
        tripId: trip.id,
        invitedById: JOHN,
        email: 'jordan@example.com',
        token: 'seed-invite-token-jordan',
        status: 'PENDING',
        expiresAt: dayFromNow(7),
      },
    ],
  });

  // -------------------- Summary --------------------
  const counts = {
    users: await prisma.user.count(),
    members: await prisma.tripMember.count({ where: { tripId: trip.id } }),
    activities: await prisma.activity.count({ where: { tripId: trip.id } }),
    votes: await prisma.activityVote.count({ where: { activity: { tripId: trip.id } } }),
    reservations: await prisma.reservation.count({ where: { tripId: trip.id } }),
    itineraryEvents: await prisma.itineraryEvent.count({ where: { tripId: trip.id } }),
    expenses: await prisma.expense.count({ where: { tripId: trip.id } }),
    participants: await prisma.expenseParticipant.count({
      where: { expense: { tripId: trip.id } },
    }),
    invitations: await prisma.tripInvitation.count({ where: { tripId: trip.id } }),
  };

  console.log('\nSeeded demo trip:', trip.name);
  console.table(counts);
  console.log(`Trip id: ${trip.id}`);
  console.log(`Dev user id: ${DEV_USER_ID}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
