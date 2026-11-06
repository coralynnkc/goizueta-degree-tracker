"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Plan } from "@/lib/plan";
import type { Totals } from "@/lib/sheet";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

const Big = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-brand">{children}</p>
);

const Fine = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-[11px] leading-snug text-faint">{children}</p>
);

export function GpaCard({ t }: { t: Totals }) {
  return (
    <Card title="GPA">
      <Big>{t.gpa === null ? "—" : t.gpa.toFixed(2)}</Big>
      <p className="mt-1.5 text-[12px] text-muted">
        {t.gradedCourses
          ? `${t.gradedCourses} graded course${t.gradedCourses === 1 ? "" : "s"} · ${fmt(t.gradedCredits)} credits`
          : "Add letter grades to see your GPA"}
      </p>
      <dl className="mt-4 flex justify-between border-t border-line pt-3 text-[13px]">
        <dt className="text-muted">Business GPA</dt>
        <dd className="font-medium tabular-nums">{t.businessGpa === null ? "—" : t.businessGpa.toFixed(2)}</dd>
      </dl>
      <Fine>Counts only courses on this sheet. Your transcript is the official GPA.</Fine>
    </Card>
  );
}

export function CreditsCard({ t, plan, setPlan }: { t: Totals; plan: Plan; setPlan: Dispatch<SetStateAction<Plan>> }) {
  const total = plan.totalCredits || 0;
  const remaining = Math.max(0, total - t.completedCredits);
  const unplanned = Math.max(0, remaining - t.inProgressCredits - t.plannedCredits);
  const pct = (n: number) => `${total ? Math.min(100, (n / total) * 100) : 0}%`;

  return (
    <Card title="Credits remaining">
      <Big>{fmt(remaining)}</Big>
      <label className="mt-1.5 flex items-center gap-1 text-[12px] text-muted">
        of
        <input
          type="number"
          min={0}
          value={plan.totalCredits}
          onChange={(e) => setPlan((p) => ({ ...p, totalCredits: Number(e.target.value) }))}
          className="w-12 rounded border border-line px-1 text-right tabular-nums text-ink outline-none focus-visible:border-brand"
          aria-label="Total credits required"
        />
        to graduate
      </label>

      <div className="mt-4 flex h-1.5 gap-px overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="bg-brand" style={{ width: pct(t.completedCredits) }} />
        <div className="bg-gold" style={{ width: pct(t.inProgressCredits) }} />
        <div className="bg-brand-100" style={{ width: pct(t.plannedCredits) }} />
      </div>
      <dl className="mt-3 space-y-1 text-[13px]">
        {[
          ["bg-brand", "Completed", t.completedCredits],
          ["bg-gold", "In progress", t.inProgressCredits],
          ["bg-brand-100", "Planned", t.plannedCredits],
          ["bg-line", "Not yet planned", unplanned],
        ].map(([color, label, n]) => (
          <div key={label as string} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <dt className="text-muted">{label}</dt>
            <dd className="ml-auto font-medium tabular-nums">{fmt(n as number)}</dd>
          </div>
        ))}
      </dl>
      <Fine>
        Counts only courses on this sheet. Add open electives under Electives. Confirm the total with your advisor.
      </Fine>
    </Card>
  );
}
