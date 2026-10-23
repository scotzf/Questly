import QuestlyWidget from "../modules/questly-widget";
import {
  State,
  balance,
  dayXp,
  progress,
  sortTasks,
  startOfDay,
  streak,
} from "./domain";
/** Pushes today's numbers to the home-screen widget (no-op off Android). */
export function syncWidget(s: State, now = Date.now()) {
  if (!QuestlyWidget) return;
  const next = sortTasks(s.tasks.filter((t) => !t.completedAt))[0];
  void QuestlyWidget.update(
    JSON.stringify({
      streak: streak(s, now),
      coins: balance(s),
      level: progress(s).level,
      xp: dayXp(s, now),
      goal: s.settings.dailyGoal,
      next: next?.title ?? null,
      dayStart: startOfDay(now),
    }),
  ).catch(() => {});
}
