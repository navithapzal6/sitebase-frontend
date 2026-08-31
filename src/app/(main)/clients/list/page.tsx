"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/app/utils/components/Button";
import { DataTable } from "@/app/utils/components/DataTable";
import { ExportButton } from "@/app/utils/components/ExportButton";
import FilterSidebar, {
  ClientFilters,
  emptyClientFilters,
} from "@/app/utils/components/ClientFilterSidebar";
import { Pagination } from "@/app/utils/components/Pagination";
import { Toaster } from "@/app/utils/components/Toaster";
import { postAPI } from "@/app/utils/helpers/api";
import { exportToExcel } from "@/app/utils/helpers/exportExcel";
import { exportToPdf } from "@/app/utils/helpers/exportPdf";
import type {
  ExportColumn,
  ExportFilter,
  ExportFormat,
} from "@/app/utils/helpers/exportTypes";
import type { TableColumn } from "@/app/utils/helpers/tableTypes";

type Client = {
  id: string | number;
  company_id?: string;
  client_name?: string;
  registration_id?: string;
  phone_number?: string;
  alternate_phone_number?: string;
  email?: string;
  gstin?: string;
  contact_type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  pincode?: string;
  state?: string;
  bank_name?: string;
  branch_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  created_at?: string;

  // Available from Get Client By ID.
  aadhaar_number?: string;
  pan_number?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const FETCH_CHUNK = 10;
const DEFAULT_PAGE_SIZE = 10;

const isSuccess = (response: any) =>
  response?.success === true ||
  response?.status === true ||
  response?.status === "true";

const getRows = (response: any): Client[] => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.clients)) {
    return response.data.clients;
  }

  return [];
};

const getTotalCount = (response: any, fallback: number) =>
  Number(
    response?.total_count ??
      response?.data?.total_count ??
      response?.data?.pagination?.total_count ??
      response?.data?.pagination?.total ??
      fallback,
  );

const buildConditions = (filters: ClientFilters) => ({
  client_name: filters.client_name.trim(),
  registration_id: filters.registration_id.trim(),
  phone_number: filters.phone_number.trim(),
  email: filters.email.trim(),
  contact_type: "client",
  from_date: filters.from_date.trim(),
  to_date: filters.to_date.trim(),
});

const CLIENT_EXPORT_COLUMNS: ExportColumn<Client>[] = [
  { label: "S.No", value: (_row, index) => index + 1, width: 10 },
  { label: "Client", value: (row) => row.client_name, width: 26 },
  { label: "Registration ID", value: (row) => row.registration_id, width: 20 },
  { label: "Phone", value: (row) => row.phone_number, width: 18 },
  {
    label: "Alternate Phone",
    value: (row) => row.alternate_phone_number,
    width: 18,
  },
  { label: "Email", value: (row) => row.email, width: 30 },
  { label: "GSTIN", value: (row) => row.gstin, width: 20 },
  { label: "Contact Type", value: (row) => row.contact_type, width: 16 },
  { label: "Address Line 1", value: (row) => row.address_line1, width: 28 },
  { label: "Address Line 2", value: (row) => row.address_line2, width: 24 },
  { label: "City", value: (row) => row.city, width: 18 },
  { label: "Pincode", value: (row) => row.pincode, width: 14 },
  { label: "State", value: (row) => row.state, width: 18 },
  { label: "Bank Name", value: (row) => row.bank_name, width: 20 },
  { label: "Branch Name", value: (row) => row.branch_name, width: 20 },
  {
    label: "Bank Account Number",
    value: (row) => row.bank_account_number,
    width: 24,
  },
  { label: "IFSC Code", value: (row) => row.ifsc_code, width: 18 },
  { label: "Created At", value: (row) => row.created_at, width: 18 },
];

export default function ClientListPage() {
  const [toast, setToast] = useState<ToastState>(null);

  const [filters, setFilters] =
    useState<ClientFilters>(emptyClientFilters);
  const [filterOpen, setFilterOpen] = useState(false);

  // Logical UI pagination.
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalRecords, setTotalRecords] = useState(0);

  // Current logical page records are still fetched 10-by-10.
  const [clients, setClients] = useState<Client[]>([]);
  const [nextChunkOffset, setNextChunkOffset] = useState(0);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [viewData, setViewData] = useState<Client | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [exportingFormat, setExportingFormat] =
    useState<ExportFormat | null>(null);

  const totalPages = Math.max(Math.ceil(totalRecords / pageSize), 1);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const logicalPageStart = (safePage - 1) * pageSize;
  const logicalPageEnd = Math.min(logicalPageStart + pageSize, totalRecords);
  const logicalPageCount = Math.max(logicalPageEnd - logicalPageStart, 0);

  const fetchChunk = useCallback(
    async (
      uiPage: number,
      selectedPageSize: number,
      chunkOffset: number,
      currentFilters: ClientFilters,
    ) => {
      const absoluteStart =
        (uiPage - 1) * selectedPageSize + chunkOffset;

      // Page-size options are kept as multiples of 10 so one backend page
      // always maps cleanly to one 10-record scroll chunk.
      const apiPage = Math.floor(absoluteStart / FETCH_CHUNK) + 1;

      const payload = {
        conditions: buildConditions(currentFilters),
        page: apiPage,
        limit: FETCH_CHUNK,
      };

      const response = await postAPI("CLIENT_LIST", payload, true);

      if (!isSuccess(response)) {
        throw new Error(response?.message || "Failed to load clients");
      }

      const rows = getRows(response);
      const count = getTotalCount(response, rows.length);

      return {
        rows,
        totalCount: Number.isFinite(count) ? count : rows.length,
      };
    },
    [],
  );

  const loadFirstChunk = useCallback(
    async (
      uiPage: number,
      selectedPageSize: number,
      currentFilters: ClientFilters,
    ) => {
      setInitialLoading(true);

      try {
        const { rows, totalCount } = await fetchChunk(
          uiPage,
          selectedPageSize,
          0,
          currentFilters,
        );

        setClients(rows);
        setNextChunkOffset(rows.length);
        setTotalRecords(totalCount);
      } catch (error: any) {
        setClients([]);
        setTotalRecords(0);
        setToast({
          message: error?.message || "Something went wrong",
          type: "error",
        });
      } finally {
        setInitialLoading(false);
      }
    },
    [fetchChunk],
  );

  useEffect(() => {
    loadFirstChunk(currentPage, pageSize, filters);
  }, [currentPage, pageSize, filters, loadFirstChunk]);

  const currentPageAvailableCount = Math.min(
    pageSize,
    Math.max(totalRecords - logicalPageStart, 0),
  );

  const hasMoreInCurrentPage =
    clients.length < currentPageAvailableCount;

  const loadNextTen = useCallback(async () => {
    if (
      loadingMore ||
      initialLoading ||
      !hasMoreInCurrentPage
    ) {
      return;
    }

    setLoadingMore(true);

    try {
      const { rows, totalCount } = await fetchChunk(
        safePage,
        pageSize,
        nextChunkOffset,
        filters,
      );

      setClients((previous) => {
        const merged = [...previous, ...rows];

        return merged.slice(0, currentPageAvailableCount);
      });

      setNextChunkOffset((previous) => previous + rows.length);
      setTotalRecords(totalCount);
    } catch (error: any) {
      setToast({
        message: error?.message || "Failed to load more clients",
        type: "error",
      });
    } finally {
      setLoadingMore(false);
    }
  }, [
    currentPageAvailableCount,
    fetchChunk,
    filters,
    hasMoreInCurrentPage,
    initialLoading,
    loadingMore,
    nextChunkOffset,
    pageSize,
    safePage,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const handleApplyFilters = (nextFilters: ClientFilters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadFirstChunk(safePage, pageSize, filters);
  };

  const getExportFilters = (
    currentFilters: ClientFilters,
  ): ExportFilter[] => {
    const labels: Array<[keyof ClientFilters, string]> = [
      ["client_name", "Client Name"],
      ["registration_id", "Registration ID"],
      ["phone_number", "Phone Number"],
      ["email", "Email"],
      ["from_date", "From Date"],
      ["to_date", "To Date"],
    ];

    return labels
      .filter(([key]) => Boolean(currentFilters[key]?.trim()))
      .map(([key, label]) => ({
        label,
        value: currentFilters[key].trim(),
      }));
  };

  const fetchSelectedPageForExport = async () => {
    // Export is ONE request for the selected logical page.
    // Example:
    // current page = 2, rows per page = 40
    // => page: 2, limit: 40, same conditions.
    const payload = {
      conditions: buildConditions(filters),
      page: safePage,
      limit: pageSize,
    };

    const response = await postAPI("CLIENT_LIST", payload, true);

    if (!isSuccess(response)) {
      throw new Error(response?.message || "Failed to load export records");
    }

    return getRows(response);
  };

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format);

    try {
      const exportData = await fetchSelectedPageForExport();

      if (exportData.length === 0) {
        setToast({
          message: "No client records available to export",
          type: "error",
        });
        return;
      }

      const exportOptions = {
        title: "Client List",
        fileName: "Client_List",
        columns: CLIENT_EXPORT_COLUMNS,
        data: exportData,
        filters: getExportFilters(filters),
      };

      if (format === "excel") {
        await exportToExcel(exportOptions);
      } else {
        await exportToPdf(exportOptions);
      }

      setToast({
        message: `${format === "excel" ? "Excel" : "PDF"} exported successfully`,
        type: "success",
      });
    } catch (error: any) {
      setToast({
        message: error?.message || "Export failed",
        type: "error",
      });
    } finally {
      setExportingFormat(null);
    }
  };

  const openView = async (clientId: string | number) => {
    setViewLoading(true);

    try {
      const response = await postAPI(
        "GET_CLIENT_BY_ID",
        {
          data: {
            client_id: Number(clientId) || clientId,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response?.message || "Failed to load client");
      }

      setViewData(response.data ?? null);
    } catch (error: any) {
      setToast({
        message: error?.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    setDeleting(true);

    try {
      const response = await postAPI(
        "DELETE_CLIENT",
        {
          data: {
            client_id: Number(deleteId) || deleteId,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response?.message || "Delete failed");
      }

      setToast({
        message: response?.message || "Client deleted successfully",
        type: "success",
      });

      setDeleteId(null);
      await loadFirstChunk(safePage, pageSize, filters);
    } catch (error: any) {
      setToast({
        message: error?.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length;

  const tableColumns = useMemo<TableColumn<Client>[]>(
    () => [
      {
        key: "sno",
        label: "S.No",
        width: "9%",
        align: "center",
        render: (_client, index) => logicalPageStart + index + 1,
      },
      {
        key: "client",
        label: "Client",
        width: "31%",
        render: (client) => (
          <span
            className="block truncate font-medium text-foreground"
            title={client.client_name || ""}
          >
            {client.client_name || "—"}
          </span>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        width: "20%",
        render: (client) => client.phone_number || "—",
      },
      {
        key: "email",
        label: "Email",
        width: "27%",
        render: (client) => (
          <span className="block truncate" title={client.email || ""}>
            {client.email || "—"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        width: "13%",
        align: "center",
        render: (client) => (
          <div className="flex items-center justify-center gap-3">
            <button
              className="redirect-link"
              onClick={() => openView(client.id)}
            >
              View
            </button>

            <button
              className="text-destructive hover:opacity-80"
              onClick={() => setDeleteId(client.id)}
              aria-label="Delete client"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [logicalPageStart],
  );

  function DetailField({
    label,
    value,
  }: {
    label: string;
    value?: string;
  }) {
    return (
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground">{value || "—"}</dd>
      </div>
    );
  }

  const exportRecordCount = Math.min(
    pageSize,
    Math.max(totalRecords - logicalPageStart, 0),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden p-3 sm:p-4">
      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {exportingFormat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/10">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-4 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />

            <div>
              <p className="text-sm font-semibold text-foreground">
                Preparing{" "}
                {exportingFormat === "excel" ? "Excel" : "PDF"} export
              </p>
              <p className="text-xs text-muted-foreground">
                Fetching {exportRecordCount.toLocaleString()} filtered records...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalRecords.toLocaleString()} client
            {totalRecords === 1 ? "" : "s"} available
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={initialLoading || loadingMore}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw
              size={16}
              className={
                initialLoading || loadingMore ? "animate-spin" : ""
              }
            />
          </button>

          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <SlidersHorizontal size={15} />
            Filters

            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          <ExportButton
            onExport={handleExport}
            loading={exportingFormat !== null}
            loadingFormat={exportingFormat}
            disabled={initialLoading || loadingMore}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <DataTable
          columns={tableColumns}
          data={clients}
          rowKey={(client) => client.id}
          loading={initialLoading}
          loadingMore={loadingMore}
          hasMore={hasMoreInCurrentPage}
          onReachEnd={loadNextTen}
          loadingText="Loading clients..."
          emptyText="No clients match your filters."
          visibleRows={10}
          rowHeight={31}
          headerHeight={40}
        />
      </div>

      <Pagination
        currentPage={safePage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 40, 50, 100]}
        disabled={initialLoading || loadingMore}
      />

      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-background p-6">
            <h2 className="text-base font-semibold text-foreground">
              Delete client?
            </h2>

            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {(viewData || viewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Client details
              </h2>

              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setViewData(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              {viewLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading client...
                </p>
              ) : viewData ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <DetailField label="Client name" value={viewData.client_name} />
                  <DetailField label="Registration ID" value={viewData.registration_id} />
                  <DetailField label="Phone" value={viewData.phone_number} />
                  <DetailField label="Alternate phone" value={viewData.alternate_phone_number} />
                  <DetailField label="Email" value={viewData.email} />
                  <DetailField label="GSTIN" value={viewData.gstin} />
                  <DetailField label="Aadhaar" value={viewData.aadhaar_number} />
                  <DetailField label="PAN" value={viewData.pan_number} />
                  <DetailField label="Address" value={viewData.address_line1} />
                  <DetailField label="Address line 2" value={viewData.address_line2} />
                  <DetailField label="City" value={viewData.city} />
                  <DetailField label="State" value={viewData.state} />
                  <DetailField label="Pincode" value={viewData.pincode} />
                  <DetailField label="Bank name" value={viewData.bank_name} />
                  <DetailField label="Branch" value={viewData.branch_name} />
                  <DetailField label="Account number" value={viewData.bank_account_number} />
                  <DetailField label="IFSC" value={viewData.ifsc_code} />
                  <DetailField label="Created" value={viewData.created_at} />
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
