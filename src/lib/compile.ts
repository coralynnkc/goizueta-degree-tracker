// Turns the four authoring CSVs into a validated Bundle.
// Errors name the file and spreadsheet row (header = row 1) so the people
// doing data entry can fix them without reading code.

import Papa from "papaparse";
import type { Bundle, Course, Program, Requirement, RuleKind } from "./types";

export interface CsvFiles {
  programs: string;
  courses: string;
  requirements: string;
  requirementCourses: string;
}

type Row = Record<string, string>;

const RULE_KINDS: RuleKind[] = ["all", "count", "credits"];

const COLUMNS = {
  programs: ["id", "name", "degree_type", "school", "catalog_year"],
  courses: ["id", "subject", "number", "title", "credits"],
  requirements: [
    "id",
    "program_id",
    "parent_id",
    "label",
    "rule_kind",
    "threshold",
    "allow_shared",
    "display_order",
    "source",
    "signed_off_by",
  ],
  requirementCourses: ["requirement_id", "course_id"],
} as const;

export const FILE_NAMES: Record<keyof CsvFiles, string> = {
  programs: "programs.csv",
  courses: "courses.csv",
  requirements: "requirements.csv",
  requirementCourses: "requirement_courses.csv",
};

export class ValidationError extends Error {
  constructor(public problems: string[]) {
    super(`${problems.length} problem(s) in requirement data:\n  ${problems.join("\n  ")}`);
  }
}

export function compileBundle(files: CsvFiles): Bundle {
  const problems: string[] = [];
  const at = (file: keyof CsvFiles, i: number) => `${FILE_NAMES[file]} row ${i + 2}`;

  const parse = (file: keyof CsvFiles): Row[] => {
    const res = Papa.parse<Row>(files[file], {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      transform: (v) => v.trim(),
    });
    for (const e of res.errors) problems.push(`${FILE_NAMES[file]}: ${e.message}`);
    const missing = COLUMNS[file].filter((c) => !res.meta.fields?.includes(c));
    if (missing.length) problems.push(`${FILE_NAMES[file]}: missing column(s) ${missing.join(", ")}`);
    return res.data;
  };

  const uniqueIds = (file: keyof CsvFiles, rows: Row[]) => {
    const seen = new Set<string>();
    rows.forEach((r, i) => {
      if (!r.id) problems.push(`${at(file, i)}: id is empty`);
      else if (seen.has(r.id)) problems.push(`${at(file, i)}: duplicate id "${r.id}"`);
      seen.add(r.id);
    });
  };

  const programRows = parse("programs");
  const courseRows = parse("courses");
  const reqRows = parse("requirements");
  const linkRows = parse("requirementCourses");
  uniqueIds("programs", programRows);
  uniqueIds("courses", courseRows);
  uniqueIds("requirements", reqRows);

  const programs: Program[] = programRows.map((r) => ({
    id: r.id,
    name: r.name,
    degreeType: r.degree_type,
    school: r.school,
    catalogYear: r.catalog_year,
  }));

  const courses: Course[] = courseRows.map((r, i) => {
    const credits = Number(r.credits);
    if (!Number.isFinite(credits) || credits <= 0)
      problems.push(`${at("courses", i)}: credits "${r.credits}" is not a positive number`);
    return { id: r.id, subject: r.subject, number: r.number, title: r.title, credits };
  });

  const programIds = new Set(programs.map((p) => p.id));
  const courseIds = new Set(courses.map((c) => c.id));

  const requirements: Requirement[] = reqRows.map((r, i) => {
    const where = at("requirements", i);
    if (!programIds.has(r.program_id)) problems.push(`${where}: unknown program_id "${r.program_id}"`);
    if (!RULE_KINDS.includes(r.rule_kind as RuleKind))
      problems.push(`${where}: rule_kind must be one of ${RULE_KINDS.join(", ")}, got "${r.rule_kind}"`);

    let threshold: number | null = null;
    if (r.rule_kind === "count" || r.rule_kind === "credits") {
      threshold = Number(r.threshold);
      if (!r.threshold || !Number.isFinite(threshold) || threshold <= 0)
        problems.push(`${where}: rule_kind "${r.rule_kind}" needs a positive threshold`);
    } else if (r.threshold) {
      problems.push(`${where}: rule_kind "all" should leave threshold blank`);
    }

    const shared = r.allow_shared.toLowerCase();
    if (!["", "true", "false", "yes", "no"].includes(shared))
      problems.push(`${where}: allow_shared must be true/false, got "${r.allow_shared}"`);
    if (!r.source) problems.push(`${where}: source is empty (cite the catalog page or audit)`);

    return {
      id: r.id,
      programId: r.program_id,
      parentId: r.parent_id || null,
      label: r.label,
      ruleKind: r.rule_kind as RuleKind,
      threshold,
      allowShared: shared === "true" || shared === "yes",
      displayOrder: Number(r.display_order) || 0,
      source: r.source,
      signedOffBy: r.signed_off_by,
      courseIds: [],
    };
  });

  const byId = new Map(requirements.map((r) => [r.id, r]));

  requirements.forEach((req, i) => {
    const where = at("requirements", i);
    if (req.parentId === null) return;
    const parent = byId.get(req.parentId);
    if (!parent) problems.push(`${where}: unknown parent_id "${req.parentId}"`);
    else if (parent.programId !== req.programId)
      problems.push(`${where}: parent "${parent.id}" belongs to a different program`);
  });

  // A cycle in parent_id would hang any tree walk, so reject it here.
  for (const req of requirements) {
    const path = new Set<string>();
    let cur: Requirement | undefined = req;
    while (cur && cur.parentId) {
      if (path.has(cur.id)) {
        problems.push(`requirements.csv: parent_id cycle through "${req.id}"`);
        break;
      }
      path.add(cur.id);
      cur = byId.get(cur.parentId);
    }
  }

  linkRows.forEach((r, i) => {
    const where = at("requirementCourses", i);
    const req = byId.get(r.requirement_id);
    if (!req) return problems.push(`${where}: unknown requirement_id "${r.requirement_id}"`);
    if (!courseIds.has(r.course_id)) return problems.push(`${where}: unknown course_id "${r.course_id}"`);
    if (req.courseIds.includes(r.course_id))
      return problems.push(`${where}: "${r.course_id}" listed twice under "${req.id}"`);
    req.courseIds.push(r.course_id);
  });

  const hasChildren = new Set(requirements.map((r) => r.parentId).filter(Boolean));
  requirements.forEach((req, i) => {
    const where = at("requirements", i);
    const isLeaf = !hasChildren.has(req.id);
    if (isLeaf && req.courseIds.length === 0)
      problems.push(`${where}: "${req.id}" has no children and no courses in requirement_courses.csv`);
    if (!isLeaf && req.courseIds.length > 0)
      problems.push(`${where}: "${req.id}" has child requirements and also courses; pick one`);
  });

  if (problems.length) throw new ValidationError(problems);
  requirements.sort((a, b) => a.displayOrder - b.displayOrder);
  return { programs, courses, requirements };
}
