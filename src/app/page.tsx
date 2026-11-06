"use client";

import { useRef } from "react";
import { CreditsCard, GpaCard } from "@/components/Cards";
import { Sheet } from "@/components/Sheet";
import { CONTACT_EMAIL, DATA_UPDATED, REPO_URL, SOURCES } from "@/data/requirements";
import { emptyPlan, parsePlan, usePlan } from "@/lib/plan";
import { totals } from "@/lib/sheet";

const updated = new Date(`${DATA_UPDATED}T12:00:00`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function Home() {
  const { plan, setPlan, loaded } = usePlan();
  const fileInput = useRef<HTMLInputElement>(null);
  const t = totals(plan);

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "degree-plan.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importPlan = async (file: File | undefined) => {
    if (!file) return;
    const p = parsePlan(await file.text());
    if (p) setPlan(p);
    else alert("That file isn't a plan exported from this tracker.");
  };

  return (
    <div className="flex min-h-full flex-col bg-[#f8f9fa]">
      <header className="border-b border-[#dadce0] bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#174e3c] text-[13px] font-bold text-white">
            G
          </div>
          <div>
            <h1 className="text-[18px] font-medium leading-tight text-[#202124]">Goizueta Degree Tracker</h1>
            <p className="text-[12px] text-[#5f6368]">
              Requirements last updated {updated} · unofficial, check against your OPUS degree audit
            </p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-full border border-[#f9ab00] bg-[#fef7e0] px-3 py-1 text-[12px] font-medium text-[#8a5a00] hover:bg-[#feefc3]"
          >
            Prototype · work in progress · GitHub ↗
          </a>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#3c4043]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={plan.hideCompleted}
              onChange={(e) => setPlan((p) => ({ ...p, hideCompleted: e.target.checked }))}
              className="h-4 w-4 accent-[#174e3c]"
            />
            Hide completed courses
          </label>
          <span className="text-[12px] text-[#80868b]">{loaded ? "Saved in this browser" : "Loading…"}</span>
          <div className="ml-auto flex gap-1">
            <button type="button" onClick={exportPlan} className="rounded px-2 py-1 hover:bg-[#e8eaed]">
              Export
            </button>
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded px-2 py-1 hover:bg-[#e8eaed]">
              Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                importPlan(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => confirm("Clear your whole sheet? Export first if you want a copy.") && setPlan(emptyPlan())}
              className="rounded px-2 py-1 text-[#c5221f] hover:bg-[#fce8e6]"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-4 lg:flex-row lg:items-start">
          <main className="min-w-0 flex-1">
            <Sheet plan={plan} setPlan={setPlan} />
          </main>
          <aside className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-4 lg:w-72 lg:grid-cols-1">
            <GpaCard t={t} />
            <CreditsCard t={t} plan={plan} setPlan={setPlan} />
          </aside>
        </div>
      </div>

      <footer className="border-t border-[#dadce0] bg-white">
        <div className="mx-auto max-w-[1600px] space-y-1 px-4 py-4 text-[12px] text-[#5f6368]">
          <p>
            <b className="text-[#3c4043]">Unofficial tool.</b> Your OPUS degree audit and your BBA advisor govern; if
            this tracker disagrees with them, they are right. Your sheet is stored only in this browser.
          </p>
          <p>
            Requirements last updated {updated} from{" "}
            {SOURCES.map((s, i) => (
              <span key={s.label}>
                {i > 0 && (i === SOURCES.length - 1 ? ", and " : ", ")}
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">
                    {s.label}
                  </a>
                ) : (
                  s.label
                )}
              </span>
            ))}
            .
          </p>
          <p>
            Found a mistake or have a question? Contact{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1a73e8] hover:underline">
              {CONTACT_EMAIL}
            </a>
            . This is a prototype and a work in progress;{" "}
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">
              the source is on GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
