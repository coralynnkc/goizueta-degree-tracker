// Usage: npx tsx scripts/build-data.ts [dataDir]
// Reads the authoring CSVs (default: data/), validates them, and writes
// src/data/bundle.json. Runs automatically before `npm run dev` and `npm run build`.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { compileBundle, FILE_NAMES, ValidationError, type CsvFiles } from "../src/lib/compile";

const dir = process.argv[2] ?? "data";
const files = Object.fromEntries(
  Object.entries(FILE_NAMES).map(([key, name]) => [key, readFileSync(join(dir, name), "utf8")]),
) as unknown as CsvFiles;

try {
  const bundle = compileBundle(files);
  mkdirSync("src/data", { recursive: true });
  writeFileSync("src/data/bundle.json", JSON.stringify(bundle, null, 2) + "\n");
  console.log(
    `bundle.json: ${bundle.programs.length} programs, ${bundle.requirements.length} requirements, ${bundle.courses.length} courses`,
  );
} catch (e) {
  if (e instanceof ValidationError) {
    console.error(e.message);
    process.exit(1);
  }
  throw e;
}
