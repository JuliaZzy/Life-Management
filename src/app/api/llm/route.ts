import { NextResponse } from "next/server";
import { extractInterviewQuestions, generateReflection, llmConfig } from "@/lib/llm-gateway";

export async function GET() {
  return NextResponse.json({ ok: true, config: llmConfig() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { task?: string; text?: string; diary?: string; card?: string; orientation?: string } | null;
  if (body?.task === "extract_questions") {
    const result = await extractInterviewQuestions(body.text ?? "");
    return NextResponse.json({ ok: true, ...result });
  }
  if (body?.task === "reflection") {
    const result = await generateReflection({ diary: body.diary ?? "", card: body.card ?? "权杖六", orientation: body.orientation ?? "正位", snapshot: "任务完成情况与投递变化由代码汇总" });
    return NextResponse.json({ ok: true, ...result });
  }
  return NextResponse.json({ ok: false, error: "未知的 LLM 任务" }, { status: 400 });
}
