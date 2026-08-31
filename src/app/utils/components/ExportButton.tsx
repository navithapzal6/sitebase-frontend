"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import type { ExportFormat } from "@/app/utils/helpers/exportTypes";

type ExportButtonProps = {
  onExport: (format: ExportFormat) => Promise<void> | void;
  loading?: boolean;
  loadingFormat?: ExportFormat | null;
  disabled?: boolean;
};

export function ExportButton({
  onExport,
  loading = false,
  loadingFormat = null,
  disabled = false,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setOpen(false);
    await onExport(format);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled || loading}
        className="primary-btn flex items-center gap-2 text-sm disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
        {loading
          ? `Preparing ${loadingFormat === "pdf" ? "PDF" : loadingFormat === "excel" ? "Excel" : "Export"}...`
          : "Export"}
        {!loading && <ChevronDown size={14} />}
      </button>

      {open && !loading && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[170px] overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
          >
            <FileSpreadsheet size={16} className="text-primary" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
          >
            <FileText size={16} className="text-primary" />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}