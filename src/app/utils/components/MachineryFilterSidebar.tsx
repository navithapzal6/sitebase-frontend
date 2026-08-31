"use client";

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";
import { DatePickerControl } from "@/app/utils/components/DatepickerField";

export type MachineryFilters = {
  machinery_name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
};

export const emptyMachineryFilters: MachineryFilters = {
  machinery_name: "",
  manufacturer: "",
  model: "",
  serial_number: "",
  purchase_date: "",
  last_maintenance_date: "",
  next_maintenance_date: "",
};

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: MachineryFilters;
  onApply: (filters: MachineryFilters) => void;
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

export default function FilterSidebar({
  open,
  onClose,
  filters,
  onApply,
}: FilterSidebarProps) {
  const [draft, setDraft] = useState<MachineryFilters>(filters);

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

  const update =
    (key: keyof MachineryFilters) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setDraft((current) => ({
        ...current,
        [key]: event.target.value,
      }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(emptyMachineryFilters);
    onApply(emptyMachineryFilters);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
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
        aria-label="Filter machineries"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">
              Filter machineries
            </h2>

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
          <Field label="Machinery name">
            <input
              className={inputClass}
              placeholder="Enter machinery name"
              value={draft.machinery_name}
              onChange={update("machinery_name")}
            />
          </Field>

          <Field label="Manufacturer">
            <input
              className={inputClass}
              placeholder="Enter manufacturer"
              value={draft.manufacturer}
              onChange={update("manufacturer")}
            />
          </Field>

          <Field label="Model">
            <input
              className={inputClass}
              placeholder="Enter model"
              value={draft.model}
              onChange={update("model")}
            />
          </Field>

          <Field label="Serial number">
            <input
              className={inputClass}
              placeholder="Enter serial number"
              value={draft.serial_number}
              onChange={update("serial_number")}
            />
          </Field>

          <Field label="Purchase date">
            <DatePickerControl
              value={draft.purchase_date}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  purchase_date: value,
                }))
              }
              placeholder="Select purchase date"
              outputFormat="yyyy-MM-dd"
              allowClear
              className="h-[38px] text-[14px] shadow-sm"
            />
          </Field>

          <Field label="Last maintenance date">
            <DatePickerControl
              value={draft.last_maintenance_date}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  last_maintenance_date: value,
                }))
              }
              placeholder="Select last maintenance date"
              outputFormat="yyyy-MM-dd"
              allowClear
              className="h-[38px] text-[14px] shadow-sm"
            />
          </Field>

          <Field label="Next maintenance date">
            <DatePickerControl
              value={draft.next_maintenance_date}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  next_maintenance_date: value,
                }))
              }
              placeholder="Select next maintenance date"
              outputFormat="yyyy-MM-dd"
              allowClear
              className="h-[38px] text-[14px] shadow-sm"
            />
          </Field>
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
            onClick={handleApply}
            className="primary-btn flex-1 text-sm"
          >
            Apply filters
          </button>
        </div>
      </aside>
    </>
  );
}
