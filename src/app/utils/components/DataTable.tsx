"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import type { TableColumn } from "@/app/utils/helpers/tableTypes";

type DataTableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;

  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onReachEnd?: () => void;

  loadingText?: string;
  emptyText?: string;
  tableClassName?: string;
  containerClassName?: string;

  visibleRows?: number;
  rowHeight?: number;
  headerHeight?: number;
};

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onReachEnd,
  loadingText = "Loading...",
  emptyText = "No records found.",
  tableClassName = "",
  containerClassName = "",
  visibleRows = 10,
  rowHeight = 31,
  headerHeight = 40,
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastRowRef = useRef<HTMLTableRowElement | null>(null);

  const viewportHeight = headerHeight + visibleRows * rowHeight;
  const shouldScroll = data.length > visibleRows;

  useEffect(() => {
    if (
      !hasMore ||
      loading ||
      loadingMore ||
      !onReachEnd ||
      !scrollRef.current ||
      !lastRowRef.current
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onReachEnd();
        }
      },
      {
        root: scrollRef.current,
        threshold: 0.9,
      },
    );

    observer.observe(lastRowRef.current);

    return () => observer.disconnect();
  }, [data.length, hasMore, loading, loadingMore, onReachEnd]);

  const viewportStyle: CSSProperties = {
    height: viewportHeight,
    maxHeight: viewportHeight,
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-border bg-background ${containerClassName}`}
    >
      <div
        ref={scrollRef}
        className={
          shouldScroll
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-y-hidden overflow-x-hidden"
        }
        style={viewportStyle}
      >
        <table className={`w-full table-fixed ${tableClassName}`}>
          <thead>
            <tr style={{ height: headerHeight }}>
              {columns.map((column) => {
                const align = column.align ?? "left";

                return (
                  <th
                    key={column.key}
                    className={`sticky top-0 z-20 overflow-hidden whitespace-nowrap bg-secondary px-4 text-sm font-semibold text-primary ${alignClass[align]} ${column.headerClassName ?? ""}`}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      height: headerHeight,
                    }}
                  >
                    <div className="truncate">{column.label}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr style={{ height: rowHeight }}>
                <td
                  colSpan={columns.length}
                  className="text-center text-sm text-muted-foreground"
                >
                  {loadingText}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr style={{ height: rowHeight }}>
                <td
                  colSpan={columns.length}
                  className="text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const isLastRow = index === data.length - 1;

                return (
                  <tr
                    key={rowKey(row)}
                    ref={isLastRow ? lastRowRef : undefined}
                    className="border-b border-border last:border-b-0"
                    style={{ height: rowHeight }}
                  >
                    {columns.map((column) => {
                      const align = column.align ?? "left";

                      return (
                        <td
                          key={column.key}
                          className={`overflow-hidden whitespace-nowrap px-4 text-sm text-foreground ${alignClass[align]} ${column.cellClassName ?? ""}`}
                          style={{
                            width: column.width,
                            minWidth: column.minWidth,
                            height: rowHeight,
                            maxHeight: rowHeight,
                          }}
                        >
                          <div className="truncate">
                            {column.render(row, index)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}

            {loadingMore && data.length > 0 && (
              <tr style={{ height: rowHeight }}>
                <td
                  colSpan={columns.length}
                  className="text-center text-xs text-muted-foreground"
                >
                  Loading next 10 records...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}