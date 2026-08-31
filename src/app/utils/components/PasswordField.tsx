"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Controller, RegisterOptions, useFormContext } from "react-hook-form";
import { Input } from "@/app/utils/components/Input";

type PasswordFieldProps = {
  name: string;
  placeholder?: string;
  validation?: RegisterOptions;
  disabled?: boolean;
};

export default function PasswordField({
  name,
  placeholder,
  validation,
  disabled = false,
}: PasswordFieldProps) {
  const { control } = useFormContext();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      rules={validation}
      render={({ field, fieldState }) => (
        <div className="w-full">
          <div className="relative">
            <Input
              {...field}
              value={field.value || ""}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="new-password"
              className="h-[42px] rounded-md border-gray-300 pr-10 focus:border-[#103BB5] focus:ring-1 focus:ring-[#103BB5]"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#103BB5] disabled:cursor-not-allowed"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldState.error && (
            <p className="mt-1 text-sm text-red-500">{String(fieldState.error.message || "")}</p>
          )}
        </div>
      )}
    />
  );
}
