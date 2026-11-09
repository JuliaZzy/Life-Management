import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumeSources } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const [saved] = await db.select().from(resumeSources).where(eq(resumeSources.isCurrent, true)).orderBy(desc(resumeSources.createdAt)).limit(1);
    return NextResponse.json({ ok: true, resume: saved ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { fileName?: string; htmlContent?: string } | null;
  if (!body?.fileName || !body.htmlContent) return NextResponse.json({ ok: false, error: "缺少简历文件" }, { status: 400 });
  const fileName = body.fileName;
  const htmlContent = body.htmlContent;
  try {
    const saved = await db.transaction(async (tx) => {
      await tx.update(resumeSources).set({ isCurrent: false }).where(eq(resumeSources.isCurrent, true));
      const [row] = await tx.insert(resumeSources).values({ fileName, htmlContent, isCurrent: true }).returning({
        id: resumeSources.id,
        fileName: resumeSources.fileName,
        htmlContent: resumeSources.htmlContent
      });
      return row;
    });
    return NextResponse.json({ ok: true, resume: saved });
  } catch {
    return NextResponse.json({ ok: false, error: "简历未能写入数据库" }, { status: 503 });
  }
}
