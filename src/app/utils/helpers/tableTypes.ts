import type { ReactNode } from "react";

export type TableAlign = "left" | "center" | "right";

export type TableColumn<T> = {
  key: string;
  label: string;
  width?: string;
  minWidth?: string;
  align?: TableAlign;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T, index: number) => ReactNode;
};
