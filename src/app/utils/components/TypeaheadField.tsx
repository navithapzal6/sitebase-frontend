
"use client";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";
import { normalizeOptions } from "@/app/utils/helpers/fieldHelpers";

import { TypeaheadField } from "@/app/utils/components/TypeaheadControl";

export default function TypeaheadFieldWrapper({
  name,
  options,
  placeholder,
  validation,
}: FieldProps) {
  return (
    <TypeaheadField
      name={name}
      options={normalizeOptions(options)}
      placeholder={placeholder}
      validation={validation}
    />
  );
}
