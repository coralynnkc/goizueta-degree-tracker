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
import { ChipSelect, focusRing, PlainSelect, StatusSelect, TextCell } from "./cells";

const TERMS = terms();
const COLUMNS = ["Requirement", "Course", "Title / notes", "Credits", "Term", "Status", "Grade"];
const GRID = "grid grid-cols-[200px_200px_minmax(220px,1fr)_64px_124px_124px_84px]";

const courseLabel = (id: string) => {
  const c = COURSE_BY_ID.get(id);
  return c ? `${c.code} · ${c.title}${c.immersive ? " ★" : ""}` : id;
};

type SetPlan = Dispatch<SetStateAction<Plan>>;

export function Sheet({ plan, setPlan }: { plan: Plan; setPlan: SetPlan }) {
  const rows = allRows(plan);
  const warnings = rowWarnings(plan, rows);

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
        row={r}
        state={plan.rows[r.def.id] ?? {}}
        warnings={warnings}
        onChange={(patch) => updateRow(r.def.id, patch)}
        onRemove={r.removable && sub ? () => removeRow(sub.id, r.def.id) : undefined}
      />
    ));

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <div className="min-w-[1000px] text-[13px] text-ink" role="table" aria-label="Degree requirements">
        <div className={`${GRID} border-b border-line px-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted`} role="row">
          {COLUMNS.map((c) => (
            <div key={c} className="px-2 py-2.5" role="columnheader">
              {c}
            </div>
          ))}
        </div>

        {SECTIONS.map((section) => {
          const sectionRows = rowsOf((r) => r.sectionId === section.id);
          return (
            <Fragment key={section.id}>
              <SectionHeader title={section.title} {...progress(plan, sectionRows)} />
              {section.subsections.map((sub) => {
                const subRows = rowsOf((r) => r.subsectionId === sub.id);
                return (
                  <Fragment key={sub.id}>
                    <SubHeader title={sub.title} note={sub.note} {...progress(plan, subRows)}>
                      {sub.id === "bba-electives" && <ElectiveSummary plan={plan} rows={rows} />}
                    </SubHeader>
                    {renderRows(subRows, sub)}
                    {sub.addable && (
                      <AddRow label={`Add ${sub.addable.label.toLowerCase()}`} onClick={() => addRow(sub.id)} />
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}

        <SectionHeader
            title="Area Depth Requirements"
          {...progress(plan, rowsOf((r) => r.sectionId === "depth"))}
        >
          <DepthPicker plan={plan} setPlan={setPlan} />
        </SectionHeader>
        {plan.depths.length === 0 && (
          <Line>
            <span className="text-muted">Choose an area depth above to add its rows. You can add more than one.</span>
          </Line>
        )}
        {plan.depths.map((id) => {
          const depth = DEPTH_BY_ID.get(id);
          if (!depth) return null;
          const subRows = rowsOf((r) => r.subsectionId === `depth:${id}`);
          return (
            <Fragment key={id}>
              <SubHeader
                        title={`${depth.name} (${depth.kind.toLowerCase()})`}
                note={[depth.flexCore?.note, ...depth.notes].filter(Boolean).join(" ")}
                {...progress(plan, subRows)}
              >
                <button
                  type="button"
                  onClick={() => setPlan((p) => ({ ...p, depths: p.depths.filter((d) => d !== id) }))}
                  className="rounded-md px-2 py-0.5 text-[12px] text-muted hover:bg-bad-50 hover:text-bad"
                >
                  Remove depth
                </button>
              </SubHeader>
              <Line>
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
  row,
  state,
  warnings,
  onChange,
  onRemove,
}: {
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
  const cell = "px-1 py-1 flex items-center min-w-0";

  return (
    <div className={`${GRID} group border-b border-line px-2 transition-colors last:border-b-0 hover:bg-brand-50/40`} role="row">
      <div className={`${cell} gap-1 px-2`} title={def.note}>
        <span className="truncate text-muted">{def.label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${def.label}`}
            className="ml-auto shrink-0 rounded px-1.5 text-faint opacity-0 hover:bg-bad-50 hover:text-bad focus:opacity-100 group-hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
      <div className={cell}>
        <CourseCell row={row} state={state} onChange={onChange} />
      </div>
      <div className={`${cell} flex-col items-start justify-center px-2`}>
        {state.course === OTHER ? (
          <TextCell
            label="Approved course code"
            value={state.text ?? ""}
            placeholder="Type the approved course code"
            onChange={(text) => onChange({ text })}
          />
        ) : (
          <div className="flex w-full items-center gap-1.5">
            <span className="truncate">{r?.title || (r ? "" : <span className="text-faint">{def.note}</span>)}</span>
            {row.depth && state.course && row.depth.depth.related.includes(state.course) && !def.options?.includes(state.course) && (
              <span className="shrink-0 rounded-full border border-line px-1.5 text-[10px] font-medium text-muted">Related</span>
            )}
            {r?.immersive && (
              <span className="shrink-0 rounded-full bg-gold-50 px-1.5 text-[10px] font-medium text-gold-700">Immersive</span>
            )}
          </div>
        )}
        {(r?.note || warn.length > 0) && (
          <span className={`truncate text-[11px] ${warn.length && !isBridge ? "text-bad" : "text-muted"}`}>
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
          className={`h-7 w-full rounded-md bg-transparent px-1 text-right text-[13px] tabular-nums hover:bg-surface disabled:hover:bg-transparent ${focusRing}`}
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
  if (def.fixed) return <span className="px-2 font-medium">{COURSE_BY_ID.get(def.fixed)?.code}</span>;

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
      className={state.course ? "font-medium text-ink hover:bg-surface" : "text-faint hover:bg-surface"}
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

function Line({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-4 py-2 text-[12px]" role="row">
      {children}
    </div>
  );
}

function Meter({ done, total }: { done: number; total: number }) {
  const pct = total ? (done / total) * 100 : 0;
  return (
    <span className="flex shrink-0 items-center gap-2 text-[12px] font-normal tabular-nums text-muted">
      <span className="h-1 w-12 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </span>
      {done}/{total}
    </span>
  );
}

function SectionHeader({
  title,
  done,
  total,
  children,
}: {
  title: string;
  done: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-brand px-4 py-3 text-white" role="row">
      <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
      <span className="flex items-center gap-2 text-[12px] tabular-nums text-white/70">
        <span className="h-1 w-12 overflow-hidden rounded-full bg-white/20" aria-hidden>
          <span className="block h-full rounded-full bg-gold" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </span>
        {done}/{total}
      </span>
      <div className="ml-auto">{children}</div>
    </div>
  );
}

function SubHeader({
  title,
  note,
  done,
  total,
  children,
}: {
  title: string;
  note?: string;
  done: number;
  total: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface px-4 py-2.5" role="row">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <Meter done={done} total={total} />
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
      {note && <p className="mt-0.5 max-w-4xl text-[12px] leading-snug text-muted">{note}</p>}
    </div>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Line>
      <button type="button" onClick={onClick} className="rounded-md px-1.5 py-0.5 font-medium text-brand hover:bg-brand-50">
        + {label}
      </button>
    </Line>
  );
}

function ElectiveSummary({ plan, rows }: { plan: Plan; rows: SheetRow[] }) {
  const t = electiveTally(plan, rows);
  const imm = t.immersive.completed ? "completed" : t.immersive.planned ? "planned" : "missing";
  return (
    <span className="flex items-center gap-2 text-[12px]">
      <span className={t.counted >= 6 ? "text-good" : "text-muted"}>
        Business electives <b className="tabular-nums">{t.counted}</b>/6 ({t.completed} done)
      </span>
      <span className="text-faint">·</span>
      <span className={imm === "missing" ? "text-bad" : "text-good"}>Immersive {imm}</span>
    </span>
  );
}

function DepthChecks({ plan, depth }: { plan: Plan; depth: Depth }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
      {depthChecks(plan, depth).map((c) => (
        <li key={c.text} className={c.ok ? "text-good" : "text-bad"}>
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
      className="chip-select h-7 cursor-pointer appearance-none rounded-md bg-white py-0 pl-3 pr-7 text-[12px] font-medium text-brand outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
