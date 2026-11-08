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
  scheduleTasks,
  transitionApplication
} from "@/lib/domain";
import { drawTarot, shuffleTarot, tarotDeck, TarotDraw } from "@/lib/tarot";

type ViewKey = "overview" | "projects" | "applications" | "interviews" | "study" | "planner" | "reflection" | "memory";

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
  suggestions?: { text?: string }[];
};

const NAV_ITEMS: { key: ViewKey; label: string; short: string }[] = [
  { key: "overview", label: "今日总览", short: "⌂" },
  { key: "projects", label: "项目与事实", short: "◈" },
  { key: "applications", label: "求职投递", short: "↗" },
  { key: "interviews", label: "面试题库", short: "◇" },
  { key: "study", label: "学习复习", short: "◒" },
  { key: "reflection", label: "每日反思", short: "✦" },
  { key: "memory", label: "记忆与日志", short: "≋" }
];

const VIEW_TITLES: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "MONDAY · 11 NOV 2026", title: "今天，先把重要的事做完", description: "把投递、练习和复盘放在同一条清晰的线上。" },
  projects: { eyebrow: "FACT LIBRARY", title: "项目与事实", description: "只把确认过的事实带入简历和答案。" },
  applications: { eyebrow: "JOB SEARCH", title: "求职投递", description: "状态流转、沉默标记和简历版本都可追溯。" },
  interviews: { eyebrow: "INTERVIEW CONTENT", title: "面试题库", description: "从原始记录提炼问题，重复项先提示再合并。" },
  study: { eyebrow: "SPACED REPETITION", title: "学习复习", description: "复习间隔由代码计算，模型只负责解释。" },
  planner: { eyebrow: "DAILY PLANNER", title: "今日排程", description: "优先安排面试、截止日期和到期复习。" },
  reflection: { eyebrow: "MORNING REFLECTION", title: "每日反思", description: "日记与牌义只用于观察今天，不参与任何决策。" },
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
  const [plannerSnapshot, setPlannerSnapshot] = useState<PlannerSnapshot | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem("life-management-tab", view);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", view);
    window.history.replaceState({}, "", url);
  }, [view]);

  useEffect(() => {
    const saved = window.localStorage.getItem("life-management-demo");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.projects) setProjects(parsed.projects);
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.tasks) setTasks(parsed.tasks);
      if (parsed.studyItems) setStudyItems(parsed.studyItems);
      if (parsed.questions) setQuestions(parsed.questions);
      if (parsed.suggestions) setSuggestions(parsed.suggestions);
    } catch {
      setToast("本地数据读取失败，已使用演示数据");
    }
  }, []);

  useEffect(() => {
    const loadPlannerSnapshot = () => {
      const stored = window.localStorage.getItem("today-planner-result");
      setPlannerSnapshot(stored ? JSON.parse(stored) as PlannerSnapshot : null);
    };
    loadPlannerSnapshot();
    window.addEventListener("today-plan-updated", loadPlannerSnapshot);
    return () => window.removeEventListener("today-plan-updated", loadPlannerSnapshot);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("life-management-demo", JSON.stringify({ projects, applications, tasks, studyItems, questions, suggestions }));
  }, [projects, applications, tasks, studyItems, questions, suggestions]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const current = VIEW_TITLES[view];
  const silentCount = markSilentApplications(applications, new Date("2026-11-11T12:00:00.000Z"), 7).filter((item) => item.silent).length;
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
          <div className="privacy-note"><span className="status-dot" />本地演示模式<div>所有写入都可确认、可追溯</div></div>
          <div className="profile-row"><div className="avatar">JZ</div><div><strong>Julia</strong><small>专注求职期</small></div><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar"><div className="breadcrumb"><span>工作台</span><b>/</b><strong>{current.title}</strong></div><div className="topbar-actions"><span className="sync"><i /> 数据已保存</span><button className="icon-button" onClick={() => flash("快捷键面板即将开放")}>⌘</button><button className="primary-button small" onClick={() => setShowTodayPlan(true)}>＋ 今日计划</button></div></header>
        <div className="content-wrap">
          <div className="page-intro"><div><span className="eyebrow">{current.eyebrow}</span><h1>{view === "overview" ? (plannerSnapshot?.tone ?? "今天的牌面，正在等待你的下一步") : current.title}</h1>{view !== "overview" && <p>{current.description}</p>}</div>{view === "overview" && <div className="date-chip"><span>今日</span><strong>{todayLabel()}</strong></div>}</div>
          {view === "overview" && <OverviewView applications={applications} tasks={tasks} projects={projects} doneCount={doneCount} confirmedFacts={confirmedFacts} silentCount={silentCount} setView={setView} plannerSnapshot={plannerSnapshot} diary={diary} />}
          {view === "projects" && <ProjectsView projects={projects} addProject={addProject} confirmFact={confirmFact} />}
          {view === "applications" && <ApplicationsView applications={applications} addApplication={addApplication} updateApplicationStatus={updateApplicationStatus} />}
          {view === "interviews" && <InterviewsView questions={questions} generateQuestions={generateQuestions} confirmQuestion={confirmQuestion} />}
          {view === "study" && <StudyView items={studyItems} reviewStudyItem={reviewStudyItem} />}
          {view === "planner" && <PlannerView tasks={tasks} addTask={addTask} toggleTask={toggleTask} />}
          {view === "reflection" && <ReflectionView diary={diary} setDiary={setDiary} diaryAllowed={diaryAllowed} setDiaryAllowed={setDiaryAllowed} flash={flash} />}
          {view === "memory" && <MemoryView suggestions={suggestions} decideMemory={decideMemory} />}
        </div>
      </section>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
      {showTodayPlan && <TodayPlanModal onClose={() => setShowTodayPlan(false)} />}
    </main>
  );
}

function TodayPlanModal({ onClose }: { onClose: () => void }) {
  const [cards, setCards] = useState(() => shuffleTarot());
  const today = new Date().toISOString().slice(0, 10);
  const storedDraw = typeof window === "undefined" ? null : window.localStorage.getItem("today-tarot");
  const initialDraw = storedDraw ? JSON.parse(storedDraw) as TarotDraw : null;
  const [draw, setDraw] = useState<TarotDraw | null>(initialDraw);
  const [selectedId, setSelectedId] = useState(initialDraw?.id ?? "");
  const [selectedOrientation, setSelectedOrientation] = useState<"upright" | "reversed">(initialDraw?.orientation ?? "upright");
  const [plan, setPlan] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem(`today-plan-${today}`) ?? "");
  function drawToday() { if (initialDraw?.date === today) { setDraw(initialDraw); setSelectedId(initialDraw.id); setSelectedOrientation(initialDraw.orientation); return; } const next = drawTarot(cards, today); localStorage.setItem("today-tarot", JSON.stringify(next)); setDraw(next); setSelectedId(next.id); setSelectedOrientation(next.orientation); }
  const selectedCard = tarotDeck.find((card) => card.id === selectedId);
  const visibleCard = selectedCard ? { ...selectedCard, orientation: selectedOrientation } : draw;
  async function saveTodayPlan() {
    const chosen = selectedCard ? { ...selectedCard, position: selectedCard.id === draw?.id ? draw.position : 1, orientation: selectedOrientation, date: today } : draw;
    if (chosen) localStorage.setItem("today-tarot", JSON.stringify(chosen));
    localStorage.setItem(`today-plan-${today}`, plan);
    if (chosen) {
      const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "planner", card: chosen.name, orientation: chosen.orientation === "upright" ? "正位" : "逆位", keywords: chosen.keywords, userPlan: plan, mood: "", observations: ["今日事项与历史趋势由代码汇总"] }) });
      const payload = await response.json() as { data?: PlannerSnapshot };
      if (payload.data) localStorage.setItem("today-planner-result", JSON.stringify(payload.data));
    }
    window.dispatchEvent(new Event("today-plan-updated"));
    onClose();
  }
  return <div className="modal-backdrop" onClick={onClose}><section className="today-plan-modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">TODAY PLAN</span><h2>今天的计划</h2></div><button className="icon-button" onClick={onClose}>×</button></div><div className="today-plan-grid"><div className="today-tarot-side"><div className="tarot-draw-slot">{visibleCard ? <><img src={visibleCard.image} alt={visibleCard.name} /><strong>{visibleCard.name}</strong><span>{visibleCard.orientation === "upright" ? "正位" : "逆位"}</span></> : <span>＋</span>}</div><select className="tarot-select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">选择你抽到的牌</option>{tarotDeck.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select><select className="tarot-select" value={selectedOrientation} onChange={(e) => setSelectedOrientation(e.target.value as "upright" | "reversed")}><option value="upright">正位</option><option value="reversed">逆位</option></select><div className="tarot-actions"><button className="secondary-button" onClick={() => setCards(shuffleTarot())}>洗牌</button><button className="primary-button" onClick={drawToday}>抽牌</button></div><small>可以手动选择你抽到的牌，也可以让系统抽牌。</small></div><div className="today-plan-input"><label>你今天想完成什么？<textarea value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="例如：复习两道题，下午出去走走…" /></label><button className="primary-button full" onClick={saveTodayPlan}>保存并交给规划 Agent</button></div></div></section></div>;
}

function OverviewView({ applications, tasks, projects, doneCount, confirmedFacts, silentCount, setView, plannerSnapshot, diary }: { applications: Application[]; tasks: PlannerTask[]; projects: Project[]; doneCount: number; confirmedFacts: number; silentCount: number; setView: (view: ViewKey) => void; plannerSnapshot: PlannerSnapshot | null; diary: string }) {
  const planned = tasks.filter((task) => !task.completed).length;
  const hasTodayStatus = diary.trim().length > 0;
  const tarotLabel = plannerSnapshot?.tarot?.card ? `${plannerSnapshot.tarot.card}（${plannerSnapshot.tarot.orientation ?? "正位"}）` : "今日尚未抽牌";
  const focus = plannerSnapshot?.suggestions?.[0]?.text ?? "先从一个可完成的小动作开始，牌面会在行动中显出方向。";
  return <div className="view-stack">
    <div className="metric-grid">
      <MetricCard label="本周投递" value="03" detail="较上周 +1" accent="coral" icon="↗" />
      <MetricCard label="待复习" value={`${tasks.filter((task) => task.kind === "review").length + 2}`} detail="今天安排了 3 项" accent="violet" icon="◒" />
      <MetricCard label="确认事实" value={String(confirmedFacts).padStart(2, "0")} detail="来自 2 个项目" accent="mint" icon="◈" />
      <MetricCard label="连续专注" value="06" detail="天" accent="yellow" icon="✦" />
    </div>
    <div className="dashboard-grid">
      <section className="panel focus-panel"><PanelHeader title="今天的焦点" action="查看排程" onAction={() => setView("planner")} /><div className="focus-hero"><div className="focus-number">01</div><div><span className="tag coral">规划 Agent</span><h2>{focus}</h2><p>依据 {tarotLabel} 与今日计划生成，可按你的判断调整。</p></div><span className="duration">今日</span></div><div className="progress-line"><span style={{ width: plannerSnapshot ? "65%" : "10%" }} /></div><div className="focus-footer"><span>{plannerSnapshot ? "已生成今日建议" : "等待今日计划"}</span><button className="text-button" onClick={() => setView("planner")}>查看规划 →</button></div></section>
      <section className="panel snapshot-panel"><PanelHeader title="状态快照" action="详情" onAction={() => setView("applications")} /><div className="mini-stat-row"><div><strong>{applications.length}</strong><span>进行中的投递</span></div><div><strong>{silentCount}</strong><span>沉默提醒</span></div><div><strong>{planned}</strong><span>待完成事项</span></div></div><div className="funnel"><div className="funnel-row"><span>已投递</span><div><i style={{ width: "100%" }} /></div><b>3</b></div><div className="funnel-row"><span>沟通中</span><div><i className="violet-bar" style={{ width: "33%" }} /></div><b>1</b></div><div className="funnel-row"><span>面试中</span><div><i className="mint-bar" style={{ width: "33%" }} /></div><b>1</b></div></div></section>
    </div>
    <div className="dashboard-grid lower"><section className="panel task-panel"><PanelHeader title="今日事项" action={`${doneCount}/${tasks.length} 完成`} onAction={() => setView("planner")} /><div className="task-list">{tasks.slice(0, 4).map((task) => <button className={`task-row ${task.completed ? "completed" : ""}`} key={task.id} onClick={() => setView("planner")}><span className="check-circle">{task.completed ? "✓" : ""}</span><span className="task-title">{task.title}</span><span className={`task-kind ${task.kind}`}>{kindLabel(task.kind)}</span><span className="task-time">{task.durationMinutes}m</span></button>)}</div></section><section className="panel reflection-teaser"><PanelHeader title="今日反思" action="去写一条" onAction={() => setView("reflection")} />{hasTodayStatus ? <div className="reflection-quote"><span className="quote-mark">“</span><p>昨日的牌面与今日事项已经留下线索，继续观察你的节奏，答案会在完成一件小事后变得清楚。</p><span className="quote-meta">昨日快照 · {tarotLabel} · 结合学习与事项</span></div> : <div className="reflection-empty"><p>还没有写下今天的状态。</p><button className="outline-button full" onClick={() => setView("reflection")}>写下今天的状态 <span>→</span></button></div>}</section></div>
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
  const [draft, setDraft] = useState({ company: "", role: "", base: "", salary: "", jd: "" });
  const [match, setMatch] = useState<any>(null);
  const withSilent = markSilentApplications(applications, new Date("2026-11-11T12:00:00.000Z"), 7);
  function openApplication(application?: Application) { setOpenId(application?.id ?? "new"); setMatch(null); setDraft(application ? { company: application.company, role: application.role, base: "", salary: "", jd: "" } : { company: "", role: "", base: "", salary: "", jd: "" }); }
  async function analyze() { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "resume_match", jd: draft.jd, resume: resumeName, projectContext: "已确认项目事实库" }) }); const payload = await response.json(); setMatch(payload.data ?? null); }
  async function pasteJdImage(event: React.ClipboardEvent<HTMLTextAreaElement>) { const clipboardFile = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/")); const clipboardItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/")); const file = clipboardFile ?? clipboardItem?.getAsFile(); if (!file) return; event.preventDefault(); const form = new FormData(); form.append("images", file, file.name || "pasted-jd.png"); const response = await fetch("/api/ocr", { method: "POST", body: form }); const payload = await response.json(); setDraft((current) => ({ ...current, company: payload.fields?.company || current.company, base: payload.fields?.base || current.base, salary: payload.fields?.salary || current.salary, jd: payload.fields?.jd || payload.text || current.jd })); }
  return <div className="view-stack"><section className="panel original-resume-panel"><div><span className="eyebrow">SOURCE RESUME</span><h2>原始简历</h2><p>所有公司匹配度分析都以这一份简历为基础。</p></div><label className="resume-upload">↑ 上传或替换简历<input type="file" accept=".html,.txt" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const html = await file.text(); setResumeName(file.name); setResumeHtml(html); localStorage.setItem("source-resume", JSON.stringify({ fileName: file.name, htmlContent: html })); await fetch("/api/resume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileName: file.name, htmlContent: html }) }); }} /></label><span className="resume-name">{resumeName}</span>{resumeHtml && <details className="resume-preview"><summary>预览 HTML 简历</summary><iframe title="原始简历预览" sandbox="allow-same-origin" srcDoc={resumeHtml} /></details>}</section><div className="toolbar-row"><div><strong>{applications.length} 个已投递机会</strong><span className="muted"> · 点击公司行查看详情</span></div><button className="primary-button" onClick={() => openApplication()}>＋ 添加投递</button></div><div className="panel table-panel"><div className="table-head"><span>公司 / 职位</span><span>状态</span><span>投递日期</span><span>简历版本</span><span /></div>{withSilent.map((application) => <button className="application-row clickable-row" key={application.id} onClick={() => openApplication(application)}><div className="company-cell"><div className="company-logo">{application.company.slice(0, 1)}</div><div><strong>{application.company}</strong><small>{application.role}</small></div></div><div onClick={(e) => e.stopPropagation()}><select value={application.status} onChange={(event) => updateApplicationStatus(application.id, event.target.value as ApplicationStatus)}>{(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((status) => <option key={status} value={status}>{APPLICATION_STATUS_LABELS[status]}</option>)}</select>{application.silent && <span className="silent-chip">沉默 12d</span>}</div><span className="date-text">{application.appliedAt.slice(5, 10).replace("-", "/")}</span><span className="version-chip">v{application.status === "interviewing" ? "03" : "01"}</span><span className="icon-button">•••</span></button>)}</div>{openId && <div className="modal-backdrop" onClick={() => setOpenId(null)}><section className="application-modal" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">APPLICATION DETAIL</span><h2>{openId === "new" ? "添加投递" : draft.company}</h2></div><button className="icon-button" onClick={() => setOpenId(null)}>×</button></div><div className="modal-grid"><label>公司名称<input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} /></label><label>职位名称<input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></label><label>公司 base 地<input value={draft.base} onChange={(e) => setDraft({ ...draft, base: e.target.value })} /></label><label>薪资范围<input value={draft.salary} onChange={(e) => setDraft({ ...draft, salary: e.target.value })} /></label></div><label className="modal-field">JD 内容<textarea value={draft.jd} onPaste={pasteJdImage} onChange={(e) => setDraft({ ...draft, jd: e.target.value })} placeholder="粘贴 JD 文字，或直接粘贴截图（⌘V / Ctrl+V）…" /></label><label className="multi-upload">↑ 上传 JD 截图（可多张）<input type="file" accept="image/*" multiple /></label><div className="modal-actions"><button className="secondary-button" onClick={() => setOpenId(null)}>保存信息</button><button className="primary-button" onClick={analyze}>生成匹配度和修改建议</button></div>{match && <div className="modal-match"><strong>匹配分析</strong>{match.gaps.map((gap: any) => <p key={gap.skill}><b>{gap.skill}</b> · {gap.reason} · 建议：{gap.suggestion}</p>)}</div>}</section></div>}</div>;
}

function InterviewsView({ questions, generateQuestions, confirmQuestion }: { questions: Question[]; generateQuestions: (event: FormEvent<HTMLFormElement>) => void; confirmQuestion: (id: string) => void }) {
  const [sourceText, setSourceText] = useState("");
  async function uploadQuestionImages(files: FileList | null) { if (!files?.length) return; const form = new FormData(); Array.from(files).forEach((file) => form.append("images", file)); const response = await fetch("/api/ocr", { method: "POST", body: form }); const payload = await response.json(); if (payload.text) setSourceText((current) => current ? `${current}\n${payload.text}` : payload.text); }
  const [rubric, setRubric] = useState<RubricScores>({ accuracy: 4, completeness: 3, structure: 4, example: 3, concision: 4 });
  const total = calculateWeightedScore(rubric);
  return <div className="view-stack"><div className="split-layout"><section className="panel extraction-panel"><PanelHeader title="录入面经" action="支持截图" onAction={() => undefined} /><form onSubmit={generateQuestions}><textarea name="sourceText" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="粘贴面试记录，或上传截图后核对转写…\n\n识别结果会回填到这里，你可以先修改。" /><div className="form-row"><label className="upload-control"><span>↑</span> 上传截图<input type="file" accept="image/*" multiple onChange={(event) => uploadQuestionImages(event.target.files)} /></label><button className="primary-button">提炼题目</button></div></form><div className="safety-callout"><span>◌</span><div><strong>外部文本只当数据</strong><p>截图或面经中的指令不会被执行，提炼结果需要你确认。</p></div></div></section><section className="panel rubric-panel"><PanelHeader title="回答评分预览" action="固定 rubric" onAction={() => undefined} /><p className="muted">总分由代码按权重计算，模型只引用回答原话。</p><div className="rubric-list">{(Object.keys(rubric) as (keyof RubricScores)[]).map((key) => <label key={key}><span>{rubricLabel(key)}</span><input type="range" min="1" max="5" value={rubric[key]} onChange={(event) => setRubric({ ...rubric, [key]: Number(event.target.value) })} /><b>{rubric[key]}</b></label>)}</div><div className="score-total"><span>当前练习分数</span><strong>{total.toFixed(1)}</strong><small>/ 5.0</small></div><button className="outline-button full">粘贴我的回答开始评分 <span>→</span></button></section></div><div className="section-heading"><div><span className="eyebrow">QUESTION BANK</span><h2>题库 · {questions.length}</h2></div><div className="legend"><span>精确重复自动合并</span><span>相似题先人工确认</span></div></div><div className="question-list">{questions.map((question) => <article className="panel question-card" key={question.id}><div className="question-top"><span className="question-number">Q{String(questions.indexOf(question) + 1).padStart(2, "0")}</span><div><div className="question-tags"><span className="tag neutral">{question.category}</span><span className={`tag ${question.source === "real" ? "coral" : "violet"}`}>{question.source === "real" ? "真实面试" : "网上面经"}</span></div><h3>{question.text}</h3></div><span className={`question-status ${question.confirmed ? "confirmed" : "draft"}`}>{question.confirmed ? "已确认" : "草稿"}</span></div><div className="question-bottom"><span>答案依据 · {question.answerBasis}</span>{question.confirmed ? <button className="text-button">查看答案草稿 →</button> : <button className="confirm-link" onClick={() => confirmQuestion(question.id)}>确认进入练习</button>}</div></article>)}</div></div>;
}

function StudyView({ items, reviewStudyItem }: { items: StudyItem[]; reviewStudyItem: (id: string, score: number) => void }) { return <div className="view-stack"><div className="study-summary"><div><span className="eyebrow">TODAY'S REVIEW</span><h2>今天有 {items.length} 个学习条目</h2><p>每次评分都会计算下一次复习日期，低于 3 分会回到第一档。</p></div><div className="streak-card"><strong>06</strong><span>day streak</span></div></div><div className="study-list">{items.map((item) => <article className="panel study-card" key={item.id}><div className={`study-type ${item.type}`}>{item.type === "algo" ? "ALGO" : item.type === "project" ? "PROJECT" : "Q"}</div><div className="study-main"><div className="study-title-row"><h3>{item.title}</h3><span className="next-review">到期 {item.nextReviewAt}</span></div><div className="stage-track">{[0, 1, 2, 3, 4].map((stage) => <i className={stage <= item.stage ? "on" : ""} key={stage} />)}<span>阶段 {item.stage + 1} / 5</span></div></div><div className="review-actions"><span>本次掌握度</span><div>{[1, 2, 3, 4, 5].map((score) => <button key={score} onClick={() => reviewStudyItem(item.id, score)}>{score}</button>)}</div></div></article>)}</div></div>; }

function PlannerAgentPanel() {
  const [card, setCard] = useState("节制");
  const [orientation, setOrientation] = useState<"正位" | "逆位">("正位");
  const [mood, setMood] = useState("");
  const [userPlan, setUserPlan] = useState("");
  const [result, setResult] = useState<any>(null);
  async function runPlanner() {
    const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "planner", card, orientation, keywords: ["平衡", "节奏", "适度"], mood, userPlan, observations: ["近 8 天连续学习后完成率通常下降", "今天有 2 项复习到期", "排程由代码检查时间冲突"] }) });
    const payload = await response.json();
    if (payload.data) setResult({ ...payload.data, provider: payload.provider });
  }
  return <section className="panel planner-agent-panel"><div className="planner-agent-copy"><span className="eyebrow">REACT PLANNER AGENT</span><h2>先看牌面，再决定今天的节奏</h2><p>牌义会公开展示，只作为软性建议。你可以接受、修改或忽略它。</p><div className="planner-inputs"><select value={card} onChange={(e) => setCard(e.target.value)}><option>节制</option><option>隐者</option><option>星星</option></select><select value={orientation} onChange={(e) => setOrientation(e.target.value as "正位" | "逆位")}><option>正位</option><option>逆位</option></select><input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="今天的心情或精力" /><input value={userPlan} onChange={(e) => setUserPlan(e.target.value)} placeholder="你想完成什么？" /><button className="primary-button" onClick={runPlanner}>生成建议</button></div></div>{result && <div className="planner-agent-result"><div className="tarot-summary"><strong>{card} · {orientation}</strong><span>{result.tarot.keywords.join(" · ")}</span></div><p className="planner-tone">{result.tone}</p>{result.observations.map((item: string) => <span className="planner-observation" key={item}>代码依据 · {item}</span>)}{result.suggestions.map((suggestion: any) => <button className="planner-suggestion" key={suggestion.text}><span>＋</span><div><strong>{suggestion.text}</strong><small>依据 · {suggestion.basis.join("、")} · 点击后加入待确认队列</small></div></button>)}<div className="planner-choice"><button>接受塔罗影响</button><button>调整建议</button><button>忽略塔罗影响</button><small>{result.provider === "ollama" ? "已使用本地 Ollama" : "本地模型未连接，当前为规则降级"}</small></div></div>}</section>;
}

function PlannerView({ tasks, addTask, toggleTask }: { tasks: PlannerTask[]; addTask: (event: FormEvent<HTMLFormElement>) => void; toggleTask: (id: string) => void }) { const result = scheduleTasks(tasks, { start: "09:00", end: "18:00" }); return <div className="view-stack"><PlannerAgentPanel /><div className="planner-head"><div><span className="eyebrow">WED · 11 NOV</span><h2>09:00 — 18:00 <span>· 7h 可用</span></h2><p>排程器不读取塔罗和日记，只使用任务、截止日和复习状态。</p></div><div className="time-window"><span>时间窗口</span><strong>09:00 — 18:00</strong><small>可在设置中调整</small></div></div><div className="planner-grid"><section className="panel schedule-panel"><PanelHeader title="已排入时间块" action={`${result.blocks.length} 项`} onAction={() => undefined} /><div className="schedule-list">{result.blocks.map((block) => <div className="schedule-row" key={block.id}><span className="schedule-time">{block.start}<small>{block.end}</small></span><div className={`schedule-bar ${block.kind}`} /><div className="schedule-content"><strong>{block.title}</strong><span>{block.reason}</span></div><span className="schedule-duration">{block.durationMinutes}m</span></div>)}</div>{result.unscheduled.length > 0 && <div className="unscheduled"><strong>顺延 {result.unscheduled.length} 项</strong>{result.unscheduled.map(({ task, reason }) => <span key={task.id}>{task.title} · {reason}</span>)}</div>}</section><section className="panel add-task-panel"><span className="eyebrow">ADD TASK</span><h2>加入今天</h2><form onSubmit={addTask}><input name="title" placeholder="要完成什么？" /><div className="form-row"><input name="duration" type="number" min="5" step="5" placeholder="分钟" /><select name="kind" defaultValue="other"><option value="interview">面试准备</option><option value="deadline">截止日期</option><option value="follow_up">投递跟进</option><option value="daily_study">固定学习</option><option value="review">到期复习</option><option value="other">其他</option></select></div><button className="primary-button full">加入排程</button></form><div className="task-queue"><strong>待办队列</strong>{tasks.map((task) => <label key={task.id} className={task.completed ? "completed" : ""}><input type="checkbox" checked={task.completed ?? false} onChange={() => toggleTask(task.id)} /><span>{task.title}</span><small>{task.durationMinutes}m</small></label>)}</div></section></div></div>; }

function ReflectionView({ diary, setDiary, diaryAllowed, setDiaryAllowed, flash }: { diary: string; setDiary: (value: string) => void; diaryAllowed: boolean; setDiaryAllowed: (value: boolean) => void; flash: (message: string) => void }) { const [card, setCard] = useState(""); const [orientation, setOrientation] = useState("正位"); const [reflection, setReflection] = useState<{ summary: string; question: string; smallThings: string[] } | null>(null); async function generate() { if (!card) { flash("今天还没有抽牌，请先选择或抽取一张牌"); return; } if (detectCareSignal(diary)) { setReflection({ summary: "我看到你正在经历一段很难受的时间。先把今天缩小到一个安全、具体的动作，联系你信任的人陪你一起度过。", question: "现在有谁可以陪你说说话？", smallThings: ["给信任的人发一条消息", "先喝水并离开让你不舒服的环境"] }); flash("检测到需要关怀的表达，已停止塔罗式解读"); return; } if (!diaryAllowed) { setReflection({ summary: "状态未允许送入模型，今天只展示牌义关键词。", question: "如果只看今天，你最想保留什么？", smallThings: ["完成一个最小任务"] }); flash("状态已保存，但不会进入模型分析"); return; } try { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "reflection", diary, card, orientation }) }); const payload = await response.json() as { summary?: string; question?: string; smallThings?: string[]; provider?: string }; if (payload.summary && payload.question && payload.smallThings) { setReflection({ summary: payload.summary, question: payload.question, smallThings: payload.smallThings }); flash(payload.provider === "ollama" ? "已使用本地模型生成反思" : "本地模型未连接，已使用规则降级"); return; } } catch { flash("本地模型未连接，已使用规则降级"); } setReflection({ summary: `你在「${card} · ${orientation}」的提示下，把注意力放回正在推进的事情。今天可以继续保留这种节奏，让行动比结论更早发生。`, question: "今天哪一个小动作会让明天的你更轻松？", smallThings: ["先复盘一个已确认事实", "给一项投递写跟进草稿", "留出 20 分钟不看消息"] }); } return <div className="view-stack"><div className="reflection-grid"><section className="panel diary-panel"><div className="panel-header"><h2>今天的状态</h2><span className="privacy-pill">{diaryAllowed ? "允许分析" : "仅保存"}</span></div><textarea value={diary} onChange={(event) => setDiary(event.target.value)} placeholder="写下今天发生了什么，或者只记一件让你在意的事…" /><div className="diary-controls"><label className="toggle-row"><input type="checkbox" checked={diaryAllowed} onChange={(event) => setDiaryAllowed(event.target.checked)} /><span className="toggle" />允许送入模型</label><span className="muted">原始状态会永久保留</span></div></section><section className="panel tarot-panel"><span className="eyebrow">YOUR CARD</span><h2>今天抽到什么牌？</h2><div className="tarot-card"><div className="tarot-sun">✦</div><strong>{card}</strong><span>{orientation}</span></div><div className="form-row"><select value={card} onChange={(event) => setCard(event.target.value)}><option value="">请选择今天的牌</option><option>权杖六</option><option>节制</option><option>隐者</option><option>星星</option></select><select value={orientation} onChange={(event) => setOrientation(event.target.value)}><option>正位</option><option>逆位</option></select></div><button className="primary-button full" onClick={generate}>生成今日反思</button></section></div>{reflection && <section className="panel reflection-result"><div className="result-top"><span className="eyebrow">REFLECTION · {card} {orientation}</span><span className="safe-badge">✓ 已通过边界检查</span></div><p className="reflection-summary">{reflection.summary}</p><div className="question-prompt"><span>给自己的问题</span><strong>{reflection.question}</strong></div><div className="small-things"><span>今天可以关注的小事</span><div>{reflection.smallThings.map((thing) => <button key={thing} onClick={() => flash("已加入待确认队列")}><i>＋</i>{thing}</button>)}</div></div></section>}<div className="boundary-note"><span>⌁</span><div><strong>边界提醒</strong><p>牌义只用于反思，不预测录用、金钱或身体结果。生成内容会经过结构校验，写入待办前需要你确认。</p></div></div></div>; }

function MemoryTrendPanel() {
  const [history, setHistory] = useState("最近 8 天连续学习后完成率下降，周一到周五学习，周末休息。昨天 4 项完成 3 项。"); const [result, setResult] = useState<any>(null);
  async function analyze() { const response = await fetch("/api/llm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "memory_trend", history, confirmedProfile: "" }) }); const payload = await response.json(); setResult(payload.data ?? null); }
  return <section className="panel memory-trend-panel"><div className="panel-header"><div><span className="eyebrow">MEMORY AGENT</span><h2>历史趋势分析</h2></div><button className="secondary-button" onClick={analyze}>分析历史</button></div><textarea value={history} onChange={(e) => setHistory(e.target.value)} />{result && <div className="trend-result">{result.observations.map((item: string) => <p key={item}>观察：{item}</p>)}{result.suggestions.map((item: any) => <article key={item.text}><strong>{item.text}</strong><small>来源：{item.source}</small><button className="confirm-button">确认写入画像</button></article>)}</div>}</section>;
}

function MemoryView({ suggestions, decideMemory }: { suggestions: MemorySuggestion[]; decideMemory: (id: string, status: "已确认" | "已拒绝") => void }) { return <div className="view-stack"><MemoryTrendPanel /><div className="memory-header"><div><span className="eyebrow">CONFIRMATION QUEUE</span><h2>有 {suggestions.filter((item) => item.status === "待确认").length} 条画像建议等你确认</h2><p>模型可以提出建议，只有你确认后才会进入画像。</p></div><div className="memory-orbit"><span>RAW</span><b>→</b><span>SUMMARY</span><b>→</b><strong>PROFILE</strong></div></div><section className="panel suggestion-panel"><div className="panel-header"><h2>待确认队列</h2><span className="muted">拒绝后不落库</span></div>{suggestions.map((suggestion) => <div className={`suggestion-row ${suggestion.status !== "待确认" ? "decided" : ""}`} key={suggestion.id}><div className="suggestion-icon">✦</div><div className="suggestion-copy"><strong>{suggestion.text}</strong><span>来源 · {suggestion.source}</span></div>{suggestion.status === "待确认" ? <div className="suggestion-actions"><button className="reject-button" onClick={() => decideMemory(suggestion.id, "已拒绝")}>拒绝</button><button className="confirm-button" onClick={() => decideMemory(suggestion.id, "已确认")}>确认写入</button></div> : <span className={`decision ${suggestion.status === "已确认" ? "yes" : "no"}`}>{suggestion.status}</span>}</div>)}</section><section className="panel event-panel"><div className="panel-header"><h2>最近事件</h2><button className="text-button">查看全部 →</button></div><div className="event-list"><EventRow time="10:42" component="规划" action="schedule_tasks" result="4 blocks / 0 overlap" /><EventRow time="09:58" component="面试内容" action="extract_questions" result="3 drafts / 1 duplicate" /><EventRow time="昨天" component="每日反思" action="generate_reflection" result="validated · 186 chars" failed /></div></section></div>; }
function EventRow({ time, component, action, result, failed }: { time: string; component: string; action: string; result: string; failed?: boolean }) { return <div className="event-row"><time>{time}</time><span className="event-component">{component}</span><code>{action}</code><span className={failed ? "event-failed" : "event-result"}>{failed ? "↻ " : "✓ "}{result}</span></div>; }
function kindLabel(kind: PlannerTask["kind"]) { return ({ interview: "面试", deadline: "截止", follow_up: "跟进", daily_study: "学习", review: "复习", other: "其他" })[kind]; }
function rubricLabel(key: keyof RubricScores) { return ({ accuracy: "准确性", completeness: "完整度", structure: "结构", example: "具体例子", concision: "简洁度" })[key]; }
