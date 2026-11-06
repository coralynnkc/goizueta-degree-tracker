"use client";

// Spreadsheet-style cells: native selects and inputs styled to look like Google Sheets
// dropdown chips, so they stay keyboard- and screen-reader-accessible.

import type { ReactNode } from "react";
import type { Status } from "@/lib/plan";

export const STATUS: { value: Status; label: string; chip: string }[] = [
  { value: "", label: "Not started", chip: "bg-[#e6e6e6] text-[#3c4043]" },
  { value: "planned", label: "Planned", chip: "bg-[#bfe1f6] text-[#0a53a8]" },
  { value: "in_progress", label: "In progress", chip: "bg-[#ffe5a0] text-[#473821]" },
  { value: "completed", label: "Completed", chip: "bg-[#d4edbc] text-[#11734b]" },
  { value: "waived", label: "Waived / N/A", chip: "bg-[#e6cff2] text-[#5a3286]" },
];

const caret = "chip-select"; // caret icon lives in globals.css

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
      className={`${caret} h-6 w-full max-w-full cursor-pointer truncate rounded-full py-0 pl-2.5 pr-5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${className}`}
    >
      {children}
    </select>
  );
}

export function StatusSelect({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  const s = STATUS.find((x) => x.value === value) ?? STATUS[0];
  return (
    <ChipSelect label="Status" value={value} onChange={(v) => onChange(v as Status)} className={s.chip}>
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
      className={value ? "bg-[#f1f3f4] text-[#202124]" : "bg-transparent text-[#80868b]"}
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
      className={`h-6 w-full bg-transparent px-1 text-[13px] outline-none placeholder:text-[#9aa0a6] focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${className}`}
    />
  );
}
