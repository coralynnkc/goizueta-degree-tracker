// The rows of the sheet. Sources (checked Nov 6, 2026):
//   GER:   https://college.catalog.emory.edu/dept/ger#blue-ger-fall-2023-and-later
//   BBA:   https://goizueta.catalog.emory.edu/degreeprograms/bba/bbaoverview#curriculum1
//   Depth: Goizueta "Area Depth Sheet", updated Nov 2026

export const DATA_UPDATED = "2026-11-06";

export const SOURCES = [
  {
    label: "Blue GER (Fall 2023 and later)",
    href: "https://college.catalog.emory.edu/dept/ger#blue-ger-fall-2023-and-later",
  },
  {
    label: "BBA curriculum",
    href: "https://goizueta.catalog.emory.edu/degreeprograms/bba/bbaoverview#curriculum1",
  },
  { label: "Area Depth Sheet (updated Nov 2026)", href: null },
];

export const CONTACT_EMAIL = "coralynn.yang@emory.edu";
export const REPO_URL = "https://github.com/coralynnkc/goizueta-degree-tracker";

/** One sheet row. Exactly one of `fixed`, `options` or `freeText` describes the course cell. */
export interface RowDef {
  id: string;
  label: string;
  fixed?: string; // a single course id; the cell is not editable
  options?: string[]; // course ids for the dropdown
  freeText?: boolean; // the student types a course code (GER rows)
  suggestions?: string[]; // hints for freeText rows
  defaultCredits?: number; // for freeText rows
  note?: string;
}

export interface Subsection {
  id: string;
  title: string;
  note?: string;
  rows: RowDef[];
  /** Students can add more rows of this shape. */
  addable?: { label: string; options?: string[]; freeText?: boolean; defaultCredits?: number };
}

export interface Section {
  id: string;
  title: string;
  subsections: Subsection[];
}

const ger = (id: string, label: string, extra: Partial<RowDef> = {}): RowDef => ({
  id: `ger:${id}`,
  label,
  freeText: true,
  defaultCredits: 3,
  ...extra,
});

export const GER_SECTION: Section = {
  id: "ger",
  title: "General Education Requirements (Blue GER)",
  subsections: [
    {
      id: "ger-success",
      title: "Success at Emory",
      note: "Complete by the end of first year.",
      rows: [
        ger("ecs", "ECS 101 (S/U)", { suggestions: ["ECS 101"], defaultCredits: 1 }),
        ger("hlth", "HLTH 100 (letter grade)", { suggestions: ["HLTH 100"], defaultCredits: 1 }),
        ger("pe", "Physical Education [PE]", { defaultCredits: 1 }),
      ],
    },
    {
      id: "ger-exploration",
      title: "Exploration",
      note: "Complete by the end of second year. Courses must be 3+ credits.",
      rows: [
        ger("ha", "Humanities and Arts [HA]"),
        ger("ns", "Natural Science [NS]"),
        ger("qr", "Quantitative Reasoning [QR]", { suggestions: ["BUS 350"], note: "BUS 350 satisfies QR" }),
        ger("ss", "Social Science [SS]", {
          suggestions: ["ECON 101", "ECON 112", "FIN 201", "OAM 330"],
          note: "ECON 101/112, FIN 201 or OAM 330 satisfy SS",
        }),
      ],
    },
    {
      id: "ger-expression",
      title: "Expression and Communication",
      note: "FS and FW by end of first year; CW by graduation, grade of C or better.",
      rows: [
        ger("fs", "First Year Seminar [FS]"),
        ger("fw", "First Year Writing [FW]", { note: "AP/IB credit can satisfy" }),
        ger("cw1", "Continuing Writing [CW] 1", {
          suggestions: ["BUS 365"],
          note: "BUS 365 satisfies one CW",
        }),
        ger("cw2", "Continuing Writing [CW] 2", { note: "Taken in Emory College or Oxford" }),
      ],
    },
    {
      id: "ger-belonging",
      title: "Belonging and Community",
      note: "Complete before senior standing.",
      rows: [
        ger("ic1", "Intercultural Communication [IC] 1", { note: "AP/IB credit can satisfy one IC" }),
        ger("ic2", "Intercultural Communication [IC] 2", { note: "Same language as IC 1" }),
        ger("ethn", "Race and Ethnicity [ETHN]", { suggestions: ["OAM 419"], note: "OAM 419 satisfies ETHN" }),
      ],
    },
    {
      id: "ger-xa",
      title: "Experience and Application",
      note: "Complete by graduation.",
      rows: [ger("xa", "Experience and Application [XA]", { note: "Your immersive BBA elective satisfies XA" })],
    },
  ],
};

const FLEX_CORE = ["ACT 301", "ACT 300", "FIN 323", "OAM 330", "OAM 331", "MKT 345", "ISOM 352"];

const repeat = (id: string, label: string, course: string, n: number): RowDef[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${id}${i + 1}`, label: `${label} (${i + 1} of ${n})`, fixed: course }));

export const BUSINESS_SECTION: Section = {
  id: "bba",
  title: "Business Requirements",
  subsections: [
    {
      id: "bba-prereq",
      title: "Pre-BBA prerequisites",
      note: "Business prerequisite average of B+ (3.3) or better to matriculate.",
      rows: [
        {
          id: "bba:stat",
          label: "Statistics competency",
          options: ["QTM 100", "QTM 110", "ECON 220", "MATH 362", "SOC 275", "AP STAT", "STAT WAIVER"],
        },
        { id: "bba:bus350", label: "Data and Decision Analytics", fixed: "BUS 350" },
        {
          id: "bba:econ1",
          label: "Economics",
          options: ["FIN 201", "ECON 101", "AP MICRO", "IB ECON"],
          note: "FIN 201 or IB HL alone satisfies the whole requirement",
        },
        {
          id: "bba:econ2",
          label: "Macroeconomics (only with ECON 101 / AP Micro)",
          options: ["ECON 112", "AP MACRO"],
          note: "Mark Waived if you took FIN 201 or have IB HL credit",
        },
        { id: "bba:bus290", label: "Tech Toolbox A: Excel", fixed: "BUS 290" },
      ],
    },
    {
      id: "bba-core",
      title: "Functional core",
      rows: [
        { id: "bba:act200", label: "Accounting", fixed: "ACT 200" },
        { id: "bba:bus365", label: "Business Communication", fixed: "BUS 365" },
        { id: "bba:fin320", label: "Corporate Finance", fixed: "FIN 320" },
        { id: "bba:oam", label: "Organization / Strategy", options: ["OAM 330", "OAM 331"] },
        { id: "bba:mkt340", label: "Marketing", fixed: "MKT 340" },
        { id: "bba:isom351", label: "Process and Systems", fixed: "ISOM 351" },
        { id: "bba:act410", label: "Legal Environment", fixed: "ACT 410" },
      ],
    },
    {
      id: "bba-flex",
      title: "Flex core",
      note: "At least two. The OAM course not used for the functional core can count here, but one course can't count as both.",
      rows: [
        { id: "bba:flex1", label: "Flex core 1", options: FLEX_CORE },
        { id: "bba:flex2", label: "Flex core 2", options: FLEX_CORE },
      ],
      addable: { label: "Additional flex core", options: FLEX_CORE },
    },
    {
      id: "bba-pd",
      title: "Professional development and co-curricular core",
      rows: [
        ...repeat("bba:bus300-", "BBA Boardroom", "BUS 300", 4),
        { id: "bba:bus380", label: "Professional Development", fixed: "BUS 380" },
        { id: "bba:bus381", label: "Personal Development", fixed: "BUS 381" },
        { id: "bba:bus383", label: "Team Dynamics and Leadership", fixed: "BUS 383" },
        ...repeat("bba:bus390-", "Tech Toolbox B", "BUS 390", 4),
        ...repeat("bba:bus480-", "Industry Seminar", "BUS 480", 2),
      ],
    },
    {
      id: "bba-electives",
      title: "Electives",
      note: "Six business electives (area depth electives count), at least one immersive. Two non-business electives (one waived with two or more depths). Open electives make up the remaining credit hours.",
      rows: [
        { id: "bba:nonbus1", label: "Non-business elective 1", freeText: true, defaultCredits: 3 },
        { id: "bba:nonbus2", label: "Non-business elective 2", freeText: true, defaultCredits: 3 },
      ],
      addable: { label: "Business or open elective", freeText: true, defaultCredits: 3 },
    },
  ],
};

export const SECTIONS: Section[] = [GER_SECTION, BUSINESS_SECTION];

/** Rows whose course can legitimately appear more than once on the sheet. */
export const REPEATABLE = new Set(["BUS 300", "BUS 390", "BUS 480"]);
