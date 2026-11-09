CREATE TABLE IF NOT EXISTS "resume_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "file_name" text NOT NULL,
  "html_content" text NOT NULL,
  "is_current" boolean DEFAULT true NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
