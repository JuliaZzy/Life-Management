import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ ok: true, service: "life-management", database: "ok", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, service: "life-management", database: "unavailable", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
