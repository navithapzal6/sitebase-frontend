
"use client";

import { Controller, useFormContext } from "react-hook-form";

import ToggleSwitch from "@/app/utils/components/Switch";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";

export default function ToggleField({
  name,
  disabled,
  readonly,
  placeholder,
}: FieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <ToggleSwitch
            checked={field.value}
            disabled={disabled || readonly}
            onChange={field.onChange}
          />

          <span>{placeholder}</span>
        </div>
      )}
    />
  );
}