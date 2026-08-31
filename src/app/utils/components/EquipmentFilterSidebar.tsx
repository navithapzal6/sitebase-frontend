"use client";

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";

export type EquipmentFilters = {
  equipment_name: string;
  equipment_description: string;
  total_quantity: string;
  equipment_category: string;
  remarks: string;
};

export const emptyEquipmentFilters: EquipmentFilters = {
  equipment_name: "",
  equipment_description: "",
  total_quantity: "",
  equipment_category: "",
  remarks: "",
};

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: EquipmentFilters;
  onApply: (filters: EquipmentFilters) => void;
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
  const [draft, setDraft] = useState<EquipmentFilters>(filters);

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
    (key: keyof EquipmentFilters) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) =>
      setDraft((current) => ({
        ...current,
        [key]: event.target.value,
      }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(emptyEquipmentFilters);
    onApply(emptyEquipmentFilters);
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
        aria-label="Filter equipments"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">
              Filter equipments
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
          <Field label="Equipment name">
            <input
              className={inputClass}
              placeholder="e.g. Concrete Mixer"
              value={draft.equipment_name}
              onChange={update("equipment_name")}
            />
          </Field>

          <Field label="Equipment Category">
            <input
              className={inputClass}
              placeholder="Enter Category"
              value={draft.equipment_category}
              onChange={update("equipment_category")}
            />
          </Field>

          <Field label="Equipment description">
            <input
              className={inputClass}
              placeholder="Enter equipment description"
              value={draft.equipment_description}
              onChange={update("equipment_description")}
            />
          </Field>

          <Field label="Total quantity">
            <input
              className={inputClass}
              placeholder="Enter total quantity"
              value={draft.total_quantity}
              onChange={update("total_quantity")}
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