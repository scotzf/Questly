import * as chrono from "chrono-node";
import type { CategoryId } from "./domain";
export type ScanLine = { text: string; top: number; left: number; height: number };
export type ScanDraft = {
  title: string;
  description: string;
  dueAt: number | null;
  category: CategoryId;
  steps: string[];
};
const BULLET = /^\s*(?:\d{1,2}[.)]|[a-hA-H][.)]|[-–•*▪●○◦►✓☐□]|\[\s?\])\s+/;
const DUE_HINT = /\b(due|deadline|submit|submission|until|before|by|on)\b/i;
const CONCRETE =
  /\d|\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b(today|tomorrow|tonight|noon|midnight)\b/i;
const JUNK = /^(?:\d{1,2}:\d{2}(?:\s?[ap]m)?|\d{1,3}%|[\W_]+)$/i;
const CATEGORY_WORDS: [CategoryId, RegExp][] = [
  ["journalism", /\b(article|news|interview|editorial|feature story|publication|press|headline|layout|byline)\b/i],
  ["project", /\b(project|meeting|presentation|deploy|sprint|repo|client|proposal|demo|prototype|capstone)\b/i],
  ["study", /\b(quiz|exam|essay|homework|assignment|module|lesson|chapter|lab|reading|activity|seatwork|research|thesis|reviewer|lecture|course|class|worksheet|problem set)\b/i],
  ["personal", /\b(buy|gym|pay|bill|doctor|birthday|grocer\w*|clean|laundry|family|appointment)\b/i],
];
/** Fraction of `line` covered by date text, e.g. "Due: Oct 30, 11:59 PM" ≈ 1. */
const dateShare = (line: string, now: Date) =>
  chrono.parse(line, now).reduce((n, r) => n + r.text.length, 0) /
  Math.max(1, line.replace(/\b(due|deadline|date|submit\w*)\b[:\s]*/gi, "").length);
export function findDue(lines: string[], now = new Date()): number | null {
  const hits = lines.flatMap((line) =>
    chrono
      .parse(line, now, { forwardDate: true })
      // Vague spans like "this week" are not deadlines; require a named day.
      .filter((r) => CONCRETE.test(r.text))
      .map((r) => ({ r, hinted: DUE_HINT.test(line) })),
  );
  const pick = hits.find((h) => h.hinted) ?? hits[0];
  if (!pick) return null;
  const d = pick.r.start.date();
  if (!pick.r.start.isCertain("hour")) d.setHours(23, 59, 0, 0);
  return d.getTime();
}
export function parseScan(raw: ScanLine[], now = new Date()): ScanDraft {
  const lines = raw
    .map((l) => ({ ...l, text: l.text.trim() }))
    .filter((l) => l.text && !JUNK.test(l.text))
    .sort((a, b) => a.top - b.top || a.left - b.left);
  const texts = lines.map((l) => l.text);
  // Steps: bullet / numbered lines, plus indented continuation lines.
  const steps: string[] = [];
  const used = new Set<number>();
  let bulletLeft = -1;
  lines.forEach((l, i) => {
    if (BULLET.test(l.text)) {
      steps.push(l.text.replace(BULLET, "").trim());
      bulletLeft = l.left;
      used.add(i);
    } else if (steps.length && bulletLeft >= 0 && l.left > bulletLeft + 8 && i - 1 >= 0 && used.has(i - 1)) {
      steps[steps.length - 1] += ` ${l.text}`;
      used.add(i);
    } else {
      bulletLeft = -1;
    }
  });
  // Title: the tallest early line that is not a step, a date, or a label.
  const candidates = lines
    .map((l, i) => ({ l, i }))
    .filter(({ l, i }) => !used.has(i) && l.text.length >= 3 && dateShare(l.text, now) < 0.6)
    .slice(0, 6);
  const best = candidates.reduce<(typeof candidates)[number] | null>(
    (top, c) => (!top || c.l.height > top.l.height * 1.15 ? c : top),
    null,
  );
  const title = (best?.l.text ?? texts[0] ?? "Scanned task").replace(/[:\-–\s]+$/, "").slice(0, 80);
  if (best) used.add(best.i);
  const all = texts.join(" ");
  const category = CATEGORY_WORDS.find(([, re]) => re.test(all))?.[0] ?? "other";
  const description = lines
    .filter((_, i) => !used.has(i))
    .map((l) => l.text)
    .join("\n")
    .slice(0, 600);
  return {
    title,
    description,
    dueAt: findDue(texts, now),
    category,
    steps: steps.map((x) => x.slice(0, 120)).filter(Boolean).slice(0, 12),
  };
}
