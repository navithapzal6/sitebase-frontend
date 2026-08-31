"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";

import BigModal from "@/app/utils/components/BigModal";
import { postAPI } from "@/app/utils/helpers/api";
import FilterSidebar, {
  emptyProjectFilters,
  type ProjectFilters,
} from "@/app/utils/components/ProjectFilterSidebar";
import { Button } from "@/app/utils/components/Button";
import { Toaster } from "@/app/utils/components/Toaster";

type Project = {
  id: string;
  client_id?: string | number;
  client_name?: string;
  project_start_date?: string;
  project_description?: string;
  status?: string;
  project_members?: unknown[];
  phase_details?: unknown[];
  project_members_count?: number;
  phase_details_count?: number;
};

type ToastState = { message: string; type: "success" | "error" } | null;

const PAGE_LIMIT = 10;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getProjectRows = (
  response: Awaited<ReturnType<typeof postAPI>>,
): Project[] => {
  const source = Array.isArray(response.data?.projects)
    ? response.data.projects
    : Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
        ? response.data
        : [];

  return source.map((item: any) => ({
    ...item,
    id: String(item?.id ?? item?.project_id ?? item?.ID ?? ""),
    client_id: item?.client_id ?? item?.client?.id,
    client_name:
      item?.client_name ?? item?.clientName ?? item?.client?.client_name ?? item?.client?.name ?? "",
    project_start_date:
      item?.project_start_date ?? item?.projectStartDate ?? item?.start_date ?? "",
    project_description:
      item?.project_description ?? item?.projectDescription ?? item?.description ?? "",
    status: item?.status ?? "",
    project_members: Array.isArray(item?.project_members) ? item.project_members : [],
    phase_details: Array.isArray(item?.phase_details) ? item.phase_details : [],
    project_members_count:
      Number(item?.project_members_count ?? item?.members_count ?? 0) ||
      (Array.isArray(item?.project_members) ? item.project_members.length : 0),
    phase_details_count:
      Number(item?.phase_details_count ?? item?.phases_count ?? 0) ||
      (Array.isArray(item?.phase_details) ? item.phase_details.length : 0),
  }));
};

const displayDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB");
};

const displayStatus = (value?: string) => {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ProjectFilters>(emptyProjectFilters);

  const [viewId, setViewId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<Project | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [updateProject, setUpdateProject] = useState<Project | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchProjects = useCallback(
    async (pageToLoad: number, currentFilters: ProjectFilters, replace: boolean) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);

      try {
        const response = await postAPI(
          "PROJECT_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              client_name: currentFilters.client_name.trim(),
              project_start_date: currentFilters.project_start_date,
              status: currentFilters.status,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load projects");
        }

        const rows = getProjectRows(response);
        setProjects((current) => (replace ? rows : [...current, ...rows]));
        setPage(pageToLoad);

        const pagination = response.data?.pagination;
        if (pagination?.total_pages) {
          setHasMore(pageToLoad < Number(pagination.total_pages));
        } else if (response.total_pages || response.totalPages) {
          setHasMore(pageToLoad < Number(response.total_pages ?? response.totalPages));
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
    fetchProjects(1, emptyProjectFilters, true);
  }, [fetchProjects]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !lastRowRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchProjects(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);
    return () => observerRef.current?.disconnect();
  }, [projects, loading, loadingMore, hasMore, page, filters, fetchProjects]);

  useEffect(() => {
    if (!viewId) {
      setViewData(null);
      return;
    }

    const fetchProject = async () => {
      setViewLoading(true);
      try {
        const response = await postAPI(
          "PROJECT_DETAIL",
          { data: { project_id: viewId } },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load project");
        }

        const source = response.data?.project ?? response.data?.data ?? response.data;
        const normalized = getProjectRows({ ...response, data: [source] })[0];
        setViewData(normalized ?? null);
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

    fetchProject();
  }, [viewId]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const response = await postAPI(
        "DELETE_PROJECT",
        { data: { project_id: deleteId } },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Delete failed");
      }

      setProjects((current) => current.filter((project) => project.id !== deleteId));
      setToast({
        message: response.message || "Project deleted successfully",
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
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} project{projects.length === 1 ? "" : "s"} loaded
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHasMore(true);
              fetchProjects(1, filters, true);
            }}
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
              <th>Client Name</th>
              <th>Project Start Date</th>
              <th>Status</th>
              <th className="text-center">Members</th>
              <th className="text-center">Phases</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-row">Loading projects...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">No projects match your filters.</td>
              </tr>
            ) : (
              projects.map((project, index) => {
                const isLast = index === projects.length - 1;
                return (
                  <tr key={project.id} ref={isLast ? lastRowRef : undefined}>
                    <td className="w-[70px] text-center">{index + 1}</td>
                    <td className="font-medium text-foreground">{project.client_name || "—"}</td>
                    <td>{displayDate(project.project_start_date)}</td>
                    <td>{displayStatus(project.status)}</td>
                    <td className="text-center">{project.project_members_count ?? 0}</td>
                    <td className="text-center">{project.phase_details_count ?? 0}</td>
                    <td className="action-cell">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          className="redirect-link"
                          onClick={() => setViewId(project.id)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="redirect-link"
                          onClick={() => setUpdateProject(project)}
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          className="text-destructive hover:opacity-80"
                          onClick={() => setDeleteId(project.id)}
                          aria-label="Delete project"
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

      {!hasMore && projects.length > 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">No more projects</p>
      )}

      <FilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setHasMore(true);
          fetchProjects(1, nextFilters, true);
        }}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-background p-6">
            <h2 className="text-base font-semibold text-foreground">Delete project?</h2>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
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
              <h2 className="text-base font-semibold text-foreground">Project details</h2>
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
                  Loading project...
                </div>
              ) : viewData ? (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Client Name</dt>
                    <dd className="font-medium text-foreground">{viewData.client_name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Project Start Date</dt>
                    <dd className="font-medium text-foreground">{displayDate(viewData.project_start_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Status</dt>
                    <dd className="font-medium text-foreground">{displayStatus(viewData.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Members</dt>
                    <dd className="font-medium text-foreground">{viewData.project_members_count ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Phases</dt>
                    <dd className="font-medium text-foreground">{viewData.phase_details_count ?? 0}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">Project Description</dt>
                    <dd className="font-medium text-foreground">{viewData.project_description || "—"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No data found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <BigModal
        open={Boolean(updateProject)}
        onClose={() => setUpdateProject(null)}
        title={updateProject?.client_name || `Project #${updateProject?.id || ""}`}
      >
        <div className="h-full bg-white" />
      </BigModal>
    </div>
  );
}
