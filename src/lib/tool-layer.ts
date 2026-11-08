import { z } from "zod";
import { reflectionSchema, skillGapSchema } from "./schemas";

/**
 * The UI calls these deterministic tool boundaries instead of touching a database.
 * The production adapter can replace the in-memory implementations with Drizzle queries.
 */
export const toolEventSchema = z.object({
  component: z.string(),
  action: z.string(),
  inputSummary: z.string(),
  outputSummary: z.string(),
  durationMs: z.number().int().nonnegative(),
  failed: z.boolean()
});

export type ToolEvent = z.infer<typeof toolEventSchema> & { id: string; createdAt: string };

export function createToolEvent(input: z.input<typeof toolEventSchema>): ToolEvent {
  return {
    ...toolEventSchema.parse(input),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

export function validateSkillGaps(value: unknown) {
  return z.array(skillGapSchema).parse(value);
}

export function validateReflection(value: unknown) {
  return reflectionSchema.parse(value);
}
