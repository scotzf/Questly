/**
 * Skill library format: Area → Category → Skill → Level / Branch →
 * Milestone + Practice → Task / Habit. Content files only `import type`
 * from here so tests can load them without the app runtime.
 */
export type AreaId =
  | "study"
  | "work"
  | "fitness"
  | "wellness"
  | "creative"
  | "hobbies"
  | "home"
  | "social"
  | "money"
  | "growth";
/** How a practice is done; drives which "add" buttons a practice offers. */
export type PracticeKind =
  | "task" // one-time
  | "habit" // recurring check-in
  | "session" // scheduled block, usually recurring
  | "duration" // measured in minutes
  | "quantity" // measured in reps, pages, items…
  | "assessment"; // a test of a milestone
export type Amount = { amount: number; unit: string };
export type Practice = {
  id: string;
  /** Short action, ≤ 48 chars: "Knee push-ups 3×8". */
  title: string;
  kind: PracticeKind;
  /** Typical minutes per session. */
  minutes?: number;
  target?: Amount;
  /** Recommended sessions per week (makes it addable as a habit). */
  perWeek?: number;
  /** Easier or equipment-free option. */
  alternative?: string;
};
/** How a milestone is demonstrated. Verification is self-reported for now. */
export type Verify = "self" | "count" | "timed" | "portfolio" | "challenge";
export type Milestone = {
  id: string;
  /** Measurable achievement, ≤ 60 chars: "10 push-ups in a row". */
  title: string;
  verify: Verify;
  target?: Amount;
};
export type Level = {
  id: string;
  name: string;
  /** One-line target for the level. */
  goal: string;
  /** Typical weeks to reach it with regular practice. */
  weeks: number;
  milestones: Milestone[];
  practice: Practice[];
  tips: string[];
  mistakes: string[];
};
/** A specialization after the main levels; users pick one, not all. */
export type Branch = { id: string; name: string; icon: string; levels: Level[] };
export type Skill = {
  /** "<categoryId>.<slug>" */
  id: string;
  area: AreaId;
  /** One of TAXONOMY's category ids. */
  category: string;
  name: string;
  /** Ionicons name. */
  icon: string;
  /** One sentence. */
  description: string;
  benefits: string[];
  /** Skill ids or short plain-text requirements. */
  prerequisites: string[];
  /** 1 (easy start) … 5 (demanding). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Typical minutes per practice session. */
  duration: number;
  /** How progress is shown overall: "Max push-ups", "Portfolio of 10 photos". */
  verification: string;
  /** Lower-case words that auto-detect this skill's area in titles and scans. */
  keywords: string[];
  levels: Level[];
  branches?: Branch[];
  /** Book titles, course names or search terms — no URLs. */
  resources?: string[];
  /** Shown for fitness, health, money and similar skills. */
  safety?: string;
};
export type Category = {
  id: string;
  name: string;
  area: AreaId;
  icon: string;
  /** Planned skills (names) from the master list. */
  skills: string[];
};
