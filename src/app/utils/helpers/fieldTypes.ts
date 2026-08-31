 
 

import { RegisterOptions } from "react-hook-form";

export type Option = {
  label: string;
  value: string;
  description?: string;
};

export type FieldType =
  | "input"
  | "textarea"
  | "radio"
  | "checkbox"
  | "datepicker"
  | "typeahead"
  | "toggle";

export type FieldProps = {
  name: string;

  type: FieldType;

  placeholder?: string;

  options?: Option[] | string[];

  required?: boolean;

  validation?: RegisterOptions;

  validationType?:
    | "email"
    | "phone"
    | "onlyNumbers"
    | "onlyAlphabets"
    | "alphanumeric"
    | "pincode"
    | "aadhaar"
    | "pan"
    | "gstin"
    | "ifsc"
    | "positiveAmount"
    | "positiveInteger"
    | "password";

  readonly?: boolean;

  disabled?: boolean;

  className?: string;

  maxLength?: number;

  uppercase?: boolean;

  capitalize?: boolean;
};
 
