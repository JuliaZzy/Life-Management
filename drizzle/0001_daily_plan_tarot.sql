CREATE TABLE IF NOT EXISTS "daily_plans" (
  "plan_date" date PRIMARY KEY NOT NULL,
  "body" text DEFAULT '' NOT NULL,
  "planner_snapshot" jsonb,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "daily_tarot" (
  "draw_date" date PRIMARY KEY NOT NULL,
  "card_id" text NOT NULL,
  "card_name" text NOT NULL,
  "image" text NOT NULL,
  "orientation" text NOT NULL,
  "position" integer NOT NULL,
  "keywords" text[] DEFAULT '{}' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "app_state" (
  "id" text PRIMARY KEY NOT NULL,
  "state" jsonb DEFAULT '{}' NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
