"use client";
import React from "react";

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function ToggleSwitch({ checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-5 w-10 items-center rounded-full
        transition-colors duration-300 
        ${checked ? "bg-green-600" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
          ${checked ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
}
