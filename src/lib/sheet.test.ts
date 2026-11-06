import { describe, expect, it } from "vitest";
import { COURSES } from "@/data/catalog";
import { DEPTHS } from "@/data/depths";
import { SECTIONS } from "@/data/requirements";
import { emptyPlan, OTHER, type Plan, type RowState } from "./plan";
import { allRows, depthChecks, depthRowId, electiveTally, rowWarnings, totals } from "./sheet";

const plan = (rows: Record<string, RowState>, extra: Partial<Plan> = {}): Plan => ({
  ...emptyPlan(),
  ...extra,
  rows,
});

describe("requirement data", () => {
  it("every course id referenced by a row or depth exists", () => {
    const ids = new Set(COURSES.map((c) => c.id));
    const refs = [
      ...SECTIONS.flatMap((s) => s.subsections.flatMap((sub) => [
        ...sub.rows.flatMap((r) => [r.fixed, ...(r.options ?? [])]),
        ...(sub.addable?.options ?? []),
      ])),
      ...DEPTHS.flatMap((d) => [...(d.flexCore?.courses ?? []), ...d.related, ...d.slots.flatMap((s) => s.options)]),
    ].filter(Boolean);
    expect(refs.filter((r) => !ids.has(r!))).toEqual([]);
  });

  it("row ids are unique", () => {
    const ids = allRows(plan({}, { depths: DEPTHS.map((d) => d.id) })).map((r) => r.def.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("totals", () => {
  it("weights GPA by credits and ignores S/U", () => {
    const t = totals(plan({
      "bba:act200": { status: "completed", grade: "A" }, // 3 cr
      "bba:bus290": { status: "completed", grade: "B" }, // 1 cr
      "ger:ecs": { text: "ECS 101", status: "completed", grade: "S" },
    }));
    expect(t.gpa).toBeCloseTo((4 * 3 + 3 * 1) / 4);
    expect(t.gradedCourses).toBe(2);
    expect(t.completedCredits).toBe(5);
  });

  it("counts a course once even if a GER row and a business row both list it", () => {
    const t = totals(plan({
      "ger:qr": { text: "bus350", status: "completed", grade: "A" },
      "bba:bus350": { status: "completed", grade: "A" },
    }));
    expect(t.completedCredits).toBe(3);
    expect(t.gradedCourses).toBe(1);
  });

  it("counts repeatable courses per row", () => {
    const t = totals(plan({
      "bba:bus300-1": { status: "completed" },
      "bba:bus300-2": { status: "completed" },
    }));
    expect(t.completedCredits).toBe(1);
  });

  it("waived rows earn no credits", () => {
    expect(totals(plan({ "bba:econ2": { course: "ECON 112", status: "waived" } })).completedCredits).toBe(0);
  });
});

describe("warnings", () => {
  it("flags a course used for two business rows", () => {
    const w = rowWarnings(plan({ "bba:flex1": { course: "FIN 323" }, "bba:flex2": { course: "FIN 323" } }));
    expect(w.get("bba:flex1")?.[0]).toMatch(/Also used for Flex core 2/);
  });

  it("allows one bridge course across two depths", () => {
    const p = plan(
      { [depthRowId("fin", 0)]: { course: "ACT 420" }, [depthRowId("act", 0)]: { course: "ACT 420" } },
      { depths: ["fin", "act"] },
    );
    expect(rowWarnings(p).get(depthRowId("fin", 0))?.[0]).toMatch(/Bridge/);
  });

  it("flags the same OAM course as core and flex core", () => {
    const w = rowWarnings(plan({ "bba:oam": { course: "OAM 330" }, "bba:flex1": { course: "OAM 330" } }));
    expect(w.get("bba:flex1")).toContain("Already your functional core OAM course");
  });
});

describe("depth checks", () => {
  const ai = DEPTHS.find((d) => d.id === "ai")!;

  it("requires the flex core", () => {
    expect(depthChecks(plan({}), ai)[0]).toEqual({ ok: false, text: "Needs flex core ISOM 352" });
    expect(depthChecks(plan({ "bba:flex1": { course: "ISOM 352" } }), ai)[0].ok).toBe(true);
  });

  it("enforces one related course and the ISOM cap", () => {
    const checks = depthChecks(
      plan({
        [depthRowId("ai", 1)]: { course: "ISOM 354" },
        [depthRowId("ai", 2)]: { course: "ISOM 455" },
        [depthRowId("ai", 3)]: { course: "CS 211" },
      }),
      ai,
    ).map((c) => c.text);
    expect(checks).toContain("2 related courses used; only one may count");
    expect(checks).toContain("At most 1 ISOM course here");
  });

  it("OAM depth needs both OAM 330 and 331 across core and flex", () => {
    const oam = DEPTHS.find((d) => d.id === "oam")!;
    expect(depthChecks(plan({ "bba:oam": { course: "OAM 330" } }), oam)[0].ok).toBe(false);
    expect(depthChecks(plan({ "bba:oam": { course: "OAM 330" }, "bba:flex1": { course: "OAM 331" } }), oam)[0].ok).toBe(true);
  });
});

describe("elective tally", () => {
  it("counts business depth courses and added electives, not approved outside courses", () => {
    const p = plan(
      {
        [depthRowId("mkt", 0)]: { course: "MKT 499R#MI", status: "completed" },
        [depthRowId("mkt", 3)]: { course: OTHER, text: "PSYC 111", status: "planned" },
        "bba-electives:x1": { text: "fin 424", status: "planned" },
      },
      { depths: ["mkt"], extra: { "bba-electives": ["bba-electives:x1"] } },
    );
    const t = electiveTally(p);
    expect(t.counted).toBe(2);
    expect(t.completed).toBe(1);
    expect(t.immersive.completed).toBe(true);
  });
});
