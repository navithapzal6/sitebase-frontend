import {
  createExportFileName,
  type ExportFileOptions,
} from "@/app/utils/helpers/exportTypes";

type ExcelCell = {
  value: string | number;
  fontWeight?: "bold";
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right";
  alignVertical?: "top" | "center" | "bottom";
  wrap?: boolean;
  columnSpan?: number;
  borderColor?: string;
  borderStyle?: "thin" | "medium" | "thick" | "dashed" | "dotted";
  bottomBorderColor?: string;
  bottomBorderStyle?: "thin" | "medium" | "thick" | "dashed" | "dotted";
};

type ExcelRow = Array<string | number | ExcelCell | null>;

const emptyCells = (count: number) =>
  Array.from({ length: Math.max(count, 0) }, () => null);

export async function exportToExcel<T>({
  title,
  fileName,
  columns,
  data,
  filters = [],
}: ExportFileOptions<T>) {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");

  const columnCount = Math.max(columns.length, 1);
  const rows: ExcelRow[] = [];

  // Title
  rows.push([
    {
      value: title,
      fontWeight: "bold",
      fontSize: 16,
      textColor: "#103BB5",
      alignVertical: "center",
      columnSpan: columnCount,
    },
    ...emptyCells(columnCount - 1),
  ]);

  rows.push(emptyCells(columnCount));

  // Applied filters
  if (filters.length > 0) {
    rows.push([
      {
        value: "Applied Filters",
        fontWeight: "bold",
        textColor: "#111827",
        columnSpan: columnCount,
      },
      ...emptyCells(columnCount - 1),
    ]);

    filters.forEach((filter) => {
      rows.push([
        {
          value: filter.label,
          fontWeight: "bold",
          textColor: "#374151",
        },
        {
          value: filter.value,
          textColor: "#111827",
          columnSpan: Math.max(columnCount - 1, 1),
        },
        ...emptyCells(Math.max(columnCount - 2, 0)),
      ]);
    });

    rows.push(emptyCells(columnCount));
  }

  // Table header
  rows.push(
    columns.map((column) => ({
      value: column.label,
      fontWeight: "bold" as const,
      textColor: "#FFFFFF",
      backgroundColor: "#103BB5",
      alignVertical: "center" as const,
      wrap: true,
      borderColor: "#D9DDE7",
      borderStyle: "thin" as const,
    })),
  );

  // Table rows
  data.forEach((row, index) => {
    rows.push(
      columns.map((column) => ({
        value: column.value(row, index) ?? "",
        alignVertical: "top" as const,
        wrap: true,
        bottomBorderColor: "#E5E7EB",
        bottomBorderStyle: "thin" as const,
      })),
    );
  });

  const excelColumns = columns.map((column) => ({
    width: column.width ?? 18,
  }));

  const headerRowNumber =
    3 + (filters.length > 0 ? filters.length + 2 : 0);

  await writeXlsxFile(rows as any, {
    sheet: title.slice(0, 31) || "Export",
    columns: excelColumns,
    stickyRowsCount: headerRowNumber,
    showGridLines: false,
  }).toFile(`${createExportFileName(fileName)}.xlsx`);
}