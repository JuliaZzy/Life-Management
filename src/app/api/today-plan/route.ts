import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { dailyPlans, dailyTarot } from "@/db/schema";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!date) return NextResponse.json({ ok: false, error: "缺少日期" }, { status: 400 });
  try {
    const [plan, tarot] = await Promise.all([
      db.select().from(dailyPlans).where(eq(dailyPlans.planDate, date)).limit(1),
      db.select().from(dailyTarot).where(eq(dailyTarot.drawDate, date)).limit(1)
    ]);
    return NextResponse.json({ ok: true, plan: plan[0] ?? null, tarot: tarot[0] ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null) as { date?: string; plan?: string; plannerSnapshot?: unknown } | null;
  if (!body?.date) return NextResponse.json({ ok: false, error: "缺少日期" }, { status: 400 });
  try {
    const [saved] = await db.insert(dailyPlans).values({ planDate: body.date, body: body.plan ?? "", plannerSnapshot: body.plannerSnapshot ?? null, updatedAt: new Date() })
      .onConflictDoUpdate({ target: dailyPlans.planDate, set: { body: body.plan ?? "", plannerSnapshot: body.plannerSnapshot ?? null, updatedAt: new Date() } }).returning();
    return NextResponse.json({ ok: true, plan: saved });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { date?: string; cardId?: string; cardName?: string; image?: string; orientation?: string; position?: number; keywords?: string[] } | null;
  if (!body?.date || !body.cardId || !body.cardName || !body.image || !body.orientation) return NextResponse.json({ ok: false, error: "塔罗信息不完整" }, { status: 400 });
  try {
    const [existing] = await db.select().from(dailyTarot).where(eq(dailyTarot.drawDate, body.date)).limit(1);
    if (existing) return NextResponse.json({ ok: false, error: "今天已经抽过牌，不能更换", tarot: existing }, { status: 409 });
    const [saved] = await db.insert(dailyTarot).values({ drawDate: body.date, cardId: body.cardId, cardName: body.cardName, image: body.image, orientation: body.orientation, position: body.position ?? 1, keywords: body.keywords ?? [] }).returning();
    return NextResponse.json({ ok: true, tarot: saved });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}
