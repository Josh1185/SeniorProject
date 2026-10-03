-- CreateEnum
CREATE TYPE "TripRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('FLIGHT', 'HOTEL', 'RENTAL_CAR', 'RESTAURANT', 'ATTRACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRIP_INVITATION', 'MEMBER_JOINED', 'ACTIVITY_CREATED', 'ACTIVITY_VOTED', 'ITINERARY_UPDATED', 'RESERVATION_ADDED', 'EXPENSE_ADDED', 'COMMENT_ADDED');

-- DropIndex
DROP INDEX "users_email_idx";

-- CreateTable
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "destination" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_members" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "TripRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_invitations" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "invited_by_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "suggested_date_time" TIMESTAMPTZ(3),
    "location_name" TEXT,
    "location_address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estimated_cost_cents" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_votes" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "type" "ReservationType" NOT NULL,
    "name" TEXT NOT NULL,
    "confirmation_number" TEXT,
    "start_date_time" TIMESTAMPTZ(3),
    "end_date_time" TIMESTAMPTZ(3),
    "location_name" TEXT,
    "location_address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cost_cents" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_events" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date_time" TIMESTAMPTZ(3) NOT NULL,
    "end_date_time" TIMESTAMPTZ(3),
    "location_name" TEXT,
    "location_address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "activity_id" UUID,
    "reservation_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "itinerary_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "paid_by_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "expense_date" DATE NOT NULL,
    "activity_id" UUID,
    "reservation_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_participants" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "share_cents" INTEGER NOT NULL,

    CONSTRAINT "expense_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_id" UUID,
    "reservation_id" UUID,
    "expense_id" UUID,
    "itinerary_event_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachments" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "activity_id" UUID,
    "reservation_id" UUID,
    "expense_id" UUID,
    "itinerary_event_id" UUID,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "trip_id" UUID,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_created_by_id_idx" ON "trips"("created_by_id");

-- CreateIndex
CREATE INDEX "trips_start_date_idx" ON "trips"("start_date");

-- CreateIndex
CREATE INDEX "trip_members_user_id_idx" ON "trip_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_members_trip_id_user_id_key" ON "trip_members"("trip_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_invitations_token_key" ON "trip_invitations"("token");

-- CreateIndex
CREATE INDEX "trip_invitations_trip_id_idx" ON "trip_invitations"("trip_id");

-- CreateIndex
CREATE INDEX "trip_invitations_invited_by_id_idx" ON "trip_invitations"("invited_by_id");

-- CreateIndex
CREATE INDEX "trip_invitations_email_status_idx" ON "trip_invitations"("email", "status");

-- CreateIndex
CREATE INDEX "activities_trip_id_idx" ON "activities"("trip_id");

-- CreateIndex
CREATE INDEX "activities_created_by_id_idx" ON "activities"("created_by_id");

-- CreateIndex
CREATE INDEX "activity_votes_user_id_idx" ON "activity_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_votes_activity_id_user_id_key" ON "activity_votes"("activity_id", "user_id");

-- CreateIndex
CREATE INDEX "reservations_trip_id_start_date_time_idx" ON "reservations"("trip_id", "start_date_time");

-- CreateIndex
CREATE INDEX "reservations_created_by_id_idx" ON "reservations"("created_by_id");

-- CreateIndex
CREATE INDEX "itinerary_events_trip_id_start_date_time_idx" ON "itinerary_events"("trip_id", "start_date_time");

-- CreateIndex
CREATE INDEX "itinerary_events_created_by_id_idx" ON "itinerary_events"("created_by_id");

-- CreateIndex
CREATE INDEX "itinerary_events_activity_id_idx" ON "itinerary_events"("activity_id");

-- CreateIndex
CREATE INDEX "itinerary_events_reservation_id_idx" ON "itinerary_events"("reservation_id");

-- CreateIndex
CREATE INDEX "expenses_trip_id_expense_date_idx" ON "expenses"("trip_id", "expense_date");

-- CreateIndex
CREATE INDEX "expenses_paid_by_id_idx" ON "expenses"("paid_by_id");

-- CreateIndex
CREATE INDEX "expenses_created_by_id_idx" ON "expenses"("created_by_id");

-- CreateIndex
CREATE INDEX "expenses_activity_id_idx" ON "expenses"("activity_id");

-- CreateIndex
CREATE INDEX "expenses_reservation_id_idx" ON "expenses"("reservation_id");

-- CreateIndex
CREATE INDEX "expense_participants_user_id_idx" ON "expense_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_participants_expense_id_user_id_key" ON "expense_participants"("expense_id", "user_id");

-- CreateIndex
CREATE INDEX "comments_trip_id_created_at_idx" ON "comments"("trip_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_activity_id_idx" ON "comments"("activity_id");

-- CreateIndex
CREATE INDEX "comments_reservation_id_idx" ON "comments"("reservation_id");

-- CreateIndex
CREATE INDEX "comments_expense_id_idx" ON "comments"("expense_id");

-- CreateIndex
CREATE INDEX "comments_itinerary_event_id_idx" ON "comments"("itinerary_event_id");

-- CreateIndex
CREATE INDEX "file_attachments_trip_id_idx" ON "file_attachments"("trip_id");

-- CreateIndex
CREATE INDEX "file_attachments_uploaded_by_id_idx" ON "file_attachments"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "file_attachments_activity_id_idx" ON "file_attachments"("activity_id");

-- CreateIndex
CREATE INDEX "file_attachments_reservation_id_idx" ON "file_attachments"("reservation_id");

-- CreateIndex
CREATE INDEX "file_attachments_expense_id_idx" ON "file_attachments"("expense_id");

-- CreateIndex
CREATE INDEX "file_attachments_itinerary_event_id_idx" ON "file_attachments"("itinerary_event_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_trip_id_idx" ON "notifications"("trip_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_invitations" ADD CONSTRAINT "trip_invitations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_invitations" ADD CONSTRAINT "trip_invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_votes" ADD CONSTRAINT "activity_votes_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_votes" ADD CONSTRAINT "activity_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_events" ADD CONSTRAINT "itinerary_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_participants" ADD CONSTRAINT "expense_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_itinerary_event_id_fkey" FOREIGN KEY ("itinerary_event_id") REFERENCES "itinerary_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_itinerary_event_id_fkey" FOREIGN KEY ("itinerary_event_id") REFERENCES "itinerary_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A comment must be attached to exactly one parent entity.
-- Prisma cannot express this, so it lives here.
ALTER TABLE "comments"
  ADD CONSTRAINT "comments_exactly_one_parent"
  CHECK (num_nonnulls("activity_id", "reservation_id", "expense_id", "itinerary_event_id") = 1);

-- A file may attach to one parent, or to none (a trip-level file).
ALTER TABLE "file_attachments"
  ADD CONSTRAINT "file_attachments_at_most_one_parent"
  CHECK (num_nonnulls("activity_id", "reservation_id", "expense_id", "itinerary_event_id") <= 1);
