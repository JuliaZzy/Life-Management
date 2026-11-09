import { describe, expect, it } from "vitest";
import {
  areExactDuplicateQuestions,
  calculateSm2,
  calculateResumeMatchScore,
  calculateWeightedScore,
  containsUnsafeTarotLanguage,
  detectCareSignal,
  isSilentApplication,
  questionDiceSimilarity,
  scheduleTasks,
  transitionApplication
} from "./domain";
import { describeTarotCard, drawTarot, shuffleTarot, tarotDeck } from "./tarot";

describe("application state machine", () => {
  it("accepts the normal forward path and rejects backwards transitions", () => {
    const initial = { id: "1", company: "A", role: "FE", status: "applied" as const, appliedAt: "2026-11-01T00:00:00.000Z", resumeVersion: "A" };
    const contacting = transitionApplication(initial, "contacting", "2026-11-02T00:00:00.000Z");
    expect(contacting.status).toBe("contacting");
    expect(() => transitionApplication(contacting, "applied", "2026-11-03T00:00:00.000Z")).toThrow("非法状态转换");
  });

  it("only marks an old applied application silent", () => {
    const asOf = new Date("2026-11-11T00:00:00.000Z");
    expect(isSilentApplication({ id: "1", company: "A", role: "FE", status: "applied", appliedAt: "2026-11-01T00:00:00.000Z", resumeVersion: "A" }, asOf, 7)).toBe(true);
    expect(isSilentApplication({ id: "2", company: "B", role: "FE", status: "contacting", appliedAt: "2026-11-01T00:00:00.000Z", resumeVersion: "B" }, asOf, 7)).toBe(false);
  });
});

describe("question deduplication", () => {
  it("normalizes punctuation and full-width characters for exact matching", () => {
    expect(areExactDuplicateQuestions("RAG 怎么评估？", "rag怎么评估")).toBe(true);
    expect(areExactDuplicateQuestions("什么是 RAG", "RAG 怎么评估")).toBe(false);
  });

  it("keeps similarity as a suggestion signal", () => {
    expect(questionDiceSimilarity("如何保证数据可靠", "怎么保证数据可靠？")).toBeGreaterThan(0.5);
  });
});

describe("SM-2 and deterministic scoring", () => {
  it("moves high scores forward and low scores back to day one", () => {
    const date = new Date("2026-11-11T00:00:00.000Z");
    expect(calculateSm2(1, 5, date)).toMatchObject({ stage: 2, intervalDays: 7 });
    expect(calculateSm2(3, 2, date)).toMatchObject({ stage: 0, intervalDays: 1 });
  });

  it("uses code-owned rubric weights", () => {
    expect(calculateWeightedScore({ accuracy: 5, completeness: 5, structure: 5, example: 5, concision: 5 })).toBe(5);
    expect(calculateWeightedScore({ accuracy: 1, completeness: 1, structure: 1, example: 1, concision: 1 })).toBe(1);
    expect(calculateResumeMatchScore({ skillCoverage: 4, evidence: 2, keywordMatch: 3, relevance: 4, clarity: 3 })).toBe(3.3);
    expect(calculateResumeMatchScore({ skillCoverage: 5, evidence: 5, keywordMatch: 5, relevance: 5, clarity: 5 })).toBe(5);
  });
});

describe("planner and reflection boundaries", () => {
  it("creates a fixed 78-card shuffle and a daily draw", () => {
    const shuffled = shuffleTarot(0.42);
    expect(shuffled).toHaveLength(78);
    expect(new Set(shuffled.map((card) => card.id)).size).toBe(78);
    expect(["upright", "reversed"]).toContain(drawTarot(shuffled, "2026-11-08").orientation);
  });
  it("explains the drawn card instead of a shared keyword label", () => {
    const upright = describeTarotCard("圣杯1", "正位");
    const reversed = describeTarotCard("圣杯1", "逆位");
    expect(upright).toBe("圣杯1代表情感与直觉上的新开始，一种被充满的感觉，建议今天先做一件让自己真正愿意投入的小事。");
    expect(reversed).toContain("圣杯1代表");
    expect(reversed).toContain("建议今天");
    expect(upright).not.toContain("行动");
    expect(new Set(tarotDeck.map((card) => describeTarotCard(card.name, "正位"))).size).toBe(78);
  });
  it("prioritizes interviews and never overlaps blocks", () => {
    const result = scheduleTasks([
      { id: "other", title: "其他", durationMinutes: 60, kind: "other" },
      { id: "interview", title: "面试", durationMinutes: 60, kind: "interview" },
      { id: "review", title: "复习", durationMinutes: 60, kind: "review" }
    ], { start: "09:00", end: "11:00" });
    expect(result.blocks.map((block) => block.title)).toEqual(["面试", "复习"]);
    expect(result.unscheduled[0].task.title).toBe("其他");
    expect(result.blocks[0].end).toBe(result.blocks[1].start);
  });

  it("stops tarot-style output for care signals and unsafe claims", () => {
    expect(detectCareSignal("我觉得活着没意义")).toBe(true);
    expect(containsUnsafeTarotLanguage("你一定会被录用")).toBe(true);
    expect(containsUnsafeTarotLanguage("今天可以关注一个小动作")).toBe(false);
  });
});
