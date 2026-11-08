export type ApplicationStatus = "applied" | "contacting" | "interviewing" | "ended" | "archived";

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
  lastContactAt?: string;
  silent?: boolean;
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "已投递",
  contacting: "沟通中",
  interviewing: "面试中",
  ended: "已结束",
  archived: "已归档"
};

const VALID_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["contacting", "interviewing", "ended", "archived"],
  contacting: ["interviewing", "ended", "archived"],
  interviewing: ["ended", "archived"],
  ended: ["archived"],
  archived: []
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus) {
  return from === to || VALID_STATUS_TRANSITIONS[from].includes(to);
}

export function transitionApplication(application: Application, to: ApplicationStatus, changedAt: string) {
  if (!canTransitionApplication(application.status, to)) {
    throw new Error(`非法状态转换：${APPLICATION_STATUS_LABELS[application.status]} → ${APPLICATION_STATUS_LABELS[to]}`);
  }

  return {
    ...application,
    status: to,
    lastContactAt: changedAt,
    silent: false
  };
}

export function isSilentApplication(application: Application, asOf: Date, thresholdDays: number) {
  if (application.status !== "applied") return false;
  const reference = application.lastContactAt ?? application.appliedAt;
  const elapsed = asOf.getTime() - new Date(reference).getTime();
  return elapsed >= thresholdDays * 24 * 60 * 60 * 1000;
}

export function markSilentApplications(applications: Application[], asOf: Date, thresholdDays: number) {
  return applications.map((application) => ({
    ...application,
    silent: isSilentApplication(application, asOf, thresholdDays)
  }));
}

export function normalizeQuestion(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\p{P}\p{S}\s]/gu, "");
}

export function areExactDuplicateQuestions(left: string, right: string) {
  const normalizedLeft = normalizeQuestion(left);
  const normalizedRight = normalizeQuestion(right);
  return normalizedLeft.length > 0 && normalizedLeft === normalizedRight;
}

function bigrams(value: string) {
  if (value.length < 2) return new Set([value]);
  return new Set(Array.from({ length: value.length - 1 }, (_, index) => value.slice(index, index + 2)));
}

export function questionDiceSimilarity(left: string, right: string) {
  const leftBigrams = bigrams(normalizeQuestion(left));
  const rightBigrams = bigrams(normalizeQuestion(right));
  if (leftBigrams.size === 0 && rightBigrams.size === 0) return 1;
  const intersection = [...leftBigrams].filter((item) => rightBigrams.has(item)).length;
  return (2 * intersection) / (leftBigrams.size + rightBigrams.size);
}

export const SM2_INTERVALS = [1, 3, 7, 14, 30];

export type ReviewResult = {
  stage: number;
  intervalDays: number;
  nextReviewAt: string;
};

export function calculateSm2(stage: number, rating: number, reviewedAt: Date): ReviewResult {
  const safeStage = Math.max(0, Math.min(stage, SM2_INTERVALS.length - 1));
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  let nextStage = safeStage;
  if (safeRating >= 4) nextStage = Math.min(safeStage + 1, SM2_INTERVALS.length - 1);
  if (safeRating < 3) nextStage = 0;
  const intervalDays = SM2_INTERVALS[nextStage];
  const nextReviewAt = new Date(reviewedAt.getTime() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
  return { stage: nextStage, intervalDays, nextReviewAt };
}

export type TaskKind = "interview" | "deadline" | "follow_up" | "daily_study" | "review" | "other";

export type PlannerTask = {
  id: string;
  title: string;
  durationMinutes: number;
  kind: TaskKind;
  dueDate?: string;
  completed?: boolean;
};

export type TimeWindow = {
  start: string;
  end: string;
};

export type ScheduledBlock = PlannerTask & {
  start: string;
  end: string;
  reason: string;
};

const TASK_KIND_RANK: Record<TaskKind, number> = {
  interview: 1,
  deadline: 1,
  follow_up: 2,
  daily_study: 3,
  review: 4,
  other: 5
};

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function scheduleTasks(tasks: PlannerTask[], window: TimeWindow): { blocks: ScheduledBlock[]; unscheduled: { task: PlannerTask; reason: string }[] } {
  const start = minutesFromTime(window.start);
  const end = minutesFromTime(window.end);
  let cursor = start;
  const blocks: ScheduledBlock[] = [];
  const unscheduled: { task: PlannerTask; reason: string }[] = [];

  const ordered = [...tasks]
    .filter((task) => !task.completed)
    .sort((left, right) => {
      const rankDelta = TASK_KIND_RANK[left.kind] - TASK_KIND_RANK[right.kind];
      if (rankDelta !== 0) return rankDelta;
      return (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31");
    });

  for (const task of ordered) {
    if (task.durationMinutes <= 0) {
      unscheduled.push({ task, reason: "时长必须大于 0 分钟" });
      continue;
    }
    if (cursor + task.durationMinutes > end) {
      unscheduled.push({ task, reason: "今天的可用时间已用完，建议顺延" });
      continue;
    }
    const blockStart = cursor;
    cursor += task.durationMinutes;
    blocks.push({
      ...task,
      start: timeFromMinutes(blockStart),
      end: timeFromMinutes(cursor),
      reason: reasonForTask(task.kind)
    });
  }

  return { blocks, unscheduled };
}

function reasonForTask(kind: TaskKind) {
  if (kind === "interview" || kind === "deadline") return "面试或截止日期优先";
  if (kind === "follow_up") return "投递跟进优先";
  if (kind === "daily_study") return "当天固定学习主题";
  if (kind === "review") return "到期复习";
  return "其他待办";
}

export type RubricScores = {
  accuracy: number;
  completeness: number;
  structure: number;
  example: number;
  concision: number;
};

export const RUBRIC_WEIGHTS: Record<keyof RubricScores, number> = {
  accuracy: 0.25,
  completeness: 0.25,
  structure: 0.2,
  example: 0.2,
  concision: 0.1
};

export function calculateWeightedScore(scores: RubricScores) {
  const total = (Object.keys(RUBRIC_WEIGHTS) as (keyof RubricScores)[]).reduce(
    (sum, key) => sum + Math.max(1, Math.min(5, scores[key])) * RUBRIC_WEIGHTS[key],
    0
  );
  return Math.round(total * 10) / 10;
}

export type ResumeMatchScores = { skillCoverage: number; evidence: number; keywordMatch: number; relevance: number; clarity: number };

export const RESUME_MATCH_WEIGHTS: Record<keyof ResumeMatchScores, number> = { skillCoverage: 0.3, evidence: 0.25, keywordMatch: 0.15, relevance: 0.2, clarity: 0.1 };

export function calculateResumeMatchScore(scores: ResumeMatchScores) {
  const total = (Object.keys(RESUME_MATCH_WEIGHTS) as (keyof ResumeMatchScores)[]).reduce((sum, key) => sum + Math.max(1, Math.min(5, scores[key])) * RESUME_MATCH_WEIGHTS[key], 0);
  return Math.round(total * 10) / 10;
}

export function detectCareSignal(text: string) {
  return /(不想活|不想继续|结束生命|自杀|伤害自己|活着没意义|撑不下去)/u.test(text);
}

export function containsUnsafeTarotLanguage(text: string) {
  return /(一定会被录用|肯定会发财|你会生病|注定|必然失败|灾难降临)/u.test(text);
}

export type DailySnapshot = {
  date: string;
  tasks: { planned: number; done: number; unfinished: string[] };
  applications: { new: number; feedback: { company: string; status: string }[] };
  study: { reviewed: number; avgScore: number };
  diary?: { mood?: number; text: string };
};
