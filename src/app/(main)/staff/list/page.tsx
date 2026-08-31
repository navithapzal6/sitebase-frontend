"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  type StaffFilters,
  emptyStaffFilters,
} from "@/app/utils/components/StaffFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Staff = {
  id: string;
  staff_name?: string;
  designation_id?: string | number;
  designation_name?: string;
  phone_number?: string;
  email?: string;
  city?: string;
  state?: string;
  created_at?: string;
};

type StaffDetail = Staff & {
  alternate_phone_number?: string;
  aadhaar_number?: string;
  pan_number?: string;
  address_line1?: string;
  address_line2?: string;
  pincode?: string;
  bank_name?: string;
  branch_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
};

type ToastState = { message: string; type: "success" | "error" } | null;

const PAGE_LIMIT = 10;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getStaffRows = (response: Awaited<ReturnType<typeof postAPI>>): Staff[] => {
  const rows = Array.isArray(response.data?.staffs)
    ? response.data.staffs
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];

  return rows.map((item: any) => ({
    ...item,
    id: String(item?.id ?? item?.staff_id ?? item?.ID ?? ""),
    staff_name: item?.staff_name ?? item?.staffName ?? item?.full_name ?? "",
    designation_id:
      item?.designation_id ?? item?.staff_designation_id ?? item?.designation?.id,
    designation_name:
      item?.designation_name ??
      item?.staff_designation ??
      item?.designation?.ledger_name ??
      item?.designation?.name ??
      "",
    phone_number: item?.phone_number ?? item?.phoneNumber ?? item?.phone ?? "",
    email: item?.email ?? "",
    city: item?.city ?? "",
    state: item?.state ?? "",
  }));
};

const normalizeDetail = (source: any): StaffDetail => ({
  ...source,
  id: String(source?.id ?? source?.staff_id ?? source?.ID ?? ""),
  staff_name: source?.staff_name ?? source?.staffName ?? source?.full_name ?? "",
  designation_id:
    source?.designation_id ?? source?.staff_designation_id ?? source?.designation?.id,
  designation_name:
    source?.designation_name ??
    source?.staff_designation ??
    source?.designation?.ledger_name ??
    source?.designation?.name ??
    "",
  phone_number: source?.phone_number ?? source?.phoneNumber ?? source?.phone ?? "",
  alternate_phone_number:
    source?.alternate_phone_number ?? source?.alternatePhoneNumber ?? "",
  email: source?.email ?? "",
  address_line1: source?.address_line1 ?? source?.addressLine1 ?? source?.address ?? "",
  address_line2: source?.address_line2 ?? source?.addressLine2 ?? "",
  city: source?.city ?? "",
  state: source?.state ?? "",
  pincode: source?.pincode ?? "",
  bank_name: source?.bank_name ?? source?.bankName ?? "",
  branch_name: source?.branch_name ?? source?.branchName ?? "",
  bank_account_number:
    source?.bank_account_number ?? source?.bankAccountNumber ?? "",
  ifsc_code: source?.ifsc_code ?? source?.ifscCode ?? "",
  aadhaar_number: source?.aadhaar_number ?? source?.aadhaarNumber ?? "",
  pan_number: source?.pan_number ?? source?.panNumber ?? "",
  created_at: source?.created_at ?? source?.createdAt ?? "",
});

export default function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<StaffFilters>(emptyStaffFilters);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<StaffDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchStaff = useCallback(
    async (
      pageToLoad: number,
      currentFilters: StaffFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "STAFF_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              staff_name: currentFilters.staff_name.trim(),
              staff_designation: currentFilters.staff_designation.trim(),
              phone_number: currentFilters.phone_number.trim(),
              email: currentFilters.email.trim(),
              city: currentFilters.city.trim(),
              state: currentFilters.state.trim(),
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load staff");
        }

        const rows = getStaffRows(response);
        setStaff((current) => (replace ? rows : [...current, ...rows]));
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
    void fetchStaff(1, filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !lastRowRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchStaff(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);
    return () => observerRef.current?.disconnect();
  }, [staff, loading, loadingMore, hasMore, page, filters, fetchStaff]);

  const handleApplyFilters = (next: StaffFilters) => {
    setFilters(next);
    setHasMore(true);
    void fetchStaff(1, next, true);
  };

  const handleRefresh = () => {
    setHasMore(true);
    void fetchStaff(1, filters, true);
  };

  useEffect(() => {
    if (!viewId) {
      setViewData(null);
      return;
    }

    const fetchDetail = async () => {
      setViewLoading(true);
      try {
        const response = await postAPI(
          "STAFF_DETAIL",
          { data: { staff_id: viewId } },
          true,
        );

        if (!isSuccess(response) || !response.data) {
          throw new Error(response.message || "Failed to load staff");
        }

        setViewData(normalizeDetail(response.data?.data ?? response.data));
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
    if (!deleteId) return;

    setDeleting(true);
    try {
      const response = await postAPI(
        "DELETE_STAFF",
        { data: { staff_id: deleteId } },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setStaff((current) => current.filter((item) => item.id !== deleteId));
      setToast({
        message: response.message || "Staff deleted successfully",
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

  function DetailField({ label, value }: { label: string; value?: string }) {
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
          <h1 className="text-lg font-semibold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">
            {staff.length} staff loaded
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
              <th>Staff Name</th>
              <th>Designation</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>State</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  Loading staff...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  No staff match your filters.
                </td>
              </tr>
            ) : (
              staff.map((item, index) => {
                const isLast = index === staff.length - 1;
                return (
                  <tr key={item.id} ref={isLast ? lastRowRef : undefined}>
                    <td className="w-[70px] text-center">{index + 1}</td>
                    <td className="font-medium text-foreground">
                      {item.staff_name}
                    </td>
                    <td>{item.designation_name || "—"}</td>
                    <td>{item.phone_number}</td>
                    <td>{item.email}</td>
                    <td>{item.city}</td>
                    <td>{item.state}</td>
                    <td className="action-cell">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="redirect-link"
                          onClick={() => setViewId(item.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="text-destructive hover:opacity-80"
                          onClick={() => setDeleteId(item.id)}
                          aria-label="Delete staff"
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

      {!hasMore && staff.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No more staff
        </p>
      )}

      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-background p-6">
            <h2 className="text-base font-semibold text-foreground">
              Delete staff?
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

      {viewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-background">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                Staff details
              </h2>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setViewId(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4">
              {viewLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Loading staff...
                </div>
              ) : viewData ? (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  <DetailField label="Staff name" value={viewData.staff_name} />
                  <DetailField
                    label="Designation"
                    value={viewData.designation_name}
                  />
                  <DetailField label="Phone" value={viewData.phone_number} />
                  <DetailField
                    label="Alternate phone"
                    value={viewData.alternate_phone_number}
                  />
                  <DetailField label="Email" value={viewData.email} />
                  <DetailField label="Aadhaar" value={viewData.aadhaar_number} />
                  <DetailField label="PAN" value={viewData.pan_number} />
                  <DetailField label="Address" value={viewData.address_line1} />
                  <DetailField
                    label="Address line 2"
                    value={viewData.address_line2}
                  />
                  <DetailField label="City" value={viewData.city} />
                  <DetailField label="State" value={viewData.state} />
                  <DetailField label="Pincode" value={viewData.pincode} />
                  <DetailField label="Bank name" value={viewData.bank_name} />
                  <DetailField label="Branch" value={viewData.branch_name} />
                  <DetailField
                    label="Account number"
                    value={viewData.bank_account_number}
                  />
                  <DetailField label="IFSC" value={viewData.ifsc_code} />
                  <DetailField label="Created" value={viewData.created_at} />
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
