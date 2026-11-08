import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "life-management", timestamp: new Date().toISOString() });
}
