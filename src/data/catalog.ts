// Every course the sheet offers in a dropdown. Titles come from the BBA catalog and the
// Area Depth Sheet (Nov 2026). Credits default to 3; students can override them per row.
//
// Line format:  ID | Title | credits | flags
//   ID      "FIN 499R#AIFM" when one number covers several topics; the part before # is shown
//   credits blank = 3
//   flags   "imm" = tagged immersive; anything else is shown as a note

export interface Course {
  id: string;
  code: string;
  subject: string;
  title: string;
  credits: number;
  business: boolean; // counts toward the six business electives
  immersive: boolean;
  note?: string;
}

const BUSINESS_SUBJECTS = new Set(["ACT", "FIN", "ISOM", "MKT", "OAM", "BUS"]);

const RAW = `
QTM 100 | Statistics (competency option) | 4
QTM 110 | Statistics (competency option) | 4
ECON 220 | Statistics (competency option) | 4
MATH 362 | Statistics (competency option) |
SOC 275 | Statistics (competency option) |
AP STAT | AP Statistics credit |
STAT WAIVER | BBA Statistics Bootcamp and waiver exam | 0
BUS 350 | Data and Decision Analytics |
FIN 201 | Business Economics |
ECON 101 | Microeconomics |
ECON 112 | Macroeconomics |
AP MICRO | AP Microeconomics credit |
AP MACRO | AP Macroeconomics credit |
IB ECON | IB Economics (Higher Level) credit | | waives ECON 112
BUS 290 | Technology Toolbox A: Excel | 1

ACT 200 | Accounting: The Language of Business |
BUS 365 | Business Communication Strategy |
FIN 320 | Corporate Finance |
OAM 330 | Organization and Management |
OAM 331 | Strategic Management |
MKT 340 | Marketing Management |
ISOM 351 | Process and Systems Management |
ACT 410 | Legal Environment of Business |
ACT 300 | Business Analysis and Valuation | | last offered SP26
ACT 301 | Strategic Cost Management |
FIN 323 | Investments |
MKT 345 | Advanced Marketing Strategy |
ISOM 352 | Applied Data Analytics with Coding |

BUS 300 | BBA Boardroom | 0.5
BUS 380 | Professional Development | 2
BUS 381 | Personal Development | 0.5
BUS 383 | Team Dynamics and Leadership | 0.5
BUS 390 | Technology Toolbox B | 0.5
BUS 480 | Industry Seminar | 1
BUS 399R | Building AI Solutions | | not available SP27
BUS 401 | Global business course abroad |

ACT 304 | Blockchain and Crypto Assets |
ACT 311 | Sustainability Measurement and Reporting |
ACT 312 | Financial Reporting of Operations |
ACT 316 | Accounting for Social Impact Organizations |
ACT 325 | Financial Reporting of Debt and Equity |
ACT 330 | Personal Financial Planning |
ACT 335 | Firm Fundamentals and Mispricing |
ACT 401 | Accounting elective abroad (global) |
ACT 414 | Financial Statement Analysis |
ACT 415 | Tax Strategy |
ACT 416 | Smart Tax: Winning Ideas from Tax Professionals |
ACT 420 | Accounting Analytics: Insights for Actions | | imm
ACT 438 | Corporate Political Strategy | | offered every other year
ACT 450 | Accounting for Mergers and Acquisitions |
ACT 477 | Machine Learning for Fundamental Analysis |
ACT 505 | Incentives and Accountability | | not available SP27
ACT 618 | Auditing |

FIN 321 | Economics and Finance of Film |
FIN 322 | IMPACT: Strategic Valuation | | imm
FIN 324 | Sports Finance |
FIN 382 | Real Estate Law |
FIN 389 | Mergers and Acquisitions |
FIN 399R | Intro to the Business of Healthcare | | not available SP27
FIN 400 | Finance elective abroad |
FIN 401 | Finance elective abroad (global) |
FIN 403 | Global Macroeconomic Perspectives |
FIN 409 | Finance elective abroad (related) |
FIN 420 | Advanced Corporate Finance |
FIN 422 | Advanced Financial Markets | | not offered SP27
FIN 424 | Derivatives |
FIN 425 | Real Estate Finance |
FIN 427 | International Finance |
FIN 428 | Investment Banking |
FIN 428B | Venture Capital and Private Equity | | immersive only if taken SP25 or earlier
FIN 429 | Fixed Income |
FIN 430 | Foundations of FinTech |
FIN 481 | Frontiers and Illiquid Assets |
FIN 482 | Real Estate Market Analysis |
FIN 483 | Applied Investment Management | | imm
FIN 484 | Advanced Derivative Assets |
FIN 485 | Entrepreneurial Private Equity |
FIN 486 | Real Estate Equity Investment | | imm
FIN 488 | Real Estate Development and Investing |
FIN 489 | Advanced Real Estate Finance |
FIN 495 | Distressed Investing |
FIN 499R#AIFM | AI for Financial Modeling |
FIN 499R#FMML | Financial Modeling with Machine Learning |
FIN 499R#BEHAV | Behavioral Economics |
FIN 499R#RETECH | Technology and Innovation in Real Estate |

ISOM 353 | Supply Chain Management |
ISOM 354 | Agent-Based Systems |
ISOM 355 | Appcology: New Commerce Infrastructure | | imm
ISOM 356 | Think Code Make | | imm
ISOM 358 | Advanced Decision Analytics | | not available SP27
ISOM 400 | ISOM elective abroad |
ISOM 401 | ISOM elective abroad (global) |
ISOM 409 | ISOM elective abroad (related) |
ISOM 450 | Foundations of Digital Enterprises and Markets | | not available SP27
ISOM 451 | Making Effective Decisions |
ISOM 453 | Operations Strategy |
ISOM 454 | Intro to Machine Learning & AI/DataSci for Business |
ISOM 455 | Superforecasting Tools for Building Predictive Systems |
ISOM 456 | Introduction to Business Data Analytics |
ISOM 459 | Process Analysis and Six Sigma |
ISOM 475 | Data Visualization |
ISOM 499R#PM | Project Management |

MKT 341 | Seminar on Global Marketing | | last offered FA24
MKT 342 | Marketing Analytics |
MKT 343 | Digital and Social Media Strategy |
MKT 346 | Consumer Behavior |
MKT 347 | Product and Brand Management |
MKT 349 | Entertainment and Media Fieldwork | | imm
MKT 360 | Driving Growth in AI |
MKT 400 | Marketing elective abroad |
MKT 401 | Marketing elective abroad (global) |
MKT 409 | Marketing elective abroad (related) |
MKT 442 | Marketing and Consulting Practicum | | imm
MKT 443 | Monetization and Pricing Strategy |
MKT 446 | Advertising and Marketing Communications |
MKT 447 | Sports Marketing |
MKT 452 | Content Marketing |
MKT 499R#MI | Monetizing Innovations | | imm
MKT 499R#GG | Good Growth |

OAM 332 | Business and Society |
OAM 335 | Strategies for Entertainment and Media |
OAM 340 | Building a Satisfying Life |
OAM 399R#AI | Business Frontiers in the Age of AI | | not available SP27
OAM 400 | OAM elective abroad |
OAM 401 | OAM elective abroad (global) |
OAM 406 | Strategy and Organization in the Healthcare Sector | | last offered FA24
OAM 409 | OAM elective abroad (related) |
OAM 419 | Bias in the Workplace | | satisfies ETHN GER
OAM 421 | Philanthropy Lab | | imm
OAM 430 | Competitive Advantage |
OAM 431 | Social Enterprise and Impact Investing | | immersive SP27 and beyond
OAM 432 | Negotiations |
OAM 433 | Leading and Managing Change |
OAM 435 | Multinational Firms and Strategy |
OAM 436 | Entrepreneurship | | imm
OAM 438 | Management Consulting | | imm
OAM 439 | Business Ethics |
OAM 440 | Leading with Evidence | | imm
OAM 450 | Venture Capital and Minority Entrepreneurship |
OAM 464 | Future of Specialty Coffee |
OAM 471 | Applied Entrepreneurship | | imm
OAM 499R#PA | People Analytics |

CS 211 | Intro to Artificial Intelligence |
CS 312 | Computing, AI, Ethics, and Society |
DATASCI 385 | Special Topics in Data Science: AI Ethics |
ECON 422 | Macroeconomics and Machine Learning |
ECON 451 | Economics of Discrimination |
FILM 403 | The Biz | | Film & Media concentration only
`;

function parse(raw: string): Course[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, title, credits, flags] = line.split("|").map((s) => s?.trim() ?? "");
      const code = id.split("#")[0];
      const subject = code.split(" ")[0];
      return {
        id,
        code,
        subject,
        title,
        credits: credits === "" || credits === undefined ? 3 : Number(credits),
        business: BUSINESS_SUBJECTS.has(subject),
        immersive: flags === "imm",
        note: flags && flags !== "imm" ? flags : undefined,
      };
    });
}

export const COURSES: Course[] = parse(RAW);
export const COURSE_BY_ID = new Map(COURSES.map((c) => [c.id, c]));

export function course(id: string): Course {
  const c = COURSE_BY_ID.get(id);
  if (!c) throw new Error(`Unknown course id "${id}" in requirement data`);
  return c;
}

/** All business courses that can be taken as an elective (everything business that isn't core/PD). */
export const BUSINESS_ELECTIVES = COURSES.filter(
  (c) =>
    c.business &&
    !["BUS 290", "BUS 300", "BUS 350", "BUS 365", "BUS 380", "BUS 381", "BUS 383", "BUS 390", "BUS 480"].includes(c.id) &&
    !["ACT 200", "FIN 320", "MKT 340", "ISOM 351", "ACT 410", "FIN 201"].includes(c.id),
).map((c) => c.id);
