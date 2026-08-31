"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { CalendarDays, ChevronDown } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import type { DropdownProps } from "react-day-picker";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/utils/components/Popover";
import { Button } from "@/app/utils/components/Button";
import { Calendar } from "@/app/utils/components/Calendar";
import { cn } from "@/app/utils/helpers/utils";
import type { FieldProps } from "@/app/utils/helpers/fieldTypes";

const parseDateValue = (value: unknown): Date | undefined => {
  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const dateValue = value.trim();

  try {
    const displayDate = parse(dateValue, "dd/MM/yyyy", new Date());
    if (
      isValid(displayDate) &&
      format(displayDate, "dd/MM/yyyy") === dateValue
    ) {
      return displayDate;
    }

    const apiDate = parseISO(dateValue);
    return isValid(apiDate) ? apiDate : undefined;
  } catch {
    return undefined;
  }
};

function CalendarDropdown({
  options,
  value,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLButtonElement>(null);

  const selectedValue = Number(value);
  const selectedOption = options?.find(
    (option) => option.value === selectedValue
  );
  const isYearDropdown = (options?.length ?? 0) > 12;

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || !isYearDropdown) return;

    const frame = requestAnimationFrame(() => {
      selectedItemRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [open, isYearDropdown, selectedValue]);

  const selectOption = (nextValue: number) => {
    if (!onChange) return;

    const syntheticEvent = {
      target: {
        value: String(nextValue),
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onChange(syntheticEvent);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((previous) => !previous)}
        className={cn(
          "flex h-8 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm font-medium text-foreground shadow-xs transition-colors",
          "hover:bg-accent/60 focus:outline-none focus:ring-2 focus:ring-ring/40",
          "disabled:pointer-events-none disabled:opacity-50",
          isYearDropdown ? "min-w-[72px]" : "min-w-[68px]"
        )}
      >
        <span>{selectedOption?.label ?? String(value ?? "")}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            "absolute left-1/2 top-full z-[10050] mt-[5px] -translate-x-1/2 rounded-md border bg-popover p-1.5 text-popover-foreground shadow-md outline-hidden",
            isYearDropdown ? "w-[244px]" : "w-[220px]"
          )}
        >
          <div
            className={cn(
              isYearDropdown
                ? "grid max-h-[220px] grid-cols-4 gap-1 overflow-y-auto pr-1"
                : "grid grid-cols-3 gap-1"
            )}
          >
            {options?.map((option) => {
              const isSelected = option.value === selectedValue;

              return (
                <button
                  key={option.value}
                  ref={isSelected ? selectedItemRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => selectOption(option.value)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40",
                    "disabled:pointer-events-none disabled:opacity-35",
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type DatePickerControlProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  outputFormat?: "dd/MM/yyyy" | "yyyy-MM-dd";
  allowClear?: boolean;
  className?: string;
};

export function DatePickerControl({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  readonly,
  outputFormat = "dd/MM/yyyy",
  allowClear = false,
  className,
}: DatePickerControlProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseDateValue(value);
  const currentYear = new Date().getFullYear();

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, outputFormat));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || readonly}
          className={cn(
            "h-[42px] w-full justify-between rounded-md border-gray-300 px-3 text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <span>
            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-[#103BB5]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={allowClear ? "center" : "end"}
        side={allowClear ? "left" : "bottom"}
        sideOffset={allowClear ? 12 : 6}
        collisionPadding={16}
        sticky="always"
        className="z-[9999] w-auto p-0"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          captionLayout="dropdown"
          startMonth={new Date(1990, 0, 1)}
          endMonth={new Date(currentYear + 15, 11, 31)}
          components={{
            Dropdown: CalendarDropdown,
          }}
        />

        {allowClear && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(format(new Date(), outputFormat));
                setOpen(false);
              }}
              className="text-xs font-medium text-[#103BB5] transition-opacity hover:opacity-80"
            >
              Today
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function DatepickerField({
  name,
  disabled,
  readonly,
  validation,
  required,
  placeholder,
  className,
}: FieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        ...(required ? { required: "Date is required" } : {}),
        ...validation,
      }}
      defaultValue={format(new Date(), "dd/MM/yyyy")}
      render={({ field }) => (
        <DatePickerControl
          value={field.value}
          onChange={field.onChange}
          placeholder={placeholder}
          disabled={disabled}
          readonly={readonly}
          className={className}
        />
      )}
    />
  );
}
