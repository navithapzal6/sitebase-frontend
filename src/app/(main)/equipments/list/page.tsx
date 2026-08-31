"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  type EquipmentFilters,
  emptyEquipmentFilters,
} from "@/app/utils/components/EquipmentFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Equipment = {
  id?: string | number;
  equipment_id?: string | number;
  company_id?: string;

  equipment_name?: string;

  equipment_category?: string | number;
  equipment_category_name?: string;

  equipment_description?: string;
  total_quantity?: string | number;
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

const getEquipmentRows = (
  response: Awaited<ReturnType<typeof postAPI>>,
): Equipment[] => {
  const source = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.equipments)
        ? response.data.equipments
        : [];

  return source.map((item: any) => ({
    ...item,
    id: item?.id ?? item?.equipment_id ?? item?.ID,
    equipment_name:
      item?.equipment_name ?? item?.equipmentName ?? "",
    equipment_category:
      item?.equipment_category ??
      item?.equipmentCategory ??
      "",
    equipment_category_name:
      item?.equipment_category_name ??
      item?.equipmentCategoryName ??
      "",
    equipment_description:
      item?.equipment_description ??
      item?.equipmentDescription ??
      "",
    total_quantity:
      item?.total_quantity ?? item?.totalQuantity ?? "",
    remarks: item?.remarks ?? "",
  }));
};

export default function EquipmentListPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<EquipmentFilters>(
    emptyEquipmentFilters,
  );

  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchEquipments = useCallback(
    async (
      pageToLoad: number,
      currentFilters: EquipmentFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "EQUIPMENT_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              equipment_name: currentFilters.equipment_name.trim(),

              equipment_category:
                ((currentFilters as EquipmentFilters & {
                  equipment_category?: string;
                }).equipment_category ?? "")
                  ? Number(
                      (currentFilters as EquipmentFilters & {
                        equipment_category?: string;
                      }).equipment_category,
                    )
                  : "",

              equipment_description:
                currentFilters.equipment_description.trim(),

              total_quantity:
                currentFilters.total_quantity.trim(),

              remarks:
                currentFilters.remarks.trim(),
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(
            response.message || "Failed to load equipments",
          );
        }

        const rows = getEquipmentRows(response);

        setEquipments((current) =>
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
    void fetchEquipments(1, filters, true);

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
          void fetchEquipments(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);

    return () => observerRef.current?.disconnect();
  }, [
    equipments,
    loading,
    loadingMore,
    hasMore,
    page,
    filters,
    fetchEquipments,
  ]);

  const handleApplyFilters = (next: EquipmentFilters) => {
    setFilters(next);
    setHasMore(true);
    void fetchEquipments(1, next, true);
  };

  const handleRefresh = () => {
    setHasMore(true);
    void fetchEquipments(1, filters, true);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    setDeleting(true);

    try {
      const response = await postAPI(
        "DELETE_EQUIPMENT",
        {
          data: {
            equipment_id: deleteId,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setEquipments((current) =>
        current.filter(
          (item) => String(item.id) !== String(deleteId),
        ),
      );

      setToast({
        message:
          response.message || "Equipment deleted successfully",
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
            Equipments
          </h1>

          <p className="text-sm text-muted-foreground">
            {equipments.length} equipment
            {equipments.length === 1 ? "" : "s"} loaded
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
              <th>Equipment Name</th>
              <th>Equipment Category</th>
              <th>Equipment Description</th>
              <th>Total Quantity</th>
              <th>Remarks</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  Loading equipments...
                </td>
              </tr>
            ) : equipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No equipments match your filters.
                </td>
              </tr>
            ) : (
              equipments.map((equipment, index) => {
                const isLast =
                  index === equipments.length - 1;

                const rowKey =
                  equipment.id ??
                  `${equipment.company_id || "company"}-${
                    equipment.equipment_name || "equipment"
                  }-${equipment.created_at || index}`;

                return (
                  <tr
                    key={String(rowKey)}
                    ref={isLast ? lastRowRef : undefined}
                  >
                    <td className="w-[70px] text-center">
                      {index + 1}
                    </td>

                    <td className="font-medium text-foreground">
                      {equipment.equipment_name || "—"}
                    </td>

                    <td>{equipment.equipment_category_name || "—"}</td>

                    <td>
                      {equipment.equipment_description || "—"}
                    </td>

                    <td>{equipment.total_quantity || "—"}</td>

                    <td>{equipment.remarks || "—"}</td>

                    <td className="action-cell">
                      <div className="flex items-center justify-center">
                        {equipment.id !== undefined &&
                          equipment.id !== null && (
                            <button
                              type="button"
                              className="text-destructive hover:opacity-80"
                              onClick={() =>
                                setDeleteId(equipment.id!)
                              }
                              aria-label="Delete equipment"
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
          <Loader2
            size={14}
            className="animate-spin"
          />
          Loading more...
        </div>
      )}

      {!hasMore && equipments.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No more equipments
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
              Delete equipment?
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
    </div>
  );
}