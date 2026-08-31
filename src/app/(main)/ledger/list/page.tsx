 "use client";
 
 import { useCallback, useEffect, useRef, useState } from "react";
 import { Loader2, RefreshCw, SlidersHorizontal, Trash2 } from "lucide-react";
 
 import { postAPI } from "@/app/utils/helpers/api";
 import FilterSidebar, {
   type LedgerFilters,
   emptyLedgerFilters,
 } from "@/app/utils/components/LedgerFilterSidebar";
 import { Button } from "@/app/utils/components/Button";
 import { Toaster } from "@/app/utils/components/Toaster";
 
 type Ledger = {
   id: string | number;
   ledger_id?: string | number;
   company_id?: string;
   ledger_name?: string;
   ledger_type?: string;
   ledger_description?: string;
    
 };
 
 type ToastState = { message: string; type: "success" | "error" } | null;
 
 const PAGE_LIMIT = 10;
 
 const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
   response.success === true ||
   response.status === true ||
   response.status === "success";
 
 const getLedgerRows = (
   response: Awaited<ReturnType<typeof postAPI>>,
 ): Ledger[] => {
   const source = Array.isArray(response.data)
     ? response.data
     : Array.isArray(response.data?.data)
       ? response.data.data
       : Array.isArray(response.data?.ledgers)
         ? response.data.ledgers
         : [];
 
   return source.map((item: any) => ({
     ...item,
     id: item.id ?? item.ledger_id,
     phone_number: item.phone_number ?? item.phone ?? "",
   }));
 };
 
 export default function LedgerListPage() {
   const [ledgers, setLedgers] = useState<Ledger[]>([]);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [loading, setLoading] = useState(false);
   const [loadingMore, setLoadingMore] = useState(false);
   const [filterOpen, setFilterOpen] = useState(false);
   const [filters, setFilters] = useState<LedgerFilters>(
     emptyLedgerFilters,
   );
   const [deleteId, setDeleteId] = useState<string | number | null>(null);
   const [deleting, setDeleting] = useState(false);
   const [toast, setToast] = useState<ToastState>(null);
 
   const lastRowRef = useRef<HTMLTableRowElement | null>(null);
   const observerRef = useRef<IntersectionObserver | null>(null);
 
   const fetchLedgers = useCallback(
     async (
       pageToLoad: number,
       currentFilters: LedgerFilters,
       replace: boolean,
     ) => {
       pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);
 
       try {
         const response = await postAPI(
           "LEDGER_LIST",
           {data :{
             page: pageToLoad,
             limit: PAGE_LIMIT,
             conditions: {
               ledger_type: currentFilters.ledger_type.trim(),
               
             },
           }
           },
           true,
         );
 
         if (!isSuccess(response)) {
           throw new Error(response.message || "Failed to load ledgers");
         }
 
         const rows = getLedgerRows(response);
         setLedgers((current) => (replace ? rows : [...current, ...rows]));
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
     void fetchLedgers(1, filters, true);
     // Initial load follows the same flow as the Client list.
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
 
   useEffect(() => {
     if (loading || loadingMore || !hasMore || !lastRowRef.current) return;
 
     observerRef.current?.disconnect();
     observerRef.current = new IntersectionObserver(
       (entries) => {
         if (entries[0].isIntersecting) {
           void fetchLedgers(page + 1, filters, false);
         }
       },
       { threshold: 0.5 },
     );
 
     observerRef.current.observe(lastRowRef.current);
     return () => observerRef.current?.disconnect();
   }, [
     ledgers,
     loading,
     loadingMore,
     hasMore,
     page,
     filters,
     fetchLedgers,
   ]);
 
   const handleApplyFilters = (next: LedgerFilters) => {
     setFilters(next);
     setHasMore(true);
     void fetchLedgers(1, next, true);
   };
 
   const handleRefresh = () => {
     setHasMore(true);
     void fetchLedgers(1, filters, true);
   };
 
   
 
   const confirmDelete = async () => {
     if (deleteId === null) return;
 
     setDeleting(true);
     try {
       const response = await postAPI(
         "DELETE_LEDGER",
         { data: { ledger_id: deleteId } },
         true,
       );
 
       if (!isSuccess(response)) {
         throw new Error(response.message || "Delete failed");
       }
 
       setLedgers((current) =>
         current.filter((item) => String(item.id) !== String(deleteId)),
       );
       setToast({
         message: response.message || "Ledger deleted successfully",
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
           <h1 className="text-lg font-semibold text-foreground">Ledgers</h1>
           <p className="text-sm text-muted-foreground">
             {ledgers.length} ledger{ledgers.length === 1 ? "" : "s"}{" "}
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
               <th>Ledger Type</th>
             <th>Ledger Name</th>
                  <th>Description</th>
               <th className="text-center">Actions</th>
             </tr>
           </thead>
           <tbody>
             {loading ? (
               <tr>
                 <td colSpan={7} className="empty-row">
                   Loading ledgers...
                 </td>
               </tr>
             ) : ledgers.length === 0 ? (
               <tr>
                 <td colSpan={7} className="empty-row">
                   No ledgers match your filters.
                 </td>
               </tr>
             ) : (
               ledgers.map((ledger, index) => {
                 const isLast = index === ledgers.length - 1;
                 return (
                   <tr
                     key={`${ledger.id}-${index}`}
                     ref={isLast ? lastRowRef : undefined}
                   >
                     <td className="w-[70px] text-center">{index + 1}</td>
                     <td className="font-medium text-foreground">
  {ledger.ledger_type
    ? ledger.ledger_type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "—"}
</td>
                      <td>{ledger.ledger_name || "—"}</td>
                     <td>{ledger.ledger_description || "—"}</td>
                      <td className="action-cell">
                       <div className="flex items-center justify-center gap-3">
                         
                          
                         <button
                           type="button"
                           className="text-destructive hover:opacity-80"
                           onClick={() => setDeleteId(ledger.id)}
                           aria-label="Delete ledger"
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
 
       {!hasMore && ledgers.length > 0 && (
         <p className="py-2 text-center text-xs text-muted-foreground">
           No more ledgers
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
               Delete ledger?
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
 