import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumeSources } from "@/db/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { fileName?: string; htmlContent?: string } | null;
  if (!body?.fileName || !body.htmlContent) return NextResponse.json({ ok: false, error: "缺少简历文件" }, { status: 400 });
  try {
    const [saved] = await db.insert(resumeSources).values({ fileName: body.fileName, htmlContent: body.htmlContent, isCurrent: true }).returning({ id: resumeSources.id, fileName: resumeSources.fileName });
    return NextResponse.json({ ok: true, resume: saved });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用，已由前端保留当前内容" }, { status: 503 });
  }
}
