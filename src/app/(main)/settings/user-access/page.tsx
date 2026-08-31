// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
// import { Loader2, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

// import BigModal from "@/app/utils/components/BigModal";
// import { Button } from "@/app/utils/components/Button";
// import ConfirmModal from "@/app/utils/components/ConfirmationModal";
// import PasswordField from "@/app/utils/components/PasswordField";
// import { Toaster } from "@/app/utils/components/Toaster";
// import { TypeaheadField } from "@/app/utils/components/TypeaheadControl";
// import UserAccessFilterSidebar, {
//   emptyUserAccessFilters,
//   type UserAccessFilters,
// } from "@/app/utils/components/UserAccessFilterSidebar";
// import UserAccessPermissions, {
//   type PermissionGroup,
// } from "@/app/utils/components/UserAccessPermissions";
// import { postAPI } from "@/app/utils/helpers/api";
// import { patterns } from "@/app/utils/helpers/validationPattern";

// type UserAccessRow = {
//   id: string;
//   staff_name: string;
//   username: string;
//   status: number;
//   status_label: string;
// };

// type StaffOptionSource = {
//   id: string;
//   staff_name: string;
//   email: string;
//   phone_number: string;
// };

// type AddUserAccessForm = {
//   staff_id: string;
//   password: string;
// };

// type ToastState = { message: string; type: "success" | "error" } | null;

// const PAGE_LIMIT = 10;

// const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
//   response.success === true ||
//   response.status === true ||
//   response.status === "success";

// const asArray = (value: any): any[] => (Array.isArray(value) ? value : []);

// const getUserRows = (response: Awaited<ReturnType<typeof postAPI>>): UserAccessRow[] => {
//   const rows = asArray(response.data?.users).length
//     ? asArray(response.data?.users)
//     : asArray(response.data).length
//       ? asArray(response.data)
//       : asArray(response.data?.data);

//   return rows
//     .filter((item) => String(item?.user_type || "user").toLowerCase() === "user")
//     .map((item) => {
//       const status = Number(item?.status ?? 1);
//       return {
//         id: String(item?.id ?? item?.user_id ?? ""),
//         staff_name: String(
//           item?.staff_name ?? item?.full_name ?? item?.name ?? item?.username ?? "—",
//         ),
//         username: String(item?.username ?? ""),
//         status,
//         status_label: String(
//           item?.status_label ??
//             (status === 1 ? "Active" : status === 2 ? "Inactive" : "Pending"),
//         ),
//       };
//     })
//     .filter((item) => item.id);
// };

// const getStaffRows = (response: Awaited<ReturnType<typeof postAPI>>): StaffOptionSource[] => {
//   const candidates = [
//     response.data?.staff,
//     response.data?.staffs,
//     response.data?.staff_list,
//     response.data?.data,
//     response.data,
//   ];
//   const rows = candidates.find((value) => Array.isArray(value)) ?? [];

//   return asArray(rows)
//     .map((item) => ({
//       id: String(item?.id ?? item?.staff_id ?? ""),
//       staff_name: String(item?.staff_name ?? item?.name ?? item?.full_name ?? ""),
//       email: String(item?.email ?? ""),
//       phone_number: String(item?.phone_number ?? item?.phone ?? ""),
//     }))
//     .filter((item) => item.id && item.staff_name);
// };

// const normalizePermissionGroups = (
//   response: Awaited<ReturnType<typeof postAPI>>,
// ): PermissionGroup[] => {
//   const rows = asArray(response.data?.permissions).length
//     ? asArray(response.data?.permissions)
//     : asArray(response.data);

//   const grouped = new Map<string, PermissionGroup["items"]>();

//   rows.forEach((item) => {
//     const key = String(item?.key ?? item?.permission_key ?? "").trim();
//     if (!key) return;

//     const route = String(item?.route ?? "").trim();
//     const rawModule = String(item?.module ?? "General").trim() || "General";
//     const rawPage = String(item?.page ?? item?.label ?? key).trim() || key;

//     let moduleName = rawModule;
//     if (/equipment|machiner/i.test(`${rawModule} ${rawPage} ${route}`)) {
//       moduleName = "Assets";
//     }

//     const items = grouped.get(moduleName) ?? [];
//     items.push({ key, label: rawPage, route });
//     grouped.set(moduleName, items);
//   });

//   return Array.from(grouped.entries()).map(([module, items]) => ({
//     module,
//     items,
//   }));
// };

// const makeUsername = (name: string) =>
//   name
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "")
//     .slice(0, 40);

// export default function UserAccessPage() {
//   const [rows, setRows] = useState<UserAccessRow[]>([]);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [filters, setFilters] = useState<UserAccessFilters>(emptyUserAccessFilters);
//   const [toast, setToast] = useState<ToastState>(null);

//   const [addOpen, setAddOpen] = useState(false);
//   const [staffRows, setStaffRows] = useState<StaffOptionSource[]>([]);
//   const [staffLoading, setStaffLoading] = useState(false);
//   const [addConfirmOpen, setAddConfirmOpen] = useState(false);
//   const [pendingAdd, setPendingAdd] = useState<AddUserAccessForm | null>(null);
//   const [savingAdd, setSavingAdd] = useState(false);

//   const [updateUser, setUpdateUser] = useState<UserAccessRow | null>(null);
//   const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
//   const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
//   const [permissionLoading, setPermissionLoading] = useState(false);
//   const [permissionConfirmOpen, setPermissionConfirmOpen] = useState(false);
//   const [savingPermissions, setSavingPermissions] = useState(false);

//   const lastRowRef = useRef<HTMLTableRowElement | null>(null);
//   const observerRef = useRef<IntersectionObserver | null>(null);

//   const addForm = useForm<AddUserAccessForm>({
//     defaultValues: { staff_id: "", password: "" },
//   });

//   const fetchUsers = useCallback(
//     async (
//       pageToLoad: number,
//       currentFilters: UserAccessFilters,
//       replace: boolean,
//     ) => {
//       pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);
//       try {
//         const response = await postAPI(
//           "USER_MANAGEMENT_LIST",
//           {
//             page: pageToLoad,
//             limit: PAGE_LIMIT,
//             conditions: {
//               search: currentFilters.staff_name.trim(),
//               user_type: "user",
//               status: currentFilters.access_status
//                 ? Number(currentFilters.access_status)
//                 : 0,
//             },
//           },
//           true,
//         );

//         if (!isSuccess(response)) {
//           throw new Error(response.message || "Failed to load user access");
//         }

//         const nextRows = getUserRows(response);
//         setRows((current) => (replace ? nextRows : [...current, ...nextRows]));
//         setPage(pageToLoad);

//         const total = Number(response.total_count ?? response.count ?? 0);
//         if (total > 0) {
//           setHasMore(pageToLoad * PAGE_LIMIT < total);
//         } else {
//           setHasMore(nextRows.length === PAGE_LIMIT);
//         }
//       } catch (error: any) {
//         setToast({
//           message: error.message || "Something went wrong",
//           type: "error",
//         });
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//       }
//     },
//     [],
//   );

//   useEffect(() => {
//     void fetchUsers(1, filters, true);
//     // The initial list follows the same single-fetch pattern used by the other list pages.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (loading || loadingMore || !hasMore || !lastRowRef.current) return;

//     observerRef.current?.disconnect();
//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting) {
//           void fetchUsers(page + 1, filters, false);
//         }
//       },
//       { threshold: 0.5 },
//     );

//     observerRef.current.observe(lastRowRef.current);
//     return () => observerRef.current?.disconnect();
//   }, [rows, loading, loadingMore, hasMore, page, filters, fetchUsers]);

//   const fetchStaffOptions = async () => {
//     if (staffRows.length > 0) return;

//     setStaffLoading(true);
//     try {
//       const response = await postAPI(
//         "STAFF_LIST",
//         {
//           page: 1,
//           limit: 100,
//           conditions: {
//             staff_name: "",
//             staff_designation: "",
//             phone_number: "",
//             email: "",
//             city: "",
//             state: "",
//           },
//         },
//         true,
//       );

//       if (!isSuccess(response)) {
//         throw new Error(response.message || "Failed to load staff");
//       }

//       setStaffRows(getStaffRows(response));
//     } catch (error: any) {
//       setToast({
//         message: error.message || "Unable to load staff",
//         type: "error",
//       });
//     } finally {
//       setStaffLoading(false);
//     }
//   };

//   const staffOptions = useMemo(
//     () =>
//       staffRows.map((staff) => ({
//         value: staff.id,
//         label: staff.staff_name,
//         description: staff.phone_number || staff.email || undefined,
//       })),
//     [staffRows],
//   );

//   const openAddModal = () => {
//     addForm.reset({ staff_id: "", password: "" });
//     setAddOpen(true);
//     void fetchStaffOptions();
//   };

//   const onAddSubmit: SubmitHandler<AddUserAccessForm> = (data) => {
//     setPendingAdd(data);
//     setAddConfirmOpen(true);
//   };

//   const confirmAddUser = async () => {
//     if (!pendingAdd) return;

//     const selectedStaff = staffRows.find(
//       (staff) => String(staff.id) === String(pendingAdd.staff_id),
//     );
//     if (!selectedStaff) {
//       setToast({ message: "Please select a valid staff", type: "error" });
//       setAddConfirmOpen(false);
//       return;
//     }

//     setSavingAdd(true);
//     try {
//       const response = await postAPI(
//         "SAVE_USER",
//         {
//           data: {
//             user_id: 0,
//             full_name: selectedStaff.staff_name,
//             email: selectedStaff.email,
//             phone: selectedStaff.phone_number,
//             staff_id: Number(selectedStaff.id) || selectedStaff.id,
//             username: makeUsername(selectedStaff.staff_name),
//             password: pendingAdd.password,
//             user_type: "user",
//             status: 1,
//           },
//         },
//         true,
//       );

//       if (!isSuccess(response)) {
//         throw new Error(response.message || "Failed to create user access");
//       }

//       setToast({
//         message: response.message || "User access created successfully",
//         type: "success",
//       });
//       setAddOpen(false);
//       setAddConfirmOpen(false);
//       setPendingAdd(null);
//       addForm.reset({ staff_id: "", password: "" });
//       setHasMore(true);
//       await fetchUsers(1, filters, true);
//     } catch (error: any) {
//       setToast({
//         message: error.message || "Something went wrong",
//         type: "error",
//       });
//     } finally {
//       setSavingAdd(false);
//     }
//   };

//   const openUpdateModal = async (user: UserAccessRow) => {
//     setUpdateUser(user);
//     setPermissionLoading(true);
//     setSelectedPermissions(new Set());
//     setPermissionGroups([]);

//     try {
//       const [catalogResponse, accessResponse] = await Promise.all([
//         postAPI("PERMISSION_CATALOG", {}, true),
//         postAPI(
//           "USER_ACCESS_DETAILS",
//           { data: { user_id: Number(user.id) || user.id } },
//           true,
//         ),
//       ]);

//       if (!isSuccess(catalogResponse)) {
//         throw new Error(catalogResponse.message || "Failed to load permission modules");
//       }
//       if (!isSuccess(accessResponse)) {
//         throw new Error(accessResponse.message || "Failed to load user access details");
//       }

//       setPermissionGroups(normalizePermissionGroups(catalogResponse));
//       const permissions = asArray(accessResponse.data?.permissions).map(String);
//       setSelectedPermissions(new Set(permissions));
//     } catch (error: any) {
//       setToast({
//         message: error.message || "Something went wrong",
//         type: "error",
//       });
//     } finally {
//       setPermissionLoading(false);
//     }
//   };

//   const confirmPermissionSave = async () => {
//     if (!updateUser) return;

//     setSavingPermissions(true);
//     try {
//       const response = await postAPI(
//         "SAVE_USER_ACCESS",
//         {
//           data: {
//             user_id: Number(updateUser.id) || updateUser.id,
//             permissions: Array.from(selectedPermissions),
//           },
//         },
//         true,
//       );

//       if (!isSuccess(response)) {
//         throw new Error(response.message || "Failed to update user access");
//       }

//       setToast({
//         message: response.message || "User access updated successfully",
//         type: "success",
//       });
//       setPermissionConfirmOpen(false);
//       setUpdateUser(null);
//     } catch (error: any) {
//       setToast({
//         message: error.message || "Something went wrong",
//         type: "error",
//       });
//     } finally {
//       setSavingPermissions(false);
//     }
//   };

//   const activeFilterCount = Object.values(filters).filter(Boolean).length;

//   return (
//     <div className="space-y-4 p-3 sm:p-6">
//       {toast && (
//         <Toaster
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast(null)}
//         />
//       )}

//       <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-lg font-semibold text-foreground">User Access</h1>
//           <p className="text-sm text-muted-foreground">
//             {rows.length} user access records loaded
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-2">
//           <button
//             type="button"
//             onClick={() => {
//               setHasMore(true);
//               void fetchUsers(1, filters, true);
//             }}
//             className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
//             aria-label="Refresh"
//             title="Refresh"
//           >
//             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//           </button>

//           <button
//             type="button"
//             onClick={() => setFilterOpen(true)}
//             className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
//           >
//             <SlidersHorizontal size={15} />
//             Filters
//             {activeFilterCount > 0 && (
//               <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
//                 {activeFilterCount}
//               </span>
//             )}
//           </button>

//           <Button type="button" onClick={openAddModal} className="primary-btn">
//             <Plus size={15} />
//             Add User Access
//           </Button>
//         </div>
//       </div>

//       <div className="overflow-x-auto rounded-lg border border-border">
//         <table className="table-default min-w-[620px]">
//           <thead>
//             <tr>
//               <th className="w-[70px] text-center">S.No</th>
//               <th>Staff Name</th>
//               <th>Access Status</th>
//               <th className="w-[130px] text-center">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={4} className="empty-row">
//                   Loading user access...
//                 </td>
//               </tr>
//             ) : rows.length === 0 ? (
//               <tr>
//                 <td colSpan={4} className="empty-row">
//                   No user access records found.
//                 </td>
//               </tr>
//             ) : (
//               rows.map((item, index) => {
//                 const isLast = index === rows.length - 1;
//                 return (
//                   <tr key={item.id} ref={isLast ? lastRowRef : undefined}>
//                     <td className="w-[70px] text-center">{index + 1}</td>
//                     <td className="font-medium text-foreground">
//                       {item.staff_name}
//                     </td>
//                     <td>
//                       <span
//                         className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
//                           item.status === 1
//                             ? "bg-emerald-50 text-emerald-700"
//                             : item.status === 2
//                               ? "bg-slate-100 text-slate-500"
//                               : "bg-amber-50 text-amber-700"
//                         }`}
//                       >
//                         {item.status_label}
//                       </span>
//                     </td>
//                     <td className="action-cell">
//                       <button
//                         type="button"
//                         className="redirect-link"
//                         onClick={() => void openUpdateModal(item)}
//                       >
//                         Update
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {loadingMore && (
//         <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
//           <Loader2 size={14} className="animate-spin" />
//           Loading more...
//         </div>
//       )}

//       <div className="flex justify-end px-1">
//         <span className="text-[10.5px] font-medium text-slate-400">
//           Applicable for Mobile Access
//         </span>
//       </div>

//       <UserAccessFilterSidebar
//         open={filterOpen}
//         onClose={() => setFilterOpen(false)}
//         filters={filters}
//         onApply={(next) => {
//           setFilters(next);
//           setHasMore(true);
//           void fetchUsers(1, next, true);
//         }}
//       />

//       <BigModal
//         open={addOpen}
//         onClose={() => {
//           if (!savingAdd) setAddOpen(false);
//         }}
//         title="User Access Details"
//         titlePrefix=""
//         size="sm"
//       >
//         <FormProvider {...addForm}>
//           <form
//             onSubmit={addForm.handleSubmit(onAddSubmit)}
//             className="flex max-h-[70vh] min-h-0 flex-col bg-white"
//           >
//             <div className="space-y-5 overflow-y-auto px-5 py-5">
//               <label className="block">
//                 <span className="form-label">
//                   Staff Name <span className="text-red-500">*</span>
//                 </span>
//                 <TypeaheadField
//                   name="staff_id"
//                   options={staffOptions}
//                   placeholder={staffLoading ? "Loading staff..." : "Select Staff"}
//                   disabled={staffLoading}
//                   validation={{ required: "Staff Name is required" }}
//                 />
//               </label>

//               <label className="block">
//                 <span className="form-label">
//                   Password <span className="text-red-500">*</span>
//                 </span>
//                 <PasswordField
//                   name="password"
//                   placeholder="Enter Password"
//                   validation={{
//                     required: "Password is required",
//                     pattern: patterns.password,
//                   }}
//                 />
//                 <p className="mt-1 text-[11px] text-slate-400">
//                   Minimum 8 characters with one capital letter and one special character.
//                 </p>
//               </label>
//             </div>

//             <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => setAddOpen(false)}
//                 disabled={savingAdd}
//               >
//                 Cancel
//               </Button>
//               <Button type="submit" disabled={savingAdd || staffLoading}>
//                 Save User Access
//               </Button>
//             </div>
//           </form>
//         </FormProvider>
//       </BigModal>

//       <ConfirmModal
//         open={addConfirmOpen}
//         title="Confirm User Access"
//         message="Are you sure you want to create user access for this staff?"
//         onCancel={() => {
//           if (!savingAdd) setAddConfirmOpen(false);
//         }}
//         onConfirm={() => void confirmAddUser()}
//         loading={savingAdd}
//       />

//       <BigModal
//         open={Boolean(updateUser)}
//         onClose={() => {
//           if (!savingPermissions) setUpdateUser(null);
//         }}
//         title={updateUser ? `User Access - ${updateUser.staff_name}` : "User Access"}
//         titlePrefix=""
//         size="lg"
//       >
//         <div className="flex h-full min-h-[520px] flex-col bg-white">
//           <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
//             <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
//               <div>
//                 <h3 className="text-[15px] font-semibold text-slate-800">
//                   Module Access
//                 </h3>
//                 <p className="text-[12px] text-slate-400">
//                   Select a whole module or choose individual pages.
//                 </p>
//               </div>
//               <span className="text-[11px] font-medium text-slate-400">
//                 {selectedPermissions.size} permissions selected
//               </span>
//             </div>

//             {permissionLoading ? (
//               <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-slate-400">
//                 <Loader2 size={16} className="animate-spin" />
//                 Loading permissions...
//               </div>
//             ) : (
//               <UserAccessPermissions
//                 groups={permissionGroups}
//                 selected={selectedPermissions}
//                 onChange={setSelectedPermissions}
//                 disabled={savingPermissions}
//               />
//             )}
//           </div>

//           <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => setUpdateUser(null)}
//               disabled={savingPermissions}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="button"
//               onClick={() => setPermissionConfirmOpen(true)}
//               disabled={permissionLoading || savingPermissions}
//             >
//               Save Access
//             </Button>
//           </div>
//         </div>
//       </BigModal>

//       <ConfirmModal
//         open={permissionConfirmOpen}
//         title="Confirm Access Update"
//         message="Are you sure you want to save these module permissions?"
//         onCancel={() => {
//           if (!savingPermissions) setPermissionConfirmOpen(false);
//         }}
//         onConfirm={() => void confirmPermissionSave()}
//         loading={savingPermissions}
//       />
//     </div>
//   );
// }

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { Loader2, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";

import BigModal from "@/app/utils/components/BigModal";
import { Button } from "@/app/utils/components/Button";
import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import PasswordField from "@/app/utils/components/PasswordField";
import { Toaster } from "@/app/utils/components/Toaster";
import { TypeaheadField } from "@/app/utils/components/TypeaheadControl";
import UserAccessFilterSidebar, {
  emptyUserAccessFilters,
  type UserAccessFilters,
} from "@/app/utils/components/UserAccessFilterSidebar";
import UserAccessPermissions, {
  type PermissionGroup,
} from "@/app/utils/components/UserAccessPermissions";
import { postAPI } from "@/app/utils/helpers/api";
import { patterns } from "@/app/utils/helpers/validationPattern";

type UserAccessRow = {
  id: string;
  staff_name: string;
  username: string;
  status: number;
  status_label: string;
};

type StaffOptionSource = {
  id: string;
  staff_name: string;
  email: string;
  phone_number: string;
};

type AddUserAccessForm = {
  staff_id: string;
  password: string;
};

type ToastState = { message: string; type: "success" | "error" } | null;

const PAGE_LIMIT = 10;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const asArray = (value: any): any[] => (Array.isArray(value) ? value : []);

const getUserRows = (response: Awaited<ReturnType<typeof postAPI>>): UserAccessRow[] => {
  const rows = asArray(response.data?.users).length
    ? asArray(response.data?.users)
    : asArray(response.data).length
      ? asArray(response.data)
      : asArray(response.data?.data);

  return rows
    .filter((item) => String(item?.user_type || "user").toLowerCase() === "user")
    .map((item) => {
      const status = Number(item?.status ?? 1);
      return {
        id: String(item?.id ?? item?.user_id ?? ""),
        staff_name: String(
          item?.staff_name ?? item?.full_name ?? item?.name ?? item?.username ?? "—",
        ),
        username: String(item?.username ?? ""),
        status,
        status_label: String(
          item?.status_label ??
            (status === 1 ? "Active" : status === 2 ? "Inactive" : "Pending"),
        ),
      };
    })
    .filter((item) => item.id);
};

const getStaffRows = (response: Awaited<ReturnType<typeof postAPI>>): StaffOptionSource[] => {
  const candidates = [
    response.data?.staff,
    response.data?.staffs,
    response.data?.staff_list,
    response.data?.data,
    response.data,
  ];
  const rows = candidates.find((value) => Array.isArray(value)) ?? [];

  return asArray(rows)
    .map((item) => ({
      id: String(item?.id ?? item?.staff_id ?? ""),
      staff_name: String(item?.staff_name ?? item?.name ?? item?.full_name ?? ""),
      email: String(item?.email ?? ""),
      phone_number: String(item?.phone_number ?? item?.phone ?? ""),
    }))
    .filter((item) => item.id && item.staff_name);
};

const normalizePermissionGroups = (
  response: Awaited<ReturnType<typeof postAPI>>,
): PermissionGroup[] => {
  const rows = asArray(response.data?.permissions).length
    ? asArray(response.data?.permissions)
    : asArray(response.data);

  const grouped = new Map<string, PermissionGroup["items"]>();

  rows.forEach((item) => {
    const key = String(item?.key ?? item?.permission_key ?? "").trim();
    if (!key) return;

    const route = String(item?.route ?? "").trim();
    const rawModule = String(item?.module ?? "General").trim() || "General";
    const rawPage = String(item?.page ?? item?.label ?? key).trim() || key;

    let moduleName = rawModule;
    if (/equipment|machiner/i.test(`${rawModule} ${rawPage} ${route}`)) {
      moduleName = "Assets";
    }

    const items = grouped.get(moduleName) ?? [];
    items.push({ key, label: rawPage, route });
    grouped.set(moduleName, items);
  });

  return Array.from(grouped.entries()).map(([module, items]) => ({
    module,
    items,
  }));
};

const makeUsername = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 40);

export default function UserAccessPage() {
  const [rows, setRows] = useState<UserAccessRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<UserAccessFilters>(emptyUserAccessFilters);
  const [toast, setToast] = useState<ToastState>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [staffRows, setStaffRows] = useState<StaffOptionSource[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [addConfirmOpen, setAddConfirmOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<AddUserAccessForm | null>(null);
  const [savingAdd, setSavingAdd] = useState(false);

  const [updateUser, setUpdateUser] = useState<UserAccessRow | null>(null);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionConfirmOpen, setPermissionConfirmOpen] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const addForm = useForm<AddUserAccessForm>({
    defaultValues: { staff_id: "", password: "" },
  });

  const fetchUsers = useCallback(
    async (
      pageToLoad: number,
      currentFilters: UserAccessFilters,
      replace: boolean,
    ) => {
      pageToLoad === 1 ? setLoading(true) : setLoadingMore(true);
      try {
        const response = await postAPI(
          "USER_MANAGEMENT_LIST",
          {
            page: pageToLoad,
            limit: PAGE_LIMIT,
            conditions: {
              search: currentFilters.staff_name.trim(),
              user_type: "user",
              status: currentFilters.access_status
                ? Number(currentFilters.access_status)
                : 0,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load user access");
        }

        const nextRows = getUserRows(response);
        setRows((current) => (replace ? nextRows : [...current, ...nextRows]));
        setPage(pageToLoad);

        const total = Number(response.total_count ?? response.count ?? 0);
        if (total > 0) {
          setHasMore(pageToLoad * PAGE_LIMIT < total);
        } else {
          setHasMore(nextRows.length === PAGE_LIMIT);
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
    void fetchUsers(1, filters, true);
    // The initial list follows the same single-fetch pattern used by the other list pages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !lastRowRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void fetchUsers(page + 1, filters, false);
        }
      },
      { threshold: 0.5 },
    );

    observerRef.current.observe(lastRowRef.current);
    return () => observerRef.current?.disconnect();
  }, [rows, loading, loadingMore, hasMore, page, filters, fetchUsers]);

  const fetchStaffOptions = async () => {
    if (staffRows.length > 0) return;

    setStaffLoading(true);
    try {
      const response = await postAPI(
        "STAFF_LIST",
        {
          page: 1,
          limit: 100,
          conditions: {
            staff_name: "",
            staff_designation: "",
            phone_number: "",
            email: "",
            city: "",
            state: "",
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to load staff");
      }

      setStaffRows(getStaffRows(response));
    } catch (error: any) {
      setToast({
        message: error.message || "Unable to load staff",
        type: "error",
      });
    } finally {
      setStaffLoading(false);
    }
  };

  const staffOptions = useMemo(
    () =>
      staffRows.map((staff) => ({
        value: staff.id,
        label: staff.staff_name,
        description: staff.phone_number || staff.email || undefined,
      })),
    [staffRows],
  );

  const openAddModal = () => {
    addForm.reset({ staff_id: "", password: "" });
    setAddOpen(true);
    void fetchStaffOptions();
  };

  const onAddSubmit: SubmitHandler<AddUserAccessForm> = (data) => {
    setPendingAdd(data);
    setAddConfirmOpen(true);
  };

  const confirmAddUser = async () => {
    if (!pendingAdd) return;

    const selectedStaff = staffRows.find(
      (staff) => String(staff.id) === String(pendingAdd.staff_id),
    );
    if (!selectedStaff) {
      setToast({ message: "Please select a valid staff", type: "error" });
      setAddConfirmOpen(false);
      return;
    }

    setSavingAdd(true);
    try {
      const response = await postAPI(
        "SAVE_USER",
        {
          data: {
            user_id: 0,
            full_name: selectedStaff.staff_name,
            email: selectedStaff.email,
            phone: selectedStaff.phone_number,
            staff_id: Number(selectedStaff.id) || selectedStaff.id,
            username: makeUsername(selectedStaff.staff_name),
            password: pendingAdd.password,
            user_type: "user",
            status: 1,
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to create user access");
      }

      setToast({
        message: response.message || "User access created successfully",
        type: "success",
      });
      setAddOpen(false);
      setAddConfirmOpen(false);
      setPendingAdd(null);
      addForm.reset({ staff_id: "", password: "" });
      setHasMore(true);
      await fetchUsers(1, filters, true);
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setSavingAdd(false);
    }
  };

  const openUpdateModal = async (user: UserAccessRow) => {
    setUpdateUser(user);
    setPermissionLoading(true);
    setSelectedPermissions(new Set());
    setPermissionGroups([]);

    try {
      const [catalogResponse, accessResponse] = await Promise.all([
        postAPI("PERMISSION_CATALOG", {}, true),
        postAPI(
          "USER_ACCESS_DETAILS",
          { data: { user_id: Number(user.id) || user.id } },
          true,
        ),
      ]);

      if (!isSuccess(catalogResponse)) {
        throw new Error(catalogResponse.message || "Failed to load permission modules");
      }
      if (!isSuccess(accessResponse)) {
        throw new Error(accessResponse.message || "Failed to load user access details");
      }

      setPermissionGroups(normalizePermissionGroups(catalogResponse));
      const permissions = asArray(accessResponse.data?.permissions).map(String);
      setSelectedPermissions(new Set(permissions));
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setPermissionLoading(false);
    }
  };

  const confirmPermissionSave = async () => {
    if (!updateUser) return;

    setSavingPermissions(true);
    try {
      const response = await postAPI(
        "SAVE_USER_ACCESS",
        {
          data: {
            user_id: Number(updateUser.id) || updateUser.id,
            permissions: Array.from(selectedPermissions),
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to update user access");
      }

      setToast({
        message: response.message || "User access updated successfully",
        type: "success",
      });
      setPermissionConfirmOpen(false);
      setUpdateUser(null);
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-3 sm:p-6">
      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">User Access</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} user access records loaded
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHasMore(true);
              void fetchUsers(1, filters, true);
            }}
            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Refresh"
            title="Refresh"
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

          <Button type="button" onClick={openAddModal} className="primary-btn">
            <Plus size={15} />
            Add User Access
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-border">
        <table className="table-default min-w-[620px]">
          <thead>
            <tr>
              <th className="sticky top-0 z-20 w-[70px] bg-secondary text-center">
                S.No
              </th>
              <th className="sticky top-0 z-20 bg-secondary">Staff Name</th>
              <th className="sticky top-0 z-20 bg-secondary">Access Status</th>
              <th className="sticky top-0 z-20 w-[130px] bg-secondary text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  Loading user access...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No user access records found.
                </td>
              </tr>
            ) : (
              rows.map((item, index) => {
                const isLast = index === rows.length - 1;
                return (
                  <tr key={item.id} ref={isLast ? lastRowRef : undefined}>
                    <td className="w-[70px] text-center">{index + 1}</td>
                    <td className="font-medium text-foreground">
                      {item.staff_name}
                    </td>
                    <td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
                          item.status === 1
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === 2
                              ? "bg-slate-100 text-slate-500"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status_label}
                      </span>
                    </td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="redirect-link"
                        onClick={() => void openUpdateModal(item)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {loadingMore && (
        <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Loading more...
        </div>
      )}

      <div className="flex shrink-0 justify-end px-1">
        <span className="text-[10.5px] font-medium text-slate-400">
          Applicable for Mobile Access
        </span>
      </div>

      <UserAccessFilterSidebar
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          setHasMore(true);
          void fetchUsers(1, next, true);
        }}
      />

      <BigModal
        open={addOpen}
        onClose={() => {
          if (!savingAdd) setAddOpen(false);
        }}
        title="User Access Details"
        titlePrefix=""
        size="sm"
      >
        <FormProvider {...addForm}>
          <form
            onSubmit={addForm.handleSubmit(onAddSubmit)}
            className="flex max-h-[70vh] min-h-0 flex-col bg-white"
          >
            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="form-label">
                  Staff Name <span className="text-red-500">*</span>
                </span>
                <TypeaheadField
                  name="staff_id"
                  options={staffOptions}
                  placeholder={staffLoading ? "Loading staff..." : "Select Staff"}
                  disabled={staffLoading}
                  validation={{ required: "Staff Name is required" }}
                />
              </label>

              <label className="block">
                <span className="form-label">
                  Password <span className="text-red-500">*</span>
                </span>
                <PasswordField
                  name="password"
                  placeholder="Enter Password"
                  validation={{
                    required: "Password is required",
                    pattern: patterns.password,
                  }}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum 8 characters with one capital letter and one special character.
                </p>
              </label>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={savingAdd}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingAdd || staffLoading}>
                Save User Access
              </Button>
            </div>
          </form>
        </FormProvider>
      </BigModal>

      <ConfirmModal
        open={addConfirmOpen}
        title="Confirm User Access"
        message="Are you sure you want to create user access for this staff?"
        onCancel={() => {
          if (!savingAdd) setAddConfirmOpen(false);
        }}
        onConfirm={() => void confirmAddUser()}
        loading={savingAdd}
      />

      <BigModal
        open={Boolean(updateUser)}
        onClose={() => {
          if (!savingPermissions) setUpdateUser(null);
        }}
        title={updateUser ? `User Access - ${updateUser.staff_name}` : "User Access"}
        titlePrefix=""
        size="lg"
      >
        <div className="flex h-full min-h-[520px] flex-col bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-800">
                  Module Access
                </h3>
                <p className="text-[12px] text-slate-400">
                  Select a whole module or choose individual pages.
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {selectedPermissions.size} permissions selected
              </span>
            </div>

            {permissionLoading ? (
              <div className="flex min-h-[300px] items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Loading permissions...
              </div>
            ) : (
              <UserAccessPermissions
                groups={permissionGroups}
                selected={selectedPermissions}
                onChange={setSelectedPermissions}
                disabled={savingPermissions}
              />
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUpdateUser(null)}
              disabled={savingPermissions}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => setPermissionConfirmOpen(true)}
              disabled={permissionLoading || savingPermissions}
            >
              Save Access
            </Button>
          </div>
        </div>
      </BigModal>

      <ConfirmModal
        open={permissionConfirmOpen}
        title="Confirm Access Update"
        message="Are you sure you want to save these module permissions?"
        onCancel={() => {
          if (!savingPermissions) setPermissionConfirmOpen(false);
        }}
        onConfirm={() => void confirmPermissionSave()}
        loading={savingPermissions}
      />
    </div>
  );
}