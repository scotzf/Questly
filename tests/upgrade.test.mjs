import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";
// Saved data as earlier versions wrote it, run through the loader's withDefaults().
const js = ts.transpileModule(fs.readFileSync(new URL("../src/domain.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const d = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const now = new Date(2026, 9, 23, 18, 0).getTime();
const DAY = 86400000;
const load = (saved) => d.withDefaults(JSON.parse(JSON.stringify(saved)));

const v01 = {
  tasks: [
    { id: "a", title: "Essay", description: "", course: "English", priority: "High", dueAt: now + DAY, estimate: 50, steps: [{ id: "s1", title: "Outline", done: true }], completedAt: null, createdAt: now - 5 * DAY, updatedAt: now },
    { id: "b", title: "Laundry", description: "", course: "", priority: "Low", dueAt: null, estimate: 25, steps: [], completedAt: now - DAY, createdAt: now - 2 * DAY, updatedAt: now },
  ],
  slots: [{ id: "x", taskId: "a", start: now + 3600000, end: now + 5100000 }],
  timer: { id: "t", taskId: "a", stepId: null, plannedSeconds: 1500, remainingSeconds: 900, endsAt: null, startedAt: now },
  sessions: [{ id: "t0", taskId: "a", seconds: 1500, endedAt: now - DAY, note: "" }],
  settings: { onboarded: true, name: "Denver", reminders: true, dayStart: 8, dayEnd: 20 },
};
const v03 = {
  tasks: [
    { id: "c", title: "Pitch deck", description: "", course: "", category: "project", priority: "Medium", dueAt: null, reminder: 15, estimate: 25, steps: [{ id: "s2", title: "Slides", done: true, doneAt: now - DAY }], completedAt: now - DAY, createdAt: now - 3 * DAY, updatedAt: now },
    { id: "e", title: "News article", description: "", course: "", category: "journalism", priority: "Low", dueAt: null, reminder: null, estimate: 25, steps: [], completedAt: null, createdAt: now - DAY, updatedAt: now },
  ],
  slots: [],
  settings: { onboarded: true, name: "Denver", reminders: false, notify: { tasks: true, deadlines: false, plan: true, daily: false }, quietStart: 22, quietEnd: 7, dayStart: 9, dayEnd: 18, dailyGoal: 50 },
  shop: { spent: 50, freezes: 1, owned: ["glasses"], outfit: "glasses", frozen: [] },
};
const v04 = {
  ...v03,
  habits: [{ id: "h", title: "Stretch", category: "fitness", days: [0, 1, 2, 3, 4, 5, 6], log: [now - DAY, now], createdAt: now - 3 * DAY }],
  skills: { "fitness.calisthenics": { started: now - 2 * DAY, branch: null, milestones: { m1: now - DAY }, levels: {} } },
  questLog: { [d.dayKey(now)]: ["goal", "tasks2", "plan"] },
};

test("0.1 data: tasks, steps, settings survive; focus-era data is dropped", () => {
  const s = load(v01);
  assert.deepEqual(s.tasks.map((t) => t.id), ["a", "b"]);
  assert.equal(s.tasks[0].title, "Essay");
  assert.equal(s.tasks[0].steps[0].done, true);
  assert.equal(s.tasks[1].completedAt, v01.tasks[1].completedAt);
  assert.equal(s.tasks[0].category, "growth", "no category yet -> default area");
  assert.equal(s.settings.name, "Denver");
  assert.equal(s.settings.dayStart, 8);
  assert.equal(s.settings.dailyGoal, 30);
  assert.equal(s.slots.length, 1);
  assert.equal("timer" in s, false);
  assert.equal("sessions" in s, false);
  assert.deepEqual(s.habits, []);
});
test("0.3 data: old categories map to areas; shop and goal survive", () => {
  const s = load(v03);
  assert.equal(s.tasks.find((t) => t.id === "c").category, "work");
  assert.equal(s.tasks.find((t) => t.id === "e").category, "creative");
  assert.equal(s.settings.dailyGoal, 50);
  assert.equal(s.settings.notify.deadlines, false);
  assert.deepEqual(s.shop, v03.shop);
  assert.equal(d.streak(s, now), 1, "yesterday's completion keeps the streak");
});
test("0.4 data: habits, skills, quests, XP and streak survive", () => {
  const before = load(v04);
  assert.equal(before.habits.length, 1);
  assert.equal(before.skills["fitness.calisthenics"].milestones.m1, now - DAY);
  assert.deepEqual(before.questLog[d.dayKey(now)], ["goal", "tasks2", "plan"]);
  assert.equal(d.streak(before, now), 2);
  // Re-saving and loading again changes nothing.
  const after = load(before);
  assert.deepEqual(after, before);
  assert.equal(d.progress(after).xp, d.progress(before).xp);
});
test("self-reported milestone XP is capped per day; evidence lifts the cap", () => {
  let s = d.initialState();
  const ids = ["m1", "m2", "m3", "m4", "m5"];
  for (const id of ids) s = d.toggleMilestone(s, "fitness.calisthenics", "lx", ["zz"], id, now);
  assert.equal(d.dayXp(s, now), d.MAX_SELF_REPORTED_PER_DAY * d.MILESTONE_XP);
  s = d.setEvidence(s, "fitness.calisthenics", "m5", { at: now, value: 12, unit: "reps" });
  assert.equal(d.dayXp(s, now), (d.MAX_SELF_REPORTED_PER_DAY + 1) * d.MILESTONE_XP);
});
