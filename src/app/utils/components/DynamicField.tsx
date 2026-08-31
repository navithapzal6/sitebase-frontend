
 
"use client";

import { FieldProps } from "@/app/utils/helpers/fieldTypes";

import InputField from "@/app/utils/components/InputField";
import TextareaField from "@/app/utils/components/TextareaField";
import RadioField from "@/app/utils/components/RadioField";
import CheckboxField from "@/app/utils/components/CheckboxField";
import DatepickerField from "@/app/utils/components/DatepickerField";
import ToggleField from "@/app/utils/components/ToggleField";
import TypeaheadFieldWrapper from "@/app/utils/components/TypeaheadField";

export default function DynamicField(
  props: FieldProps
) {
  switch (props.type) {
    case "input":
      return <InputField {...props} />;

    case "textarea":
      return <TextareaField {...props} />;

    case "radio":
      return <RadioField {...props} />;

    case "checkbox":
      return <CheckboxField {...props} />;

    case "datepicker":
      return <DatepickerField {...props} />;

    case "toggle":
      return <ToggleField {...props} />;

    case "typeahead":
      return (
        <TypeaheadFieldWrapper {...props} />
      );

    default:
      return null;
  }
}

