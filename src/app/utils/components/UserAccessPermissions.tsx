"use client";

import { Check } from "lucide-react";

export type PermissionItem = {
  key: string;
  label: string;
  route?: string;
};

export type PermissionGroup = {
  module: string;
  items: PermissionItem[];
};

type UserAccessPermissionsProps = {
  groups: PermissionGroup[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  disabled?: boolean;
};

function AccessCheckbox({
  checked,
  indeterminate = false,
  onClick,
  label,
  disabled = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      aria-pressed={checked}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
          checked || indeterminate
            ? "border-[#103BB5] bg-[#103BB5] text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        {indeterminate ? (
          <span className="h-[1.5px] w-2 rounded bg-white" />
        ) : (
          <Check size={11} strokeWidth={3} />
        )}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function UserAccessPermissions({
  groups,
  selected,
  onChange,
  disabled = false,
}: UserAccessPermissionsProps) {
  const toggleItem = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  };

  const toggleGroup = (group: PermissionGroup) => {
    const keys = group.items.map((item) => item.key);
    const allSelected = keys.length > 0 && keys.every((key) => selected.has(key));
    const next = new Set(selected);

    keys.forEach((key) => {
      if (allSelected) next.delete(key);
      else next.add(key);
    });

    onChange(next);
  };

  if (groups.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 text-center text-sm text-slate-400">
        No permission modules available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const keys = group.items.map((item) => item.key);
        const selectedCount = keys.filter((key) => selected.has(key)).length;
        const allSelected = keys.length > 0 && selectedCount === keys.length;
        const partiallySelected = selectedCount > 0 && !allSelected;

        return (
          <section
            key={group.module}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
              <AccessCheckbox
                checked={allSelected}
                indeterminate={partiallySelected}
                onClick={() => toggleGroup(group)}
                label={group.module}
                disabled={disabled}
              />
              <span className="text-[10.5px] font-medium text-slate-400">
                {selectedCount}/{keys.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[13px] text-slate-600"
                >
                  <AccessCheckbox
                    checked={selected.has(item.key)}
                    onClick={() => toggleItem(item.key)}
                    label={item.label}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
