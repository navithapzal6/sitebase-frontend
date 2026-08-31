"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  type WarehouseFilters,
  emptyWarehouseFilters,
} from "@/app/utils/components/WarehouseFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Warehouse = {
  id: string | number;
  warehouse_id?: string | number;
  company_id?: string;
  warehouse_name?: string;
  phone_number?: string;
  phone?: string;
  address?: string;
  pincode?: string | number;
  state?: string;
  created_at?: string;
};

type ToastState = { message: string; type: "success" | "error" } | null;

const PAGE_LIMIT = 10;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getWarehouseRows = (
  response: Awaited<ReturnType<typeof postAPI>>,
): Warehouse[] => {
  const source = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.warehouses)
        ? response.data.warehouses
        : [];

  return source.map((item: any) => ({
    ...item,
    id: item.id ?? item.warehouse_id,
    phone_number: item.phone_number ?? item.phone ?? "",
  }));
};

export default function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<WarehouseFilters>(
    emptyWarehouseFilters,
  );
  const [viewId, setViewId] = useState<string | number | null>(null);
  const [viewData, setViewData] = useState<Warehouse | null>(null);
  const [viewLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchWarehouses = useCallback(
    async (
      pageToLoad: number,
      currentFilters: WarehouseFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "WAREHOUSE_LIST",
          {data :{
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              warehouse_name: currentFilters.warehouse_name.trim(),
              phone_number: currentFilters.phone_number.trim(),
              address: currentFilters.address.trim(),
              pincode: currentFilters.pincode.trim(),
              state: currentFilters.state.trim(),
              search: "",
            },
          }
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load warehouses");
        }

        const rows = getWarehouseRows(response);
        setWarehouses((current) => (replace ? rows : [...current, ...rows]));
        setPage(pageToLoad);

        const pagination = response.data?.pagination;
        if (pagination?.total_pages) {
          setHasMore(pageToLoad < Number(pagination.total_pages));
        } else if (response.total_pages || response.totalPages) {
          setHasMore(
            pageToLoad < Number(response.total_pages ?? response.totalPages),
          );
        } else if (
          typeof response.count === "number" ||
          typeof response.total_count === "number"
        ) {
          const total = Number(response.count ?? response.total_count ?? 0);
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
    void fetchWarehouses(1, filters, true);
    // Initial load follows the same flow as the Client list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !lastRowRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchWarehouses(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);
    return () => observerRef.current?.disconnect();
  }, [
    warehouses,
    loading,
    loadingMore,
    hasMore,
    page,
    filters,
    fetchWarehouses,
  ]);

  const handleApplyFilters = (next: WarehouseFilters) => {
    setFilters(next);
    setHasMore(true);
    void fetchWarehouses(1, next, true);
  };

  const handleRefresh = () => {
    setHasMore(true);
    void fetchWarehouses(1, filters, true);
  };

  

  const confirmDelete = async () => {
    if (deleteId === null) return;

    setDeleting(true);
    try {
      const response = await postAPI(
        "DELETE_WAREHOUSE",
        { data: { warehouse_id: deleteId } },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setWarehouses((current) =>
        current.filter((item) => String(item.id) !== String(deleteId)),
      );
      setToast({
        message: response.message || "Warehouse deleted successfully",
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

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const DetailField = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );

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
          <h1 className="text-lg font-semibold text-foreground">Warehouses</h1>
          <p className="text-sm text-muted-foreground">
            {warehouses.length} warehouse{warehouses.length === 1 ? "" : "s"}{" "}
            loaded
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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
              <th>Warehouse Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Pincode</th>
              <th>State</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  Loading warehouses...
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No warehouses match your filters.
                </td>
              </tr>
            ) : (
              warehouses.map((warehouse, index) => {
                const isLast = index === warehouses.length - 1;
                return (
                  <tr
                    key={`${warehouse.id}-${index}`}
                    ref={isLast ? lastRowRef : undefined}
                  >
                    <td className="w-[70px] text-center">{index + 1}</td>
                    <td className="font-medium text-foreground">
                      {warehouse.warehouse_name || "—"}
                    </td>
                    <td>{warehouse.phone_number || warehouse.phone || "—"}</td>
                    <td>{warehouse.address || "—"}</td>
                    <td>{warehouse.pincode || "—"}</td>
                    <td>{warehouse.state || "—"}</td>
                    <td className="action-cell">
                      <div className="flex items-center justify-center gap-3">
                        
                         
                        <button
                          type="button"
                          className="text-destructive hover:opacity-80"
                          onClick={() => setDeleteId(warehouse.id)}
                          aria-label="Delete warehouse"
                        >
                          <Trash2 size={15} />
                        </button>
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

      {!hasMore && warehouses.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No more warehouses
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
              Delete warehouse?
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
                Warehouse details
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
                  Loading warehouse...
                </div>
              ) : viewData ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <DetailField
                    label="Warehouse name"
                    value={viewData.warehouse_name}
                  />
                  <DetailField
                    label="Phone"
                    value={viewData.phone_number || viewData.phone}
                  />
                  <DetailField label="Address" value={viewData.address} />
                  <DetailField label="Pincode" value={viewData.pincode} />
                  <DetailField label="State" value={viewData.state} />
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
