"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
};

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-left",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-left",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-right",
    totalPages,
  ];
}

export function Pagination({
  currentPage,
  pageSize,
  totalRecords,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 40, 50, 100],
  disabled = false,
}: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalRecords / pageSize), 1);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const [goToPage, setGoToPage] = useState(String(safePage));

  useEffect(() => {
    setGoToPage(String(safePage));
  }, [safePage]);

  const pageItems = useMemo(
    () => getPageItems(safePage, totalPages),
    [safePage, totalPages],
  );

  const startRecord =
    totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord =
    totalRecords === 0
      ? 0
      : Math.min(safePage * pageSize, totalRecords);

  const changePage = (page: number) => {
    if (
      disabled ||
      page < 1 ||
      page > totalPages ||
      page === safePage
    ) {
      return;
    }

    onPageChange(page);
  };

  const submitGoToPage = () => {
    const page = Number(goToPage);

    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      setGoToPage(String(safePage));
      return;
    }

    changePage(page);
  };

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-background px-3 py-2.5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>

          <select
            value={pageSize}
            disabled={disabled}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
            className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {startRecord.toLocaleString()}
          </span>
          {" – "}
          <span className="font-medium text-foreground">
            {endRecord.toLocaleString()}
          </span>
          {" of "}
          <span className="font-semibold text-primary">
            {totalRecords.toLocaleString()}
          </span>{" "}
          records
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="First page"
            title="First page"
            onClick={() => changePage(1)}
            disabled={disabled || safePage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronsLeft size={15} />
          </button>

          <button
            type="button"
            aria-label="Previous page"
            title="Previous page"
            onClick={() => changePage(safePage - 1)}
            disabled={disabled || safePage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1">
            {pageItems.map((item) => {
              if (typeof item !== "number") {
                return (
                  <span
                    key={item}
                    className="flex h-9 min-w-8 items-center justify-center px-1 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const active = item === safePage;

              return (
                <button
                  type="button"
                  key={item}
                  disabled={disabled}
                  onClick={() => changePage(item)}
                  className={`h-9 min-w-9 rounded-md border px-2 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Next page"
            title="Next page"
            onClick={() => changePage(safePage + 1)}
            disabled={disabled || safePage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight size={15} />
          </button>

          <button
            type="button"
            aria-label="Last page"
            title="Last page"
            onClick={() => changePage(totalPages)}
            disabled={disabled || safePage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronsRight size={15} />
          </button>
        </div>

        {totalPages > 7 && (
          <div className="ml-1 flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Go to page:
            </span>

            <input
              value={goToPage}
              disabled={disabled}
              inputMode="numeric"
              onChange={(event) =>
                setGoToPage(event.target.value.replace(/\D/g, ""))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitGoToPage();
                }
              }}
              className="h-9 w-16 rounded-md border border-border bg-background px-2 text-center text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />

            <button
              type="button"
              disabled={disabled}
              onClick={submitGoToPage}
              className="h-9 rounded-md border border-primary px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Go
            </button>
          </div>
        )}
      </div>
    </div>
  );
}