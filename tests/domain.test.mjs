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
  remaining,
  elapsed,
  withDefaults,
  streak,
  progress,
  focusByDay,
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
test("completed tasks and already recorded effort are excluded", () => {
  const s = initialState();
  s.tasks = [{ ...task("done", 60), completedAt: now }, task("worked", 60)];
  s.sessions = [
    { id: "session", taskId: "worked", seconds: 2400, endedAt: now, note: "" },
  ];
  const p = proposePlan(s, now);
  assert.equal(p.slots.length, 1);
  assert.equal(p.slots[0].end - p.slots[0].start, 20 * 60000);
});
test("timer recovers after backgrounding and clamps after deadline", () => {
  const timer = {
    plannedSeconds: 1500,
    remainingSeconds: 1500,
    endsAt: now + 1500000,
  };
  assert.equal(remaining(timer, now + 900000), 600);
  assert.equal(elapsed(timer, now + 900000), 900);
  assert.equal(remaining(timer, now + 2000000), 0);
  assert.equal(elapsed(timer, now + 2000000), 1500);
});
test("paused timer does not lose time while app is closed", () => {
  const timer = { plannedSeconds: 1500, remainingSeconds: 800, endsAt: null };
  assert.equal(remaining(timer, now + 999999999), 800);
  assert.equal(elapsed(timer, now + 999999999), 700);
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
test("older saved data gains missing settings and fields", () => {
  const s = withDefaults({ tasks: [], settings: { onboarded: true, name: "A" } });
  assert.equal(s.settings.dayStart, 9);
  assert.equal(s.settings.name, "A");
  assert.deepEqual(s.sessions, []);
  assert.equal(s.timer, null);
});
test("older tasks gain a category and reminder", () => {
  const { category, reminder, ...old } = { ...task("a", 25), category: "", reminder: 0 };
  const s = withDefaults({ tasks: [old] });
  assert.equal(s.tasks[0].category, "other");
  assert.equal(s.tasks[0].reminder, null);
  assert.equal(s.settings.notify.tasks, true);
});
test("streak counts consecutive active days and tolerates an open today", () => {
  const s = initialState();
  const day = 86400000;
  s.sessions = [1, 2, 3].map((n) => ({
    id: String(n),
    taskId: "a",
    seconds: 600,
    endedAt: now - n * day,
    note: "",
  }));
  assert.equal(streak(s, now), 3);
  s.sessions.push({ id: "t", taskId: "a", seconds: 60, endedAt: now, note: "" });
  assert.equal(streak(s, now), 4);
});
test("xp, level and week chart come from sessions and completions", () => {
  const s = initialState();
  s.tasks = [{ ...task("a", 25), completedAt: now }];
  s.sessions = [{ id: "1", taskId: "a", seconds: 600 * 60, endedAt: now, note: "" }];
  const p = progress(s);
  assert.equal(p.xp, 620);
  assert.equal(p.level, 2);
  assert.equal(p.levelXp, 120);
  const week = focusByDay(s.sessions, now);
  assert.equal(week.length, 7);
  assert.equal(week.reduce((n, d) => n + d.minutes, 0), 600);
  assert.equal(taskStatus(s.tasks[0], s.sessions), "done");
});
