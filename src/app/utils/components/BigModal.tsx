"use client";

import React from "react";
import { X } from "lucide-react";

interface BigModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "lg";
  titlePrefix?: string;
}

export default function BigModal({
  open,
  onClose,
  title,
  children,
  size = "lg",
  titlePrefix = "Project Name :",
}: BigModalProps) {
  if (!open) return null;

  const widthClass = size === "sm" ? "w-[92vw] max-w-[520px]" : "w-[95vw] max-w-[1600px]";

  return (
    <div
      className="fixed inset-0 z-[40] flex justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`my-auto flex max-h-[calc(100vh-32px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${widthClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <h2 className="min-w-0 truncate text-[17px] font-semibold text-slate-900">
            {titlePrefix ? `${titlePrefix} ${title}` : title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
