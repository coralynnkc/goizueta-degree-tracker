"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Plan } from "@/lib/plan";
import type { Totals } from "@/lib/sheet";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#dadce0] bg-white p-4 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
      <h2 className="text-[12px] font-medium uppercase tracking-wide text-[#5f6368]">{title}</h2>
      {children}
    </section>
  );
}

export function GpaCard({ t }: { t: Totals }) {
  return (
    <Card title="GPA">
      <p className="mt-1 text-[36px] font-semibold leading-tight tabular-nums text-[#202124]">
        {t.gpa === null ? "—" : t.gpa.toFixed(2)}
      </p>
      <p className="text-[12px] text-[#5f6368]">
        {t.gradedCourses
          ? `${t.gradedCourses} letter-graded course${t.gradedCourses === 1 ? "" : "s"}, ${fmt(t.gradedCredits)} credits`
          : "Add letter grades to see your GPA"}
      </p>
      <dl className="mt-3 flex justify-between border-t border-[#e8eaed] pt-2 text-[13px]">
        <dt className="text-[#5f6368]">Business GPA</dt>
        <dd className="tabular-nums font-medium">{t.businessGpa === null ? "—" : t.businessGpa.toFixed(2)}</dd>
      </dl>
      <p className="mt-2 text-[11px] leading-snug text-[#80868b]">
        Counts only the courses on this sheet. Your transcript is the official GPA.
      </p>
    </Card>
  );
}

export function CreditsCard({ t, plan, setPlan }: { t: Totals; plan: Plan; setPlan: Dispatch<SetStateAction<Plan>> }) {
  const total = plan.totalCredits || 0;
  const remaining = Math.max(0, total - t.completedCredits);
  const unplanned = Math.max(0, remaining - t.inProgressCredits - t.plannedCredits);
  const pct = (n: number) => `${total ? Math.min(100, (n / total) * 100) : 0}%`;

  return (
    <Card title="Remaining credits">
      <p className="mt-1 text-[36px] font-semibold leading-tight tabular-nums text-[#202124]">{fmt(remaining)}</p>
      <label className="flex items-center gap-1 text-[12px] text-[#5f6368]">
        of
        <input
          type="number"
          min={0}
          value={plan.totalCredits}
          onChange={(e) => setPlan((p) => ({ ...p, totalCredits: Number(e.target.value) }))}
          className="w-14 rounded border border-[#dadce0] px-1 text-right tabular-nums text-[#202124] outline-none focus-visible:border-[#1a73e8]"
          aria-label="Total credits required"
        />
        required to graduate
      </label>

      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#e8eaed]" aria-hidden>
        <div className="bg-[#34a853]" style={{ width: pct(t.completedCredits) }} />
        <div className="bg-[#fbbc04]" style={{ width: pct(t.inProgressCredits) }} />
        <div className="bg-[#4285f4]" style={{ width: pct(t.plannedCredits) }} />
      </div>
      <dl className="mt-2 space-y-0.5 text-[13px]">
        {[
          ["bg-[#34a853]", "Completed", t.completedCredits],
          ["bg-[#fbbc04]", "In progress", t.inProgressCredits],
          ["bg-[#4285f4]", "Planned", t.plannedCredits],
          ["bg-[#e8eaed]", "Not yet planned", unplanned],
        ].map(([color, label, n]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <dt className="text-[#5f6368]">{label}</dt>
            <dd className="ml-auto tabular-nums font-medium">{fmt(n as number)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] leading-snug text-[#80868b]">
        Counts only the courses on this sheet. Add open electives and anything else you&apos;ve taken under Electives.
        Confirm the total with your advisor.
      </p>
    </Card>
  );
}
