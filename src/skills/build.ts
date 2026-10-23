import type { Level, PracticeKind, Verify } from "./types";
/** [title, target amount?, unit?, verify?] — a target defaults verify to "count". */
export type M = [title: string, amount?: number, unit?: string, verify?: Verify];
/** [title, minutes?, perWeek?, kind?] — kind defaults from perWeek and minutes. */
export type P = [title: string, minutes?: number, perWeek?: number, kind?: PracticeKind];
/**
 * Compact level builder for the content library. Milestone and practice ids are
 * prefixed with the level id, so they stay unique across a skill's levels.
 */
export const level = (
  id: string,
  name: string,
  goal: string,
  weeks: number,
  milestones: M[],
  practice: P[],
  tips: string[],
  mistakes: string[],
): Level => ({
  id,
  name,
  goal,
  weeks,
  milestones: milestones.map(([title, amount, unit, verify], i) => ({
    id: `${id}m${i + 1}`,
    title,
    verify: verify ?? (amount ? "count" : "self"),
    ...(amount ? { target: { amount, unit: unit ?? "times" } } : {}),
  })),
  practice: practice.map(([title, minutes, perWeek, kind], i) => ({
    id: `${id}p${i + 1}`,
    title,
    kind: kind ?? (perWeek ? ((minutes ?? 0) >= 30 ? "session" : "habit") : "task"),
    ...(minutes ? { minutes } : {}),
    ...(perWeek ? { perWeek } : {}),
  })),
  tips,
  mistakes,
});
