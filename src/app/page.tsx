"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  APPLICATION_STATUS_LABELS,
  Application,
  ApplicationStatus,
  calculateSm2,
  calculateWeightedScore,
  canTransitionApplication,
  containsUnsafeTarotLanguage,
  detectCareSignal,
  markSilentApplications,
  PlannerTask,
  RubricScores,
  transitionApplication
} from "@/lib/domain";
import { drawTarot, shuffleTarot, tarotDeck, TarotDraw } from "@/lib/tarot";

type ViewKey = "overview" | "projects" | "applications" | "interviews" | "study" | "memory";

type Project = {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  facts: { id: string; text: string; status: "candidate" | "confirmed" }[];
};

type StudyItem = {
  id: string;
  title: string;
  type: "algo" | "project" | "interview_q";
  stage: number;
  nextReviewAt: string;
};

type Question = {
  id: string;
  text: string;
  category: string;
  source: "real" | "web";
  answerBasis: "项目事实" | "通用知识" | "答题框架";
  confirmed: boolean;
};

type MemorySuggestion = { id: string; text: string; source: string; status: "待确认" | "已确认" | "已拒绝" };
type PlannerSnapshot = {
  tone?: string;
  tarot?: { card?: string; orientation?: string; keywords?: string[] };
  observations?: string[];
  suggestions?: { text?: string }[];
};

type OverviewStats = {
  todayApplications: number;
  todayInterviews: number;
};

const NAV_ITEMS: { key: ViewKey; label: string; short: string }[] = [
  { key: "overview", label: "今日总览", short: "⌂" },
  { key: "projects", label: "项目与事实", short: "◈" },
  { key: "applications", label: "求职投递", short: "↗" },
  { key: "interviews", label: "面试题库", short: "◇" },
  { key: "study", label: "学习复习", short: "◒" },
  { key: "memory", label: "记忆与日志", short: "≋" }
];

const VIEW_TITLES: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "MONDAY · 11 NOV 2026", title: "今天，先把重要的事做完", description: "把投递、练习和复盘放在同一条清晰的线上。" },
  projects: { eyebrow: "FACT LIBRARY", title: "项目与事实", description: "只把确认过的事实带入简历和答案。" },
  applications: { eyebrow: "JOB SEARCH", title: "求职投递", description: "状态流转、沉默标记和简历版本都可追溯。" },
  interviews: { eyebrow: "INTERVIEW CONTENT", title: "面试题库", description: "从原始记录提炼问题，重复项先提示再合并。" },
  study: { eyebrow: "SPACED REPETITION", title: "学习复习", description: "复习间隔由代码计算，模型只负责解释。" },
  memory: { eyebrow: "AUDIT TRAIL", title: "记忆与日志", description: "所有写入先进入确认队列，每次调用都留下事件。" }
};

const seedProjects: Project[] = [
  {
    id: "p-1",
    name: "求职期学习助手",
    summary: "一个把项目事实、投递、面试练习和每日反思串起来的个人 Agent 应用。",
    stack: ["TypeScript", "Next.js", "PostgreSQL", "Drizzle"],
    facts: [
      { id: "f-1", text: "排程、状态流转和复习间隔由确定性代码完成。", status: "confirmed" },
      { id: "f-2", text: "简历和答案只能引用已经确认的项目事实。", status: "confirmed" },
      { id: "f-3", text: "向量检索是可选能力，当前以结构化数据为主。", status: "candidate" }
    ]
  },
  {
    id: "p-2",
    name: "城市交通可视化",
    summary: "把开放交通数据做成可探索的城市通勤视图。",
    stack: ["React", "MapLibre", "Python"],
    facts: [
      { id: "f-4", text: "以站点级数据聚合高峰期的拥堵变化。", status: "confirmed" },
      { id: "f-5", text: "数据更新失败时保留上一次成功快照。", status: "candidate" }
    ]
  }
];

const seedApplications: Application[] = [
  { id: "a-1", company: "远山数据", role: "全栈工程师", status: "interviewing", appliedAt: "2026-11-04T10:00:00.000Z", lastContactAt: "2026-11-06T09:00:00.000Z" },
  { id: "a-2", company: "北极星科技", role: "前端工程师", status: "applied", appliedAt: "2026-10-30T10:00:00.000Z" },
  { id: "a-3", company: "松果实验室", role: "产品工程师", status: "contacting", appliedAt: "2026-10-24T10:00:00.000Z", lastContactAt: "2026-11-05T11:00:00.000Z" }
];

const seedTasks: PlannerTask[] = [
  { id: "t-1", title: "准备远山数据技术一面复盘", durationMinutes: 60, kind: "interview", dueDate: "2026-11-11" },
  { id: "t-2", title: "给北极星科技发一次跟进", durationMinutes: 25, kind: "follow_up", dueDate: "2026-11-11" },
  { id: "t-3", title: "复习 3 道面经题", durationMinutes: 45, kind: "review", dueDate: "2026-11-11" },
  { id: "t-4", title: "LeetCode 146 LRU Cache", durationMinutes: 60, kind: "daily_study", dueDate: "2026-11-11" }
];

const seedStudy: StudyItem[] = [
  { id: "s-1", title: "为什么排程不用模型？", type: "project", stage: 2, nextReviewAt: "2026-11-11" },
  { id: "s-2", title: "LRU Cache", type: "algo", stage: 1, nextReviewAt: "2026-11-11" },
  { id: "s-3", title: "如何保证事实库不编造？", type: "interview_q", stage: 0, nextReviewAt: "2026-11-10" }
];

const seedQuestions: Question[] = [
  { id: "q-1", text: "你的多 Agent 项目里，为什么报表不用 ReAct？", category: "agent", source: "real", answerBasis: "项目事实", confirmed: true },
  { id: "q-2", text: "如何保证模型生成的简历没有编造？", category: "工程判断", source: "real", answerBasis: "项目事实", confirmed: false },
  { id: "q-3", text: "RAG 怎么评估？", category: "LLM", source: "web", answerBasis: "通用知识", confirmed: true }
];

const initialSuggestions: MemorySuggestion[] = [
  { id: "m-1", text: "你更愿意把上午留给需要深度思考的任务。", source: "近 7 天摘要", status: "待确认" },
  { id: "m-2", text: "面试前一天适合先复盘已确认事实，再补充通用知识。", source: "面试记录", status: "待确认" }
];

function todayLabel() {
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", weekday: "short" }).format(new Date());
}

function todayDateKey(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function HomePage() {
  const [view, setView] = useState<ViewKey>(() => {
    if (typeof window === "undefined") return "overview";
    const saved = window.sessionStorage.getItem("life-management-tab") as ViewKey | null;
    return saved && NAV_ITEMS.some((item) => item.key === saved) ? saved : "overview";
  });
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [applications, setApplications] = useState<Application[]>(seedApplications);
  const [tasks, setTasks] = useState<PlannerTask[]>(seedTasks);
  const [studyItems, setStudyItems] = useState<StudyItem[]>(seedStudy);
  const [questions, setQuestions] = useState<Question[]>(seedQuestions);
  const [suggestions, setSuggestions] = useState<MemorySuggestion[]>(initialSuggestions);
  const [diary, setDiary] = useState("");
  const [diaryAllowed, setDiaryAllowed] = useState(true);
  const [toast, setToast] = useState("");
  const [showTodayPlan, setShowTodayPlan] = useState(false);
  const [showPlannerDetail, setShowPlannerDetail] = useState(false);
  const [showTodayStatus, setShowTodayStatus] = useState(false);
  const [plannerSnapshot, setPlannerSnapshot] = useState<PlannerSnapshot | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({ todayApplications: 0, todayInterviews: 0 });
  const [stateLoaded, setStateLoaded] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem("life-management-tab", view);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  useEffect(() => {
    void fetch("/api/app-state").then((response) => response.json()).then((payload: { state?: Partial<{ projects: Project[]; applications: Application[]; tasks: PlannerTask[]; studyItems: StudyItem[]; questions: Question[]; suggestions: MemorySuggestion[]; diary: string; diaryAllowed: boolean }> | null }) => {
      const saved = payload.state;
      if (saved) {
        if (saved.projects) setProjects(saved.projects);
        if (saved.applications) setApplications(saved.applications);
        if (saved.tasks) setTasks(saved.tasks);
        if (saved.studyItems) setStudyItems(saved.studyItems);
        if (saved.questions) setQuestions(saved.questions);
        if (saved.suggestions) setSuggestions(saved.suggestions);
        if (typeof saved.diary === "string") setDiary(saved.diary);
        if (typeof saved.diaryAllowed === "boolean") setDiaryAllowed(saved.diaryAllowed);
      } else {
        const legacy = window.localStorage.getItem("life-management-demo");
        if (legacy) {
          try {
            const old = JSON.parse(legacy);
            if (old.projects) setProjects(old.projects);
            if (old.applications) setApplications(old.applications);
            if (old.tasks) setTasks(old.tasks);
            if (old.studyItems) setStudyItems(old.studyItems);
            if (old.questions) setQuestions(old.questions);
            if (old.suggestions) setSuggestions(old.suggestions);
            window.localStorage.removeItem("life-management-demo");
          } catch { /* discard malformed legacy cache */ }
        }
      }
      setStateLoaded(true);
    }).catch(() => { setStateLoaded(true); setToast("数据库暂不可用，当前页面不会保存到本地"); });
  }, []);

  useEffect(() => {
    const loadPlannerSnapshot = async () => {
      const response = await fetch(`/api/today-plan?date=${new Date().toISOString().slice(0, 10)}`);
      const payload = await response.json().catch(() => null) as { plan?: { plannerSnapshot?: PlannerSnapshot | null } } | null;
      setPlannerSnapshot(payload?.plan?.plannerSnapshot ?? null);
    };
    void loadPlannerSnapshot();
    const refresh = () => void loadPlannerSnapshot();
    window.addEventListener("today-plan-updated", refresh);
    return () => window.removeEventListener("today-plan-updated", refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const date = todayDateKey(timeZone);
    const query = new URLSearchParams({ date, timezone: timeZone });

    fetch(`/api/overview?${query.toString()}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("overview stats unavailable");
        return response.json() as Promise<{ stats?: OverviewStats }>;
      })
      .then((payload) => {
        if (!cancelled && payload.stats) setOverviewStats(payload.stats);
      })
      .catch(() => {
        // Keep the overview usable in local demo mode when PostgreSQL is offline.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stateLoaded) return;
    void fetch("/api/app-state", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ projects, applications, tasks, studyItems, questions, suggestions, diary, diaryAllowed }) });
  }, [stateLoaded, projects, applications, tasks, studyItems, questions, suggestions, diary, diaryAllowed]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const current = VIEW_TITLES[view];
  const doneCount = tasks.filter((task) => task.completed).length;
  const confirmedFacts = projects.flatMap((project) => project.facts).filter((fact) => fact.status === "confirmed").length;

  function flash(message: string) {
    setToast(message);
  }

  function updateApplicationStatus(id: string, next: ApplicationStatus) {
    setApplications((items) => items.map((application) => {
      if (application.id !== id) return application;
      if (!canTransitionApplication(application.status, next)) {
        flash(`不能从「${APPLICATION_STATUS_LABELS[application.status]}」直接变为「${APPLICATION_STATUS_LABELS[next]}」`);
        return application;
      }
      flash("状态已记录到事件日志");
      return transitionApplication(application, next, new Date().toISOString());
    }));
  }

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const summary = String(form.get("summary") ?? "").trim();
    if (!name) return;
    setProjects((items) => [{ id: crypto.randomUUID(), name, summary, stack: ["待补充"], facts: [] }, ...items]);
    event.currentTarget.reset();
    flash("项目已加入，接下来可以补充 README 和事实");
  }

  function addApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company = String(form.get("company") ?? "").trim();
    const role = String(form.get("role") ?? "").trim();
    if (!company || !role) return;
    setApplications((items) => [{ id: crypto.randomUUID(), company, role, status: "applied", appliedAt: new Date().toISOString() }, ...items]);
    event.currentTarget.reset();
    flash("投递已保存，状态可继续推进");
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const durationMinutes = Number(form.get("duration") ?? 0);
    const kind = String(form.get("kind") ?? "other") as PlannerTask["kind"];
    if (!title || !durationMinutes) return;
    setTasks((items) => [...items, { id: crypto.randomUUID(), title, durationMinutes, kind }]);
    event.currentTarget.reset();
    flash("待办已加入排程队列");
  }

  function toggleTask(id: string) {
    setTasks((items) => items.map((task) => task.id === id ? { ...task, completed: !task.completed } : task));
  }

  async function generateQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const sourceText = String(form.get("sourceText") ?? "");
    try {
      const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "extract_questions", text: sourceText }) });
      const payload = await response.json() as { questions?: { text: string; category: string; sourceType: "real" | "web" }[]; provider?: string };
      if (payload.questions?.length) {
        const additions = payload.questions.filter((item) => !questions.some((question) => question.text === item.text)).map((item) => ({ id: crypto.randomUUID(), text: item.text, category: item.category, source: item.sourceType, answerBasis: "答题框架" as const, confirmed: false }));
        setQuestions((items) => [...additions, ...items]);
        formElement.reset();
        flash(additions.length ? `本地模型新增 ${additions.length} 道草稿题` : "本地模型提炼出的题目都是精确重复");
        return;
      }
    } catch {
      // The deterministic fallback below keeps the flow usable when Ollama is offline.
    }
    const lines = sourceText.split(/[\n。！？!?]/).map((line) => line.trim()).filter(Boolean);
    const candidates = (lines.length ? lines : ["请介绍一个你做过的项目，并说明其中最重要的取舍。", "你如何验证这项设计的效果？"]).slice(0, 4);
    const additions = candidates
      .filter((text) => !questions.some((question) => question.text === text))
      .map((text) => ({ id: crypto.randomUUID(), text, category: "待分类", source: "real" as const, answerBasis: "答题框架" as const, confirmed: false }));
    setQuestions((items) => [...additions, ...items]);
    formElement.reset();
    flash(additions.length ? `新增 ${additions.length} 道草稿题，等待你确认` : "没有新增题目，可能是精确重复");
  }

  function reviewStudyItem(id: string, score: number) {
    setStudyItems((items) => items.map((item) => {
      if (item.id !== id) return item;
      const result = calculateSm2(item.stage, score, new Date("2026-11-11T12:00:00.000Z"));
      flash(`已记录 ${score} 分，下次复习在 ${result.intervalDays} 天后`);
      return { ...item, stage: result.stage, nextReviewAt: result.nextReviewAt.slice(0, 10) };
    }));
  }

  function confirmFact(projectId: string, factId: string) {
    setProjects((items) => items.map((project) => project.id === projectId ? {
      ...project,
      facts: project.facts.map((fact) => fact.id === factId ? { ...fact, status: "confirmed" } : fact)
    } : project));
    flash("事实已确认，可以被简历和答案引用");
  }

  function confirmQuestion(id: string) {
    setQuestions((items) => items.map((question) => question.id === id ? { ...question, confirmed: true } : question));
    flash("答案入口已打开，仍需你补充自己的回答");
  }

  function decideMemory(id: string, status: "已确认" | "已拒绝") {
    setSuggestions((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    flash(status === "已确认" ? "画像建议已写入确认记录" : "建议已拒绝，原始日志仍保留");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>LM</span><div><strong>life / manage</strong><small>求职期学习助手</small></div></div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="主导航">
          {NAV_ITEMS.map((item) => <button key={item.key} className={`nav-item ${view === item.key ? "active" : ""}`} onClick={() => setView(item.key)}><span className="nav-icon">{item.short}</span><span>{item.label}</span>{item.key === "memory" && <em>2</em>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><span className="status-dot" />本地演示模式</div>
          <div className="profile-row"><div className="avatar">JZ</div><div><strong>Julia</strong><small>专注求职期</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar"><div className="breadcrumb"><span>工作台</span><b>/</b><strong>{current.title}</strong></div><div className="topbar-actions"><span className="sync"><i /> 数据已保存</span><button className="icon-button" onClick={() => flash("快捷键面板即将开放")}>⌘</button><button className="primary-button small" onClick={() => setShowTodayPlan(true)}>＋ 今日计划</button></div></header>
        <div className="content-wrap">
          <div className="page-intro"><div><span className="eyebrow">{current.eyebrow}</span><h1>{view === "overview" ? (plannerSnapshot?.tone ?? "一张牌，一个计划，今天从这里开始...") : current.title}</h1>{view !== "overview" && <p>{current.description}</p>}</div>{view === "overview" && <div className="date-chip"><span>今日</span><strong>{todayLabel()}</strong></div>}</div>
          {view === "overview" && <OverviewView tasks={tasks} projects={projects} doneCount={doneCount} confirmedFacts={confirmedFacts} overviewStats={overviewStats} setView={setView} plannerSnapshot={plannerSnapshot} diary={diary} onPlannerDetail={() => setShowPlannerDetail(true)} onTodayPlan={() => setShowTodayPlan(true)} onTodayStatus={() => setShowTodayStatus(true)} />}
          {view === "projects" && <ProjectsView projects={projects} addProject={addProject} confirmFact={confirmFact} />}
          {view === "applications" && <ApplicationsView applications={applications} addApplication={addApplication} updateApplicationStatus={updateApplicationStatus} />}
          {view === "interviews" && <InterviewsView questions={questions} generateQuestions={generateQuestions} confirmQuestion={confirmQuestion} />}
          {view === "study" && <StudyView items={studyItems} reviewStudyItem={reviewStudyItem} />}
          {view === "memory" && <MemoryView suggestions={suggestions} decideMemory={decideMemory} />}
        </div>
      </section>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      {showTodayPlan && <TodayPlanModal onClose={() => setShowTodayPlan(false)} />}
      {showPlannerDetail && plannerSnapshot && <PlannerDetailModal snapshot={plannerSnapshot} onClose={() => setShowPlannerDetail(false)} />}
      {showTodayStatus && <TodayStatusModal diary={diary} setDiary={setDiary} diaryAllowed={diaryAllowed} setDiaryAllowed={setDiaryAllowed} onClose={() => setShowTodayStatus(false)} />}
    </main>
  );
}

function TodayPlanModal({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState(() => shuffleTarot());
  const today = new Date().toISOString().slice(0, 10);
  const [draw, setDraw] = useState<TarotDraw | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedOrientation, setSelectedOrientation] = useState<"upright" | "reversed">("upright");
  const [plan, setPlan] = useState("");
  const [locked, setLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => { void fetch(`/api/today-plan?date=${today}`).then((response) => response.json()).then((payload: { plan?: { body?: string }; tarot?: { cardId: string; cardName: string; image: string; orientation: TarotDraw["orientation"]; position: number; keywords: string[]; drawDate: string } }) => { if (payload.plan) setPlan(payload.plan.body ?? ""); if (payload.tarot) { const saved = { id: payload.tarot.cardId, name: payload.tarot.cardName, image: payload.tarot.image, orientation: payload.tarot.orientation, position: payload.tarot.position, keywords: payload.tarot.keywords, date: payload.tarot.drawDate }; setLocked(true); setDraw(saved); setSelectedId(saved.id); setSelectedOrientation(saved.orientation); } }).catch(() => undefined); }, [today]);
  function drawToday() { if (locked) return; const next = drawTarot(cards, today); setDraw(next); setSelectedId(next.id); setSelectedOrientation(next.orientation); }
  const selectedCard = tarotDeck.find((card) => card.id === selectedId);
  const visibleCard = selectedCard ? { ...selectedCard, orientation: selectedOrientation } : draw;
  async function saveTodayPlan() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError("");
    const chosen = selectedCard ? { ...selectedCard, position: selectedCard.id === draw?.id ? draw.position : 1, orientation: selectedOrientation, date: today } : draw;
    try {
      let plannerSnapshot: PlannerSnapshot | undefined;
      if (chosen) {
        const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "planner", card: chosen.name, orientation: chosen.orientation === "upright" ? "正位" : "逆位", keywords: chosen.keywords, userPlan: plan, mood: "", observations: ["今日事项与历史趋势由代码汇总"] }) });
        if (!response.ok) throw new Error("planner request failed");
        const payload = await response.json() as { data?: PlannerSnapshot };
        plannerSnapshot = payload.data;
        if (!locked) {
          const tarotResponse = await fetch("/api/today-plan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: today, cardId: chosen.id, cardName: chosen.name, image: chosen.image, orientation: chosen.orientation, position: chosen.position, keywords: chosen.keywords }) });
          if (!tarotResponse.ok && tarotResponse.status !== 409) throw new Error("tarot request failed");
          setLocked(true);
        }
      }
      const planResponse = await fetch("/api/today-plan", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: today, plan, plannerSnapshot }) });
      if (!planResponse.ok) throw new Error("plan request failed");
      window.dispatchEvent(new Event("today-plan-updated"));
      onClose();
    } catch {
      setSaveError("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }
  return <div className="modal-backdrop" onClick={isSaving ? undefined : onClose}><section className="today-plan-modal" aria-busy={isSaving} onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">TODAY PLAN</span><h2>今天的计划</h2></div><button className="icon-button" disabled={isSaving} onClick={onClose}>×</button></div><div className="today-plan-grid"><div className="today-tarot-side"><div className="tarot-draw-slot">{visibleCard ? <><img src={visibleCard.image} alt={visibleCard.name} /><strong>{visibleCard.name}</strong><span>{visibleCard.orientation === "upright" ? "正位" : "逆位"}</span></> : <span>＋</span>}</div><select className="tarot-select" disabled={locked || isSaving} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">选择你抽到的牌</option>{tarotDeck.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select><select className="tarot-select" disabled={locked || isSaving} value={selectedOrientation} onChange={(e) => setSelectedOrientation(e.target.value as "upright" | "reversed")}><option value="upright">正位</option><option value="reversed">逆位</option></select><div className="tarot-actions"><button className="secondary-button" disabled={locked || isSaving} onClick={() => setCards(shuffleTarot())}>洗牌</button><button className="primary-button" disabled={locked || isSaving} onClick={drawToday}>抽牌</button></div><small>{locked ? "今日塔罗已锁定，只能修改计划。" : "可以手动选择你抽到的牌，也可以让系统抽牌。"}</small></div><div className="today-plan-input"><label>你今天想完成什么？<textarea disabled={isSaving} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="例如：复习两道题，下午出去走走…" /></label>{saveError && <p className="save-error" role="alert">{saveError}</p>}<button className="primary-button full" disabled={isSaving} aria-busy={isSaving} onClick={saveTodayPlan}>{isSaving && <span className="loading-spinner" aria-hidden="true" />}{isSaving ? "正在保存并生成规划…" : "保存并交给规划 Agent"}</button></div></div></section></div>;
}

function PlannerDetailModal({ snapshot, onClose }: { snapshot: PlannerSnapshot; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="planner-detail-modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PLANNER AGENT</span><h2>今日建议详情</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="planner-detail-content">{snapshot.tarot && <div className="planner-detail-card"><span className="eyebrow">牌面</span><strong>{snapshot.tarot.card} · {snapshot.tarot.orientation}</strong><small>{snapshot.tarot.keywords?.join(" · ")}</small></div>}{snapshot.tone && <div className="planner-detail-section"><span>给今天的一句话</span><p>{snapshot.tone}</p></div>}{snapshot.observations && snapshot.observations.length > 0 && <div className="planner-detail-section"><span>代码依据</span>{snapshot.observations.map((item) => <p className="planner-detail-observation" key={item}>· {item}</p>)}</div>}<div className="planner-detail-section"><span>规划 Agent 生成的全部建议</span>{snapshot.suggestions?.map((suggestion, index) => <article className="planner-detail-suggestion" key={`${suggestion.text}-${index}`}><b>{index + 1}</b><div><strong>{suggestion.text}</strong></div></article>)}</div></div><button className="primary-button full" onClick={onClose}>知道了</button></section></div>;
}

function TodayStatusModal({ diary, setDiary, diaryAllowed, setDiaryAllowed, onClose }: { diary: string; setDiary: (value: string) => void; diaryAllowed: boolean; setDiaryAllowed: (value: boolean) => void; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="today-status-modal" onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">TODAY STATUS</span><h2>今天的状态</h2></div><button className="icon-button" onClick={onClose}>×</button></div><textarea value={diary} onChange={(event) => setDiary(event.target.value)} placeholder="写下今天发生了什么，或者只记一件让你在意的事…" /><div className="diary-controls"><label className="toggle-row"><input type="checkbox" checked={diaryAllowed} onChange={(event) => setDiaryAllowed(event.target.checked)} /><span className="toggle" />允许送入模型</label><span className="muted">原始状态会永久保留</span></div><button className="primary-button full" onClick={onClose}>保存状态</button></section></div>;
}

function OverviewView({ tasks, projects, doneCount, confirmedFacts, overviewStats, setView, plannerSnapshot, diary, onPlannerDetail, onTodayPlan, onTodayStatus }: { tasks: PlannerTask[]; projects: Project[]; doneCount: number; confirmedFacts: number; overviewStats: OverviewStats; setView: (view: ViewKey) => void; plannerSnapshot: PlannerSnapshot | null; diary: string; onPlannerDetail: () => void; onTodayPlan: () => void; onTodayStatus: () => void }) {
  const planned = tasks.filter((task) => !task.completed).length;
  const hasTodayStatus = diary.trim().length > 0;
  const tarotLabel = plannerSnapshot?.tarot?.card ? `${plannerSnapshot.tarot.card}（${plannerSnapshot.tarot.orientation ?? "正位"}）` : "今日尚未抽牌";
  const focus = plannerSnapshot?.suggestions?.[0]?.text ?? "先从一个可完成的小动作开始，牌面会在行动中显出方向。";
  const plannerItems = plannerSnapshot?.suggestions?.filter((item) => item.text).map((item, index) => ({ id: `agent-${index}`, title: item.text as string, durationMinutes: index === 0 ? 45 : 30 })) ?? [];
  const overviewItems: { id: string; title: string; durationMinutes: number; completed?: boolean; kind?: PlannerTask["kind"] }[] = plannerItems.length ? plannerItems : tasks.slice(0, 4);
  return <div className="view-stack">
    <div className="metric-grid">
      <MetricCard label="本周投递" value="03" detail="较上周 +1" accent="coral" icon="↗" />
      <MetricCard label="待复习" value={`${tasks.filter((task) => task.kind === "review").length + 2}`} detail="今天安排了 3 项" accent="violet" icon="◒" />
      <MetricCard label="确认事实" value={String(confirmedFacts).padStart(2, "0")} detail="来自 2 个项目" accent="mint" icon="◈" />
      <MetricCard label="连续专注" value="06" detail="天" accent="yellow" icon="✦" />
    </div>
    <div className="dashboard-grid">
      <section className="panel focus-panel"><PanelHeader title="今天的焦点" action="查看建议" onAction={onPlannerDetail} /><div className="focus-hero"><div className="focus-number">01</div><div><span className="tag coral">规划 Agent</span><h2>{focus}</h2><p>依据 {tarotLabel} 与今日计划生成，可按你的判断调整。</p></div><span className="duration">今日</span></div><div className="progress-line"><span style={{ width: plannerSnapshot ? "65%" : "10%" }} /></div><div className="focus-footer"><span>{plannerSnapshot ? "已生成今日建议" : "等待今日计划"}</span><button className="text-button" onClick={onPlannerDetail}>查看规划 →</button></div></section>
      <section className="panel snapshot-panel"><PanelHeader title="状态快照" action="详情" onAction={() => setView("applications")} /><div className="mini-stat-row"><div><strong>{overviewStats.todayApplications}</strong><span>今日投递</span></div><div><strong>{overviewStats.todayInterviews}</strong><span>今日面试</span></div><div><strong>{planned}</strong><span>待完成事项</span></div></div><div className="funnel"><div className="funnel-row"><span>已投递</span><div><i style={{ width: "100%" }} /></div><b>3</b></div><div className="funnel-row"><span>沟通中</span><div><i className="violet-bar" style={{ width: "33%" }} /></div><b>1</b></div><div className="funnel-row"><span>面试中</span><div><i className="mint-bar" style={{ width: "33%" }} /></div><b>1</b></div></div></section>
    </div>
    <div className="dashboard-grid lower"><section className="panel task-panel"><PanelHeader title="今日事项" action={plannerItems.length ? "规划 Agent 已生成" : `${doneCount}/${tasks.length} 完成`} onAction={plannerItems.length ? onPlannerDetail : onTodayPlan} /><div className="task-list">{overviewItems.map((task) => <button className={`task-row ${task.completed ? "completed" : ""}`} key={task.id} onClick={plannerItems.length ? onPlannerDetail : onTodayPlan}><span className="check-circle">{task.completed ? "✓" : ""}</span><span className="task-title">{task.title}</span><span className={`task-kind ${task.kind ?? "other"}`}>{task.kind ? kindLabel(task.kind) : "建议"}</span><span className="task-time">{task.durationMinutes}m</span></button>)}</div></section><section className="panel reflection-teaser"><PanelHeader title="今日反思" action="打开" onAction={onTodayStatus} />{hasTodayStatus ? <div className="reflection-quote" onClick={onTodayStatus}><span className="quote-mark">“</span><p>{diary}</p><span className="quote-meta">今天的状态 · 点击编辑</span></div> : <div className="reflection-empty"><p>还没有写下今天的状态。</p><button className="outline-button full" onClick={onTodayStatus}>写下今天的状态 <span>→</span></button></div>}</section></div>
    <div className="section-heading"><div><span className="eyebrow">YOUR FOUNDATION</span><h2>项目事实库</h2></div><button className="text-button" onClick={() => setView("projects")}>管理项目 →</button></div><div className="project-strip">{projects.map((project) => <article className="project-mini" key={project.id}><div className="project-mini-top"><span className="project-symbol">{project.name.slice(0, 1)}</span><span className="count-badge">{project.facts.length} 条事实</span></div><h3>{project.name}</h3><p>{project.summary}</p><div className="stack-row">{project.stack.slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div></article>)}</div>
  </div>;
}

function MetricCard({ label, value, detail, accent, icon }: { label: string; value: string; detail: string; accent: string; icon: string }) { return <article className={`metric-card ${accent}`}><div className="metric-top"><span>{label}</span><b>{icon}</b></div><strong>{value}</strong><small>{detail}</small></article>; }
function PanelHeader({ title, action, onAction }: { title: string; action: string; onAction: () => void }) { return <div className="panel-header"><h2>{title}</h2><button className="text-button" onClick={onAction}>{action} <span>→</span></button></div>; }

function ProjectsView({ projects, addProject, confirmFact }: { projects: Project[]; addProject: (event: FormEvent<HTMLFormElement>) => void; confirmFact: (projectId: string, factId: string) => void }) {
  return <div className="view-stack"><div className="toolbar-row"><div><strong>{projects.length} 个项目</strong><span className="muted"> · {projects.flatMap((project) => project.facts).length} 条事实</span></div><button className="secondary-button" onClick={() => document.getElementById("new-project")?.scrollIntoView({ behavior: "smooth" })}>＋ 新建项目</button></div><div className="project-grid">{projects.map((project) => <article className="panel project-card" key={project.id}><div className="project-card-heading"><span className="project-symbol large">{project.name.slice(0, 1)}</span><div><h2>{project.name}</h2><p>{project.summary}</p></div><button className="icon-button">•••</button></div><div className="stack-row">{project.stack.map((item) => <span key={item}>{item}</span>)}</div><div className="facts-header"><strong>事实候选</strong><span>{project.facts.filter((fact) => fact.status === "confirmed").length}/{project.facts.length} 已确认</span></div><div className="fact-list">{project.facts.map((fact) => <div className="fact-row" key={fact.id}><span className={`fact-status ${fact.status}`} /> <span>{fact.text}</span>{fact.status === "candidate" ? <button className="confirm-link" onClick={() => confirmFact(project.id, fact.id)}>确认</button> : <span className="verified">已确认</span>}</div>)}</div><button className="outline-button full">上传 README / 图片 <span>↑</span></button></article>)}</div><section className="panel form-panel" id="new-project"><div><span className="eyebrow">NEW FOUNDATION</span><h2>添加一个项目</h2><p>先保存项目概况，再从 README 提炼事实候选。</p></div><form className="inline-form" onSubmit={addProject}><input name="name" placeholder="项目名称" aria-label="项目名称" /><input name="summary" placeholder="一句话简介" aria-label="项目简介" /><button className="primary-button">保存项目</button></form></section></div>;
}

function ContentResumePanel() {
  const [jd, setJd] = useState(""); const [resume, setResume] = useState(""); const [projectContext, setProjectContext] = useState("求职期学习助手：TypeScript、Next.js、PostgreSQL、Drizzle。"); const [result, setResult] = useState<any>(null);
  async function analyze() { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "resume_match", jd, resume, projectContext }) }); const payload = await response.json(); setResult(payload.data ?? null); }
  return <section className="panel resume-match-panel"><div className="resume-match-heading"><div><span className="eyebrow">CONTENT & RESUME AGENT</span><h2>简历匹配度分析</h2><p>只引用你提供的 JD、简历和项目内容。</p></div><button className="primary-button" onClick={analyze}>分析匹配度</button></div><div className="resume-input-grid"><textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="粘贴目标 JD…" /><textarea value={resume} onChange={(e) => setResume(e.target.value)} placeholder="粘贴原始简历…" /><textarea value={projectContext} onChange={(e) => setProjectContext(e.target.value)} placeholder="项目资料…" /></div>{result && <div className="resume-result"><strong>分析结果</strong>{result.gaps.map((gap: any) => <article className="gap-item" key={gap.skill}><b>{gap.skill}</b><span>{gap.reason}</span><small>建议：{gap.suggestion}</small></article>)}</div>}</section>;
}


function ApplicationsView({ applications, addApplication, updateApplicationStatus }: { applications: Application[]; addApplication: (event: FormEvent<HTMLFormElement>) => void; updateApplicationStatus: (id: string, next: ApplicationStatus) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState("尚未上传原始简历");
  const [resumeHtml, setResumeHtml] = useState("");
  useEffect(() => { void fetch("/api/resume").then((response) => response.json()).then(async (payload: { resume?: { fileName?: string; htmlContent?: string } | null }) => { if (payload.resume) { setResumeName(payload.resume.fileName ?? "已上传简历"); setResumeHtml(payload.resume.htmlContent ?? ""); return; } const legacy = window.localStorage.getItem("source-resume"); if (!legacy) return; try { const old = JSON.parse(legacy) as { fileName?: string; htmlContent?: string }; if (old.fileName && old.htmlContent) { setResumeName(old.fileName); setResumeHtml(old.htmlContent); await fetch("/api/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(old) }); window.localStorage.removeItem("source-resume"); } } catch { /* discard malformed legacy cache */ } }).catch(() => undefined); }, []);
  const [draft, setDraft] = useState({ company: "", role: "", base: "", salary: "", jd: "" });
  const [match, setMatch] = useState<any>(null);
  const withSilent = markSilentApplications(applications, new Date("2026-11-11T12:00:00.000Z"), 7);
  function openApplication(application?: Application) { setOpenId(application?.id ?? "new"); setMatch(null); setDraft(application ? { company: application.company, role: application.role, base: "", salary: "", jd: "" } : { company: "", role: "", base: "", salary: "", jd: "" }); }
  async function analyze() { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "resume_match", jd: draft.jd, resume: resumeName, projectContext: "已确认项目事实库" }) }); const payload = await response.json(); setMatch(payload.data ?? null); }
  async function pasteJdImage(event: React.ClipboardEvent<HTMLTextAreaElement>) { const clipboardFile = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/")); const clipboardItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/")); const file = clipboardFile ?? clipboardItem?.getAsFile(); if (!file) return; event.preventDefault(); const form = new FormData(); form.append("images", file, file.name || "pasted-jd.png"); const response = await fetch("/api/ocr", { method: "POST", body: form }); const payload = await response.json(); setDraft((current) => ({ ...current, company: payload.fields?.company || current.company, base: payload.fields?.base || current.base, salary: payload.fields?.salary || current.salary, jd: payload.fields?.jd || payload.text || current.jd })); }
  return <div className="view-stack"><section className="panel original-resume-panel"><div><span className="eyebrow">SOURCE RESUME</span><h2>原始简历</h2><p>所有公司匹配度分析都以这一份简历为基础。</p></div><label className="resume-upload">↑ 上传或替换简历<input type="file" accept=".html,.txt" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const html = await file.text(); setResumeName(file.name); setResumeHtml(html); await fetch("/api/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file.name, htmlContent: html }) }); }} /></label><span className="resume-name">{resumeName}</span>{resumeHtml && <details className="resume-preview"><summary>预览 HTML 简历</summary><iframe title="原始简历预览" sandbox="allow-same-origin" srcDoc={resumeHtml} /></details>}</section><div className="toolbar-row"><div><strong>{applications.length} 个已投递机会</strong><span className="muted"> · 点击公司行查看详情</span></div><button className="primary-button" onClick={() => openApplication()}>＋ 添加投递</button></div><div className="panel table-panel"><div className="table-head"><span>公司 / 职位</span><span>状态</span><span>投递日期</span><span>简历版本</span><span /></div>{withSilent.map((application) => <button className="application-row clickable-row" key={application.id} onClick={() => openApplication(application)}><div className="company-cell"><div className="company-logo">{application.company.slice(0, 1)}</div><div><strong>{application.company}</strong><small>{application.role}</small></div></div><div onClick={(e) => e.stopPropagation()}><select value={application.status} onChange={(event) => updateApplicationStatus(application.id, event.target.value as ApplicationStatus)}>{(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}</select>{application.silent && <span className="silent-chip">沉默 12d</span>}</div><span className="date-text">{application.appliedAt.slice(5, 10).replace("-", "/")}</span><span className="version-chip">v{application.status === "interviewing" ? "03" : "01"}</span><span className="icon-button">•••</span></button>)}</div>{openId && <div className="modal-backdrop" onClick={() => setOpenId(null)}><section className="application-modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">APPLICATION DETAIL</span><h2>{openId === "new" ? "添加投递" : draft.company}</h2></div><button className="icon-button" onClick={() => setOpenId(null)}>×</button></div><div className="modal-grid"><label>公司名称<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label><label>职位名称<input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label><label>公司 base 地<input value={draft.base} onChange={(e) => setDraft({ ...draft, base: e.target.value })} /></label><label>薪资范围<input value={draft.salary} onChange={(e) => setDraft({ ...draft, salary: e.target.value })} /></label></div><label className="modal-field">JD 内容<textarea value={draft.jd} onPaste={pasteJdImage} onChange={(e) => setDraft({ ...draft, jd: e.target.value })} placeholder="粘贴 JD 文字，或直接粘贴截图（⌘V / Ctrl+V）…" /></label><label className="multi-upload">↑ 上传 JD 截图（可多张）<input type="file" accept="image/*" multiple /></label><div className="modal-actions"><button className="secondary-button" onClick={() => setOpenId(null)}>保存信息</button><button className="primary-button" onClick={analyze}>生成匹配度和修改建议</button></div>{match && <div className="modal-match"><strong>匹配分析</strong>{match.gaps.map((gap: any) => <p key={gap.skill}><b>{gap.skill}</b> · {gap.reason} · 建议：{gap.suggestion}</p>)}</div>}</section></div>}</div>;
}

function InterviewsView({ questions, generateQuestions, confirmQuestion }: { questions: Question[]; generateQuestions: (event: FormEvent<HTMLFormElement>) => void; confirmQuestion: (id: string) => void }) {
  const [sourceText, setSourceText] = useState("");
  async function uploadQuestionImages(files: FileList | null) { if (!files?.length) return; const form = new FormData(); Array.from(files).forEach((file) => form.append("images", file)); const response = await fetch("/api/ocr", { method: "POST", body: form }); const payload = await response.json(); if (payload.text) setSourceText((current) => current ? `${current}\n${payload.text}` : payload.text); }
  const [rubric, setRubric] = useState<RubricScores>({ accuracy: 4, completeness: 3, structure: 4, example: 3, concision: 4 });
  const total = calculateWeightedScore(rubric);
  return <div className="view-stack"><div className="split-layout"><section className="panel extraction-panel"><PanelHeader title="录入面经" action="支持截图" onAction={() => undefined} /><form onSubmit={generateQuestions}><textarea name="sourceText" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="粘贴面试记录，或上传截图后核对转写…\n\n识别结果会回填到这里，你可以先修改。" /><div className="form-row"><label className="upload-control"><span>↑</span> 上传截图<input type="file" accept="image/*" multiple onChange={(event) => uploadQuestionImages(event.target.files)} /></label><button className="primary-button">提炼题目</button></div></form><div className="safety-callout"><span>◌</span><div><strong>外部文本只当数据</strong><p>截图或面经中的指令不会被执行，提炼结果需要你确认。</p></div></div></section><section className="panel rubric-panel"><PanelHeader title="回答评分预览" action="固定 rubric" onAction={() => undefined} /><p className="muted">总分由代码按权重计算，模型只引用回答原话。</p><div className="rubric-list">{(Object.keys(rubric) as (keyof RubricScores)[]).map((key) => <label key={key}><span>{rubricLabel(key)}</span><input type="range" min="1" max="5" value={rubric[key]} onChange={(event) => setRubric({ ...rubric, [key]: Number(event.target.value) })} /><b>{rubric[key]}</b></label>)}</div><div className="score-total"><span>当前练习分数</span><strong>{total.toFixed(1)}</strong><small>/ 5.0</small></div><button className="outline-button full">粘贴我的回答开始评分 <span>→</span></button></section></div><div className="section-heading"><div><span className="eyebrow">QUESTION BANK</span><h2>题库 · {questions.length}</h2></div><div className="legend"><span>精确重复自动合并</span><span>相似题先人工确认</span></div></div><div className="question-list">{questions.map((question) => <article className="panel question-card" key={question.id}><div className="question-top"><span className="question-number">Q{String(questions.indexOf(question) + 1).padStart(2, "0")}</span><div><div className="question-tags"><span className="tag neutral">{question.category}</span><span className={`tag ${question.source === "real" ? "coral" : "violet"}`}>{question.source === "real" ? "真实面试" : "网上面经"}</span></div><h3>{question.text}</h3></div><span className={`question-status ${question.confirmed ? "confirmed" : "draft"}`}>{question.confirmed ? "已确认" : "草稿"}</span></div><div className="question-bottom"><span>答案依据 · {question.answerBasis}</span>{question.confirmed ? <button className="text-button">查看答案草稿 →</button> : <button className="confirm-link" onClick={() => confirmQuestion(question.id)}>确认进入练习</button>}</div></article>)}</div></div>;
}

function StudyView({ items, reviewStudyItem }: { items: StudyItem[]; reviewStudyItem: (id: string, score: number) => void }) { return <div className="view-stack"><div className="study-summary"><div><span className="eyebrow">TODAY'S REVIEW</span><h2>今天有 {items.length} 个学习条目</h2><p>每次评分都会计算下一次复习日期，低于 3 分会回到第一档。</p></div><div className="streak-card"><strong>06</strong><span>day streak</span></div></div><div className="study-list">{items.map((item) => <article className="panel study-card" key={item.id}><div className={`study-type ${item.type}`}>{item.type === "algo" ? "ALGO" : item.type === "project" ? "PROJECT" : "Q"}</div><div className="study-main"><div className="study-title-row"><h3>{item.title}</h3><span className="next-review">到期 {item.nextReviewAt}</span></div><div className="stage-track">{[0, 1, 2, 3, 4].map((stage) => <i className={stage <= item.stage ? "on" : ""} key={stage} />)}<span>阶段 {item.stage + 1} / 5</span></div></div><div className="review-actions"><span>本次掌握度</span><div>{[1, 2, 3, 4, 5].map((score) => <button key={score} onClick={() => reviewStudyItem(item.id, score)}>{score}</button>)}</div></div></article>)}</div></div>; }

function MemoryTrendPanel() {
  const [history, setHistory] = useState("最近 8 天连续学习后完成率下降，周一到周五学习，周末休息。昨天 4 项完成 3 项。"); const [result, setResult] = useState<any>(null);
  async function analyze() { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "memory_trend", history, confirmedProfile: "" }) }); const payload = await response.json(); setResult(payload.data ?? null); }
  return <section className="panel memory-trend-panel"><div className="panel-header"><div><span className="eyebrow">MEMORY AGENT</span><h2>历史趋势分析</h2></div><button className="secondary-button" onClick={analyze}>分析历史</button></div><textarea value={history} onChange={(e) => setHistory(e.target.value)} />{result && <div className="trend-result">{result.observations.map((item: string) => <p key={item}>观察：{item}</p>)}{result.suggestions.map((item: any) => <article key={item.text}><strong>{item.text}</strong><small>来源：{item.source}</small><button className="confirm-button">确认写入画像</button></article>)}</div>}</section>;
}

function MemoryView({ suggestions, decideMemory }: { suggestions: MemorySuggestion[]; decideMemory: (id: string, status: "已确认" | "已拒绝") => void }) { return <div className="view-stack"><MemoryTrendPanel /><div className="memory-header"><div><span className="eyebrow">CONFIRMATION QUEUE</span><h2>有 {suggestions.filter((item) => item.status === "待确认").length} 条画像建议等你确认</h2><p>模型可以提出建议，只有你确认后才会进入画像。</p></div><div className="memory-orbit"><span>RAW</span><b>→</b><span>SUMMARY</span><b>→</b><strong>PROFILE</strong></div></div><section className="panel suggestion-panel"><div className="panel-header"><h2>待确认队列</h2><span className="muted">拒绝后不落库</span></div>{suggestions.map((suggestion) => <div className={`suggestion-row ${suggestion.status !== "待确认" ? "decided" : ""}`} key={suggestion.id}><div className="suggestion-icon">✦</div><div className="suggestion-copy"><strong>{suggestion.text}</strong><span>来源 · {suggestion.source}</span></div>{suggestion.status === "待确认" ? <div className="suggestion-actions"><button className="reject-button" onClick={() => decideMemory(suggestion.id, "已拒绝")}>拒绝</button><button className="confirm-button" onClick={() => decideMemory(suggestion.id, "已确认")}>确认写入</button></div> : <span className={`decision ${suggestion.status === "已确认" ? "yes" : "no"}`}>{suggestion.status}</span>}</div>)}</section><section className="panel event-panel"><div className="panel-header"><h2>最近事件</h2><button className="text-button">查看全部 →</button></div><div className="event-list"><EventRow time="10:42" component="规划" action="schedule_tasks" result="4 blocks / 0 overlap" /><EventRow time="09:58" component="面试内容" action="extract_questions" result="3 drafts / 1 duplicate" /><EventRow time="昨天" component="每日反思" action="generate_reflection" result="validated · 186 chars" failed /></div></section></div>; }
function EventRow({ time, component, action, result, failed }: { time: string; component: string; action: string; result: string; failed?: boolean }) { return <div className="event-row"><time>{time}</time><span className="event-component">{component}</span><code>{action}</code><span className={failed ? "event-failed" : "event-result"}>{failed ? "↻ " : "✓ "}{result}</span></div>; }
function kindLabel(kind: PlannerTask["kind"]) { return ({ interview: "面试", deadline: "截止", follow_up: "跟进", daily_study: "学习", review: "复习", other: "其他" })[kind]; }
function rubricLabel(key: keyof RubricScores) { return ({ accuracy: "准确性", completeness: "完整度", structure: "结构", example: "具体例子", concision: "简洁度" })[key]; }
