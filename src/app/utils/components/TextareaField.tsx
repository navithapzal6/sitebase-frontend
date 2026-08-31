
"use client";

import { Controller, useFormContext } from "react-hook-form";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";
import { getValidation } from "@/app/utils/helpers/fieldUtils";

export default function TextareaField({
  name,
  placeholder,
  required,
  validation,
  validationType,
  readonly,
  disabled,
}: FieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        ...getValidation(placeholder || name, validationType, required),
        ...validation,
      }}
      render={({ field, fieldState }) => (
        <div>
          <textarea
            {...field}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            className="
              w-full
              border
              border-gray-300
              rounded-md
              px-3
              py-2
              min-h-[100px]
              resize-none
              focus:border-[#103BB5]
              outline-none
            "
          />

          {fieldState.error && (
            <p className="text-red-500 text-sm mt-1">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
