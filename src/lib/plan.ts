"use client";

// The student's sheet: the only state that persists. It lives in localStorage (one plan per
// browser) and can be exported/imported as JSON to move it to another device.

import { useEffect, useRef, useState } from "react";

export type Status = "" | "planned" | "in_progress" | "completed" | "waived";

export interface RowState {
  course?: string; // course id for dropdown rows; OTHER for an advisor-approved course
  text?: string; // typed course code (GER / elective rows, or OTHER)
  credits?: number; // overrides the catalog credits
  term?: string;
  status?: Status;
  grade?: string;
}

export interface Plan {
  version: 2;
  rows: Record<string, RowState>; // keyed by row id
  extra: Record<string, string[]>; // subsection id -> ids of rows the student added
  depths: string[]; // chosen area depth ids, in order
  hideCompleted: boolean;
  totalCredits: number;
}

export const OTHER = "__other";
const STORAGE_KEY = "gdt.plan.v2";
const SAVE_DEBOUNCE_MS = 300;

export const emptyPlan = (): Plan => ({
  version: 2,
  rows: {},
  extra: {},
  depths: [],
  hideCompleted: false,
  totalCredits: 128,
});

export function parsePlan(raw: string): Plan | null {
  try {
    const p = JSON.parse(raw);
    if (p?.version !== 2 || typeof p.rows !== "object" || !Array.isArray(p.depths)) return null;
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
    // The plan still works for this tab; it just won't survive a reload.
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
