"use client";

// The student's plan: the only state that persists. It lives in localStorage
// (one plan per browser) and can be exported/imported as JSON so someone can
// move it to another laptop during testing.

import { useEffect, useRef, useState } from "react";

export type CourseStatus = "completed" | "in_progress" | "planned";

export interface PlannedCourse {
  status: CourseStatus;
  term: string | null; // a key into Plan.terms; null for completed courses with no term recorded
}

export interface Plan {
  version: 1;
  programIds: string[]; // one for now; an array so a second major/minor fits later
  terms: string[]; // ordered term labels, e.g. ["Spring 2027", "Fall 2027"]
  courses: Record<string, PlannedCourse>; // keyed by Course.id
  hideCompleted: boolean; // shared by both views
}

const STORAGE_KEY = "gdt.plan.v1";
const SAVE_DEBOUNCE_MS = 300;

export const emptyPlan = (): Plan => ({
  version: 1,
  programIds: [],
  terms: [],
  courses: {},
  hideCompleted: false,
});

export function parsePlan(raw: string): Plan | null {
  try {
    const p = JSON.parse(raw);
    if (p?.version !== 1 || typeof p.courses !== "object" || !Array.isArray(p.terms)) return null;
    return { ...emptyPlan(), ...p };
  } catch {
    return null;
  }
}

// localStorage can throw (private windows, blocked storage), so every access is guarded.
function loadPlan(): Plan {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return (raw && parsePlan(raw)) || emptyPlan();
  } catch {
    return emptyPlan();
  }
}

function savePlan(plan: Plan) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Nothing useful to do; the plan still works for this tab.
  }
}

/** Plan state backed by localStorage. `loaded` is false until the first read, which avoids a hydration mismatch. */
export function usePlan() {
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage has to wait until after hydration
    setPlan(loadPlan());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => savePlan(plan), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [plan, loaded]);

  return { plan, setPlan, loaded };
}

export function exportPlan(plan: Plan): string {
  return JSON.stringify(plan, null, 2);
}
