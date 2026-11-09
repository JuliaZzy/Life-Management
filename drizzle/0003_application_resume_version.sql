CREATE TABLE IF NOT EXISTS "applications" (
  "id" text PRIMARY KEY,
  "company" text NOT NULL,
  "role" text NOT NULL,
  "base" text DEFAULT '' NOT NULL,
  "salary" text DEFAULT '' NOT NULL,
  "job_description" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'applied' NOT NULL,
  "applied_at" timestamptz NOT NULL,
  "last_contact_at" timestamptz,
  "resume_version_id" uuid,
  "resume_version" text DEFAULT '' NOT NULL
);

ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "base" text;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "salary" text;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "job_description" text;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "resume_version" text;
UPDATE "applications" SET "base" = '' WHERE "base" IS NULL;
UPDATE "applications" SET "salary" = '' WHERE "salary" IS NULL;
UPDATE "applications" SET "job_description" = '' WHERE "job_description" IS NULL;
UPDATE "applications" SET "resume_version" = "company" WHERE "resume_version" IS NULL;
ALTER TABLE "applications" ALTER COLUMN "base" SET DEFAULT '';
ALTER TABLE "applications" ALTER COLUMN "salary" SET DEFAULT '';
ALTER TABLE "applications" ALTER COLUMN "job_description" SET DEFAULT '';
ALTER TABLE "applications" ALTER COLUMN "resume_version" SET DEFAULT '';
ALTER TABLE "applications" ALTER COLUMN "base" SET NOT NULL;
ALTER TABLE "applications" ALTER COLUMN "salary" SET NOT NULL;
ALTER TABLE "applications" ALTER COLUMN "job_description" SET NOT NULL;
ALTER TABLE "applications" ALTER COLUMN "resume_version" SET NOT NULL;
