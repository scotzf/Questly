import assert from "node:assert/strict";
import { test, after } from "node:test";
import fs from "node:fs";
import ts from "typescript";
// Transpile src/skills into tests/.gen (relative imports get ".mjs") and load from there.
const SRC = new URL("../src/skills/", import.meta.url);
const OUT = new URL("./.gen/skills/", import.meta.url);
const transpileDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      transpileDir(new URL(`${entry.name}/`, from), new URL(`${entry.name}/`, to));
    } else if (entry.name.endsWith(".ts")) {
      const js = ts
        .transpileModule(fs.readFileSync(new URL(entry.name, from), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        })
        .outputText.replace(/from "(\.{1,2}\/[^"]+)"/g, 'from "$1.mjs"');
      fs.writeFileSync(new URL(entry.name.replace(/\.ts$/, ".mjs"), to), js);
    }
  }
};
transpileDir(SRC, OUT);
const { TAXONOMY } = await import(new URL("taxonomy.mjs", OUT).href);
const SKILLS = [];
for (const file of fs.readdirSync(new URL("content/", OUT)).filter((f) => f.endsWith(".mjs"))) {
  const mod = await import(new URL(`content/${file}`, OUT).href);
  for (const value of Object.values(mod)) if (Array.isArray(value)) SKILLS.push(...value);
}
const AREAS = ["study", "work", "fitness", "wellness", "creative", "hobbies", "home", "social", "money", "growth"];
const KINDS = ["task", "habit", "session", "duration", "quantity", "assessment"];
const VERIFY = ["self", "count", "timed", "portfolio", "challenge"];
const NEEDS_SAFETY = ["fitness", "wellness", "money"];
test("taxonomy: 35 categories, valid areas, unique ids", () => {
  assert.equal(TAXONOMY.length, 35);
  assert.equal(new Set(TAXONOMY.map((c) => c.id)).size, 35);
  for (const c of TAXONOMY) assert.ok(AREAS.includes(c.area), c.id);
});
test("every skill follows the format", () => {
  assert.ok(SKILLS.length > 0);
  const ids = new Set();
  for (const s of SKILLS) {
    const where = s.id;
    assert.ok(!ids.has(s.id), `duplicate ${where}`);
    ids.add(s.id);
    const cat = TAXONOMY.find((c) => c.id === s.category);
    assert.ok(cat, `${where}: unknown category ${s.category}`);
    assert.ok(s.id.startsWith(`${s.category}.`), `${where}: id must start with category`);
    assert.equal(s.area, cat.area, `${where}: area must match category`);
    assert.ok(cat.skills.includes(s.name), `${where}: "${s.name}" is not in ${cat.name}`);
    assert.ok(s.description.length <= 120, `${where}: description too long`);
    assert.ok(s.benefits.length >= 1, `${where}: needs benefits`);
    assert.ok([1, 2, 3, 4, 5].includes(s.difficulty), `${where}: difficulty`);
    assert.ok(s.duration > 0, `${where}: duration`);
    assert.ok(s.keywords.length >= 3, `${where}: needs 3+ keywords`);
    for (const k of s.keywords) assert.equal(k, k.toLowerCase(), `${where}: keyword "${k}" must be lower-case`);
    if (NEEDS_SAFETY.includes(s.area)) assert.ok(s.safety, `${where}: needs a safety note`);
    assert.ok(s.levels.length >= 1, `${where}: needs a level`);
    const levelIds = new Set();
    const milestoneIds = new Set();
    const practiceIds = new Set();
    const levels = [...s.levels, ...(s.branches ?? []).flatMap((b) => b.levels)];
    for (const l of levels) {
      const at = `${where}/${l.id}`;
      assert.ok(!levelIds.has(l.id), `${at}: duplicate level id`);
      levelIds.add(l.id);
      assert.ok(l.goal.length <= 70, `${at}: goal too long`);
      assert.ok(l.weeks > 0, `${at}: weeks`);
      assert.ok(l.milestones.length >= 1, `${at}: needs a milestone`);
      assert.ok(l.practice.length >= 1, `${at}: needs practice`);
      assert.ok(l.tips.length >= 1, `${at}: needs a tip`);
      for (const m of l.milestones) {
        assert.ok(!milestoneIds.has(m.id), `${at}: duplicate milestone ${m.id}`);
        milestoneIds.add(m.id);
        assert.ok(m.title.length <= 60, `${at}/${m.id}: milestone title too long`);
        assert.ok(VERIFY.includes(m.verify), `${at}/${m.id}: verify`);
      }
      for (const p of l.practice) {
        assert.ok(!practiceIds.has(p.id), `${at}: duplicate practice ${p.id}`);
        practiceIds.add(p.id);
        assert.ok(p.title.length <= 48, `${at}/${p.id}: practice title too long`);
        assert.ok(KINDS.includes(p.kind), `${at}/${p.id}: kind`);
        if (p.perWeek !== undefined) assert.ok(p.perWeek >= 1 && p.perWeek <= 7, `${at}/${p.id}: perWeek`);
      }
    }
  }
  // Prerequisites that look like skill ids must exist.
  for (const s of SKILLS)
    for (const p of s.prerequisites)
      if (/^[a-z]+\.[a-z0-9-]+$/.test(p)) assert.ok(ids.has(p), `${s.id}: unknown prerequisite ${p}`);
});
test("library coverage report", () => {
  const planned = TAXONOMY.reduce((n, c) => n + c.skills.length, 0);
  console.log(`  skills authored: ${SKILLS.length} / ${planned}`);
});

after(() => fs.rmSync(new URL("./.gen/", import.meta.url), { recursive: true, force: true }));
