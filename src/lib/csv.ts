// The sheet as a CSV file: export it, fill it out in Google Sheets or Excel, import it back.
// Each line carries its row ID so it maps back to the same row. Students can also add lines
// with no ID under a section that allows extra rows (Electives, Flex core).

import { COURSE_BY_ID } from "@/data/catalog";
import { DEPTH_BY_ID } from "@/data/depths";
import { SECTIONS } from "@/data/requirements";
import { OTHER, type Plan, type RowState, type Status } from "./plan";
import { allRows, GRADES, resolve, STATUS_LABEL, terms, type SheetRow } from "./sheet";

const HEADER = ["Section", "Requirement", "Course", "Title", "Credits", "Term", "Status", "Grade", "ID"];
const SUBSECTIONS = SECTIONS.flatMap((s) => s.subsections);

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** One line per requirement row. */
export function toCsv(plan: Plan, rows = allRows(plan)): string {
  const title = new Map(SUBSECTIONS.map((sub) => [sub.id, sub.title]));
  const lines = [HEADER];
  for (const row of rows) {
    const state = plan.rows[row.def.id] ?? {};
    const r = resolve(row.def, state);
    lines.push([
      row.depth ? row.depth.depth.name : (title.get(row.subsectionId) ?? ""),
      row.def.label,
      r?.code ?? "",
      r?.title ?? "",
      r ? String(r.credits) : "",
      state.term ?? "",
      STATUS_LABEL[state.status ?? ""],
      state.grade ?? "",
      row.def.id,
    ]);
  }
  return lines.map((l) => l.map(csvCell).join(",")).join("\n") + "\n";
}

/** RFC 4180 parsing: quoted fields, doubled quotes, CRLF, and Excel's byte-order mark. */
export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      out.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    out.push(row);
  }
  return out.filter((r) => r.some((f) => f.trim()));
}

const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const code = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ").replace(/^([A-Z_]+)\s?(\d)/, "$1 $2");

const STATUS_BY_TEXT = new Map<string, Status>();
for (const [value, label] of Object.entries(STATUS_LABEL) as [Status, string][]) {
  STATUS_BY_TEXT.set(key(label), value);
  if (value) STATUS_BY_TEXT.set(key(value.replace("_", " ")), value);
}
STATUS_BY_TEXT.set("waived", "waived");
STATUS_BY_TEXT.set("done", "completed");

const GRADE_BY_TEXT = new Map(GRADES.map((g) => [key(g), g]));
const TERM_BY_TEXT = new Map(terms().map((t) => [key(t), t]));

export interface ImportResult {
  plan: Plan;
  imported: number;
  skipped: string[]; // human-readable reasons, one per skipped line or cell
}

/** Read an edited export back into a plan. Returns null if the file isn't a tracker CSV. */
export function fromCsv(text: string, base: Plan): ImportResult | null {
  const [head, ...lines] = parseCsv(text);
  if (!head) return null;
  const col = (name: string) => head.findIndex((h) => key(h).startsWith(key(name)));
  const c = {
    section: col("section"),
    requirement: col("requirement"),
    course: col("course"),
    credits: col("credits"),
    term: col("term"),
    status: col("status"),
    grade: col("grade"),
    id: col("id"),
  };
  if (c.id < 0 || c.course < 0 || c.status < 0) return null;

  const plan: Plan = { ...base, rows: {}, extra: {}, depths: [] };
  const skipped: string[] = [];
  let imported = 0;
  let fresh = 0;

  for (const [n, line] of lines.entries()) {
    const get = (i: number) => (i >= 0 ? (line[i] ?? "").trim() : "");
    const where = `Line ${n + 2}`;
    let id = get(c.id);

    if (!id) {
      // A new line the student added: allowed under sections that take extra rows.
      const sub = SUBSECTIONS.find((s) => s.addable && key(s.title) === key(get(c.section)));
      if (!sub) {
        if (get(c.course)) skipped.push(`${where}: no ID, and "${get(c.section)}" doesn't take extra rows`);
        continue;
      }
      id = `${sub.id}:xi${(fresh++).toString(36)}`;
    }

    if (id.startsWith("depth:")) {
      const depthId = id.split(":")[1];
      if (!DEPTH_BY_ID.has(depthId)) {
        skipped.push(`${where}: unknown area depth`);
        continue;
      }
      if (!plan.depths.includes(depthId)) plan.depths.push(depthId);
    } else {
      const sub = SUBSECTIONS.find((s) => s.addable && id.startsWith(`${s.id}:x`));
      if (sub) plan.extra[sub.id] = [...(plan.extra[sub.id] ?? []), id];
    }

    const row = allRows(plan).find((r) => r.def.id === id);
    if (!row) {
      skipped.push(`${where}: unknown ID "${id}"`);
      continue;
    }

    const state = rowState(row, get, c, (msg) => skipped.push(`${where} (${row.def.label}): ${msg}`));
    if (Object.keys(state).length) plan.rows[id] = state;
    imported++;
  }

  // Keep added rows only if they hold something, so blank template lines don't pile up.
  for (const [subId, ids] of Object.entries(plan.extra)) {
    plan.extra[subId] = ids.filter((id) => plan.rows[id]);
  }
  return { plan, imported, skipped };
}

function rowState(
  row: SheetRow,
  get: (i: number) => string,
  c: Record<"course" | "credits" | "term" | "status" | "grade", number>,
  skip: (msg: string) => void,
): RowState {
  const { def } = row;
  const state: RowState = {};
  const course = get(c.course);

  if (course && !def.fixed) {
    if (def.freeText) state.text = course;
    else {
      const depth = row.depth?.depth;
      const slot = depth?.slots[row.depth!.slot];
      const choices = [...(def.options ?? []), ...(slot?.related ? depth!.related : [])];
      const match = choices.find((id) => code(COURSE_BY_ID.get(id)?.code ?? id) === code(course) || id === course);
      if (match) state.course = match;
      else if (slot?.related && depth?.otherRelated) {
        state.course = OTHER;
        state.text = course;
      }
      else skip(`"${course}" isn't an option for this row`);
    }
  }

  const term = get(c.term);
  if (term) {
    const t = TERM_BY_TEXT.get(key(term));
    if (t) state.term = t;
    else skip(`term "${term}" not recognized (use e.g. "Fall 2025")`);
  }

  const status = get(c.status);
  if (status) {
    const s = STATUS_BY_TEXT.get(key(status));
    if (s !== undefined) {
      if (s) state.status = s;
    } else skip(`status "${status}" not recognized`);
  }

  const grade = get(c.grade);
  if (grade) {
    const g = GRADE_BY_TEXT.get(key(grade));
    if (g) state.grade = g;
    else skip(`grade "${grade}" not recognized`);
  }

  // Only keep credits that differ from the course's default.
  const credits = get(c.credits);
  if (credits) {
    const n = Number(credits);
    const r = resolve(def, state);
    if (!Number.isFinite(n) || n < 0) skip(`credits "${credits}" isn't a number`);
    else if (r && n !== r.credits) state.credits = n;
  }
  return state;
}
