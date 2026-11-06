// Satisfaction engine. NOT IMPLEMENTED: this is the Solver workstream.
// See SPEC.md, "Solver", for the max-flow formulation and the cases it must handle.

import type { Bundle } from "./types";
import type { Plan } from "./plan";

export interface RequirementProgress {
  requirementId: string;
  satisfied: boolean;
  progress: number; // children, courses, or credits counted toward the threshold
  needed: number;
}

export interface SolveResult {
  progress: Record<string, RequirementProgress>; // keyed by Requirement.id
  assignment: Record<string, string>; // Course.id -> leaf Requirement.id it was spent on
  surplus: string[]; // counted courses that no requirement used
}

export function solve(bundle: Bundle, plan: Plan, include: "completed" | "all" = "completed"): SolveResult {
  void bundle;
  void plan;
  void include;
  throw new Error("solve() is not implemented yet");
}
