import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  summary: text("summary").notNull().default(""),
  role: text("role").notNull().default(""),
  techStack: text("tech_stack").array().notNull().default([]),
  readme: text("readme").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const facts = pgTable("facts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id"),
  category: text("category").notNull(),
  content: text("content").notNull(),
  sourceSection: text("source_section"),
  verificationStatus: text("verification_status").notNull().default("candidate"),
  confirmed: boolean("confirmed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const resumeSources = pgTable("resume_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: text("file_name").notNull(),
  htmlContent: text("html_content").notNull(),
  isCurrent: boolean("is_current").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobDescription: text("job_description").notNull().default(""),
  status: text("status").notNull().default("applied"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  resumeVersionId: uuid("resume_version_id")
});

export const skillGaps = pgTable("skill_gaps", {
  id: serial("id").primaryKey(),
  applicationId: uuid("application_id").notNull(),
  name: text("name").notNull(),
  evidence: text("evidence").notNull(),
  priority: integer("priority").notNull(),
  status: text("status").notNull().default("candidate")
});

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id"),
  company: text("company").notNull(),
  round: text("round"),
  sourceType: text("source_type").notNull().default("real"),
  rawRecord: text("raw_record").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const interviewQuestions = pgTable("interview_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  normalizedText: text("normalized_text").notNull(),
  category: text("category").notNull(),
  answerDraft: text("answer_draft"),
  answerBasis: text("answer_basis"),
  confirmedAnswer: text("confirmed_answer"),
  mastery: integer("mastery").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const studyItems = pgTable("study_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("active"),
  stage: integer("stage").notNull().default(0),
  nextReviewAt: date("next_review_at"),
  scoreHistory: jsonb("score_history").notNull().default([])
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  kind: text("kind").notNull(),
  dueDate: date("due_date"),
  completed: boolean("completed").notNull().default(false)
});

export const diaryEntries = pgTable("diary_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  entryDate: date("entry_date").notNull(),
  body: text("body").notNull(),
  mood: integer("mood"),
  tags: text("tags").array().notNull().default([]),
  allowModel: boolean("allow_model").notNull().default(false)
});

export const dailyReflections = pgTable("daily_reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  reflectionDate: date("reflection_date").notNull(),
  cardName: text("card_name").notNull(),
  orientation: text("orientation").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  generatedContent: jsonb("generated_content"),
  confirmed: boolean("confirmed").notNull().default(false)
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  component: text("component").notNull(),
  action: text("action").notNull(),
  inputSummary: text("input_summary").notNull(),
  outputSummary: text("output_summary").notNull(),
  durationMs: integer("duration_ms").notNull(),
  failed: boolean("failed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
