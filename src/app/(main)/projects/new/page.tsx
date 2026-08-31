"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { ClipboardList, Plus, Trash2, UsersRound } from "lucide-react";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type ProjectMember = {
  staff_id: string;
  designation_id: string;
};

type PhaseDetail = {
  phase_title: string;
  phase_description: string;
  start_date: string;
  end_date: string;
  budget: string;
};

type ProjectForm = {
  client_id: string;
  project_start_date: string;
  project_description: string;
  status: string;
  project_members: ProjectMember[];
  phase_details: PhaseDetail[];
};

type SelectOption = {
  label: string;
  value: string;
};

type StaffOption = SelectOption & {
  designationId: string;
  designationName: string;
};

const STATUS_OPTIONS: SelectOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
];

const EMPTY_MEMBER: ProjectMember = {
  staff_id: "",
  designation_id: "",
};

const EMPTY_PHASE: PhaseDetail = {
  phase_title: "",
  phase_description: "",
  start_date: "",
  end_date: "",
  budget: "",
};

const CLIENT_PAGE_SIZE = 100;
const STAFF_PAGE_SIZE = 100;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const toApiDate = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const getClientRows = (response: Awaited<ReturnType<typeof postAPI>>) => {
  if (Array.isArray(response.data?.clients)) return response.data.clients;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};


const getStaffRows = (response: Awaited<ReturnType<typeof postAPI>>) => {
  if (Array.isArray(response.data?.staffs)) return response.data.staffs;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

function FieldRow({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <label className="w-full text-[15px] font-medium text-black sm:w-1/3">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-2/3">{children}</div>
    </div>
  );
}

export default function NewProjectPage() {
  const methods = useForm<ProjectForm>({
    defaultValues: {
      client_id: "",
      project_start_date: "",
      project_description: "",
      status: "pending",
      project_members: [],
      phase_details: [],
    },
  });

  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control: methods.control,
    name: "project_members",
  });

  const {
    fields: phaseFields,
    append: appendPhase,
    remove: removePhase,
  } = useFieldArray({
    control: methods.control,
    name: "phase_details",
  });

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<ProjectForm | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const watchedMembers =
    useWatch({
      control: methods.control,
      name: "project_members",
    }) ?? [];

  const fetchAllClients = useCallback(async () => {
    setClientLoading(true);

    try {
      const clientsById = new Map<string, SelectOption>();
      let page = 1;

      while (true) {
        const response = await postAPI(
          "CLIENT_LIST",
          {
            data: {
              filters: {
                client_name: "",
                phone_number: "",
                email: "",
                city: "",
                state: "",
                gstin: "",
              },
              page,
              limit: CLIENT_PAGE_SIZE,
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load clients");
        }

        const rows = getClientRows(response);
        let addedCount = 0;

        rows.forEach((client: any) => {
          const id = String(client?.id ?? client?.client_id ?? client?.ID ?? "");
          const name = String(
            client?.client_name ?? client?.clientName ?? client?.full_name ?? "",
          ).trim();

          if (!id || !name || clientsById.has(id)) return;

          clientsById.set(id, { label: name, value: id });
          addedCount += 1;
        });

        const pagination = response.data?.pagination;
        const totalPages = Number(
          pagination?.total_pages ??
            response.total_pages ??
            response.totalPages ??
            0,
        );

        if (totalPages > 0) {
          if (page >= totalPages) break;
        } else if (rows.length < CLIENT_PAGE_SIZE || addedCount === 0) {
          break;
        }

        page += 1;
      }

      setClientOptions(Array.from(clientsById.values()));
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to load clients",
        type: "error",
      });
    } finally {
      setClientLoading(false);
    }
  }, []);

  const fetchAllStaff = useCallback(async () => {
    setStaffLoading(true);

    try {
      const staffById = new Map<string, StaffOption>();
      let page = 1;

      while (true) {
        const response = await postAPI(
          "STAFF_LIST",
          {
            page,
            limit: STAFF_PAGE_SIZE,
            conditions: {
              staff_name: "",
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

        const rows = getStaffRows(response);
        let addedCount = 0;

        rows.forEach((staff: any) => {
          const id = String(staff?.id ?? staff?.staff_id ?? staff?.ID ?? "");
          const name = String(
            staff?.staff_name ?? staff?.staffName ?? staff?.full_name ?? "",
          ).trim();

          const designationId = String(
            staff?.designation_id ??
              staff?.staff_designation_id ??
              staff?.designation?.id ??
              "",
          );
          const designationName = String(
            staff?.designation_name ??
              staff?.staff_designation ??
              staff?.designation?.ledger_name ??
              staff?.designation?.name ??
              "",
          ).trim();

          if (!id || !name || staffById.has(id)) return;

          staffById.set(id, {
            label: name,
            value: id,
            designationId,
            designationName,
          });
          addedCount += 1;
        });

        const pagination = response.data?.pagination;
        const totalPages = Number(
          pagination?.total_pages ??
            response.total_pages ??
            response.totalPages ??
            0,
        );

        if (totalPages > 0) {
          if (page >= totalPages) break;
        } else if (rows.length < STAFF_PAGE_SIZE || addedCount === 0) {
          break;
        }

        page += 1;
      }

      setStaffOptions(Array.from(staffById.values()));
    } catch (error: any) {
      setToast({
        message: error.message || "Failed to load staff",
        type: "error",
      });
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllClients();
    void fetchAllStaff();
  }, [fetchAllClients, fetchAllStaff]);

  useEffect(() => {
    watchedMembers.forEach((member, index) => {
      const selectedStaff = staffOptions.find(
        (option) => option.value === String(member?.staff_id || ""),
      );
      const nextDesignationId = selectedStaff?.designationId || "";

      if (String(member?.designation_id || "") !== nextDesignationId) {
        methods.setValue(
          `project_members.${index}.designation_id`,
          nextDesignationId,
          { shouldValidate: Boolean(member?.staff_id) },
        );
      }
    });
  }, [methods, staffOptions, watchedMembers]);

  const onSubmit: SubmitHandler<ProjectForm> = (data) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const onInvalid = () => {
    setToast({
      message: "Please fill all mandatory fields",
      type: "error",
    });
  };

  const confirmSubmit = async () => {
    if (!pendingData) return;

    setLoading(true);

    try {
      const payload = {
        client_id: Number(pendingData.client_id),
        project_start_date: toApiDate(pendingData.project_start_date),
        project_description: pendingData.project_description.trim(),
        status: pendingData.status,
        project_members: pendingData.project_members.map((member) => ({
          staff_id: Number(member.staff_id),
          designation_id: Number(member.designation_id),
        })),
        phase_details: pendingData.phase_details.map((phase) => ({
          phase_title: phase.phase_title.trim(),
          phase_description: phase.phase_description.trim(),
          start_date: toApiDate(phase.start_date),
          end_date: toApiDate(phase.end_date),
          budget: Number(phase.budget),
        })),
      };

      const response = await postAPI(
        "ADD_PROJECT",
        { data: payload },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to add project");
      }

      setToast({
        message: response.message || "Project created successfully",
        type: "success",
      });

      methods.reset({
        client_id: "",
        project_start_date: "",
        project_description: "",
        status: "pending",
        project_members: [],
        phase_details: [],
      });
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setPendingData(null);
    }
  };

  const handleCancel = () => {
    methods.reset({
      client_id: "",
      project_start_date: "",
      project_description: "",
      status: "pending",
      project_members: [],
      phase_details: [],
    });
  };

  const selectedStaffIds = new Set(
    watchedMembers
      .map((member) => String(member?.staff_id || ""))
      .filter(Boolean),
  );

  return (
    <FormProvider {...methods}>
      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <form
        onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
        className="flex h-full min-h-0 flex-col overflow-hidden bg-white py-2"
      >
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-3 sm:px-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.55fr)] xl:items-start xl:gap-5">
            <section className="min-w-0 space-y-4">
              <h3 className="text-md font-medium text-[#103BB5]">
                Project Details
              </h3>

              <div className="space-y-3.5">
                <FieldRow label="Client Name" required>
                  <DynamicField
                    type="typeahead"
                    name="client_id"
                    placeholder={
                      clientLoading ? "Loading clients..." : "Select client"
                    }
                    options={clientOptions}
                    required
                    validation={{ required: "Please select a client" }}
                  />
                </FieldRow>

                <FieldRow label="Project Start Date" required>
                  <DynamicField
                    type="datepicker"
                    name="project_start_date"
                    placeholder="Select project start date"
                    required
                    validation={{ required: "Project start date is required" }}
                  />
                </FieldRow>

                <FieldRow label="Project Description" required>
                  <DynamicField
                    type="textarea"
                    name="project_description"
                    placeholder="Enter project description"
                    required
                    validation={{ required: "Project description is required" }}
                  />
                </FieldRow>

                <FieldRow label="Status" required>
                  <DynamicField
                    type="typeahead"
                    name="status"
                    placeholder="Select status"
                    options={STATUS_OPTIONS}
                    required
                    validation={{ required: "Status is required" }}
                  />
                </FieldRow>
              </div>
            </section>
            <section className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-md font-medium text-[#103BB5]">
                  Project Members
                </h3>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => appendMember({ ...EMPTY_MEMBER })}
                  className="h-8 shrink-0 gap-1.5 px-2.5 text-[13px] text-[#103BB5] hover:bg-[#103BB5]/5 hover:text-[#103BB5]"
                >
                  <Plus size={14} />
                  Add row
                </Button>
              </div>

              <div
                className={`overflow-x-hidden rounded-lg border border-border md:h-[286px] ${
                  memberFields.length > 5
                    ? "md:overflow-y-auto"
                    : "md:overflow-y-hidden"
                } ${
                  memberFields.length > 3
                    ? "max-md:max-h-[360px] max-md:overflow-y-auto"
                    : "max-md:overflow-y-hidden"
                }`}
              >
                <table
                  className="table-default !overflow-visible w-full table-fixed text-[14px] [&_th]:!h-10 [&_th]:!px-3 [&_th]:!py-2 [&_th]:!text-[13px] [&_th]:whitespace-nowrap [&_td]:!px-3 [&_td]:!py-1.5 [&_td]:!text-[14px] max-md:block"
                  style={{ borderCollapse: "separate", borderSpacing: 0 }}
                >
                  <colgroup className="max-md:hidden">
                    <col className="w-[8%]" />
                    <col className="w-[42%]" />
                    <col className="w-[42%]" />
                    <col className="w-[8%]" />
                  </colgroup>

                  <thead className="max-md:hidden">
                    <tr>
                      <th className="sticky top-0 z-30 bg-secondary text-center">S.No</th>
                      <th className="sticky top-0 z-30 bg-secondary">Staff Name</th>
                      <th className="sticky top-0 z-30 bg-secondary">Staff Designation</th>
                      <th className="sticky top-0 z-30 bg-secondary text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody className="max-md:block">
                    {memberFields.length === 0 ? (
                      <tr className="max-md:block">
                        <td colSpan={4} className="!border-0 !p-0 max-md:block">
                          <div className="flex h-[102px] flex-col items-center justify-center gap-1 text-center md:h-[246px]">
                            <UsersRound
                              size={27}
                              strokeWidth={1.6}
                              className="text-slate-400/55"
                            />
                            <p className="text-[13px] font-medium text-slate-500/80">
                              No project members added
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      memberFields.map((field, index) => (
                      <tr
                        key={field.id}
                        className="max-md:grid max-md:grid-cols-1 max-md:gap-2 max-md:border-b max-md:border-border max-md:p-2.5 last:max-md:border-b-0"
                      >
                        <td className="text-center align-middle max-md:flex max-md:items-center max-md:justify-between max-md:!border-0 max-md:!p-0 max-md:text-left">
                          <span className="font-medium text-muted-foreground md:hidden">S.No</span>
                          <span>{index + 1}</span>
                        </td>

                        <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Staff Name</span>
                          <div className="min-w-0 [&_button]:!h-9 [&_button]:!px-3 [&_button]:!text-[14px] [&_button_span]:truncate">
                            <DynamicField
                              type="typeahead"
                              name={`project_members.${index}.staff_id`}
                              placeholder={
                                staffLoading ? "Loading staff..." : "Select staff"
                              }
                              options={staffOptions.filter(
                                (option) =>
                                  option.value ===
                                    String(watchedMembers[index]?.staff_id || "") ||
                                  !selectedStaffIds.has(option.value),
                              )}
                              required
                              validation={{ required: "Staff name is required" }}
                            />
                          </div>
                        </td>

                        <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                          <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Staff Designation</span>
                          <input
                            type="hidden"
                            {...methods.register(
                              `project_members.${index}.designation_id`,
                              { required: true },
                            )}
                          />
                          {(() => {
                            const selectedStaff = staffOptions.find(
                              (option) =>
                                option.value ===
                                String(watchedMembers[index]?.staff_id || ""),
                            );

                            return (
                              <div
                                className={`flex h-9 min-w-0 items-center rounded-md border border-input px-3 text-[14px] ${
                                  selectedStaff?.designationName
                                    ? "bg-muted/20 text-foreground"
                                    : "bg-muted/10 text-muted-foreground"
                                }`}
                                title={selectedStaff?.designationName || undefined}
                              >
                                <span className="truncate">
                                  {selectedStaff?.designationName ||
                                    (watchedMembers[index]?.staff_id
                                      ? "Designation unavailable"
                                      : "Select staff first")}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="action-cell align-middle max-md:flex max-md:justify-end max-md:!border-0 max-md:!p-0">
                          <button
                            type="button"
                            onClick={() => removeMember(index)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                            aria-label={`Remove project member ${index + 1}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="mt-4 min-w-0 space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-md font-medium text-[#103BB5]">
                Phase Details
              </h3>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendPhase({ ...EMPTY_PHASE })}
                className="h-8 shrink-0 gap-1.5 px-2.5 text-[13px] text-[#103BB5] hover:bg-[#103BB5]/5 hover:text-[#103BB5]"
              >
                <Plus size={14} />
                Add row
              </Button>
            </div>

            <div
              className={`overflow-x-hidden rounded-lg border border-border md:h-[272px] ${
                phaseFields.length > 5
                  ? "md:overflow-y-auto"
                  : "md:overflow-y-hidden"
              } ${
                phaseFields.length > 3
                  ? "max-md:max-h-[520px] max-md:overflow-y-auto"
                  : "max-md:overflow-y-hidden"
              }`}
            >
              <table
                className="table-default !overflow-visible w-full table-fixed text-[14px] [&_th]:!h-10 [&_th]:!px-3 [&_th]:!py-2 [&_th]:!text-[13px] [&_th]:whitespace-nowrap [&_td]:!px-3 [&_td]:!py-1.5 [&_td]:!text-[14px] max-md:block"
                style={{ borderCollapse: "separate", borderSpacing: 0 }}
              >
                <colgroup className="max-md:hidden">
                  <col className="w-[5%]" />
                  <col className="w-[16%]" />
                  <col className="w-[27%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[8%]" />
                </colgroup>

                <thead className="max-md:hidden">
                  <tr>
                    <th className="sticky top-0 z-30 bg-secondary text-center">S.No</th>
                    <th className="sticky top-0 z-30 bg-secondary">Phase Title</th>
                    <th className="sticky top-0 z-30 bg-secondary">Phase Description</th>
                    <th className="sticky top-0 z-30 bg-secondary">Start Date</th>
                    <th className="sticky top-0 z-30 bg-secondary">End Date</th>
                    <th className="sticky top-0 z-30 bg-secondary">Budget</th>
                    <th className="sticky top-0 z-30 bg-secondary text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="max-md:block">
                  {phaseFields.length === 0 ? (
                    <tr className="max-md:block">
                      <td colSpan={7} className="!border-0 !p-0 max-md:block">
                        <div className="flex h-[118px] flex-col items-center justify-center gap-1 text-center md:h-[232px]">
                          <ClipboardList
                            size={27}
                            strokeWidth={1.6}
                            className="text-slate-400/55"
                          />
                          <p className="text-[13px] font-medium text-slate-500/80">
                            No phase details added
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    phaseFields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="max-md:grid max-md:grid-cols-1 max-md:gap-2 max-md:border-b max-md:border-border max-md:p-2.5 last:max-md:border-b-0"
                    >
                      <td className="text-center align-middle max-md:flex max-md:items-center max-md:justify-between max-md:!border-0 max-md:!p-0 max-md:text-left">
                        <span className="font-medium text-muted-foreground md:hidden">S.No</span>
                        <span>{index + 1}</span>
                      </td>

                      <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Phase Title</span>
                        <DynamicField
                          type="input"
                          name={`phase_details.${index}.phase_title`}
                          placeholder="Phase title"
                          className="!mb-0 !h-9 !px-3 !text-[14px]"
                          required
                          validation={{ required: "Phase title is required" }}
                        />
                      </td>

                      <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Phase Description</span>
                        <DynamicField
                          type="input"
                          name={`phase_details.${index}.phase_description`}
                          placeholder="Description"
                          className="!mb-0 !h-9 !px-3 !text-[14px]"
                        />
                      </td>

                      <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Start Date</span>
                        <div className="min-w-0 [&_button_span]:truncate">
                          <DynamicField
                            type="datepicker"
                            name={`phase_details.${index}.start_date`}
                            placeholder="Start date"
                            className="!h-9 !px-3 !text-[14px]"
                            required
                            validation={{ required: "Start date is required" }}
                          />
                        </div>
                      </td>

                      <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">End Date</span>
                        <div className="min-w-0 [&_button_span]:truncate">
                          <DynamicField
                            type="datepicker"
                            name={`phase_details.${index}.end_date`}
                            placeholder="End date"
                            className="!h-9 !px-3 !text-[14px]"
                            required
                            validation={{ required: "End date is required" }}
                          />
                        </div>
                      </td>

                      <td className="align-middle max-md:block max-md:!border-0 max-md:!p-0">
                        <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">Budget</span>
                        <DynamicField
                          type="input"
                          name={`phase_details.${index}.budget`}
                          placeholder="Budget"
                          className="numbers-decimal no-space !mb-0 !h-9 !px-3 !text-[14px]"
                          required
                          validationType="positiveAmount"
                        />
                      </td>

                      <td className="action-cell align-middle max-md:flex max-md:justify-end max-md:!border-0 max-md:!p-0">
                        <button
                          type="button"
                          onClick={() => removePhase(index)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10"
                          aria-label={`Remove phase ${index + 1}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t bg-white px-3 py-2.5 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleCancel}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading || clientLoading || staffLoading}>
            {loading ? "Submitting..." : "Add Project"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this project?"
      />
    </FormProvider>
  );
}
