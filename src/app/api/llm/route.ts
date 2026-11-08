import { NextResponse } from "next/server";
import { analyzeMemoryTrend, analyzeResumeMatch, extractInterviewQuestions, generatePlannerSuggestion, generateReflection, llmConfig } from "@/lib/llm-gateway";

export async function GET() {
  return NextResponse.json({ ok: true, config: llmConfig() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { task?: string; text?: string; diary?: string; card?: string; orientation?: string; keywords?: string[]; userPlan?: string; mood?: string; observations?: string[]; jd?: string; resume?: string; projectContext?: string; history?: string; confirmedProfile?: string } | null;
  if (body?.task === "extract_questions") {
    const result = await extractInterviewQuestions(body.text ?? "");
    return NextResponse.json({ ok: true, ...result });
  }
  if (body?.task === "reflection") {
    const result = await generateReflection({ diary: body.diary ?? "", card: body.card ?? "权杖六", orientation: body.orientation ?? "正位", snapshot: "任务完成情况与投递变化由代码汇总" });
    return NextResponse.json({ ok: true, ...result });
  }
  if (body?.task === "planner") {
    const result = await generatePlannerSuggestion({ card: body.card ?? "节制", orientation: body.orientation === "逆位" ? "逆位" : "正位", keywords: body.keywords ?? ["平衡", "节奏"], userPlan: body.userPlan ?? "", mood: body.mood ?? "", observations: body.observations ?? [] });
    return NextResponse.json({ ok: true, ...result });
  }
  if (body?.task === "resume_match") return NextResponse.json({ ok: true, data: await analyzeResumeMatch({ jd: body.jd ?? "", resume: body.resume ?? "", projectContext: body.projectContext ?? "" }) });
  if (body?.task === "memory_trend") return NextResponse.json({ ok: true, data: await analyzeMemoryTrend({ history: body.history ?? "", confirmedProfile: body.confirmedProfile ?? "" }) });
  return NextResponse.json({ ok: false, error: "未知的 LLM 任务" }, { status: 400 });
}
