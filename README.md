# Goizueta Degree Tracker

Unofficial requirement tracker and semester planner for the Goizueta BBA. Built for the BUS 300
Boardroom group activity (AI, Analytics & Emerging Technology). See `SPEC.md` for what it does and
why it is built this way.

## Running it

```sh
npm install
npm run dev     # http://localhost:3000
npm test
```

## Updating requirement data

Edit the files in `src/data/` (see `SPEC.md`), bump `DATA_UPDATED` in `src/data/requirements.ts`,
and run `npm test`, which checks that every course a row or depth refers to exists.

## Layout

```
src/data/catalog.ts       courses
src/data/requirements.ts  GER and business rows, sources, last-updated date
src/data/depths.ts        area depths
src/lib/sheet.ts          GPA, credits, warnings, depth checks
src/lib/plan.ts           saved plan + localStorage
src/components/           sheet, cells, cards
src/app/page.tsx          page layout
```
