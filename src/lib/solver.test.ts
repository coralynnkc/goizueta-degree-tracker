// Cases the solver must pass, written against data/example (a made-up program).
// Turn each `it.todo` into a real test as solve() comes together.
import { describe, it } from "vitest";

describe("solve", () => {
  it.todo("EX101 + EX102 completed satisfies EX-CORE and nothing else");
  it.todo("EX201 alone satisfies EX-DEPTH or puts 3 credits toward EX-ELEC, never both");
  it.todo("EX201 + EX202 + EX301: EX202 goes to depth so EX201 + EX301 cover the 6 elective credits");
  it.todo("a course that matches no requirement is reported as surplus");
  it.todo("an allow_shared requirement counts a course already spent elsewhere");
  it.todo("include='all' counts planned and in-progress courses, include='completed' does not");
});
