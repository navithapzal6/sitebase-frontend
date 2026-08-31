export type ExportFormat = "excel" | "pdf";

export type ExportColumn<T> = {
  label: string;
  value: (row: T, index: number) => string | number | null | undefined;
  width?: number;
};

export type ExportFilter = {
  label: string;
  value: string;
};

export type ExportFileOptions<T> = {
  title: string;
  fileName: string;
  columns: ExportColumn<T>[];
  data: T[];
  filters?: ExportFilter[];
};

export const createExportFileName = (fileName: string) => {
  const today = new Date();
  const date = [
    String(today.getDate()).padStart(2, "0"),
    String(today.getMonth() + 1).padStart(2, "0"),
    today.getFullYear(),
  ].join("-");

  return `${fileName}_${date}`;
};
