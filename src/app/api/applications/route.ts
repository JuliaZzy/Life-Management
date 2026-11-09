import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { applications } from "@/db/schema";
import { APPLICATION_STATUS_LABELS, ApplicationStatus, canTransitionApplication } from "@/lib/domain";
import { resumeMatchSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

type ApplicationBody = {
  id?: string;
  company?: string;
  role?: string;
  base?: string;
  salary?: string;
  jobDescription?: string;
  jd?: string;
  status?: string;
  appliedAt?: string;
  matchAnalysis?: unknown;
};

function parseAppliedAt(value: string | undefined) {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asStatus(value: string | undefined): ApplicationStatus | null {
  return value && STATUSES.includes(value as ApplicationStatus) ? value as ApplicationStatus : null;
}

function serialize(row: typeof applications.$inferSelect) {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    base: row.base,
    salary: row.salary,
    jobDescription: row.jobDescription,
    status: row.status,
    appliedAt: row.appliedAt.toISOString(),
    lastContactAt: row.lastContactAt?.toISOString(),
    resumeVersion: row.resumeVersion,
    matchAnalysis: row.matchAnalysis ?? null
  };
}

function parseMatchAnalysis(value: unknown) {
  if (value == null) return null;
  const parsed = resumeMatchSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export async function GET() {
  try {
    const rows = await db.select().from(applications).orderBy(desc(applications.appliedAt));
    return NextResponse.json({ ok: true, applications: rows.map(serialize) });
  } catch {
    return NextResponse.json({ ok: false, error: "投递列表读取失败" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ApplicationBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "请求格式不正确" }, { status: 400 });
  const company = body.company?.trim() ?? "";
  const role = body.role?.trim() ?? "";
  if (!company || !role) return NextResponse.json({ ok: false, error: "请填写公司名称和职位名称" }, { status: 400 });
  const jobDescription = (body.jobDescription ?? body.jd ?? "").trim();
  const appliedAt = parseAppliedAt(body.appliedAt) ?? new Date();
  const matchAnalysis = body.matchAnalysis === undefined ? null : parseMatchAnalysis(body.matchAnalysis);
  if (body.matchAnalysis !== undefined && matchAnalysis === undefined) return NextResponse.json({ ok: false, error: "匹配分析结果格式不正确" }, { status: 400 });
  try {
    const [saved] = await db.insert(applications).values({
      id: crypto.randomUUID(),
      company,
      role,
      base: body.base?.trim() ?? "",
      salary: body.salary?.trim() ?? "",
      jobDescription,
      status: "applied",
      appliedAt,
      resumeVersion: company,
      matchAnalysis
    }).returning();
    return NextResponse.json({ ok: true, application: serialize(saved) });
  } catch {
    return NextResponse.json({ ok: false, error: "投递未能写入数据库" }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as ApplicationBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "请求格式不正确" }, { status: 400 });
  const id = body.id?.trim() ?? "";
  if (!id) return NextResponse.json({ ok: false, error: "缺少投递 ID" }, { status: 400 });
  try {
    const [existing] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    if (!existing) return NextResponse.json({ ok: false, error: "投递不存在" }, { status: 404 });
    const updates: Partial<typeof applications.$inferInsert> = {};
    if (typeof body.company === "string") updates.company = body.company.trim();
    if (typeof body.role === "string") updates.role = body.role.trim();
    if (typeof body.base === "string") updates.base = body.base.trim();
    if (typeof body.salary === "string") updates.salary = body.salary.trim();
    if (typeof body.jobDescription === "string" || typeof body.jd === "string") {
      updates.jobDescription = (body.jobDescription ?? body.jd ?? "").trim();
    }
    if (typeof body.appliedAt === "string") {
      const appliedAt = parseAppliedAt(body.appliedAt);
      if (!appliedAt) return NextResponse.json({ ok: false, error: "投递日期或时间无效" }, { status: 400 });
      updates.appliedAt = appliedAt;
    }
    if (body.matchAnalysis !== undefined) {
      const matchAnalysis = parseMatchAnalysis(body.matchAnalysis);
      if (matchAnalysis === undefined) return NextResponse.json({ ok: false, error: "匹配分析结果格式不正确" }, { status: 400 });
      updates.matchAnalysis = matchAnalysis;
    }
    if (typeof body.status === "string") {
      const next = asStatus(body.status);
      if (!next || !canTransitionApplication(existing.status as ApplicationStatus, next)) {
        return NextResponse.json({ ok: false, error: "状态不能这样变更" }, { status: 400 });
      }
      updates.status = next;
      updates.lastContactAt = new Date();
    }
    if (updates.company === "") return NextResponse.json({ ok: false, error: "请填写公司名称" }, { status: 400 });
    if (updates.role === "") return NextResponse.json({ ok: false, error: "请填写职位名称" }, { status: 400 });
    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true, application: serialize(existing) });
    const [saved] = await db.update(applications).set(updates).where(eq(applications.id, id)).returning();
    return NextResponse.json({ ok: true, application: serialize(saved) });
  } catch {
    return NextResponse.json({ ok: false, error: "投递未能写入数据库" }, { status: 503 });
  }
}
