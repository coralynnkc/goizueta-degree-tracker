"use client";

import { Fragment, type Dispatch, type SetStateAction } from "react";
import { BUSINESS_ELECTIVES, COURSE_BY_ID } from "@/data/catalog";
import { DEPTHS, DEPTH_BY_ID, type Depth } from "@/data/depths";
import { SECTIONS, type Subsection } from "@/data/requirements";
import { OTHER, type Plan, type RowState } from "@/lib/plan";
import {
  allRows,
  depthChecks,
  electiveTally,
  GRADES,
  isDone,
  progress,
  resolve,
  rowWarnings,
  terms,
  type SheetRow,
  type Warnings,
} from "@/lib/sheet";
import { ChipSelect, PlainSelect, StatusSelect, TextCell } from "./cells";

const TERMS = terms();
const COLUMNS = ["Requirement", "Course", "Title / notes", "Credits", "Term", "Status", "Grade"];
const GRID = "grid grid-cols-[44px_220px_190px_minmax(220px,1fr)_64px_124px_124px_88px]";

const courseLabel = (id: string) => {
  const c = COURSE_BY_ID.get(id);
  return c ? `${c.code} · ${c.title}${c.immersive ? " ★" : ""}` : id;
};

type SetPlan = Dispatch<SetStateAction<Plan>>;

export function Sheet({ plan, setPlan }: { plan: Plan; setPlan: SetPlan }) {
  const rows = allRows(plan);
  const warnings = rowWarnings(plan, rows);
  let rowNum = 1; // row 1 is the column header
  const nextNum = () => ++rowNum;

  const updateRow = (id: string, patch: Partial<RowState>) =>
    setPlan((p) => ({ ...p, rows: { ...p.rows, [id]: { ...p.rows[id], ...patch } } }));

  const addRow = (subId: string) =>
    setPlan((p) => {
      const id = `${subId}:x${Date.now().toString(36)}`;
      return { ...p, extra: { ...p.extra, [subId]: [...(p.extra[subId] ?? []), id] } };
    });

  const removeRow = (subId: string, rowId: string) =>
    setPlan((p) => {
      const rest = { ...p.rows };
      delete rest[rowId];
      return { ...p, rows: rest, extra: { ...p.extra, [subId]: (p.extra[subId] ?? []).filter((x) => x !== rowId) } };
    });

  const rowsOf = (pred: (r: SheetRow) => boolean) => rows.filter(pred);
  const visible = (r: SheetRow) => !(plan.hideCompleted && isDone(plan.rows[r.def.id]?.status));

  const renderRows = (list: SheetRow[], sub?: Subsection) =>
    list.filter(visible).map((r) => (
      <Row
        key={r.def.id}
        num={nextNum()}
        row={r}
        state={plan.rows[r.def.id] ?? {}}
        warnings={warnings}
        onChange={(patch) => updateRow(r.def.id, patch)}
        onRemove={r.removable && sub ? () => removeRow(sub.id, r.def.id) : undefined}
      />
    ));

  return (
    <div className="overflow-x-auto rounded-md border border-[#dadce0] bg-white">
      <div className="min-w-[1080px] text-[13px] text-[#202124]" role="table" aria-label="Degree requirements">
        {/* Sheets-style column letters and headers */}
        <div className={`${GRID} sticky top-0 z-10 border-b border-[#c7c7c7] bg-[#f8f9fa] text-[11px] text-[#5f6368]`} role="row">
          <div className="border-r border-[#e2e3e3]" />
          {COLUMNS.map((_, i) => (
            <div key={i} className="border-r border-[#e2e3e3] py-0.5 text-center">
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <div className={`${GRID} border-b border-[#c7c7c7] bg-[#f8f9fa] font-semibold`} role="row">
          <div className="border-r border-[#e2e3e3] py-1.5 text-center text-[11px] font-normal text-[#5f6368]">1</div>
          {COLUMNS.map((c) => (
            <div key={c} className="border-r border-[#e2e3e3] px-2 py-1.5" role="columnheader">
              {c}
            </div>
          ))}
        </div>

        {SECTIONS.map((section) => {
          const sectionRows = rowsOf((r) => r.sectionId === section.id);
          return (
            <Fragment key={section.id}>
              <SectionHeader num={nextNum()} title={section.title} {...progress(plan, sectionRows)} />
              {section.subsections.map((sub) => {
                const subRows = rowsOf((r) => r.subsectionId === sub.id);
                return (
                  <Fragment key={sub.id}>
                    <SubHeader num={nextNum()} title={sub.title} note={sub.note} {...progress(plan, subRows)}>
                      {sub.id === "bba-electives" && <ElectiveSummary plan={plan} rows={rows} />}
                    </SubHeader>
                    {renderRows(subRows, sub)}
                    {sub.addable && (
                      <AddRow num={nextNum()} label={`Add ${sub.addable.label.toLowerCase()}`} onClick={() => addRow(sub.id)} />
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}

        <SectionHeader
          num={nextNum()}
          title="Area Depth Requirements"
          {...progress(plan, rowsOf((r) => r.sectionId === "depth"))}
        >
          <DepthPicker plan={plan} setPlan={setPlan} />
        </SectionHeader>
        {plan.depths.length === 0 && (
          <Line num={nextNum()}>
            <span className="text-[#5f6368]">Choose an area depth above to add its rows. You can add more than one.</span>
          </Line>
        )}
        {plan.depths.map((id) => {
          const depth = DEPTH_BY_ID.get(id);
          if (!depth) return null;
          const subRows = rowsOf((r) => r.subsectionId === `depth:${id}`);
          return (
            <Fragment key={id}>
              <SubHeader
                num={nextNum()}
                title={`${depth.name} (${depth.kind.toLowerCase()})`}
                note={[depth.flexCore?.note, ...depth.notes].filter(Boolean).join(" ")}
                {...progress(plan, subRows)}
              >
                <button
                  type="button"
                  onClick={() => setPlan((p) => ({ ...p, depths: p.depths.filter((d) => d !== id) }))}
                  className="rounded px-1.5 text-[12px] text-[#5f6368] hover:bg-[#e8eaed]"
                >
                  Remove depth
                </button>
              </SubHeader>
              <Line num={nextNum()}>
                <DepthChecks plan={plan} depth={depth} />
              </Line>
              {renderRows(subRows)}
            </Fragment>
          );
        })}
      </div>

      <datalist id="dl-business">
        {BUSINESS_ELECTIVES.map((id) => (
          <option key={id} value={COURSE_BY_ID.get(id)!.code}>
            {COURSE_BY_ID.get(id)!.title}
          </option>
        ))}
      </datalist>
    </div>
  );
}

function Row({
  num,
  row,
  state,
  warnings,
  onChange,
  onRemove,
}: {
  num: number;
  row: SheetRow;
  state: RowState;
  warnings: Warnings;
  onChange: (p: Partial<RowState>) => void;
  onRemove?: () => void;
}) {
  const { def } = row;
  const r = resolve(def, state);
  const warn = warnings.get(def.id) ?? [];
  const isBridge = warn.length === 1 && warn[0].startsWith("Bridge");
  const cell = "border-r border-b border-[#e2e3e3] px-1.5 flex items-center min-w-0";

  return (
    <div className={`${GRID} group hover:bg-[#f8fbff]`} role="row">
      <div className={`${cell} justify-center bg-[#f8f9fa] text-[11px] text-[#5f6368]`}>{num}</div>
      <div className={`${cell} gap-1 px-2`} title={def.note}>
        <span className="truncate">{def.label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${def.label}`}
            className="ml-auto shrink-0 rounded px-1 text-[#5f6368] opacity-0 hover:bg-[#e8eaed] focus:opacity-100 group-hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
      <div className={cell}>
        <CourseCell row={row} state={state} onChange={onChange} />
      </div>
      <div className={`${cell} flex-col items-start justify-center py-1`}>
        {state.course === OTHER ? (
          <TextCell
            label="Approved course code"
            value={state.text ?? ""}
            placeholder="Type the approved course code"
            onChange={(text) => onChange({ text })}
          />
        ) : (
          <div className="flex w-full items-center gap-1.5">
            <span className="truncate">{r?.title || (r ? "" : <span className="text-[#9aa0a6]">{def.note}</span>)}</span>
            {row.depth && state.course && row.depth.depth.related.includes(state.course) && !def.options?.includes(state.course) && (
              <span className="shrink-0 rounded-full bg-[#e8eaed] px-1.5 text-[10px] font-medium text-[#3c4043]">Related</span>
            )}
            {r?.immersive && (
              <span className="shrink-0 rounded-full bg-[#fde4cf] px-1.5 text-[10px] font-medium text-[#8a3c00]">Immersive</span>
            )}
          </div>
        )}
        {(r?.note || warn.length > 0) && (
          <span className={`truncate text-[11px] ${warn.length && !isBridge ? "text-[#c5221f]" : "text-[#5f6368]"}`}>
            {[...warn, r?.note].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
      <div className={cell}>
        <input
          aria-label="Credits"
          type="number"
          min={0}
          step={0.5}
          value={r ? r.credits : ""}
          disabled={!r}
          onChange={(e) => onChange({ credits: e.target.value === "" ? undefined : Number(e.target.value) })}
          className="h-6 w-full bg-transparent text-right text-[13px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
        />
      </div>
      <div className={cell}>
        <PlainSelect label="Term" placeholder="Term" value={state.term ?? ""} options={TERMS} onChange={(term) => onChange({ term })} />
      </div>
      <div className={cell}>
        <StatusSelect value={state.status ?? ""} onChange={(status) => onChange({ status })} />
      </div>
      <div className={cell}>
        <PlainSelect label="Grade" placeholder="—" value={state.grade ?? ""} options={GRADES} onChange={(grade) => onChange({ grade })} />
      </div>
    </div>
  );
}

function CourseCell({ row, state, onChange }: { row: SheetRow; state: RowState; onChange: (p: Partial<RowState>) => void }) {
  const { def } = row;
  if (def.fixed) return <span className="px-1 font-medium">{COURSE_BY_ID.get(def.fixed)?.code}</span>;

  if (def.freeText) {
    const listId = def.suggestions ? `dl-${def.id}` : row.removable ? "dl-business" : undefined;
    return (
      <>
        <TextCell
          label={`${def.label} course`}
          value={state.text ?? ""}
          placeholder={def.suggestions ? `e.g. ${def.suggestions[0]}` : "Course code"}
          list={listId}
          onChange={(text) => onChange({ text, credits: undefined })}
          className="font-medium"
        />
        {def.suggestions && (
          <datalist id={listId}>
            {def.suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </>
    );
  }

  const depth = row.depth?.depth;
  const slot = row.depth ? depth!.slots[row.depth.slot] : undefined;
  const options = def.options ?? [];
  const related = slot?.related ? depth!.related.filter((id) => !options.includes(id)) : [];
  const other = slot?.related ? depth!.otherRelated : undefined;

  return (
    <ChipSelect
      label={`${def.label} course`}
      value={state.course ?? ""}
      onChange={(course) => onChange({ course: course || undefined, credits: undefined })}
      className={state.course ? "bg-[#f1f3f4] font-medium text-[#202124]" : "bg-transparent text-[#80868b]"}
    >
      <option value="">Choose a course</option>
      {related.length || other ? (
        <optgroup label="Courses">
          {options.map((id) => (
            <option key={id} value={id}>
              {courseLabel(id)}
            </option>
          ))}
        </optgroup>
      ) : (
        options.map((id) => (
          <option key={id} value={id}>
            {courseLabel(id)}
          </option>
        ))
      )}
      {related.length > 0 && (
        <optgroup label="Related courses (only one may count)">
          {related.map((id) => (
            <option key={id} value={id}>
              {courseLabel(id)}
            </option>
          ))}
        </optgroup>
      )}
      {other && (
        <optgroup label="Other">
          <option value={OTHER}>{other}</option>
        </optgroup>
      )}
    </ChipSelect>
  );
}

function Line({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[44px_1fr] border-b border-[#e2e3e3]" role="row">
      <div className="flex items-center justify-center border-r border-[#e2e3e3] bg-[#f8f9fa] text-[11px] text-[#5f6368]">{num}</div>
      <div className="px-2 py-1.5 text-[12px]">{children}</div>
    </div>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <span className="ml-2 shrink-0 text-[12px] font-normal tabular-nums text-[#5f6368]">
      {done} / {total} done
    </span>
  );
}

function SectionHeader({
  num,
  title,
  done,
  total,
  children,
}: {
  num: number;
  title: string;
  done: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[44px_1fr] border-b border-[#c7c7c7] bg-[#174e3c] text-white" role="row">
      <div className="flex items-center justify-center bg-[#f8f9fa] text-[11px] text-[#5f6368]">{num}</div>
      <div className="flex flex-wrap items-center gap-2 px-2 py-2">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        <span className="text-[12px] tabular-nums text-[#c8e6d6]">
          {done} / {total} done
        </span>
        <div className="ml-auto">{children}</div>
      </div>
    </div>
  );
}

function SubHeader({
  num,
  title,
  note,
  done,
  total,
  children,
}: {
  num: number;
  title: string;
  note?: string;
  done: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[44px_1fr] border-b border-[#e2e3e3] bg-[#e6f4ea]" role="row">
      <div className="flex items-center justify-center border-r border-[#e2e3e3] bg-[#f8f9fa] text-[11px] text-[#5f6368]">{num}</div>
      <div className="px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-x-2">
          <h3 className="font-semibold">{title}</h3>
          <Progress done={done} total={total} />
          <div className="ml-auto flex items-center gap-2">{children}</div>
        </div>
        {note && <p className="mt-0.5 text-[12px] text-[#3c4043]">{note}</p>}
      </div>
    </div>
  );
}

function AddRow({ num, label, onClick }: { num: number; label: string; onClick: () => void }) {
  return (
    <Line num={num}>
      <button type="button" onClick={onClick} className="rounded px-1 text-[#1a73e8] hover:bg-[#e8f0fe]">
        + {label}
      </button>
    </Line>
  );
}

function ElectiveSummary({ plan, rows }: { plan: Plan; rows: SheetRow[] }) {
  const t = electiveTally(plan, rows);
  const imm = t.immersive.completed ? "completed" : t.immersive.planned ? "planned" : "missing";
  return (
    <span className="text-[12px]">
      <span className={t.counted >= 6 ? "text-[#11734b]" : "text-[#3c4043]"}>
        Business electives: <b className="tabular-nums">{t.counted}</b> of 6 ({t.completed} completed)
      </span>
      <span className="mx-1.5 text-[#9aa0a6]">·</span>
      <span className={imm === "missing" ? "text-[#c5221f]" : "text-[#11734b]"}>Immersive: {imm}</span>
    </span>
  );
}

function DepthChecks({ plan, depth }: { plan: Plan; depth: Depth }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
      {depthChecks(plan, depth).map((c) => (
        <li key={c.text} className={c.ok ? "text-[#11734b]" : "text-[#c5221f]"}>
          {c.ok ? "✓" : "✗"} {c.text}
        </li>
      ))}
    </ul>
  );
}

function DepthPicker({ plan, setPlan }: { plan: Plan; setPlan: SetPlan }) {
  const available = DEPTHS.filter((d) => !plan.depths.includes(d.id));
  if (!available.length) return null;
  return (
    <select
      aria-label="Add an area depth"
      value=""
      onChange={(e) => e.target.value && setPlan((p) => ({ ...p, depths: [...p.depths, e.target.value] }))}
      className="chip-select h-7 cursor-pointer appearance-none rounded-full bg-white py-0 pl-3 pr-6 text-[12px] text-[#174e3c] outline-none focus-visible:ring-2 focus-visible:ring-[#8ab4f8]"
    >
      <option value="">+ Add an area depth</option>
      {(["Functional", "Interdisciplinary"] as const).map((kind) => (
        <optgroup key={kind} label={kind}>
          {available
            .filter((d) => d.kind === kind)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}
