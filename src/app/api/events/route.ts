import { NextResponse } from "next/server";
import { toolEventSchema } from "@/lib/tool-layer";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = toolEventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "事件格式不正确" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, event: { ...parsed.data, receivedAt: new Date().toISOString() } });
}
