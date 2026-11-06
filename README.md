# Goizueta Degree Tracker

Unofficial requirement tracker and semester planner for the Goizueta BBA. Built for the BUS 300
Boardroom group activity (AI, Analytics & Emerging Technology). See `SPEC.md` for what it does and
why it is built this way.

## Running it

```sh
npm install
npm run dev     # compiles data/ into src/data/bundle.json, then starts http://localhost:3000
npm test
```

## Adding requirement data

Edit the CSVs in `data/` (or export them from the shared spreadsheet with the same column names),
then run `npm run data`. If a row is wrong it tells you which file and row. Column definitions are in
`SPEC.md`.

## Layout

```
data/                 authoring CSVs (real data); data/example/ is a made-up test fixture
scripts/build-data.ts CSV -> src/data/bundle.json
src/lib/types.ts      requirement model
src/lib/compile.ts    CSV validation
src/lib/plan.ts       student plan + localStorage
src/lib/solver.ts     requirement satisfaction (to do)
src/app/              UI
```
