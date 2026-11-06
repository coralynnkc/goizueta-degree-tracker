"use client";

// Table cells: native selects and inputs styled as chips, so they stay keyboard- and
// screen-reader-accessible.

import type { ReactNode } from "react";
import type { Status } from "@/lib/plan";
import { STATUS_LABEL } from "@/lib/sheet";

const CHIP: Record<Status, string> = {
  "": "bg-surface text-muted",
  planned: "bg-brand-50 text-brand",
  in_progress: "bg-gold-50 text-gold-700",
  completed: "bg-good-50 text-good",
  waived: "bg-[#f2eff8] text-[#5b4a8a]",
};

export const STATUS = (Object.keys(STATUS_LABEL) as Status[]).map((value) => ({
  value,
  label: STATUS_LABEL[value],
  chip: CHIP[value],
}));

export const focusRing = "outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

export function ChipSelect({
  value,
  onChange,
  label,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`chip-select h-7 w-full max-w-full cursor-pointer truncate rounded-md py-0 pl-2 pr-6 text-[12.5px] transition-colors ${focusRing} ${className}`}
    >
      {children}
    </select>
  );
}

export function StatusSelect({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  return (
    <ChipSelect
      label="Status"
      value={value}
      onChange={(v) => onChange(v as Status)}
      className={`font-medium ${CHIP[value] ?? CHIP[""]}`}
    >
      {STATUS.map((x) => (
        <option key={x.value} value={x.value}>
          {x.label}
        </option>
      ))}
    </ChipSelect>
  );
}

export function PlainSelect({
  value,
  onChange,
  label,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <ChipSelect
      label={label}
      value={value}
      onChange={onChange}
      className={value ? "text-ink hover:bg-surface" : "text-faint hover:bg-surface"}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </ChipSelect>
  );
}

export function TextCell({
  value,
  onChange,
  label,
  placeholder,
  list,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  list?: string;
  className?: string;
}) {
  return (
    <input
      aria-label={label}
      value={value}
      placeholder={placeholder}
      list={list}
      onChange={(e) => onChange(e.target.value)}
      className={`h-7 w-full rounded-md bg-transparent px-2 text-[13px] placeholder:font-normal placeholder:text-faint hover:bg-surface ${focusRing} ${className}`}
    />
  );
}
