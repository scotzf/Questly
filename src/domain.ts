import type { AreaId } from "./skills/types";
export type Priority = "Low" | "Medium" | "High";
/** A task's area (Study, Fitness, …); see src/skills/taxonomy.ts. */
export type CategoryId = AreaId;
/** `doneAt` dates subtask XP; older data may lack it. */
export type Step = { id: string; title: string; done: boolean; doneAt?: number };
export type Task = {
  id: string;
  title: string;
  description: string;
  course: string;
  category: CategoryId;
  priority: Priority;
  /** Date & time the task is scheduled / due. */
  dueAt: number | null;
  /** Minutes before `dueAt` to remind; null = no reminder. */
  reminder: number | null;
  estimate: number;
  steps: Step[];
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  /** Set when the task was added from a skill's practice. */
  skillId?: string;
};
/** A recurring check-in. `days` are weekdays (0 = Sun); `log` holds check-in times. */
export type Habit = {
  id: string;
  title: string;
  category: CategoryId;
  days: number[];
  log: number[];
  createdAt: number;
  skillId?: string;
  archived?: boolean;
};
/**
 * Proof attached to a milestone. Optional today (milestones are self-reported);
 * the slot exists so verification can be added without migrating data.
 */
export type Evidence = {
  at: number;
  note?: string;
  value?: number;
  unit?: string;
  /** Local file URI of a photo. */
  photo?: string;
};
/** Progress in one skill: chosen branch and milestone completion times. */
export type SkillProgress = {
  started: number;
  branch: string | null;
  milestones: Record<string, number>;
  /** Level id -> when its last milestone was completed. */
  levels: Record<string, number>;
  /** Milestone id -> proof, when given. */
  evidence?: Record<string, Evidence>;
};
export type Slot = { id: string; taskId: string; start: number; end: number };
export type Settings = {
  onboarded: boolean;
  name: string;
  reminders: boolean;
  notify: { tasks: boolean; deadlines: boolean; plan: boolean; daily: boolean };
  quietStart: number;
  quietEnd: number;
  dayStart: number;
  dayEnd: number;
  /** XP needed per day to hit the daily goal. */
  dailyGoal: number;
};
export type Shop = {
  /** Coins spent so far; balance = earned - spent. */
  spent: number;
  freezes: number;
  owned: string[];
  outfit: string | null;
  /** Day keys a streak freeze covered. */
  frozen: string[];
};
export type State = {
  tasks: Task[];
  slots: Slot[];
  settings: Settings;
  shop: Shop;
  habits: Habit[];
  skills: Record<string, SkillProgress>;
  /** Quest ids picked for each day (dayKey -> ids), so history stays stable. */
  questLog: Record<string, string[]>;
};
export const initialState = (): State => ({
  tasks: [],
  slots: [],
  settings: {
    onboarded: false,
    name: "",
    reminders: false,
    notify: { tasks: true, deadlines: true, plan: true, daily: false },
    quietStart: 22,
    quietEnd: 7,
    dayStart: 9,
    dayEnd: 18,
    dailyGoal: 30,
  },
  shop: { spent: 0, freezes: 0, owned: [], outfit: null, frozen: [] },
  habits: [],
  skills: {},
  questLog: {},
});
const taskDefaults = { course: "", category: "growth", reminder: null } as const;
/** Categories from before the 10 areas. */
const OLD_CATEGORY: Record<string, CategoryId> = {
  project: "work",
  journalism: "creative",
  personal: "home",
  other: "growth",
};
/** Fills fields missing from data saved by an older version. */
export const withDefaults = (saved: Partial<State>): State => {
  const base = initialState();
  return {
    tasks: (saved.tasks ?? []).map((t) => {
      const task = { ...taskDefaults, ...t };
      return { ...task, category: OLD_CATEGORY[task.category] ?? task.category };
    }),
    slots: saved.slots ?? [],
    shop: { ...base.shop, ...saved.shop },
    habits: saved.habits ?? [],
    skills: Object.fromEntries(
      Object.entries(saved.skills ?? {}).map(([id, p]) => [
        id,
        { started: 0, branch: null, milestones: {}, levels: {}, ...(p as Partial<SkillProgress>) },
      ]),
    ),
    questLog: saved.questLog ?? {},
    settings: {
      ...base.settings,
      ...saved.settings,
      notify: { ...base.settings.notify, ...saved.settings?.notify },
    },
  };
};
export const newTask = (
  id: string,
  fields: Partial<Task> & { title: string },
  now = Date.now(),
): Task => ({
  id,
  description: "",
  ...taskDefaults,
  priority: "Medium",
  dueAt: null,
  estimate: 25,
  steps: [],
  completedAt: null,
  createdAt: now,
  updatedAt: now,
  ...fields,
});
export const toggleTask = (s: State, id: string, now = Date.now()): State => ({
  ...s,
  tasks: s.tasks.map((t) =>
    t.id === id
      ? { ...t, completedAt: t.completedAt ? null : now, updatedAt: now }
      : t,
  ),
  slots: s.slots.filter((x) => x.taskId !== id),
});
export const toggleStep = (
  s: State,
  taskId: string,
  stepId: string,
  now = Date.now(),
): State => ({
  ...s,
  tasks: s.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          updatedAt: now,
          steps: t.steps.map((x) =>
            x.id === stepId
              ? { ...x, done: !x.done, doneAt: x.done ? undefined : now }
              : x,
          ),
        }
      : t,
  ),
});
export const deleteTask = (s: State, id: string): State => ({
  ...s,
  tasks: s.tasks.filter((t) => t.id !== id),
  slots: s.slots.filter((x) => x.taskId !== id),
});
export const dayKey = (time: number) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
export const nextStep = (task: Task) =>
  task.steps.find((s) => !s.done)?.title ?? null;
export const sortTasks = (tasks: Task[]) =>
  [...tasks].sort(
    (a, b) =>
      (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) ||
      { High: 0, Medium: 1, Low: 2 }[a.priority] -
        { High: 0, Medium: 1, Low: 2 }[b.priority] ||
      a.createdAt - b.createdAt,
  );
export type Plan = {
  slots: Slot[];
  unplanned: { taskId: string; minutes: number; reason: string }[];
};
/** Propose only: caller explicitly confirms replacement of future slots. */
export function proposePlan(state: State, now = Date.now()): Plan {
  const slots: Slot[] = [];
  const unplanned: Plan["unplanned"] = [];
  const start = new Date(now);
  start.setHours(state.settings.dayStart, 0, 0, 0);
  const end = new Date(now);
  end.setHours(state.settings.dayEnd, 0, 0, 0);
  let cursor = Math.max(start.getTime(), Math.ceil(now / 300000) * 300000);
  // A block already in progress remains committed when future slots are replaced.
  for (const slot of state.slots)
    if (slot.start < now && slot.end > now)
      cursor = Math.max(cursor, slot.end + 5 * 60000);
  for (const task of sortTasks(state.tasks.filter((t) => !t.completedAt))) {
    let minutes = Math.max(0, Math.ceil(task.estimate));
    if (!minutes) continue;
    const limit = Math.min(end.getTime(), task.dueAt ?? Infinity);
    while (minutes > 0 && cursor + 60000 <= limit) {
      const block = Math.min(25, minutes, Math.floor((limit - cursor) / 60000));
      slots.push({
        id: `plan-${task.id}-${cursor}`,
        taskId: task.id,
        start: cursor,
        end: cursor + block * 60000,
      });
      cursor += (block + 5) * 60000;
      minutes -= block;
    }
    if (minutes)
      unplanned.push({
        taskId: task.id,
        minutes,
        reason:
          task.dueAt !== null && task.dueAt <= now ? "Past due" : "Out of time",
      });
  }
  return { slots, unplanned };
}

const DAY = 86400000;
export const startOfDay = (time: number) => {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
/** Monday-first week containing `time`. */
export const weekDays = (time: number) => {
  const d = new Date(startOfDay(time));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day.getTime();
  });
};
export type TaskStatus = "todo" | "doing" | "done";
export const taskStatus = (task: Task): TaskStatus =>
  task.completedAt ? "done" : task.steps.some((s) => s.done) ? "doing" : "todo";
export const stepProgress = (task: Task) =>
  task.steps.length
    ? task.steps.filter((s) => s.done).length / task.steps.length
    : task.completedAt
      ? 1
      : 0;

// ---- XP, streaks, quests (Duolingo-style loop) ----
export const STEP_XP = 3;
export const HABIT_XP = 5;
export const MILESTONE_XP = 25;
export const LEVEL_XP = 50;
/**
 * Self-reported milestones and levels only earn XP up to this many per day;
 * extra ones still count as progress. Keeps leagues fair until evidence exists.
 */
export const MAX_SELF_REPORTED_PER_DAY = 3;
/** Ticked off within 2 minutes of being added: counts, but barely (keeps leagues fair). */
const INSTANT = 2 * 60000;
/** XP for completing a task: base + priority + beating the deadline. */
export const taskXp = (t: Task) =>
  t.completedAt && t.completedAt - t.createdAt < INSTANT
    ? 2
    : 10 +
      { High: 10, Medium: 5, Low: 0 }[t.priority] +
      (t.completedAt && t.dueAt && t.completedAt <= t.dueAt ? 5 : 0);
type XpEvent = {
  at: number;
  xp: number;
  kind: "task" | "step" | "habit" | "milestone" | "level";
  category?: CategoryId;
  task?: Task;
  skill?: boolean;
};
const xpEvents = (s: State): XpEvent[] => [
  ...s.tasks.flatMap((t) => [
    ...(t.completedAt
      ? [{ at: t.completedAt, xp: taskXp(t), kind: "task" as const, category: t.category, task: t, skill: !!t.skillId }]
      : []),
    ...t.steps
      .filter((x) => x.done && x.doneAt)
      .map((x) => ({ at: x.doneAt!, xp: STEP_XP, kind: "step" as const, category: t.category, task: t })),
  ]),
  ...s.habits.flatMap((h) =>
    h.log.map((at) => ({ at, xp: HABIT_XP, kind: "habit" as const, category: h.category, skill: !!h.skillId })),
  ),
  ...capSelfReported(
    Object.values(s.skills).flatMap((p) => [
      ...Object.entries(p.milestones).map(([id, at]) => ({
        at,
        xp: MILESTONE_XP,
        kind: "milestone" as const,
        skill: true,
        proven: !!p.evidence?.[id],
      })),
      ...Object.values(p.levels).map((at) => ({ at, xp: LEVEL_XP, kind: "level" as const, skill: true, proven: false })),
    ]),
  ),
];
function capSelfReported(events: (XpEvent & { proven: boolean })[]): XpEvent[] {
  const perDay = new Map<string, number>();
  return [...events]
    .sort((a, b) => a.at - b.at)
    .map(({ proven, ...e }) => {
      if (proven) return e;
      const key = dayKey(e.at);
      const n = (perDay.get(key) ?? 0) + 1;
      perDay.set(key, n);
      return n > MAX_SELF_REPORTED_PER_DAY ? { ...e, xp: 0 } : e;
    });
}
const onDay = (e: XpEvent[], day: number) => {
  const start = startOfDay(day);
  return e.filter((x) => x.at >= start && x.at < start + DAY);
};
export const habitDueOn = (h: Habit, day: number) =>
  !h.archived && h.days.includes(new Date(day).getDay());
export const habitDoneOn = (h: Habit, day: number) =>
  h.log.some((at) => dayKey(at) === dayKey(day));
export type Quest = {
  id: string;
  title: string;
  detail: string;
  icon: string;
  value: number;
  goal: number;
  xp: number;
};
type QuestDef = {
  title: string;
  detail: string;
  icon: string;
  xp: number;
  goal: (s: State, day: number) => number;
  value: (events: XpEvent[], s: State, day: number) => number;
  /** Offered only when it can be done today. */
  available: (s: State, now: number) => boolean;
};
const open = (s: State) => s.tasks.filter((t) => !t.completedAt);
const areaQuest = (area: CategoryId, title: string, label: string, icon: string): QuestDef => ({
  title,
  detail: `Finish 1 ${label} task or habit`,
  icon,
  xp: 10,
  goal: () => 1,
  value: (e) => e.filter((x) => (x.kind === "task" || x.kind === "habit") && x.category === area).length,
  available: (s, now) =>
    open(s).some((t) => t.category === area) ||
    s.habits.some((h) => h.category === area && habitDueOn(h, now)),
});
const dueToday = (s: State, day: number) =>
  s.tasks.filter((t) => t.dueAt && dayKey(t.dueAt) === dayKey(day));
export const QUESTS: Record<string, QuestDef> = {
  goal: {
    title: "Earn XP",
    detail: "Your daily XP target",
    icon: "star",
    xp: 10,
    goal: (s) => s.settings.dailyGoal,
    value: (e) => e.reduce((n, x) => n + x.xp, 0),
    available: () => true,
  },
  tasks2: {
    title: "Finish 2 tasks",
    detail: "Any 2 tasks",
    icon: "checkmark-done",
    xp: 10,
    goal: () => 2,
    value: (e) => e.filter((x) => x.kind === "task").length,
    available: () => true,
  },
  steps5: {
    title: "Check off 5 subtasks",
    detail: "Small steps count",
    icon: "list",
    xp: 10,
    goal: () => 5,
    value: (e) => e.filter((x) => x.kind === "step").length,
    available: (s) => open(s).reduce((n, t) => n + t.steps.filter((x) => !x.done).length, 0) >= 5,
  },
  fitness: areaQuest("fitness", "Move your body", "Fitness", "barbell"),
  wellness: areaQuest("wellness", "Mind break", "Wellness", "leaf"),
  creative: areaQuest("creative", "Make something", "Creative", "color-palette"),
  home: areaQuest("home", "Home reset", "Home", "home"),
  social: areaQuest("social", "Reach out", "Social", "people"),
  study: areaQuest("study", "Study session", "Study", "school"),
  balance: {
    title: "Balanced day",
    detail: "Finish tasks in 3 areas",
    icon: "pie-chart",
    xp: 15,
    goal: () => 3,
    value: (e) => new Set(e.filter((x) => x.kind === "task").map((x) => x.category)).size,
    available: (s) => new Set(open(s).map((t) => t.category)).size >= 3,
  },
  habits2: {
    title: "Keep 2 habits",
    detail: "Check in 2 habits today",
    icon: "repeat",
    xp: 10,
    goal: () => 2,
    value: (e) => e.filter((x) => x.kind === "habit").length,
    available: (s, now) => s.habits.filter((h) => habitDueOn(h, now)).length >= 2,
  },
  early: {
    title: "Early start",
    detail: "Finish a task before 12 PM",
    icon: "sunny",
    xp: 10,
    goal: () => 1,
    value: (e) => e.filter((x) => x.kind === "task" && new Date(x.at).getHours() < 12).length,
    available: (s, now) => new Date(now).getHours() < 10 && open(s).length > 0,
  },
  clear: {
    title: "Clear today's list",
    detail: "Finish everything due today",
    icon: "checkbox",
    xp: 15,
    goal: (s, day) => Math.max(1, dueToday(s, day).length),
    value: (_e, s, day) => dueToday(s, day).filter((t) => t.completedAt).length,
    available: (s, now) => dueToday(s, now).some((t) => !t.completedAt),
  },
  high: {
    title: "Top priority",
    detail: "Finish a High-priority task",
    icon: "flag",
    xp: 15,
    goal: () => 1,
    value: (e) => e.filter((x) => x.kind === "task" && x.task?.priority === "High").length,
    available: (s) => open(s).some((t) => t.priority === "High"),
  },
  plan: {
    title: "Plan tomorrow",
    detail: "Add a task for tomorrow",
    icon: "calendar",
    xp: 5,
    goal: () => 1,
    value: (_e, s, day) =>
      s.tasks.filter(
        (t) =>
          dayKey(t.createdAt) === dayKey(day) &&
          t.dueAt &&
          dayKey(t.dueAt) === dayKey(startOfDay(day) + DAY + DAY / 2),
      ).length,
    available: () => true,
  },
  practice: {
    title: "Practice an activity",
    detail: "Finish an activity practice or milestone",
    icon: "school",
    xp: 15,
    goal: () => 1,
    value: (e) => e.filter((x) => x.skill).length,
    available: (s) => Object.keys(s.skills).length > 0,
  },
};
const hash = (text: string) =>
  [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** Picks and saves today's quests once: "Earn XP" plus 2 that can be done today. */
export const ensureQuests = (s: State, now = Date.now()): State => {
  const key = dayKey(now);
  if (s.questLog[key]) return s;
  const pool = Object.keys(QUESTS)
    .filter((id) => id !== "goal" && QUESTS[id].available(s, now))
    .sort((a, b) => hash(key + a) - hash(key + b));
  return { ...s, questLog: { ...s.questLog, [key]: ["goal", ...pool.slice(0, 2)] } };
};
/** The day's saved quests with progress; empty if none were picked that day. */
export const quests = (s: State, now = Date.now()): Quest[] => {
  const events = onDay(xpEvents(s), now);
  return (s.questLog[dayKey(now)] ?? [])
    .filter((id) => QUESTS[id])
    .map((id) => {
      const q = QUESTS[id];
      const goal = q.goal(s, now);
      return {
        id,
        title: id === "goal" ? `Earn ${goal} XP` : q.title,
        detail: q.detail,
        icon: q.icon,
        xp: q.xp,
        goal,
        value: Math.min(goal, q.value(events, s, now)),
      };
    });
};
const questXp = (s: State, day: number) =>
  quests(s, day).reduce((n, q) => n + (q.value >= q.goal ? q.xp : 0), 0);
/** XP earned on the day containing `day`, quest bonuses included. */
export const dayXp = (s: State, day: number) =>
  onDay(xpEvents(s), day).reduce((n, e) => n + e.xp, 0) +
  (onDay(xpEvents(s), day).length ? questXp(s, day) : 0);
export const xpByDay = (s: State, now = Date.now()) =>
  weekDays(now).map((day) => ({ day, xp: dayXp(s, day) }));
const activeDays = (s: State) =>
  new Set([...xpEvents(s).map((e) => dayKey(e.at)), ...s.shop.frozen]);
export const isFrozen = (s: State, day: number) => s.shop.frozen.includes(dayKey(day));
/**
 * Spends streak freezes on the inactive days between the last active day and
 * yesterday — only if there are enough to save the streak.
 */
export const applyFreezes = (s: State, now = Date.now()): State => {
  const days = activeDays(s);
  const gap: string[] = [];
  let day = startOfDay(startOfDay(now) - DAY / 2);
  while (!days.has(dayKey(day)) && gap.length <= s.shop.freezes) {
    gap.push(dayKey(day));
    day = startOfDay(day - DAY / 2);
  }
  if (!gap.length || gap.length > s.shop.freezes || !days.has(dayKey(day))) return s;
  return {
    ...s,
    shop: { ...s.shop, freezes: s.shop.freezes - gap.length, frozen: [...s.shop.frozen, ...gap] },
  };
};
/** Consecutive active days ending today (or yesterday, if today is still open). */
export const streak = (s: State, now = Date.now()) => {
  const days = activeDays(s);
  let day = startOfDay(now);
  if (!days.has(dayKey(day))) day = startOfDay(day - DAY / 2);
  let count = 0;
  while (days.has(dayKey(day))) {
    count++;
    day = startOfDay(day - DAY / 2);
  }
  return count;
};
export const bestStreak = (s: State) => {
  const sorted = [...activeDays(s)]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return new Date(y, m, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 0,
    run = 0;
  sorted.forEach((day, i) => {
    run = i && Math.round((day - sorted[i - 1]) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
};
export const categoryCounts = (s: State) => {
  const totals: Partial<Record<CategoryId, number>> = {};
  for (const t of s.tasks.filter((t) => t.completedAt))
    totals[t.category] = (totals[t.category] ?? 0) + 1;
  return totals;
};
export const XP_PER_LEVEL = 200;
export const progress = (s: State) => {
  const days = new Set(xpEvents(s).map((e) => startOfDay(e.at)));
  const xp = [...days].reduce((n, day) => n + dayXp(s, day), 0);
  return {
    xp,
    coins: Math.floor(xp / 2),
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
  };
};
export type Achievement = { id: string; title: string; icon: string; value: number; goal: number };
export const achievements = (s: State): Achievement[] => {
  const done = s.tasks.filter((t) => t.completedAt);
  const steps = s.tasks.reduce((n, t) => n + t.steps.filter((x) => x.done).length, 0);
  const early = done.filter((t) => t.dueAt && t.completedAt! <= t.dueAt).length;
  const best = bestStreak(s);
  return [
    { id: "first", title: "First Win", icon: "flash", value: done.length, goal: 1 },
    { id: "week", title: "7-Day Streak", icon: "flame", value: best, goal: 7 },
    { id: "early", title: "Early Bird", icon: "alarm", value: early, goal: 10 },
    { id: "steps", title: "Step by Step", icon: "list", value: steps, goal: 100 },
    { id: "tasks", title: "Task Master", icon: "trophy", value: done.length, goal: 50 },
    { id: "month", title: "30-Day Streak", icon: "bonfire", value: best, goal: 30 },
  ].map((a) => ({ ...a, value: Math.min(a.value, a.goal) }));
};

// ---- Shop ----
export type ShopItem = { id: string; title: string; price: number; kind: "freeze" | "outfit" };
export const MAX_FREEZES = 2;
export const SHOP: ShopItem[] = [
  { id: "freeze", title: "Streak Freeze", price: 50, kind: "freeze" },
  { id: "glasses", title: "Glasses", price: 100, kind: "outfit" },
  { id: "scarf", title: "Scarf", price: 120, kind: "outfit" },
  { id: "party", title: "Party Hat", price: 150, kind: "outfit" },
  { id: "wizard", title: "Wizard Hat", price: 250, kind: "outfit" },
  { id: "crown", title: "Crown", price: 400, kind: "outfit" },
];
export const balance = (s: State) => progress(s).coins - s.shop.spent;
export const canBuy = (s: State, item: ShopItem) =>
  balance(s) >= item.price &&
  (item.kind === "freeze" ? s.shop.freezes < MAX_FREEZES : !s.shop.owned.includes(item.id));
/** Buys an item (outfits are worn right away); unchanged state if not allowed. */
export const buy = (s: State, id: string): State => {
  const item = SHOP.find((i) => i.id === id);
  if (!item || !canBuy(s, item)) return s;
  const shop = { ...s.shop, spent: s.shop.spent + item.price };
  return {
    ...s,
    shop:
      item.kind === "freeze"
        ? { ...shop, freezes: shop.freezes + 1 }
        : { ...shop, owned: [...shop.owned, item.id], outfit: item.id },
  };
};
export const wear = (s: State, outfit: string | null): State => ({
  ...s,
  shop: { ...s.shop, outfit: outfit && s.shop.owned.includes(outfit) ? outfit : null },
});

// ---- Habits ----
/** Spreads "N times a week" over sensible weekdays (0 = Sun). */
export const daysForPerWeek = (perWeek: number): number[] =>
  ({ 1: [6], 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] })[
    perWeek
  ] ?? [0, 1, 2, 3, 4, 5, 6];
export const addHabit = (s: State, habit: Habit): State => ({ ...s, habits: [...s.habits, habit] });
export const deleteHabit = (s: State, id: string): State => ({
  ...s,
  habits: s.habits.filter((h) => h.id !== id),
});
/** Checks a habit in for today, or undoes today's check-in. */
export const toggleHabit = (s: State, id: string, now = Date.now()): State => ({
  ...s,
  habits: s.habits.map((h) =>
    h.id !== id
      ? h
      : habitDoneOn(h, now)
        ? { ...h, log: h.log.filter((at) => dayKey(at) !== dayKey(now)) }
        : { ...h, log: [...h.log, now] },
  ),
});
/** Consecutive scheduled days the habit was done, ending today or the last due day. */
export const habitStreak = (h: Habit, now = Date.now()) => {
  let day = startOfDay(now);
  if (!habitDoneOn(h, day)) day = startOfDay(day - DAY / 2);
  let count = 0;
  for (let i = 0; i < 400; i++) {
    if (habitDueOn(h, day)) {
      if (!habitDoneOn(h, day)) break;
      count++;
    }
    day = startOfDay(day - DAY / 2);
  }
  return count;
};

// ---- Skills ----
export const startSkill = (s: State, skillId: string, now = Date.now()): State =>
  s.skills[skillId]
    ? s
    : { ...s, skills: { ...s.skills, [skillId]: { started: now, branch: null, milestones: {}, levels: {} } } };
export const stopSkill = (s: State, skillId: string): State => {
  const skills = { ...s.skills };
  delete skills[skillId];
  return { ...s, skills };
};
export const chooseBranch = (s: State, skillId: string, branch: string | null): State => {
  const p = s.skills[skillId];
  return p ? { ...s, skills: { ...s.skills, [skillId]: { ...p, branch } } } : s;
};
/**
 * Ticks or unticks a milestone. When every milestone of its level is done the
 * level is marked complete; unticking reopens it.
 */
export const toggleMilestone = (
  s: State,
  skillId: string,
  levelId: string,
  levelMilestones: string[],
  milestoneId: string,
  now = Date.now(),
): State => {
  const base = startSkill(s, skillId, now);
  const p = base.skills[skillId];
  const milestones = { ...p.milestones };
  const levels = { ...p.levels };
  if (milestones[milestoneId]) {
    delete milestones[milestoneId];
    delete levels[levelId];
  } else {
    milestones[milestoneId] = now;
    if (levelMilestones.every((m) => milestones[m])) levels[levelId] = now;
  }
  return { ...base, skills: { ...base.skills, [skillId]: { ...p, milestones, levels } } };
};

/** Attaches (or with null, removes) proof for a milestone. */
export const setEvidence = (
  s: State,
  skillId: string,
  milestoneId: string,
  evidence: Evidence | null,
): State => {
  const p = s.skills[skillId];
  if (!p) return s;
  const all = { ...p.evidence };
  if (evidence) all[milestoneId] = evidence;
  else delete all[milestoneId];
  return { ...s, skills: { ...s.skills, [skillId]: { ...p, evidence: all } } };
};
