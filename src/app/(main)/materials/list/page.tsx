"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  type MaterialFilters,
  emptyMaterialFilters,
} from "@/app/utils/components/MaterialFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Material = {
  id?: string | number;
  material_id?: string | number;
  company_id?: string;

  material_name?: string;

  material_category?: string | number;
  material_category_name?: string;

  material_description?: string;

  unit_of_measurement?: string | number;
  unit_of_measurement_name?: string;
  minimum_stock_level?: string | number;
  reorder_level?: string | number;
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

const getMaterialRows = (
  response: Awaited<ReturnType<typeof postAPI>>,
): Material[] => {
  const source = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data?.materials)
        ? response.data.materials
        : [];

  return source.map((item: any) => ({
    ...item,
    id: item?.id ?? item?.material_id ?? item?.ID,
    material_name: item?.material_name ?? item?.materialName ?? "",
    material_category: item?.material_category ?? item?.materialCategory ?? "",
    material_category_name:
      item?.material_category_name ?? item?.materialCategoryName ?? "",
    material_description:
      item?.material_description ?? item?.materialDescription ?? "",
    unit_of_measurement:
      item?.unit_of_measurement ?? item?.unitOfMeasurement ?? "",
    unit_of_measurement_name:
      item?.unit_of_measurement_name ?? item?.unitOfMeasurementName ?? "",
    minimum_stock_level:
      item?.minimum_stock_level ?? item?.minimumStockLevel ?? "",
    reorder_level: item?.reorder_level ?? item?.reorderLevel ?? "",
    remarks: item?.remarks ?? "",
  }));
};

export default function MaterialListPage() {
  const [materials, setMaterials] = useState<Material[]>([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MaterialFilters>(emptyMaterialFilters);

  const [viewId, setViewId] = useState<string | number | null>(null);
  const [viewData, setViewData] = useState<Material | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchMaterials = useCallback(
    async (
      pageToLoad: number,
      currentFilters: MaterialFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "MATERIAL_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              material_name: currentFilters.material_name.trim(),

              material_category: currentFilters.material_category
                ? Number(currentFilters.material_category)
                : "",

              material_description: currentFilters.material_description.trim(),

              unit_of_measurement: currentFilters.unit_of_measurement
                ? Number(currentFilters.unit_of_measurement)
                : "",

              minimum_stock_level: currentFilters.minimum_stock_level.trim(),

              reorder_level: currentFilters.reorder_level.trim(),

              // Backend expects remarks in the list payload.
              // No remarks filter field is used in the sidebar, so send empty string.
              remarks: "",
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load materials");
        }

        const rows = getMaterialRows(response);

        setMaterials((current) => (replace ? rows : [...current, ...rows]));

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
    void fetchMaterials(1, filters, true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !lastRowRef.current) {
      return;
    }

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchMaterials(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);

    return () => observerRef.current?.disconnect();
  }, [materials, loading, loadingMore, hasMore, page, filters, fetchMaterials]);

  const handleApplyFilters = (next: MaterialFilters) => {
    setFilters(next);
    setHasMore(true);
    void fetchMaterials(1, next, true);
  };

  const handleRefresh = () => {
    setHasMore(true);
    void fetchMaterials(1, filters, true);
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
          "GET_MATERIAL_BY_ID",
          {
            data: {
              material_id: viewId,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load material");
        }

        const detail = response.data?.data ?? response.data ?? {};

        setViewData({
          ...detail,
          id: detail?.id ?? detail?.material_id ?? detail?.ID ?? viewId,
          material_name: detail?.material_name ?? detail?.materialName ?? "",
          material_category:
            detail?.material_category ?? detail?.materialCategory ?? "",
          material_category_name:
            detail?.material_category_name ??
            detail?.materialCategoryName ??
            "",
          material_description:
            detail?.material_description ?? detail?.materialDescription ?? "",
          unit_of_measurement:
            detail?.unit_of_measurement ?? detail?.unitOfMeasurement ?? "",
          unit_of_measurement_name:
            detail?.unit_of_measurement_name ??
            detail?.unitOfMeasurementName ??
            "",
          minimum_stock_level:
            detail?.minimum_stock_level ?? detail?.minimumStockLevel ?? "",
          reorder_level: detail?.reorder_level ?? detail?.reorderLevel ?? "",
          remarks: detail?.remarks ?? "",
          created_at: detail?.created_at ?? detail?.createdAt ?? "",
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
        "DELETE_MATERIAL",
        {
          data: {
            material_id: deleteId,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setMaterials((current) =>
        current.filter((item) => String(item.id) !== String(deleteId)),
      );

      setToast({
        message: response.message || "Material deleted successfully",
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

  function DetailField({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) {
    return (
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground">{value || "—"}</dd>
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
          <h1 className="text-lg font-semibold text-foreground">Materials</h1>

          <p className="text-sm text-muted-foreground">
            {materials.length} material
            {materials.length === 1 ? "" : "s"} loaded
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
              <th>Material Name</th>
              <th>Material Category</th>
              <th>Unit of Measurement</th>
              <th>Minimum Stock Level</th>
              <th>Reorder Level</th>
              <th>Remarks</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Loading materials...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No materials match your filters.
                </td>
              </tr>
            ) : (
              materials.map((material, index) => {
                const isLast = index === materials.length - 1;

                const rowKey =
                  material.id ??
                  `${material.company_id || "company"}-${
                    material.material_name || "material"
                  }-${material.created_at || index}`;

                return (
                  <tr
                    key={String(rowKey)}
                    ref={isLast ? lastRowRef : undefined}
                  >
                    <td className="w-[70px] text-center">{index + 1}</td>

                    <td className="font-medium text-foreground">
                      {material.material_name || "—"}
                    </td>

                    <td>{material.material_category_name || "—"}</td>
                    <td>{material.unit_of_measurement_name || "—"}</td>
                    <td>{material.minimum_stock_level ?? "—"}</td>
                    <td>{material.reorder_level ?? "—"}</td>
                    <td>{material.remarks || "—"}</td>

                    <td className="action-cell">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="redirect-link"
                          onClick={() => {
                            if (
                              material.id === undefined ||
                              material.id === null
                            ) {
                              setToast({
                                message: "Material ID is missing",
                                type: "error",
                              });
                              return;
                            }

                            setViewId(material.id);
                          }}
                        >
                          View
                        </button>

                        {material.id !== undefined && material.id !== null && (
                          <button
                            type="button"
                            className="text-destructive hover:opacity-80"
                            onClick={() => setDeleteId(material.id!)}
                            aria-label="Delete material"
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

      {!hasMore && materials.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No more materials
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
              Delete material?
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
                Material details
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
                  Loading material...
                </div>
              ) : viewData ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <DetailField
                    label="Material name"
                    value={viewData.material_name}
                  />
                  <DetailField
                    label="Material category"
                    value={viewData.material_category_name}
                  />
                  <DetailField
                    label="Description"
                    value={viewData.material_description}
                  />
                  <DetailField
                    label="Unit of measurement"
                    value={viewData.unit_of_measurement_name}
                  />
                  <DetailField
                    label="Minimum stock level"
                    value={viewData.minimum_stock_level}
                  />
                  <DetailField
                    label="Reorder level"
                    value={viewData.reorder_level}
                  />
                  <DetailField label="Remarks" value={viewData.remarks} />
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
