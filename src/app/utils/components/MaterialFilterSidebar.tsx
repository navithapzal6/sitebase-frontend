"use client";

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";

export type MaterialFilters = {
  material_name: string;
  material_category: string;
  material_description: string;
  unit_of_measurement: string;
  minimum_stock_level: string;
  reorder_level: string;
  remarks: string;
};

export const emptyMaterialFilters: MaterialFilters = {
  material_name: "",
  material_category:"",
  material_description: "",
  unit_of_measurement: "",
  minimum_stock_level: "",
  reorder_level: "",
  remarks: "",
};

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: MaterialFilters;
  onApply: (filters: MaterialFilters) => void;
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
  const [draft, setDraft] = useState<MaterialFilters>(filters);

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
    (key: keyof MaterialFilters) =>
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
    setDraft(emptyMaterialFilters);
    onApply(emptyMaterialFilters);
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
        aria-label="Filter materials"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">
              Filter materials
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
          <Field label="Material name">
            <input
              className={inputClass}
              placeholder="Enter material name"
              value={draft.material_name}
              onChange={update("material_name")}
            />
          </Field>

          <Field label="Material category">
            <input
              className={inputClass}
              placeholder="Enter material category"
              value={draft.material_name}
              onChange={update("material_category")}
            />
          </Field>

          <Field label="Material description">
            <input
              className={inputClass}
              placeholder="Enter material description"
              value={draft.material_description}
              onChange={update("material_description")}
            />
          </Field>

          <Field label="Unit of measurement">
            <input
              className={inputClass}
              placeholder="e.g. Kg, Ton, Nos"
              value={draft.unit_of_measurement}
              onChange={update("unit_of_measurement")}
            />
          </Field>

          <Field label="Minimum stock level">
            <input
              className={inputClass}
              placeholder="Enter minimum stock level"
              value={draft.minimum_stock_level}
              onChange={update("minimum_stock_level")}
              inputMode="numeric"
            />
          </Field>

          <Field label="Reorder level">
            <input
              className={inputClass}
              placeholder="Enter reorder level"
              value={draft.reorder_level}
              onChange={update("reorder_level")}
              inputMode="numeric"
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
