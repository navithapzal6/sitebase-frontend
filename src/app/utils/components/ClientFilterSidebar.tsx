

import { useEffect, useState } from "react";
import { Filter as FilterIcon, RotateCcw, X } from "lucide-react";

import { DatePickerControl } from "@/app/utils/components/DatepickerField";

export type ClientFilters = {
  client_name: string;
  registration_id: string;
  phone_number: string;
  email: string;
  from_date: string;
  to_date: string;
};

export const emptyClientFilters: ClientFilters = {
  client_name: "",
  registration_id: "",
  phone_number: "",
  email: "",
  from_date: "",
  to_date: "",
};

type FilterSidebarProps = {
  open: boolean;
  onClose: () => void;
  filters: ClientFilters;
  onApply: (filters: ClientFilters) => void;
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

export default function ClientFilterSidebar({
  open,
  onClose,
  filters,
  onApply,
}: FilterSidebarProps) {
  const [draft, setDraft] = useState<ClientFilters>(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const updateText =
    (key: keyof ClientFilters) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDraft((previous) => ({
        ...previous,
        [key]: event.target.value,
      }));
    };

  const updateDate = (key: "from_date" | "to_date", value: string) => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(emptyClientFilters);
    onApply(emptyClientFilters);
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
        aria-label="Filter clients"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FilterIcon size={16} className="text-primary" />
            <h2 className="text-[15px] font-semibold">Filter clients</h2>

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
          <Field label="Client name">
            <input
              className={inputClass}
              placeholder="e.g. Apex Builders"
              value={draft.client_name}
              onChange={updateText("client_name")}
            />
          </Field>

          <Field label="Registration ID">
            <input
              className={inputClass}
              placeholder="e.g. REG-1001"
              value={draft.registration_id}
              onChange={updateText("registration_id")}
            />
          </Field>

          <Field label="Phone number">
            <input
              className={inputClass}
              placeholder="e.g. 9876543210"
              value={draft.phone_number}
              onChange={updateText("phone_number")}
            />
          </Field>

          <Field label="Email">
            <input
              className={inputClass}
              placeholder="e.g. accounts@apex.com"
              value={draft.email}
              onChange={updateText("email")}
            />
          </Field>

          <Field label="From date">
            <DatePickerControl
              value={draft.from_date}
              onChange={(value) => updateDate("from_date", value)}
              placeholder="DD/MM/YYYY"
              outputFormat="dd/MM/yyyy"
              allowClear
            />
          </Field>

          <Field label="To date">
            <DatePickerControl
              value={draft.to_date}
              onChange={(value) => updateDate("to_date", value)}
              placeholder="DD/MM/YYYY"
              outputFormat="dd/MM/yyyy"
              allowClear
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
