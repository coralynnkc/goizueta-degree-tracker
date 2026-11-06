# Spec

Working spec for the BUS 300 Boardroom build. The technical planning document is the longer version;
this file is what we change as decisions get made.

## What it does

A Goizueta BBA student sees every requirement their degree imposes, marks courses as completed, in
progress, or planned, and places planned courses into future terms. The tracker tells them what is
still unmet and whether their plan for the remaining terms covers it.

Out of scope: live enrollment (sections, seats, instructors), OPUS/Canvas integration, transcripts,
GPA, Emory College GER.

## Decisions

**No accounts, no database, no backend.** The requirement data is static and ships with the app as
`src/data/bundle.json`. The plan is the only thing that persists, and it lives in `localStorage`
under `gdt.plan.v1`. Consequences we accept:

- A plan belongs to one browser. Clearing site data deletes it.
- To move a plan between machines, the app will offer JSON export and import (`exportPlan` / `parsePlan` in `src/lib/plan.ts`).
- Nothing a student enters leaves their machine, which also settles the privacy question.

If accounts come later, the `Plan` shape in `src/lib/plan.ts` becomes the row we store, and the
solver stays on the client.

**Requirement data is authored as CSV, not JSON**, so the people transcribing requirements never
touch code. `npm run data` validates and compiles it; errors cite the file and spreadsheet row.

## Data

Four files in `data/`, one per table. `data/example/` is a made-up program used by tests; do not
put real requirements there.

| File | Columns |
| --- | --- |
| `programs.csv` | `id, name, degree_type, school, catalog_year` |
| `courses.csv` | `id, subject, number, title, credits` |
| `requirements.csv` | `id, program_id, parent_id, label, rule_kind, threshold, allow_shared, display_order, source, signed_off_by` |
| `requirement_courses.csv` | `requirement_id, course_id` |

Rules the compiler enforces:

- `rule_kind` is `all` (every child), `count` (`threshold` children, or courses at a leaf), or
  `credits` (`threshold` credit hours). `count` and `credits` need a threshold; `all` leaves it blank.
- `parent_id` blank means a top-level block. Parents must exist, be in the same program, and not form
  a cycle.
- A requirement either has children or has courses listed in `requirement_courses.csv`, not both and
  not neither.
- Every row has a `source` (catalog page or the audit it came from). `signed_off_by` is the second
  reader; blank means unchecked.

## Solver

`solve(bundle, plan)` in `src/lib/solver.ts` (not yet written). One course can appear in several
requirement lists but may only count toward one, so progress is a max-flow problem:

- source → each counted course, capacity = its credits
- course → each leaf requirement that accepts it
- leaf → sink, capacity = its threshold in credits (for `count` leaves, use capacity 1 per course
  and threshold 1 per edge instead)

`allow_shared` requirements are evaluated outside the network with a membership test, so a shared
course never consumes capacity. The solver returns per-requirement progress, which leaf each course
was spent on, and surplus courses. The cases it must pass are in `src/lib/solver.test.ts`.

Open question for the solver owner: mixing `count` and `credits` leaves in one network needs a
decision on units. Splitting each course into a "slot" node and a "credits" node is one option.

## Views

**Checklist.** The requirement tree as collapsible sections, each with progress against its
threshold. Satisfied sections collapse by default; a toggle hides them. Under each unmet requirement,
the acceptable courses not yet taken. Completed courses show which requirement they were spent on.

**Planner.** Remaining terms as columns, planned courses as draggable cards (dnd-kit). Each column
totals its credits and warns outside a normal load.

Both views read the same plan and solver output; `hideCompleted` is part of the plan so it carries
across views.

Every view shows the unofficial-tool disclaimer.

## Not decided yet

- Which programs we load beyond the BBA core, and the catalog year.
- Credit-load range for the planner warning.
- Whether "in progress" counts toward progress by default.
