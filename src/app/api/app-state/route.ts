import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appState } from "@/db/schema";

const STATE_ID = "default";

export async function GET() {
  try {
    const [saved] = await db.select().from(appState).where(eq(appState.id, STATE_ID)).limit(1);
    return NextResponse.json({ ok: true, state: saved?.state ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const state = await request.json().catch(() => null);
  if (!state || typeof state !== "object") return NextResponse.json({ ok: false, error: "状态格式不正确" }, { status: 400 });
  const { applications: _ignored, ...rest } = state as Record<string, unknown>;
  try {
    await db.insert(appState).values({ id: STATE_ID, state: rest, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appState.id, set: { state: rest, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "数据库暂不可用" }, { status: 503 });
  }
}
