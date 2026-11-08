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

export type SkillGap = z.infer<typeof skillGapSchema>;
export type InterviewExtraction = z.infer<typeof interviewExtractionSchema>;
export type Reflection = z.infer<typeof reflectionSchema>;
