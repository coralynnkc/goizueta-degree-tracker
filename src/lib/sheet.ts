// Pure functions that turn the requirement data plus a Plan into what the sheet shows:
// the row list, resolved courses, GPA, credit totals and rule warnings. No React here,
// so all of it is unit-testable.

import { COURSES, COURSE_BY_ID, type Course } from "@/data/catalog";
import { DEPTH_BY_ID, type Depth } from "@/data/depths";
import { REPEATABLE, SECTIONS, type RowDef, type Subsection } from "@/data/requirements";
import { OTHER, type Plan, type RowState, type Status } from "./plan";

// ---------- rows ----------

export interface SheetRow {
  def: RowDef;
  sectionId: string;
  subsectionId: string;
  removable?: boolean;
  depth?: { depth: Depth; slot: number };
}

export function extraRowDef(sub: Subsection, rowId: string, n: number): RowDef {
  const a = sub.addable!;
  return {
    id: rowId,
    label: `${a.label} ${n}`,
    options: a.options,
    freeText: a.freeText,
    defaultCredits: a.defaultCredits,
  };
}

export function depthRowId(depthId: string, slot: number) {
  return `depth:${depthId}:${slot}`;
}

export function depthSlotDef(depth: Depth, slot: number): RowDef {
  const s = depth.slots[slot];
  return { id: depthRowId(depth.id, slot), label: s.label, options: s.options };
}

/** Every row on the sheet, in display order. */
export function allRows(plan: Plan): SheetRow[] {
  const rows: SheetRow[] = [];
  for (const section of SECTIONS) {
    for (const sub of section.subsections) {
      for (const def of sub.rows) rows.push({ def, sectionId: section.id, subsectionId: sub.id });
      (plan.extra[sub.id] ?? []).forEach((id, i) =>
        rows.push({
          def: extraRowDef(sub, id, sub.rows.length + i + 1),
          sectionId: section.id,
          subsectionId: sub.id,
          removable: true,
        }),
      );
    }
  }
  for (const id of plan.depths) {
    const depth = DEPTH_BY_ID.get(id);
    if (!depth) continue;
    depth.slots.forEach((_, slot) =>
      rows.push({ def: depthSlotDef(depth, slot), sectionId: "depth", subsectionId: `depth:${id}`, depth: { depth, slot } }),
    );
  }
  return rows;
}

// ---------- courses ----------

export interface Resolved {
  key: string; // identity for de-duplication; repeatable courses are unique per row
  code: string;
  title: string;
  credits: number;
  business: boolean;
  immersive: boolean;
  note?: string;
  known: boolean; // found in the catalog
}

const normalize = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ").replace(/^([A-Z_]+)\s?(\d)/, "$1 $2");

const BY_CODE = new Map<string, Course>();
for (const c of COURSES) if (!BY_CODE.has(c.code)) BY_CODE.set(c.code, c);

function fromCourse(c: Course, rowId: string, state: RowState): Resolved {
  return {
    key: REPEATABLE.has(c.code) ? `${c.id}@${rowId}` : c.id,
    code: c.code,
    title: c.title,
    credits: state.credits ?? c.credits,
    business: c.business,
    immersive: c.immersive,
    note: c.note,
    known: true,
  };
}

function fromText(text: string, def: RowDef, state: RowState, business: boolean | null): Resolved | null {
  const code = normalize(text);
  if (!code) return null;
  const known = COURSE_BY_ID.get(code) ?? BY_CODE.get(code);
  if (known && business !== false) return fromCourse(known, def.id, state);
  const subject = code.split(" ")[0];
  return {
    key: code,
    code,
    title: "",
    credits: state.credits ?? def.defaultCredits ?? 3,
    business: business ?? ["ACT", "FIN", "ISOM", "MKT", "OAM", "BUS"].includes(subject),
    immersive: false,
    known: false,
  };
}

export function resolve(def: RowDef, state: RowState = {}): Resolved | null {
  if (def.fixed) return fromCourse(COURSE_BY_ID.get(def.fixed)!, def.id, state);
  if (def.freeText) return fromText(state.text ?? "", def, state, null);
  if (!state.course) return null;
  // An advisor-approved course outside Goizueta never counts as a business elective.
  if (state.course === OTHER) return fromText(state.text ?? "", def, state, false);
  const c = COURSE_BY_ID.get(state.course);
  return c ? fromCourse(c, def.id, state) : null;
}

// ---------- status, GPA, credits ----------

export const GRADE_POINTS: Record<string, number> = {
  A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, "C-": 1.7, "D+": 1.3, D: 1, F: 0,
};
export const GRADES = [...Object.keys(GRADE_POINTS), "S", "U", "P", "W", "AP/IB", "Transfer"];

export const isDone = (s?: Status) => s === "completed" || s === "waived";
export const isCounted = (s?: Status) => s === "completed" || s === "in_progress" || s === "planned";

export interface Totals {
  gpa: number | null;
  gradedCredits: number;
  gradedCourses: number;
  businessGpa: number | null;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
}

export function totals(plan: Plan, rows = allRows(plan)): Totals {
  const seen = new Set<string>();
  let pts = 0, cr = 0, bPts = 0, bCr = 0, n = 0;
  const t = { completedCredits: 0, inProgressCredits: 0, plannedCredits: 0 };
  for (const { def } of rows) {
    const state = plan.rows[def.id] ?? {};
    const r = resolve(def, state);
    if (!r || seen.has(r.key)) continue;
    if (state.status === "completed") t.completedCredits += r.credits;
    else if (state.status === "in_progress") t.inProgressCredits += r.credits;
    else if (state.status === "planned") t.plannedCredits += r.credits;
    else continue; // not started / waived rows don't claim the course
    seen.add(r.key);
    const gp = state.grade !== undefined ? GRADE_POINTS[state.grade] : undefined;
    if (gp !== undefined && r.credits > 0) {
      pts += gp * r.credits;
      cr += r.credits;
      n++;
      if (r.business) {
        bPts += gp * r.credits;
        bCr += r.credits;
      }
    }
  }
  return {
    gpa: cr ? pts / cr : null,
    gradedCredits: cr,
    gradedCourses: n,
    businessGpa: bCr ? bPts / bCr : null,
    ...t,
  };
}

// ---------- warnings ----------

export type Warnings = Map<string, string[]>; // row id -> messages

const add = (w: Warnings, id: string, msg: string) => w.set(id, [...(w.get(id) ?? []), msg]);

/** A course may only fill one requirement row, except GER rows (which double count by policy),
 * repeatable courses, and one "bridge" course shared by two area depths. */
export function rowWarnings(plan: Plan, rows = allRows(plan)): Warnings {
  const w: Warnings = new Map();
  const uses = new Map<string, SheetRow[]>();
  for (const row of rows) {
    if (row.sectionId === "ger") continue;
    const r = resolve(row.def, plan.rows[row.def.id]);
    if (!r) continue;
    uses.set(r.key, [...(uses.get(r.key) ?? []), row]);
  }
  let bridges = 0;
  for (const [, list] of uses) {
    if (list.length < 2) continue;
    const depthsUsed = new Set(list.map((r) => r.depth?.depth.id));
    const isBridge = list.length === 2 && list.every((r) => r.depth) && depthsUsed.size === 2;
    if (isBridge && bridges === 0) {
      bridges++;
      for (const r of list) add(w, r.def.id, "Bridge course: counts toward both depths");
      continue;
    }
    for (const r of list) {
      const others = list.filter((o) => o !== r).map((o) => o.def.label);
      add(w, r.def.id, `Also used for ${others.join(", ")}`);
    }
  }

  const coreOam = plan.rows["bba:oam"]?.course;
  for (const row of rows) {
    if (row.subsectionId === "bba-flex" && plan.rows[row.def.id]?.course && plan.rows[row.def.id]?.course === coreOam)
      add(w, row.def.id, "Already your functional core OAM course");
  }
  return w;
}

export interface DepthCheck {
  ok: boolean;
  text: string;
}

function chosenFlexCore(plan: Plan): string[] {
  const ids = ["bba:flex1", "bba:flex2", ...(plan.extra["bba-flex"] ?? [])];
  return ids.map((id) => plan.rows[id]?.course).filter((c): c is string => !!c);
}

export function depthChecks(plan: Plan, depth: Depth): DepthCheck[] {
  const checks: DepthCheck[] = [];
  const flex = chosenFlexCore(plan);
  const core = plan.rows["bba:oam"]?.course;

  if (depth.flexCore) {
    const fc = depth.flexCore;
    const ok = fc.all
      ? fc.courses.every((c) => flex.includes(c) || core === c)
      : fc.courses.some((c) => flex.includes(c));
    const names = fc.courses.map((c) => COURSE_BY_ID.get(c)?.code ?? c).join(fc.all ? " and " : " or ");
    checks.push({ ok, text: ok ? `Flex core ${names} is on your sheet` : `Needs flex core ${names}` });
  }

  const states = depth.slots.map((_, i) => plan.rows[depthRowId(depth.id, i)] ?? {});
  const resolved = depth.slots.map((_, i) => resolve(depthSlotDef(depth, i), states[i]));
  const relatedSet = new Set(depth.related);
  const relatedUsed = states.filter((s) => s.course && (s.course === OTHER || relatedSet.has(s.course))).length;
  if (relatedUsed > 1) checks.push({ ok: false, text: `${relatedUsed} related courses used; only one may count` });

  for (const limit of depth.limits) {
    const subjects = limit.slots
      .map((i) => (resolved[i] && states[i].course !== OTHER ? resolved[i]!.code.split(" ")[0] : null))
      .filter((s): s is string => !!s);
    const count = (s: string) => subjects.filter((x) => x === s).length;
    if (limit.maxFrom && count(limit.maxFrom.subject) > limit.maxFrom.n)
      checks.push({ ok: false, text: `At most ${limit.maxFrom.n} ${limit.maxFrom.subject} course here` });
    if (limit.maxPerSubject) {
      const over = [...new Set(subjects)].filter(
        (s) => s !== limit.maxPerSubject!.except && count(s) > limit.maxPerSubject!.n,
      );
      for (const s of over) checks.push({ ok: false, text: `At most ${limit.maxPerSubject.n} ${s} courses` });
    }
  }

  const filled = resolved.filter(Boolean).length;
  const done = states.filter((s, i) => resolved[i] && s.status === "completed").length;
  checks.push({
    ok: filled === depth.slots.length,
    text: `${filled} of ${depth.slots.length} courses chosen, ${done} completed`,
  });
  return checks;
}

export interface ElectiveTally {
  counted: number; // business electives planned, in progress or completed
  completed: number;
  immersive: { planned: boolean; completed: boolean };
}

/** The six-business-electives and one-immersive rules, over depth slots and added elective rows. */
export function electiveTally(plan: Plan, rows = allRows(plan)): ElectiveTally {
  const counted = new Set<string>();
  const completed = new Set<string>();
  const imm = { planned: false, completed: false };
  for (const row of rows) {
    if (!row.depth && !(row.subsectionId === "bba-electives" && row.removable)) continue;
    const state = plan.rows[row.def.id] ?? {};
    const r = resolve(row.def, state);
    if (!r || !r.business || !isCounted(state.status)) continue;
    counted.add(r.key);
    if (state.status === "completed") completed.add(r.key);
    if (r.immersive) {
      imm.planned = true;
      if (state.status === "completed") imm.completed = true;
    }
  }
  return { counted: counted.size, completed: completed.size, immersive: imm };
}

/** Rows done (completed or waived) out of rows on the sheet, for a section or subsection. */
export function progress(plan: Plan, rows: SheetRow[]) {
  return { done: rows.filter((r) => isDone(plan.rows[r.def.id]?.status)).length, total: rows.length };
}

export function terms(): string[] {
  const out = ["AP / transfer"];
  for (let y = 2022; y <= 2030; y++) out.push(`Spring ${y}`, `Summer ${y}`, `Fall ${y}`);
  return out;
}
