export type Priority = "Low" | "Medium" | "High";
export type CategoryId = "study" | "project" | "journalism" | "personal" | "other";
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
});
const taskDefaults = { course: "", category: "other", reminder: null } as const;
/** Fills fields missing from data saved by an older version. */
export const withDefaults = (saved: Partial<State>): State => {
  const base = initialState();
  return {
    tasks: (saved.tasks ?? []).map((t) => ({ ...taskDefaults, ...t })),
    slots: saved.slots ?? [],
    shop: { ...base.shop, ...saved.shop },
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
/** XP for completing a task: base + priority + beating the deadline. */
export const taskXp = (t: Task) =>
  10 +
  { High: 10, Medium: 5, Low: 0 }[t.priority] +
  (t.completedAt && t.dueAt && t.completedAt <= t.dueAt ? 5 : 0);
type XpEvent = { at: number; xp: number; kind: "task" | "step"; task: Task };
const xpEvents = (s: State): XpEvent[] =>
  s.tasks.flatMap((t) => [
    ...(t.completedAt ? [{ at: t.completedAt, xp: taskXp(t), kind: "task" as const, task: t }] : []),
    ...t.steps
      .filter((x) => x.done && x.doneAt)
      .map((x) => ({ at: x.doneAt!, xp: STEP_XP, kind: "step" as const, task: t })),
  ]);
const onDay = (e: XpEvent[], day: number) => {
  const start = startOfDay(day);
  return e.filter((x) => x.at >= start && x.at < start + DAY);
};
export type Quest = { id: string; title: string; icon: string; value: number; goal: number; xp: number };
/** Three quests per day, picked deterministically from the date. */
export const quests = (s: State, now = Date.now()): Quest[] => {
  const today = onDay(xpEvents(s), now);
  const tasks = today.filter((e) => e.kind === "task");
  const xp = today.reduce((n, e) => n + e.xp, 0);
  const pool: Quest[] = [
    { id: "goal", title: "Hit your daily goal", icon: "flag", value: xp, goal: s.settings.dailyGoal, xp: 10 },
    { id: "three", title: "Complete 3 tasks", icon: "checkmark-done", value: tasks.length, goal: 3, xp: 10 },
    { id: "steps", title: "Finish 5 subtasks", icon: "list", value: today.length - tasks.length, goal: 5, xp: 10 },
    { id: "early", title: "Beat a deadline", icon: "alarm", value: tasks.filter((e) => e.task.dueAt && e.at <= e.task.dueAt).length, goal: 1, xp: 15 },
    { id: "high", title: "Finish a High priority task", icon: "flame", value: tasks.filter((e) => e.task.priority === "High").length, goal: 1, xp: 15 },
    { id: "variety", title: "Work in 2 categories", icon: "color-palette", value: new Set(tasks.map((e) => e.task.category)).size, goal: 2, xp: 10 },
  ];
  const seed = new Date(now).getDate() + new Date(now).getMonth() * 31;
  const daily = [pool[0], pool[1 + (seed % 5)], pool[1 + ((seed + 2) % 5)]];
  return daily.map((q) => ({ ...q, value: Math.min(q.value, q.goal) }));
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
