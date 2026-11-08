import { z } from "zod";

export const skillGapSchema = z.object({
  name: z.string().min(1),
  evidence: z.string().min(1),
  priority: z.number().int().min(1).max(3)
});

export const interviewExtractionSchema = z.object({
  questions: z.array(z.object({
    text: z.string().min(1),
    category: z.string().min(1),
    sourceType: z.enum(["real", "web"]),
    round: z.string().optional(),
    followUps: z.array(z.string()).default([])
  })),
  unparsed: z.string().default("")
});

export const reflectionSchema = z.object({
  summary: z.string().min(1).max(600),
  question: z.string().min(1).max(120),
  smallThings: z.array(z.string().min(1)).max(3),
  safetyChecked: z.literal(true)
});

export const plannerSuggestionSchema = z.object({
  tarot: z.object({ card: z.string(), orientation: z.enum(["正位", "逆位"]), keywords: z.array(z.string()) }),
  observations: z.array(z.string()),
  suggestions: z.array(z.object({ text: z.string(), basis: z.array(z.enum(["learning_trend", "user_input", "tarot", "schedule"])), requiresConfirmation: z.literal(true) })),
  tone: z.string().min(1),
  safetyChecked: z.literal(true)
});

export const resumeMatchSchema = z.object({
  gaps: z.array(z.object({ skill: z.string(), evidence: z.string(), reason: z.string(), suggestion: z.string() })),
  highlights: z.array(z.string()),
  safetyChecked: z.literal(true)
});

export const memoryTrendSchema = z.object({
  observations: z.array(z.string()),
  suggestions: z.array(z.object({ text: z.string(), source: z.string(), requiresConfirmation: z.literal(true) })),
  safetyChecked: z.literal(true)
});

export type SkillGap = z.infer<typeof skillGapSchema>;
export type InterviewExtraction = z.infer<typeof interviewExtractionSchema>;
export type Reflection = z.infer<typeof reflectionSchema>;
export type PlannerSuggestion = z.infer<typeof plannerSuggestionSchema>;
export type ResumeMatch = z.infer<typeof resumeMatchSchema>;
export type MemoryTrend = z.infer<typeof memoryTrendSchema>;
