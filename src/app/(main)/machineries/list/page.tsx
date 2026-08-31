"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  type MachineryFilters,
  emptyMachineryFilters,
} from "@/app/utils/components/MachineryFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Machinery = {
  id?: string | number;
  machinery_id?: string | number;
  company_id?: string;
  machinery_name?: string;
  machinery_category?: string | number;
  machinery_category_name?: string;
  machinery_description?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string | null;
  purchase_cost?: string | number;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  remarks?: string;
  created_at?: string;
};

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const PAGE_LIMIT = 10;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getMachineryRows = (
  response: Awaited<ReturnType<typeof postAPI>>,
): Machinery[] => {
  const source = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.machineries)
        ? response.data.machineries
        : [];

  return source.map((item: any) => ({
    ...item,
    id: item?.id ?? item?.machinery_id ?? item?.ID,
    machinery_name:
      item?.machinery_name ?? item?.machineryName ?? "",
    machinery_category:
      item?.machinery_category ??
      item?.machineryCategory ??
      "",
    machinery_category_name:
      item?.machinery_category_name ??
      item?.machineryCategoryName ??
      "",
    machinery_description:
      item?.machinery_description ??
      item?.machineryDescription ??
      "",
    manufacturer: item?.manufacturer ?? "",
    model: item?.model ?? "",
    serial_number:
      item?.serial_number ?? item?.serialNumber ?? "",
    purchase_date:
      item?.purchase_date ?? item?.purchaseDate ?? null,
    purchase_cost:
      item?.purchase_cost ?? item?.purchaseCost ?? "",
    last_maintenance_date:
      item?.last_maintenance_date ??
      item?.lastMaintenanceDate ??
      null,
    next_maintenance_date:
      item?.next_maintenance_date ??
      item?.nextMaintenanceDate ??
      null,
    remarks: item?.remarks ?? "",
  }));
};

const displayDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB");
};

export default function MachineryListPage() {
  const [machineries, setMachineries] = useState<Machinery[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MachineryFilters>(
    emptyMachineryFilters,
  );

  const [viewId, setViewId] = useState<string | number | null>(null);
  const [viewData, setViewData] = useState<Machinery | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchMachineries = useCallback(
    async (
      pageToLoad: number,
      currentFilters: MachineryFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "MACHINERY_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              machinery_name: currentFilters.machinery_name.trim(),

              machinery_category:
                ((currentFilters as MachineryFilters & {
                  machinery_category?: string;
                }).machinery_category ?? "")
                  ? Number(
                      (currentFilters as MachineryFilters & {
                        machinery_category?: string;
                      }).machinery_category,
                    )
                  : "",

              manufacturer: currentFilters.manufacturer.trim(),
              model: currentFilters.model.trim(),
              serial_number: currentFilters.serial_number.trim(),
              purchase_date: currentFilters.purchase_date,
              last_maintenance_date:
                currentFilters.last_maintenance_date,
              next_maintenance_date:
                currentFilters.next_maintenance_date,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(
            response.message || "Failed to load machineries",
          );
        }

        const rows = getMachineryRows(response);

        setMachineries((current) =>
          replace ? rows : [...current, ...rows],
        );

        setPage(pageToLoad);

        const pagination = response.data?.pagination;

        if (pagination?.total_pages) {
          setHasMore(
            pageToLoad < Number(pagination.total_pages),
          );
        } else if (response.total_pages || response.totalPages) {
          setHasMore(
            pageToLoad <
              Number(response.total_pages ?? response.totalPages),
          );
        } else if (
          typeof response.count === "number" ||
          typeof response.total_count === "number"
        ) {
          const total = Number(
            response.count ?? response.total_count ?? 0,
          );

          setHasMore(pageToLoad * PAGE_LIMIT < total);
        } else {
          setHasMore(rows.length === PAGE_LIMIT);
        }
      } catch (error: any) {
        setToast({
          message: error.message || "Something went wrong",
          type: "error",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchMachineries(1, filters, true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !lastRowRef.current
    ) {
      return;
    }

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchMachineries(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);

    return () => observerRef.current?.disconnect();
  }, [
    machineries,
    loading,
    loadingMore,
    hasMore,
    page,
    filters,
    fetchMachineries,
  ]);

  const handleApplyFilters = (next: MachineryFilters) => {
    setFilters(next);
    setHasMore(true);
    void fetchMachineries(1, next, true);
  };

  const handleRefresh = () => {
    setHasMore(true);
    void fetchMachineries(1, filters, true);
  };

  useEffect(() => {
    if (viewId === null) {
      setViewData(null);
      return;
    }

    const fetchDetail = async () => {
      setViewLoading(true);
      setViewData(null);

      try {
        const response = await postAPI(
          "GET_MACHINERY_BY_ID",
          {
            data: {
              machinery_id: viewId,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(
            response.message || "Failed to load machinery",
          );
        }

        const detail = response.data?.data ?? response.data ?? {};

        setViewData({
          ...detail,
          id:
            detail?.id ??
            detail?.machinery_id ??
            detail?.ID ??
            viewId,
          machinery_name:
            detail?.machinery_name ??
            detail?.machineryName ??
            "",
          machinery_category:
            detail?.machinery_category ??
            detail?.machineryCategory ??
            "",
          machinery_category_name:
            detail?.machinery_category_name ??
            detail?.machineryCategoryName ??
            "",
          machinery_description:
            detail?.machinery_description ??
            detail?.machineryDescription ??
            "",
          manufacturer: detail?.manufacturer ?? "",
          model: detail?.model ?? "",
          serial_number:
            detail?.serial_number ??
            detail?.serialNumber ??
            "",
          purchase_date:
            detail?.purchase_date ??
            detail?.purchaseDate ??
            null,
          purchase_cost:
            detail?.purchase_cost ??
            detail?.purchaseCost ??
            "",
          last_maintenance_date:
            detail?.last_maintenance_date ??
            detail?.lastMaintenanceDate ??
            null,
          next_maintenance_date:
            detail?.next_maintenance_date ??
            detail?.nextMaintenanceDate ??
            null,
          remarks: detail?.remarks ?? "",
          created_at:
            detail?.created_at ??
            detail?.createdAt ??
            "",
        });
      } catch (error: any) {
        setToast({
          message: error.message || "Something went wrong",
          type: "error",
        });

        setViewId(null);
      } finally {
        setViewLoading(false);
      }
    };

    void fetchDetail();
  }, [viewId]);

  const confirmDelete = async () => {
    if (deleteId === null) return;

    setDeleting(true);

    try {
      const response = await postAPI(
        "DELETE_MACHINERY",
        {
          data: {
            machinery_id: deleteId,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setMachineries((current) =>
        current.filter(
          (item) => String(item.id) !== String(deleteId),
        ),
      );

      setToast({
        message:
          response.message || "Machinery deleted successfully",
        type: "success",
      });
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length;

  function DetailField({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) {
    return (
      <div>
        <dt className="text-xs text-muted-foreground">
          {label}
        </dt>
        <dd className="font-medium text-foreground">
          {value || "—"}
        </dd>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 sm:p-6">
      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Machineries
          </h1>

          <p className="text-sm text-muted-foreground">
            {machineries.length} machiner
            {machineries.length === 1 ? "y" : "ies"} loaded
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Refresh"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
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

        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="table-default">
          <thead>
            <tr>
              <th className="w-[70px] text-center">S.No</th>
              <th>Machinery Name</th>
              <th>Machinery Category</th>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Purchase Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Loading machineries...
                </td>
              </tr>
            ) : machineries.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No machineries match your filters.
                </td>
              </tr>
            ) : (
              machineries.map((machinery, index) => {
                const isLast =
                  index === machineries.length - 1;

                const rowKey =
                  machinery.id ??
                  `${machinery.company_id || "company"}-${
                    machinery.machinery_name || "machinery"
                  }-${machinery.created_at || index}`;

                return (
                  <tr
                    key={String(rowKey)}
                    ref={isLast ? lastRowRef : undefined}
                  >
                    <td className="w-[70px] text-center">
                      {index + 1}
                    </td>

                    <td className="font-medium text-foreground">
                      {machinery.machinery_name || "—"}
                    </td>

                    <td>{machinery.machinery_category_name || "—"}</td>
                    <td>{machinery.manufacturer || "—"}</td>
                    <td>{machinery.model || "—"}</td>
                    <td>{machinery.serial_number || "—"}</td>
                    <td>{displayDate(machinery.purchase_date)}</td>

                    <td className="action-cell">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="redirect-link"
                          onClick={() => {
                            if (
                              machinery.id === undefined ||
                              machinery.id === null
                            ) {
                              setToast({
                                message:
                                  "Machinery ID is missing",
                                type: "error",
                              });
                              return;
                            }

                            setViewId(machinery.id);
                          }}
                        >
                          View
                        </button>

                        {machinery.id !== undefined &&
                          machinery.id !== null && (
                            <button
                              type="button"
                              className="text-destructive hover:opacity-80"
                              onClick={() =>
                                setDeleteId(machinery.id!)
                              }
                              aria-label="Delete machinery"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {loadingMore && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Loading more...
        </div>
      )}

      {!hasMore && machineries.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No more machineries
        </p>
      )}

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
              Delete machinery?
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

      {viewId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Machinery details
              </h2>

              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setViewId(null);
                  setViewData(null);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              {viewLoading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Loading machinery...
                </div>
              ) : viewData ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <DetailField
                    label="Machinery name"
                    value={viewData.machinery_name}
                  />
                  <DetailField
                    label="Machinery category"
                    value={viewData.machinery_category_name}
                  />
                  <DetailField
                    label="Description"
                    value={viewData.machinery_description}
                  />
                  <DetailField
                    label="Manufacturer"
                    value={viewData.manufacturer}
                  />
                  <DetailField
                    label="Model"
                    value={viewData.model}
                  />
                  <DetailField
                    label="Serial number"
                    value={viewData.serial_number}
                  />
                  <DetailField
                    label="Purchase date"
                    value={displayDate(viewData.purchase_date)}
                  />
                  <DetailField
                    label="Purchase cost"
                    value={viewData.purchase_cost}
                  />
                  <DetailField
                    label="Last maintenance"
                    value={displayDate(
                      viewData.last_maintenance_date,
                    )}
                  />
                  <DetailField
                    label="Next maintenance"
                    value={displayDate(
                      viewData.next_maintenance_date,
                    )}
                  />
                  <DetailField
                    label="Remarks"
                    value={viewData.remarks}
                  />
                  <DetailField
                    label="Created"
                    value={displayDate(viewData.created_at)}
                  />
                </dl>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No data found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}