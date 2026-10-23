export type Priority = "Low" | "Medium" | "High";
export type CategoryId = "study" | "project" | "journalism" | "personal" | "other";
export type Step = { id: string; title: string; done: boolean };
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
export type Timer = {
  id: string;
  taskId: string;
  stepId: string | null;
  plannedSeconds: number;
  remainingSeconds: number;
  endsAt: number | null;
  startedAt: number;
};
export type Session = {
  id: string;
  taskId: string;
  seconds: number;
  endedAt: number;
  note: string;
};
export type Settings = {
  onboarded: boolean;
  name: string;
  reminders: boolean;
  notify: { tasks: boolean; deadlines: boolean; focus: boolean; daily: boolean };
  quietStart: number;
  quietEnd: number;
  dayStart: number;
  dayEnd: number;
  focusMinutes: number;
};
export type State = {
  tasks: Task[];
  slots: Slot[];
  timer: Timer | null;
  sessions: Session[];
  settings: Settings;
};
export const initialState = (): State => ({
  tasks: [],
  slots: [],
  timer: null,
  sessions: [],
  settings: {
    onboarded: false,
    name: "",
    reminders: false,
    notify: { tasks: true, deadlines: true, focus: true, daily: false },
    quietStart: 22,
    quietEnd: 7,
    dayStart: 9,
    dayEnd: 18,
    focusMinutes: 25,
  },
});
const taskDefaults = { course: "", category: "other", reminder: null } as const;
/** Fills fields missing from data saved by an older version. */
export const withDefaults = (saved: Partial<State>): State => {
  const base = initialState();
  return {
    ...base,
    ...saved,
    tasks: (saved.tasks ?? []).map((t) => ({ ...taskDefaults, ...t })),
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
            x.id === stepId ? { ...x, done: !x.done } : x,
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
export const remaining = (timer: Timer, now = Date.now()) =>
  timer.endsAt === null
    ? timer.remainingSeconds
    : Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
export const elapsed = (timer: Timer, now = Date.now()) =>
  Math.max(0, timer.plannedSeconds - remaining(timer, now));
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
    const worked = state.sessions
      .filter((s) => s.taskId === task.id)
      .reduce((sum, s) => sum + s.seconds / 60, 0);
    let minutes = Math.max(0, Math.ceil(task.estimate - worked));
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
          task.dueAt !== null && task.dueAt <= now
            ? "Past due"
            : "Out of time",
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
export const taskStatus = (task: Task, sessions: Session[]): TaskStatus =>
  task.completedAt
    ? "done"
    : task.steps.some((s) => s.done) ||
        sessions.some((s) => s.taskId === task.id)
      ? "doing"
      : "todo";
export const stepProgress = (task: Task) =>
  task.steps.length
    ? task.steps.filter((s) => s.done).length / task.steps.length
    : task.completedAt
      ? 1
      : 0;
/** Focus minutes per day for the 7 days of the week containing `now`. */
export const focusByDay = (sessions: Session[], now = Date.now()) =>
  weekDays(now).map((day) => ({
    day,
    minutes: Math.round(
      sessions
        .filter((s) => s.endedAt >= day && s.endedAt < day + DAY)
        .reduce((n, s) => n + s.seconds, 0) / 60,
    ),
  }));
const activeDays = (s: State) =>
  new Set([
    ...s.sessions.map((x) => dayKey(x.endedAt)),
    ...s.tasks.filter((t) => t.completedAt).map((t) => dayKey(t.completedAt!)),
  ]);
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
export const categoryMinutes = (s: State) => {
  const totals: Partial<Record<CategoryId, number>> = {};
  for (const x of s.sessions) {
    const cat = s.tasks.find((t) => t.id === x.taskId)?.category ?? "other";
    totals[cat] = (totals[cat] ?? 0) + x.seconds / 60;
  }
  return totals;
};
export const XP_PER_LEVEL = 500;
export const progress = (s: State) => {
  const minutes = s.sessions.reduce((n, x) => n + x.seconds, 0) / 60;
  const done = s.tasks.filter((t) => t.completedAt).length;
  const steps = s.tasks.reduce(
    (n, t) => n + t.steps.filter((x) => x.done).length,
    0,
  );
  const xp = Math.floor(minutes + done * 20 + steps * 5);
  return {
    xp,
    coins: xp,
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
  };
};
export type Achievement = {
  id: string;
  title: string;
  icon: string;
  value: number;
  goal: number;
};
export const achievements = (s: State): Achievement[] => {
  const done = s.tasks.filter((t) => t.completedAt).length;
  const longest = Math.max(0, ...s.sessions.map((x) => x.seconds / 60));
  const hours = s.sessions.reduce((n, x) => n + x.seconds, 0) / 3600;
  return [
    { id: "first", title: "First Focus", icon: "flash", value: s.sessions.length, goal: 1 },
    { id: "streak", title: "7-Day Streak", icon: "flame", value: bestStreak(s), goal: 7 },
    { id: "deep", title: "Deep Diver", icon: "water", value: Math.floor(longest), goal: 50 },
    { id: "tasks", title: "Task Master", icon: "trophy", value: done, goal: 50 },
    { id: "hours", title: "10 Hours", icon: "time", value: Math.floor(hours), goal: 10 },
  ].map((a) => ({ ...a, value: Math.min(a.value, a.goal) }));
};
export const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};
