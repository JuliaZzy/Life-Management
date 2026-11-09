import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, interviews } from "@/db/schema";

export const dynamic = "force-dynamic";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(date: string) {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

/**
 * Return today's persisted activity for the overview cards.
 * Interview records currently use created_at as their recorded interview date.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const timeZone = url.searchParams.get("timezone") ?? "UTC";

  if (!isValidDate(date) || !isValidTimeZone(timeZone)) {
    return NextResponse.json({ ok: false, error: "日期或时区格式不正确" }, { status: 400 });
  }

  try {
    const [applicationResult, interviewResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(applications)
        .where(sql`(${applications.appliedAt} AT TIME ZONE ${timeZone})::date = ${date}`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(interviews)
        .where(sql`(${interviews.createdAt} AT TIME ZONE ${timeZone})::date = ${date}`)
    ]);

    return NextResponse.json({
      ok: true,
      source: "database",
      date,
      timeZone,
      stats: {
        todayApplications: Number(applicationResult[0]?.count ?? 0),
        todayInterviews: Number(interviewResult[0]?.count ?? 0)
      }
    });
  } catch {
    return NextResponse.json({ ok: false, source: "database", error: "数据库暂不可用" }, { status: 503 });
  }
}
