"use client";

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";

export type UserAccessFilters = {
  staff_name: string;
  access_status: "" | "1" | "2";
};

export const emptyUserAccessFilters: UserAccessFilters = {
  staff_name: "",
  access_status: "",
};

type UserAccessFilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: UserAccessFilters;
  onApply: (filters: UserAccessFilters) => void;
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "1" },
  { label: "Inactive", value: "2" },
] as const;

export default function UserAccessFilterSidebar({
  open,
  onClose,
  filters,
  onApply,
}: UserAccessFilterSidebarProps) {
  const [draft, setDraft] = useState<UserAccessFilters>(filters);

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

  const handleReset = () => {
    setDraft(emptyUserAccessFilters);
    onApply(emptyUserAccessFilters);
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
        aria-label="Filter user access"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">Filter user access</h2>
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

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="form-label">Staff name</span>
            <input
              className={inputClass}
              placeholder="Search staff name"
              value={draft.staff_name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  staff_name: event.target.value,
                }))
              }
            />
          </label>

          <div>
            <span className="form-label">Access status</span>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => {
                const active = draft.access_status === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        access_status: option.value,
                      }))
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-[#103BB5] bg-[#103BB5]/8 text-[#103BB5]"
                        : "border-border bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
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
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="primary-btn flex-1 text-sm"
          >
            Apply filters
          </button>
        </div>
      </aside>
    </>
  );
}
