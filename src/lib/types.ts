// Requirement model, mirroring section 2 of the technical plan.
// The CSVs in data/ have one column per field here; scripts/build-data.ts
// validates them and writes the compiled bundle to src/data/bundle.json.

export type RuleKind =
  | "all" // every child must be satisfied
  | "count" // `threshold` children (or courses, at a leaf) must be satisfied
  | "credits"; // `threshold` credit hours must be covered

export interface Program {
  id: string;
  name: string;
  degreeType: string; // "BBA", "minor", ...
  school: string;
  catalogYear: string; // "2026-2027"
}

export interface Course {
  id: string; // "ACT200"
  subject: string; // "ACT"
  number: string; // "200"
  title: string;
  credits: number;
}

export interface Requirement {
  id: string;
  programId: string;
  parentId: string | null; // null = top-level block of the program
  label: string;
  ruleKind: RuleKind;
  threshold: number | null; // required for "count" and "credits"
  allowShared: boolean; // may double-count by policy; evaluated outside the flow network
  displayOrder: number;
  source: string; // catalog page or audit the row was read from
  signedOffBy: string; // second reader; empty = not yet checked
  courseIds: string[]; // acceptable courses (leaves only), from requirement_courses.csv
}

export interface Bundle {
  programs: Program[];
  courses: Course[];
  requirements: Requirement[];
}
