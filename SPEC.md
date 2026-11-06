# Spec

Working spec for the BUS 300 Boardroom build. The technical planning document is the longer version;
this file is what we change as decisions get made.

## What it does

A Goizueta BBA student fills in a sheet that looks like Google Sheets: one row per requirement, with
dropdowns for the course, term, status and grade. The sheet is split into the Blue GER, business
requirements (prerequisites, functional core, flex core, professional development, electives) and
area depths. Two cards beside it show GPA and remaining credits. A checkbox hides completed rows.

Out of scope: live enrollment (sections, seats, instructors), OPUS/Canvas integration, reading
transcripts, Emory College majors and minors.

## Decisions

**No accounts, no database, no backend.** The plan lives in `localStorage` under `gdt.plan.v2`.
A plan belongs to one browser; Export/Import moves it as a JSON file. Nothing a student enters leaves
their machine.

**The student assigns courses to rows.** The technical plan proposed a max-flow solver that works out
which requirement each course counts toward. The sheet asks the student to make that choice in the
dropdowns instead, and the app checks it: a course used in two rows is flagged (except GER rows,
which double count by policy, repeatable BUS courses, and one bridge course between two depths).

**Requirement data is typed TypeScript, not CSV.** `src/data/` holds it, transcribed from the
sources below, with `DATA_UPDATED` shown in the header and footer. Change that date whenever the
data changes.

## Data sources (checked Nov 6, 2026)

- Blue GER (Fall 2023 and later): https://college.catalog.emory.edu/dept/ger#blue-ger-fall-2023-and-later
- BBA curriculum: https://goizueta.catalog.emory.edu/degreeprograms/bba/bbaoverview#curriculum1
- Goizueta Area Depth Sheet, updated Nov 2026 (PDF from the BBA Canvas page)

## Files

| File | What it holds |
| --- | --- |
| `src/data/catalog.ts` | every course in a dropdown: code, title, credits, immersive tag, notes |
| `src/data/requirements.ts` | GER and business rows, sources, contact, `DATA_UPDATED` |
| `src/data/depths.ts` | the 12 area depths: flex core, slots, related courses, limits |
| `src/lib/sheet.ts` | GPA, credit totals, duplicate warnings, depth checks, elective tally |
| `src/lib/plan.ts` | the saved plan and localStorage |

## Rules the app checks

- GPA: credit-weighted over rows with a letter grade, each course counted once. S/U, P, W, AP
  and transfer don't affect it. Business GPA uses ACT/FIN/ISOM/MKT/OAM/BUS courses only.
- Credits: completed, in progress and planned, each course counted once; waived rows earn none.
  The total defaults to 128 and is editable. **The catalog pages don't state the total; confirm it.**
- Business electives: six, counting depth courses and added electives that are planned or later;
  at least one immersive. Courses from outside Goizueta don't count.
- Depths: required flex core on the sheet, at most one related course, per-area caps
  ("at most one ISOM", "at most two from any single area").

## Not checked yet

- GER rules about timing, 3+ credit minimums and C-or-better grades (shown as notes only).
- Matriculation date differences (e.g. the Accounting flex core for Fall 25 and earlier).
- The ISOM AI track and the Business Analytics "ISOM related course" rule (shown as notes).
- Two non-business electives, one waived with two or more depths.
