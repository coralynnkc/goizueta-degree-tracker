// Area depths, transcribed from the Goizueta Area Depth Sheet (updated Nov 2026).
// Each depth is a fixed number of slots; a slot's dropdown lists what may fill it.
// Related courses appear in a separate group in each dropdown, and at most one may be used.

export interface DepthSlot {
  label: string;
  options: string[];
  related?: boolean; // offer the depth's related courses in this slot
}

export interface Limit {
  slots: number[]; // slot indexes the limit applies to
  maxFrom?: { subject: string; n: number };
  maxPerSubject?: { n: number; except?: string };
}

export interface Depth {
  id: string;
  name: string;
  kind: "Functional" | "Interdisciplinary";
  flexCore?: { courses: string[]; all?: boolean; note?: string };
  slots: DepthSlot[];
  related: string[];
  otherRelated?: string; // label for an advisor-approved course outside Goizueta
  limits: Limit[];
  notes: string[];
}

const four = (label: string, options: string[], related = true): DepthSlot[] =>
  [1, 2, 3, 4].map((i) => ({ label: `${label} ${i}`, options, related }));

const three = (label: string, options: string[], related = true): DepthSlot[] =>
  [1, 2, 3].map((i) => ({ label: `${label} ${i}`, options, related }));

const OUTSIDE_LIMIT = (subject: string): Limit[] => [
  { slots: [1, 2, 3], maxFrom: { subject, n: 1 } },
  { slots: [1, 2, 3], maxPerSubject: { n: 2, except: subject } },
];

export const DEPTHS: Depth[] = [
  {
    id: "act",
    name: "Accounting",
    kind: "Functional",
    flexCore: {
      courses: ["ACT 301", "ACT 300"],
      note: "ACT 301 required if you matriculated Spring 26 or later. Matriculated Fall 25 or earlier: not required (ACT 300 or 301 if taken).",
    },
    slots: four("Elective", [
      "ACT 301", "ACT 311", "ACT 420", "ACT 438", "ACT 505",
      "ACT 312", "ACT 316", "ACT 325", "ACT 330", "ACT 415", "ACT 416", "ACT 618",
      "ACT 300", "ACT 304", "ACT 335", "ACT 414", "ACT 450", "ACT 477",
    ]),
    related: [
      "FIN 420", "FIN 422", "FIN 483", "ISOM 455", "ISOM 456", "ISOM 475",
      "MKT 342", "MKT 347", "MKT 443", "OAM 430", "OAM 433", "OAM 438", "OAM 499R#PA",
    ],
    limits: [],
    notes: ["ACT 301 counts as an elective only if it isn't your flex core."],
  },
  {
    id: "fin",
    name: "Finance",
    kind: "Functional",
    flexCore: { courses: ["FIN 323"] },
    slots: four("Elective", [
      "FIN 322", "FIN 389", "FIN 399R", "FIN 403", "FIN 420", "FIN 424", "FIN 427", "FIN 428",
      "FIN 428B", "FIN 429", "FIN 430", "FIN 483", "FIN 484", "FIN 485", "FIN 495",
      "FIN 499R#AIFM", "FIN 499R#FMML", "FIN 499R#BEHAV", "FIN 400", "FIN 401",
    ]),
    related: [
      "ACT 300", "ACT 414", "ACT 415", "ACT 416", "ACT 420", "ACT 450",
      "FIN 321", "FIN 324", "FIN 382", "FIN 409", "FIN 422", "FIN 425", "FIN 481", "FIN 482",
      "FIN 486", "FIN 488", "FIN 489", "FIN 499R#RETECH", "MKT 443", "OAM 450",
    ],
    limits: [],
    notes: [],
  },
  {
    id: "isom",
    name: "Information Systems & Operations Management",
    kind: "Functional",
    flexCore: { courses: ["ISOM 352"] },
    slots: four("Elective", [
      "ISOM 354", "ISOM 355", "ISOM 356", "ISOM 450",
      "ISOM 358", "ISOM 454", "ISOM 455", "ISOM 456", "ISOM 475", "ISOM 499R#PM",
      "ISOM 353", "ISOM 451", "ISOM 453", "ISOM 459", "ISOM 400", "ISOM 401",
    ]),
    related: [
      "ACT 420", "BUS 399R", "FIN 430", "FIN 499R#AIFM", "ISOM 409", "MKT 342", "MKT 343",
      "MKT 360", "MKT 447", "OAM 430", "OAM 433", "OAM 440",
    ],
    otherRelated: "Approved computer science class (doesn't count toward the 6 business electives)",
    limits: [],
    notes: [
      "AI track: ISOM 354 and ISOM 450 (26-27: ISOM 356 or 454 may replace 450), one of ISOM 355/356, one of ISOM 454/455/456.",
    ],
  },
  {
    id: "mkt",
    name: "Marketing",
    kind: "Functional",
    flexCore: { courses: ["MKT 345"] },
    slots: [
      { label: "Required course", options: ["MKT 342", "MKT 347", "MKT 443", "MKT 499R#MI"] },
      ...[2, 3].map((i) => ({
        label: `Required or elective ${i - 1}`,
        options: [
          "MKT 342", "MKT 347", "MKT 443", "MKT 499R#MI",
          "MKT 341", "MKT 343", "MKT 346", "MKT 349", "MKT 360", "MKT 442", "MKT 446",
          "MKT 447", "MKT 452", "MKT 499R#GG", "MKT 400", "MKT 401",
        ],
      })),
      {
        label: "Required, elective or related",
        related: true,
        options: [
          "MKT 342", "MKT 347", "MKT 443", "MKT 499R#MI",
          "MKT 341", "MKT 343", "MKT 346", "MKT 349", "MKT 360", "MKT 442", "MKT 446",
          "MKT 447", "MKT 452", "MKT 499R#GG", "MKT 400", "MKT 401",
        ],
      },
    ],
    related: [
      "ACT 300", "ACT 414", "BUS 399R", "FIN 324", "FIN 420", "ISOM 453", "ISOM 455",
      "ISOM 475", "MKT 409", "OAM 430", "OAM 432", "OAM 433",
    ],
    otherRelated: "Approved econ, psyc or soc class (doesn't count toward the 6 business electives)",
    limits: [],
    notes: [],
  },
  {
    id: "oam",
    name: "Organization & Management",
    kind: "Functional",
    flexCore: {
      courses: ["OAM 330", "OAM 331"],
      all: true,
      note: "Both OAM 330 and OAM 331: one as functional core, the other as flex core.",
    },
    slots: four("Elective", [
      "OAM 332", "OAM 335", "OAM 340", "OAM 399R#AI", "OAM 406", "OAM 419",
      "OAM 430", "OAM 431", "OAM 432", "OAM 433", "OAM 435", "OAM 436", "OAM 438", "OAM 439",
      "OAM 440", "OAM 450", "OAM 464", "OAM 471", "OAM 499R#PA", "OAM 400", "OAM 401",
    ]),
    related: [
      "ACT 300", "ACT 301", "ACT 505", "FIN 420", "FIN 428B", "ISOM 352", "ISOM 358",
      "ISOM 453", "ISOM 459", "MKT 347", "MKT 442", "OAM 409", "FILM 403",
    ],
    otherRelated: "Approved econ, psyc or soc class (doesn't count toward the 6 business electives)",
    limits: [],
    notes: ["ACT 301 and ISOM 352 count as related only if not taken as flex core."],
  },
  {
    id: "ai",
    name: "Artificial Intelligence",
    kind: "Interdisciplinary",
    flexCore: { courses: ["ISOM 352"] },
    slots: [
      { label: "Required course", options: ["ISOM 355", "ISOM 450", "ISOM 356", "ISOM 454"] },
      ...three("Elective", [
        "BUS 399R", "FIN 499R#AIFM", "ISOM 354", "ISOM 356", "MKT 360", "OAM 399R#AI",
      ]),
    ],
    related: [
      "ACT 420", "ACT 477", "FIN 323", "FIN 430", "ISOM 353", "ISOM 358", "ISOM 454", "ISOM 455",
      "ISOM 456", "MKT 347", "OAM 499R#PA", "DATASCI 385", "CS 211", "CS 312", "ECON 422", "ECON 451",
    ],
    limits: OUTSIDE_LIMIT("ISOM"),
    notes: [
      "Required: ISOM 355 or ISOM 450. For 26-27, ISOM 356 or 454 may replace 450.",
      "Of the three electives: at most one ISOM, at most two from any single other area.",
      "DATASCI and CS courses don't count toward the 6 business electives.",
    ],
  },
  {
    id: "ba",
    name: "Business Analytics",
    kind: "Interdisciplinary",
    flexCore: { courses: ["ISOM 352"] },
    slots: [
      { label: "Required course", options: ["ISOM 456"] },
      ...three("Elective", [
        "ACT 420", "ACT 477", "FIN 430", "FIN 499R#AIFM", "ISOM 358", "ISOM 450", "ISOM 454",
        "ISOM 455", "ISOM 475", "MKT 342", "MKT 443", "MKT 360", "OAM 499R#PA",
      ]),
    ],
    related: ["BUS 399R", "ISOM 355", "ISOM 356"],
    limits: OUTSIDE_LIMIT("ISOM"),
    notes: [
      "Of the three electives: at most one ISOM, at most two from any single other area.",
      "If an ISOM related course counts toward the depth, no other ISOM electives may.",
    ],
  },
  {
    id: "bs",
    name: "Business & Society",
    kind: "Interdisciplinary",
    slots: four(
      "Course",
      [
        "ACT 311", "ACT 316", "ACT 438", "ACT 505", "ISOM 451", "MKT 341", "MKT 499R#GG",
        "OAM 332", "OAM 419", "OAM 421", "OAM 431", "OAM 433", "OAM 439", "OAM 450", "OAM 464",
      ],
    ),
    related: [],
    otherRelated: "Approved Emory College elective (see advisor; doesn't count toward the 6 business electives)",
    limits: [{ slots: [0, 1, 2, 3], maxPerSubject: { n: 2 } }],
    notes: ["At most two from any single academic area."],
  },
  {
    id: "consulting",
    name: "Consulting",
    kind: "Interdisciplinary",
    flexCore: { courses: ["OAM 331"], note: "With OAM 331 as core plus two other flex cores, OAM 330 isn't required." },
    slots: [
      { label: "Required course", options: ["OAM 438"] },
      ...three(
        "Elective",
        [
          "ACT 300", "ACT 414", "ACT 301", "ACT 420", "FIN 428", "FIN 428B", "ISOM 353", "ISOM 450",
          "ISOM 453", "ISOM 459", "MKT 342", "MKT 345", "MKT 442", "OAM 440",
        ],
        false,
      ),
    ],
    related: [],
    limits: OUTSIDE_LIMIT("OAM"),
    notes: ["Of the three electives: at most one OAM, at most two from any single other area."],
  },
  {
    id: "entre",
    name: "Entrepreneurship",
    kind: "Interdisciplinary",
    slots: [
      { label: "Required course", options: ["OAM 436", "OAM 471"] },
      ...three(
        "Required or elective",
        [
          "OAM 436", "OAM 471", "ACT 300", "ACT 414", "ACT 438", "BUS 399R", "FIN 322", "FIN 428B",
          "FIN 485", "ISOM 355", "ISOM 356", "MKT 342", "MKT 443", "MKT 499R#MI", "OAM 430",
          "OAM 431", "OAM 450",
        ],
        false,
      ),
    ],
    related: [],
    limits: OUTSIDE_LIMIT("OAM"),
    notes: ["Of the last three: at most one OAM, at most two from any single other area."],
  },
  {
    id: "ib",
    name: "International Business",
    kind: "Interdisciplinary",
    slots: four("Course", [
      "ACT 401", "ACT 450", "BUS 401", "FIN 401", "FIN 403", "FIN 427", "ISOM 353", "ISOM 401",
      "ISOM 450", "MKT 341", "MKT 401", "OAM 332", "OAM 401", "OAM 435", "OAM 464",
    ]),
    related: [],
    otherRelated: "Approved Emory College elective (see advisor; doesn't count toward the 6 business electives)",
    limits: [{ slots: [0, 1, 2, 3], maxPerSubject: { n: 2 } }],
    notes: ["At most two from any single academic area. Plan a BBA study abroad semester."],
  },
  {
    id: "re",
    name: "Real Estate",
    kind: "Interdisciplinary",
    slots: [
      { label: "Required course", options: ["FIN 425"] },
      ...three("Elective", ["FIN 382", "FIN 482", "FIN 486", "FIN 488", "FIN 489", "FIN 499R#RETECH"]),
    ],
    related: ["FIN 495", "ISOM 451", "OAM 432"],
    limits: [],
    notes: [],
  },
];

export const DEPTH_BY_ID = new Map(DEPTHS.map((d) => [d.id, d]));
