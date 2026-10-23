import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(
  new URL("../src/domain.ts", import.meta.url),
  "utf8",
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const {
  initialState,
  proposePlan,
  withDefaults,
  streak,
  progress,
  xpByDay,
  dayXp,
  quests,
  taskXp,
  toggleStep,
  taskStatus,
} =
  await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);
const now = new Date(2026, 9, 23, 9, 0).getTime();
const task = (id, estimate, dueAt = null) => ({
  id,
  title: id,
  estimate,
  dueAt,
  priority: "Medium",
  steps: [],
  completedAt: null,
  createdAt: now,
  updatedAt: now,
  description: "",
  course: "",
});
test("planner orders deadlines, uses breaks, and never overlaps", () => {
  const s = initialState();
  s.tasks = [
    task("later", 70, now + 3600000 * 6),
    task("earlier", 50, now + 3600000 * 2),
  ];
  const p = proposePlan(s, now);
  assert.equal(p.slots[0].taskId, "earlier");
  assert.equal(p.slots.length, 5);
  assert.equal(p.unplanned.length, 0);
  p.slots.forEach((x, i) => {
    assert.ok(x.end - x.start <= 25 * 60000);
    if (i) assert.ok(x.start >= p.slots[i - 1].end + 5 * 60000);
  });
  assert.deepEqual(s.slots, []);
});
test("past deadline remains unchanged and is reported", () => {
  const s = initialState();
  s.tasks = [task("past", 30, now - 1)];
  const p = proposePlan(s, now);
  assert.equal(p.slots.length, 0);
  assert.equal(p.unplanned[0].minutes, 30);
  assert.equal(s.tasks[0].dueAt, now - 1);
});
test("insufficient availability is explicit, never extends day", () => {
  const s = initialState();
  s.settings.dayEnd = 10;
  s.tasks = [task("big", 120)];
  const p = proposePlan(s, now);
  assert.equal(p.unplanned[0].minutes, 70);
  assert.ok(p.slots.every((x) => x.end <= now + 3600000));
});
test("completed tasks are excluded from the plan", () => {
  const s = initialState();
  s.tasks = [{ ...task("done", 40), completedAt: now }, task("open", 20)];
  const p = proposePlan(s, now);
  assert.ok(p.slots.every((x) => x.taskId === "open"));
});
test("after study hours all remaining work is reported", () => {
  const s = initialState();
  s.tasks = [task("later", 25)];
  const p = proposePlan(s, new Date(2026, 9, 23, 20).getTime());
  assert.equal(p.slots.length, 0);
  assert.equal(p.unplanned[0].minutes, 25);
});
test("replanning does not overlap a block already in progress", () => {
  const s = initialState();
  s.tasks = [task("new", 25)];
  s.slots = [
    { id: "existing", taskId: "other", start: now - 600000, end: now + 600000 },
  ];
  const p = proposePlan(s, now);
  assert.ok(p.slots[0].start >= now + 900000);
});
test("older saved data gains missing settings and drops focus data", () => {
  const s = withDefaults({
    tasks: [],
    timer: { id: "x" },
    sessions: [{ id: "1" }],
    settings: { onboarded: true, name: "A" },
  });
  assert.equal(s.settings.dayStart, 9);
  assert.equal(s.settings.dailyGoal, 30);
  assert.equal(s.settings.name, "A");
  assert.equal("timer" in s, false);
  assert.equal("sessions" in s, false);
});
test("older tasks gain a category and reminder", () => {
  const { category, reminder, ...old } = { ...task("a", 25), category: "", reminder: 0 };
  const s = withDefaults({ tasks: [old] });
  assert.equal(s.tasks[0].category, "other");
  assert.equal(s.tasks[0].reminder, null);
  assert.equal(s.settings.notify.plan, true);
});
test("task XP rewards priority and beating the deadline", () => {
  assert.equal(taskXp({ ...task("a", 5), priority: "Low", completedAt: now }), 10);
  assert.equal(taskXp({ ...task("a", 5), priority: "High", completedAt: now }), 20);
  assert.equal(
    taskXp({ ...task("a", 5, now + 1000), completedAt: now }),
    20,
    "Medium (+5) and early (+5)",
  );
});
test("streak counts consecutive days with a completion and tolerates an open today", () => {
  const s = initialState();
  const day = 86400000;
  s.tasks = [1, 2, 3].map((n) => ({ ...task(`t${n}`, 5), completedAt: now - n * day }));
  assert.equal(streak(s, now), 3);
  s.tasks.push({ ...task("today", 5), completedAt: now });
  assert.equal(streak(s, now), 4);
});
test("subtasks, quests and levels add up to daily XP", () => {
  let s = initialState();
  s.tasks = [{ ...task("a", 25), steps: [{ id: "s1", title: "x", done: false }] }];
  s = toggleStep(s, "a", "s1", now);
  assert.equal(dayXp(s, now), 3);
  s.tasks[0] = { ...s.tasks[0], completedAt: now };
  // 3 (step) + 15 (Medium task); goal of 30 not yet reached.
  assert.equal(dayXp(s, now), 18);
  assert.equal(quests(s, now).length, 3);
  assert.equal(quests(s, now)[0].id, "goal");
  const week = xpByDay(s, now);
  assert.equal(week.length, 7);
  assert.equal(week.reduce((n, d) => n + d.xp, 0), 18);
  assert.equal(taskStatus(s.tasks[0]), "done");
  assert.equal(progress(s).level, 1);
});
test("streak freezes cover a missed day only when there are enough", async () => {
  const { applyFreezes, buy, balance } = await import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
  );
  const day = 86400000;
  const s = initialState();
  s.tasks = [{ ...task("old", 5), completedAt: now - 2 * day }];
  assert.equal(streak(s, now), 0, "yesterday was missed");
  const one = { ...s, shop: { ...s.shop, freezes: 1 } };
  const saved = applyFreezes(one, now);
  assert.equal(saved.shop.freezes, 0);
  assert.equal(streak(saved, now), 2);
  const none = applyFreezes({ ...s, tasks: [{ ...task("x", 5), completedAt: now - 4 * day }], shop: { ...s.shop, freezes: 1 } }, now);
  assert.equal(none.shop.freezes, 1, "3 missed days, 1 freeze: not spent");
  assert.equal(balance(s), 7, "15 XP -> 7 coins");
  assert.equal(buy(s, "freeze"), s, "can't afford");
});
