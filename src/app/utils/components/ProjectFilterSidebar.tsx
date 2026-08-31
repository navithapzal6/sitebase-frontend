"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Filter as FilterIcon, RotateCcw, X } from "lucide-react";

import { Button } from "@/app/utils/components/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/utils/components/Popover";

export type ProjectFilters = {
  client_name: string;
  project_start_date: string;
  status: string;
};

export const emptyProjectFilters: ProjectFilters = {
  client_name: "",
  project_start_date: "",
  status: "",
};

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
];

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

type Props = {
  open: boolean;
  onClose: () => void;
  filters: ProjectFilters;
  onApply: (filters: ProjectFilters) => void;
};

export default function FilterSidebar({ open, onClose, filters, onApply }: Props) {
  const [draft, setDraft] = useState<ProjectFilters>(filters);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setStatusOpen(false);
    }
  }, [open, filters]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const activeCount = Object.values(filters).filter(Boolean).length;
  const selectedStatus =
    STATUS_OPTIONS.find((option) => option.value === draft.status)?.label ?? "All Status";

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
        aria-label="Filter projects"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">Filter projects</h2>
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="form-label">Client name</span>
            <input
              className={inputClass}
              placeholder="Enter client name"
              value={draft.client_name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, client_name: event.target.value }))
              }
            />
          </label>

          <label className="block">
            <span className="form-label">Project start date</span>
            <input
              className={inputClass}
              placeholder="DD/MM/YYYY"
              value={draft.project_start_date}
              onChange={(event) =>
                setDraft((current) => ({ ...current, project_start_date: event.target.value }))
              }
            />
          </label>

          <div>
            <span className="form-label">Status</span>
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-[38px] w-full justify-between px-3 text-sm font-normal"
                >
                  <span>{selectedStatus}</span>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={4} className="z-[100] w-[300px] p-1">
                {STATUS_OPTIONS.map((option) => {
                  const selected = draft.status === option.value;
                  return (
                    <button
                      key={option.value || "all"}
                      type="button"
                      onClick={() => {
                        setDraft((current) => ({ ...current, status: option.value }));
                        setStatusOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? "bg-[#103BB5]/10 font-medium text-[#103BB5]"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{option.label}</span>
                      {selected && <Check size={15} className="text-[#103BB5]" />}
                    </button>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setDraft(emptyProjectFilters);
              onApply(emptyProjectFilters);
            }}
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
