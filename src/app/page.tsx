"use client";

import bundle from "@/data/bundle.json";
import type { Bundle } from "@/lib/types";
import { usePlan } from "@/lib/plan";

const data = bundle as Bundle;

export default function Home() {
  const { plan, loaded } = usePlan();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Goizueta Degree Tracker</h1>
      <p className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        Unofficial tool. Your official degree audit and your advisor govern; if this tracker disagrees
        with them, they are right. Your plan is saved only in this browser.
      </p>

      <section className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Loaded {data.programs.length} programs, {data.requirements.length} requirements,{" "}
          {data.courses.length} courses.
        </p>
        <p>{loaded ? `Plan has ${Object.keys(plan.courses).length} courses.` : "Loading plan…"}</p>
        <p className="mt-4">Requirement checklist and semester planner go here.</p>
      </section>
    </main>
  );
}
