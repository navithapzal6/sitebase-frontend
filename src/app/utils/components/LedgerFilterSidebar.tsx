"use client";

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";

import { LEDGER_TYPE_OPTIONS } from "@/app/utils/helpers/ledgerConfig";

export type LedgerFilters = {
  ledger_type: string;
};

export const emptyLedgerFilters: LedgerFilters = {
  ledger_type: "",
};

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: LedgerFilters;
  onApply: (filters: LedgerFilters) => void;
};

const selectClass =
  "h-[38px] w-full rounded-md border border-input bg-background px-3 text-sm text-foreground " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

export default function FilterSidebar({
  open,
  onClose,
  filters,
  onApply,
}: FilterSidebarProps) {
  const [draft, setDraft] = useState<LedgerFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(emptyLedgerFilters);
    onApply(emptyLedgerFilters);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[340px] flex-col border-l border-border bg-card text-card-foreground shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter ledgers"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">Filter ledgers</h2>
            {activeCount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary">
                {activeCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="form-label">Ledger type</span>
            <select
              className={selectClass}
              value={draft.ledger_type}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ledger_type: event.target.value,
                }))
              }
            >
              {LEDGER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button type="button" onClick={handleApply} className="primary-btn flex-1 text-sm">
            Apply filters
          </button>
        </div>
      </aside>
    </>
  );
}
