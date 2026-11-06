import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compileBundle, FILE_NAMES, ValidationError, type CsvFiles } from "./compile";

const load = (dir: string) =>
  Object.fromEntries(
    Object.entries(FILE_NAMES).map(([k, name]) => [k, readFileSync(join(dir, name), "utf8")]),
  ) as unknown as CsvFiles;

const example = load("data/example");

describe("compileBundle", () => {
  it("compiles the example fixture", () => {
    const b = compileBundle(example);
    expect(b.requirements).toHaveLength(6);
    expect(b.requirements.find((r) => r.id === "EX-DEPTH")?.courseIds).toEqual(["EX201", "EX202"]);
  });

  it("accepts the empty authoring files", () => {
    expect(compileBundle(load("data")).requirements).toEqual([]);
  });

  it("reports spreadsheet row numbers", () => {
    const bad = { ...example, requirements: example.requirements.replace("EX-DEPTH,EX,EX-ROOT", "EX-DEPTH,EX,NOPE") };
    expect(() => compileBundle(bad)).toThrow(/requirements\.csv row 6: unknown parent_id "NOPE"/);
  });

  it("rejects a count rule without a threshold", () => {
    const bad = { ...example, requirements: example.requirements.replace("count,1,false,4", "count,,false,4") };
    expect(() => compileBundle(bad)).toThrow(ValidationError);
  });
});
