export type LedgerRecord = {
  id?: string | number;
  company_id?: string;
  ledger_type: string;
  ledger_name: string;
  ledger_description?: string;
  status: string;
};

export const LEDGER_TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Accounts Ledger", value: "accounts_ledger" },
  { label: "Expense Ledger", value: "expense_ledger" },
  { label: "Unit Ledger", value: "unit_ledger" },
  { label: "Client Ledger", value: "client_ledger" },
  { label: "Equipments Ledger", value: "equipment_ledger" },
  { label: "Material Ledger", value: "material_ledger" },
  { label: "Machineries Ledger", value: "machinery_ledger" },
  { label: "Staff Designation Ledger", value: "staff_designation_ledger" },
] as const;


export const mapLedgerRecord = (item: any): LedgerRecord => ({
  id: item?.id ?? item?.ID,
  company_id: item?.company_id,
  ledger_type: item?.ledgerType ?? item?.ledger_type ?? "",
  ledger_name: item?.ledgerName ?? item?.ledger_name ?? "",
  ledger_description: item?.ledgerDescription ?? item?.ledger_description ?? "",
  status: String(item?.status ?? "1"),
});

export const isLedgerApiSuccess = (response: {
  success?: boolean;
  status?: boolean | string;
}) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";
