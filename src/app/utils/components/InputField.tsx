 
"use client";

import React from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/app/utils/components/Input";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";
import { getValidation } from "@/app/utils/helpers/fieldUtils";

export default function InputField({
  name,
  placeholder,
  required,
  validation,
  validationType,
  readonly,
  disabled,
  className,
  maxLength,
  uppercase,
  capitalize,
}: FieldProps) {
  const { control } = useFormContext();
  const cssRules = className || "";
  const limitMatch = cssRules.match(/limit-(\d+)/);
  const computedMaxLength =
    maxLength || (limitMatch ? Number(limitMatch[1]) : undefined);
  const onlyNumbers =
    cssRules.includes("only-number") || cssRules.includes("only-numbers");
  const decimalNumbers = cssRules.includes("numbers-decimal");
  const onlyAlphabets = cssRules.includes("only-alphabets");
  const alphanumeric = cssRules.includes("alphanumeric");
  const noSpace = cssRules.includes("no-space");
  const forceUppercase =
    uppercase ||
    cssRules.includes("uppercase") ||
    cssRules.includes("alphanumeric-uppercase");
  const forceCapitalize = capitalize || cssRules.includes("capitalize");

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        ...getValidation(placeholder || name, validationType, required),
        ...validation,
      }}
      render={({ field, fieldState }) => (
        <div className="w-full">
         <Input
  {...field}
  value={field.value || ""}
  placeholder={placeholder}
  disabled={disabled}
  readOnly={readonly}
  maxLength={computedMaxLength}
  inputMode={onlyNumbers ? "numeric" : decimalNumbers ? "decimal" : undefined}
  className={`
    border border-gray-300
    focus:border-[#103BB5]
    focus:ring-1
    focus:ring-[#103BB5]
    rounded-md
    h-[42px] form-label
    ${className || ""}
  `}
  onChange={(e) => {
    let value = e.target.value;

    if (onlyNumbers) {
      value = value.replace(/[^0-9]/g, "");
    }

    if (decimalNumbers) {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      value = parts.length > 1
        ? `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`
        : parts[0];
    }

    if (onlyAlphabets) {
      value = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (alphanumeric) {
      value = value.replace(/[^A-Za-z0-9]/g, "");
    }

    if (noSpace) {
      value = value.replace(/\s+/g, "");
    }

    if (forceUppercase) {
      value = value.toUpperCase();
    }

    if (forceCapitalize) {
      value = value
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
          char.toUpperCase()
        );
    }

    field.onChange(
      computedMaxLength ? value.slice(0, computedMaxLength) : value
    );
  }}
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
 

  
