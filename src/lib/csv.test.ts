import { describe, expect, it } from "vitest";
import { DEPTHS } from "@/data/depths";
import { fromCsv, parseCsv, toCsv } from "./csv";
import { emptyPlan, type Plan } from "./plan";
import { allRows, depthRowId } from "./sheet";

const depth = DEPTHS[0];

const filled = (): Plan => ({
  ...emptyPlan(),
  depths: [depth.id],
  extra: { "bba-electives": ["bba-electives:xabc"] },
  rows: {
    "bba:act200": { term: "Fall 2025", status: "completed", grade: "A-" },
    "bba:oam": { course: "OAM 330", status: "planned", term: "Spring 2026" },
    "bba:nonbus1": { text: "HIST 101", status: "in_progress", credits: 4 },
    "bba-electives:xabc": { text: "FIN 420", status: "planned" },
    [depthRowId(depth.id, 0)]: { course: depth.slots[0].options[0], status: "planned" },
  },
});

describe("csv", () => {
  it("export has a header plus one line per row", () => {
    const p = filled();
    const rows = parseCsv(toCsv(p));
    expect(rows[0]).toEqual(["Section", "Requirement", "Course", "Title", "Credits", "Term", "Status", "Grade", "ID"]);
    expect(rows).toHaveLength(allRows(p).length + 1);
  });

  it("round-trips a plan", () => {
    const p = filled();
    const res = fromCsv(toCsv(p), emptyPlan())!;
    expect(res.skipped).toEqual([]);
    expect(res.plan.rows).toEqual(p.rows);
    expect(res.plan.depths).toEqual(p.depths);
    expect(res.plan.extra).toEqual(p.extra);
  });

  it("accepts a line the student added without an ID, and Excel's CRLF + BOM", () => {
    const csv = "﻿" + toCsv(emptyPlan()).replace(/\n/g, "\r\n") + "Electives,,fin 420,,,fall 2025,completed,b+,\r\n";
    const res = fromCsv(csv, emptyPlan())!;
    const [id] = res.plan.extra["bba-electives"];
    expect(res.plan.rows[id]).toEqual({ text: "fin 420", term: "Fall 2025", status: "completed", grade: "B+" });
  });

  it("reports values it can't read instead of failing", () => {
    const lines = toCsv(emptyPlan()).split("\n");
    const i = lines.findIndex((l) => l.endsWith(",bba:oam"));
    lines[i] = "Business Core,Organization / Strategy,ZZZ 999,,,Someday,Maybe,Q,bba:oam";
    const res = fromCsv(lines.join("\n"), emptyPlan())!;
    expect(res.skipped).toHaveLength(4);
    expect(res.plan.rows["bba:oam"]).toBeUndefined();
  });

  it("rejects files that aren't a tracker export", () => {
    expect(fromCsv("a,b,c\n1,2,3\n", emptyPlan())).toBeNull();
    expect(fromCsv("", emptyPlan())).toBeNull();
  });
});
