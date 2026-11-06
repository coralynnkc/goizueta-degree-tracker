"use client";

import { useRef, useState } from "react";
import { CreditsCard, GpaCard } from "@/components/Cards";
import { GitHubIcon, Logo } from "@/components/Logo";
import { Sheet } from "@/components/Sheet";
import { CONTACT_EMAIL, DATA_UPDATED, REPO_URL, SOURCES } from "@/data/requirements";
import { emptyPlan, usePlan } from "@/lib/plan";
import { fromCsv, toCsv } from "@/lib/csv";
import { totals } from "@/lib/sheet";

const updated = new Date(`${DATA_UPDATED}T12:00:00`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const link = "text-brand underline decoration-brand-100 underline-offset-2 hover:decoration-brand";
const toolButton = "h-8 rounded-md px-3 text-[13px] font-medium transition-colors";

export default function Home() {
  const { plan, setPlan, loaded } = usePlan();
  const t = totals(plan);
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string; details?: string[] } | null>(null);

  const importCsv = async (file: File | undefined) => {
    if (!file) return;
    const res = fromCsv(await file.text(), plan);
    if (!res) {
      setNotice({ ok: false, text: "That file isn't a CSV downloaded from this tracker. Download one, fill it out, then import it." });
      return;
    }
    if (!confirm("Replace your current sheet with this file?")) return;
    setPlan(res.plan);
    setNotice({
      ok: res.skipped.length === 0,
      text: `Imported ${res.imported} rows${res.skipped.length ? `; ${res.skipped.length} value${res.skipped.length === 1 ? "" : "s"} couldn't be read` : ""}.`,
      details: res.skipped,
    });
  };

  const downloadCsv = () => {
    const blob = new Blob([toCsv(plan)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "degree-plan.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <Logo />
          <h1 className="text-[15px] font-semibold tracking-tight text-brand">Goizueta Degree Tracker</h1>
          <span className="hidden rounded-full bg-gold-50 px-2 py-0.5 text-[11px] font-medium text-gold-700 sm:inline">
            Beta
          </span>

          <div className="ml-auto flex items-center gap-1">
            <label className="mr-2 hidden cursor-pointer items-center gap-2 text-[13px] text-muted md:flex">
              <input
                type="checkbox"
                checked={plan.hideCompleted}
                onChange={(e) => setPlan((p) => ({ ...p, hideCompleted: e.target.checked }))}
                className="h-3.5 w-3.5 accent-brand"
              />
              Hide completed
            </label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className={`${toolButton} text-brand hover:bg-brand-50`}
              title="Import a CSV you downloaded from this tracker and filled out"
            >
              Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                importCsv(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={downloadCsv}
              className={`${toolButton} text-brand hover:bg-brand-50`}
              title="Download your sheet as a CSV for Google Sheets or Excel"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => confirm("Clear your whole sheet? This can't be undone.") && setPlan(emptyPlan())}
              className={`${toolButton} text-muted hover:bg-bad-50 hover:text-bad`}
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          <span>Unofficial · check against your OPUS degree audit</span>
          <span className="text-line">|</span>
          <span>Requirements updated {updated}</span>
          <span className="text-line">|</span>
          <span>{loaded ? "Saved in this browser" : "Loading…"}</span>
          <label className="ml-auto flex cursor-pointer items-center gap-2 md:hidden">
            <input
              type="checkbox"
              checked={plan.hideCompleted}
              onChange={(e) => setPlan((p) => ({ ...p, hideCompleted: e.target.checked }))}
              className="h-3.5 w-3.5 accent-brand"
            />
            Hide completed
          </label>
        </div>

        {notice && (
          <div
            role="status"
            className={`mb-4 rounded-lg border px-4 py-3 text-[13px] ${notice.ok ? "border-good/20 bg-good-50 text-good" : "border-gold/30 bg-gold-50 text-gold-700"}`}
          >
            <div className="flex items-start gap-3">
              <p className="flex-1">{notice.text}</p>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
                ×
              </button>
            </div>
            {notice.details && notice.details.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[12px]">
                {notice.details.slice(0, 8).map((d) => (
                  <li key={d}>{d}</li>
                ))}
                {notice.details.length > 8 && <li>…and {notice.details.length - 8} more</li>}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
          <main className="min-w-0 flex-1">
            <Sheet plan={plan} setPlan={setPlan} />
          </main>
          <aside className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-20 lg:w-64 lg:grid-cols-1">
            <GpaCard t={t} />
            <CreditsCard t={t} plan={plan} setPlan={setPlan} />
          </aside>
        </div>
      </div>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-[12px] leading-relaxed text-muted sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl space-y-1">
            <p>
              <span className="font-medium text-ink">Unofficial tool.</span> Your OPUS degree audit and your BBA
              advisor govern; if this tracker disagrees with them, they are right. Your sheet stays in this browser.
            </p>
            <p>
              Sources:{" "}
              {SOURCES.map((s, i) => (
                <span key={s.label}>
                  {i > 0 && ", "}
                  {s.href ? (
                    <a href={s.href} target="_blank" rel="noreferrer" className={link}>
                      {s.label}
                    </a>
                  ) : (
                    s.label
                  )}
                </span>
              ))}
              . Found a mistake?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md px-2 py-1 font-medium text-ink hover:bg-surface"
          >
            <GitHubIcon />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
