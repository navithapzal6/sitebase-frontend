
"use client";

import { useFormContext } from "react-hook-form";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";
import { normalizeOptions } from "@/app/utils/helpers/fieldHelpers";

export default function RadioField({
  name,
  options,
  disabled,
  readonly,
}: FieldProps) {
  const { register } = useFormContext();

  const opts = normalizeOptions(options);

  return (
    <div className="flex gap-4">
      {opts.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2"
        >
          <input
            type="radio"
            value={opt.value}
            {...register(name)}
            disabled={disabled || readonly}
            className="accent-[#103BB5]"
          />

          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}