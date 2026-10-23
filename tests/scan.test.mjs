import assert from "node:assert/strict";
import { test, after } from "node:test";
import fs from "node:fs";
import ts from "typescript";
// Transpile next to this file so the bare `chrono-node` import resolves.
const out = new URL("./.scan.generated.mjs", import.meta.url);
fs.writeFileSync(
  out,
  ts.transpileModule(fs.readFileSync(new URL("../src/scan.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
const { parseScan } = await import(out.href);
after(() => fs.rmSync(out, { force: true }));
const now = new Date(2026, 9, 23, 10, 0); // Fri 23 Oct 2026
const line = (text, top, height = 20, left = 20) => ({ text, top, left, height });
test("classroom activity: title, due date with time, numbered subtasks", () => {
  const d = parseScan(
    [
      line("9:41", 0, 14),
      line("Activity 3: Sorting Algorithms", 60, 34),
      line("Due Oct 30, 11:59 PM", 110),
      line("Instructions", 150),
      line("1. Read chapter 4 on merge sort", 190),
      line("2. Implement bubble sort and", 220),
      line("quicksort in Python", 245, 20, 48),
      line("3. Submit a short report", 275),
    ],
    now,
  );
  assert.equal(d.title, "Activity 3: Sorting Algorithms");
  assert.equal(d.category, "study");
  const due = new Date(d.dueAt);
  assert.equal(due.getMonth(), 9);
  assert.equal(due.getDate(), 30);
  assert.equal(due.getHours(), 23);
  assert.equal(due.getMinutes(), 59);
  assert.deepEqual(d.steps, [
    "Read chapter 4 on merge sort",
    "Implement bubble sort and quicksort in Python",
    "Submit a short report",
  ]);
});
test("chat message with weekday deadline and no time", () => {
  const d = parseScan(
    [
      line("Group 2", 10, 18),
      line("Guys the project proposal deck is due on Friday", 50),
      line("- slides 1-5 Ana", 80),
      line("- budget slide Ben", 105),
    ],
    now,
  );
  assert.equal(d.category, "work");
  const due = new Date(d.dueAt);
  assert.ok(due.getTime() > now.getTime(), "deadline is in the future");
  assert.equal(due.getDay(), 5);
  assert.equal(d.steps.length, 2);
});
test("no date and no bullets still yields a task", () => {
  const d = parseScan([line("Buy groceries for the week", 10, 30)], now);
  assert.equal(d.title, "Buy groceries for the week");
  assert.equal(d.dueAt, null);
  assert.equal(d.category, "home");
  assert.deepEqual(d.steps, []);
});
