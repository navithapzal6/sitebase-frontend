"use client";

import { useCallback, useEffect, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type FormValues = {
  staff_name: string;
  designation_id: string;
  phone: string;
  alternate_phone: string;
  email: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
  bank_name: string;
  branch_name: string;
  bank_account: string;
  ifsc: string;
  aadhaar: string;
  pan: string;
};

type SelectOption = {
  label: string;
  value: string;
};

const DEFAULT_VALUES: FormValues = {
  staff_name: "",
  designation_id: "",
  phone: "",
  alternate_phone: "",
  email: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  bank_name: "",
  branch_name: "",
  bank_account: "",
  ifsc: "",
  aadhaar: "",
  pan: "",
};

const LEDGER_PAGE_SIZE = 100;

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getLedgerRows = (response: Awaited<ReturnType<typeof postAPI>>) => {
  if (Array.isArray(response.data?.ledgers)) return response.data.ledgers;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export default function NewStaffPage() {
  const router = useRouter();
  const methods = useForm<FormValues>({ defaultValues: DEFAULT_VALUES });

  const [designationOptions, setDesignationOptions] = useState<SelectOption[]>([]);
  const [designationLoading, setDesignationLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<FormValues | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const fetchAllDesignations = useCallback(async () => {
    setDesignationLoading(true);

    try {
      const optionsById = new Map<string, SelectOption>();
      let page = 1;

      while (true) {
        const response = await postAPI(
          "LEDGER_LIST",
          {
            data: {
              page,
              limit: LEDGER_PAGE_SIZE,
              conditions: {
                ledger_type: "staff_designation_ledger",
              },
            },
          },
          true,
        );

        if (!isSuccess(response)) {
          throw new Error(response.message || "Failed to load staff designations");
        }

        const rows = getLedgerRows(response);
        let addedCount = 0;

        rows.forEach((item: any) => {
          const id = String(item?.id ?? item?.ledger_id ?? item?.ID ?? "");
          const name = String(
            item?.ledger_name ?? item?.ledgerName ?? item?.name ?? "",
          ).trim();

          if (!id || !name || optionsById.has(id)) return;
          optionsById.set(id, { label: name, value: id });
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
        } else if (rows.length < LEDGER_PAGE_SIZE || addedCount === 0) {
          break;
        }

        page += 1;
      }

      setDesignationOptions(Array.from(optionsById.values()));
    } catch (error: any) {
      showToast(error.message || "Failed to load staff designations", "error");
    } finally {
      setDesignationLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllDesignations();
  }, [fetchAllDesignations]);

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleInvalid = () => {
    showToast("Please fill all mandatory fields", "error");
  };

  const confirmSubmit = async () => {
    if (!pendingData) return;

    setLoading(true);
    try {
      const payload = {
        staffName: pendingData.staff_name,
        designationId: Number(pendingData.designation_id),
        phoneNumber: pendingData.phone,
        alternatePhoneNumber: pendingData.alternate_phone,
        email: pendingData.email,
        addressLine1: pendingData.address,
        addressLine2: pendingData.address2,
        city: pendingData.city,
        state: pendingData.state,
        pincode: pendingData.pincode,
        bankName: pendingData.bank_name,
        branchName: pendingData.branch_name,
        bankAccountNumber: pendingData.bank_account,
        ifscCode: pendingData.ifsc,
        aadhaarNumber: pendingData.aadhaar,
        panNumber: pendingData.pan,
      };

      const response = await postAPI("ADD_STAFF", { data: payload }, true);

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to add staff");
      }

      showToast(response.message || "Staff added successfully");
      methods.reset(DEFAULT_VALUES);
      window.setTimeout(() => router.push("/staff/list"), 1000);
    } catch (error: any) {
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setPendingData(null);
    }
  };

  const handleCancel = () => {
    methods.reset(DEFAULT_VALUES);
    setShowConfirm(false);
    router.push("/staff/list");
  };

  const Row = ({
    label,
    required = false,
    children,
  }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <label className="w-full text-[15px] font-medium text-black sm:w-1/3">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-2/3">{children}</div>
    </div>
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
        className="flex h-full min-h-0 flex-col overflow-hidden bg-white py-4"
        onSubmit={methods.handleSubmit(handleFormSubmit, handleInvalid)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-md mb-2 font-medium text-[#103BB5]">
                Basic Details
              </h3>
              <div className="space-y-4">
                <Row label="Staff Name" required>
                  <DynamicField
                    type="input"
                    name="staff_name"
                    placeholder="Enter Staff name"
                    className="capitalize"
                    required
                    validation={{ required: "Staff Name is required" }}
                  />
                </Row>

                <Row label="Staff Designation" required>
                  <DynamicField
                    type="typeahead"
                    name="designation_id"
                    placeholder={
                      designationLoading
                        ? "Loading designations..."
                        : "Select designation"
                    }
                    options={designationOptions}
                    required
                    validation={{ required: "Staff Designation is required" }}
                  />
                </Row>

                <Row label="Phone Number" required>
                  <DynamicField
                    type="input"
                    name="phone"
                    placeholder="Enter 10 Digit Phone number"
                    className="only-number limit-10"
                    required
                    validationType="phone"
                  />
                </Row>

                <Row label="Alternate Number">
                  <DynamicField
                    type="input"
                    name="alternate_phone"
                    placeholder="Enter Alternate number"
                    className="only-number no-space limit-10"
                    validationType="phone"
                  />
                </Row>

                <Row label="Email" required>
                  <DynamicField
                    type="input"
                    name="email"
                    placeholder="Enter Email"
                    required
                    validationType="email"
                  />
                </Row>

                <Row label="Address" required>
                  <DynamicField
                    type="textarea"
                    name="address"
                    placeholder="Enter address"
                    required
                  />
                </Row>

                <Row label="Address Line 2">
                  <DynamicField
                    type="input"
                    name="address2"
                    placeholder="Enter Address Line 2"
                  />
                </Row>

                <Row label="City">
                  <DynamicField type="input" name="city" placeholder="Enter City" />
                </Row>

                <Row label="Pincode">
                  <DynamicField
                    type="input"
                    name="pincode"
                    placeholder="Enter 6-Digit Pincode"
                    className="only-number no-space limit-6"
                    validationType="pincode"
                  />
                </Row>

                <Row label="State">
                  <DynamicField
                    type="input"
                    name="state"
                    placeholder="Enter State"
                    className="uppercase"
                  />
                </Row>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-md mt-6 font-medium text-[#103BB5]">
                Bank Details
              </h3>
              <div className="space-y-4">
                <Row label="Bank Account Number">
                  <DynamicField
                    type="input"
                    name="bank_account"
                    placeholder="Enter Account number"
                    className="only-number no-space"
                  />
                </Row>
                <Row label="IFSC Code">
                  <DynamicField
                    type="input"
                    name="ifsc"
                    placeholder="Enter 11-Digit IFSC code"
                    className="alphanumeric-uppercase no-space limit-11"
                    validationType="ifsc"
                  />
                </Row>
                <Row label="Branch Name">
                  <DynamicField
                    type="input"
                    name="branch_name"
                    placeholder="Enter Branch name"
                    className="uppercase only-alphabets"
                  />
                </Row>
                <Row label="Bank Name">
                  <DynamicField
                    type="input"
                    name="bank_name"
                    placeholder="Enter Bank name"
                    className="uppercase only-alphabets"
                  />
                </Row>
              </div>

              <h3 className="text-md mt-6 font-medium text-[#103BB5]">
                Proof Details
              </h3>
              <div className="space-y-4">
                <Row label="Aadhaar Number">
                  <DynamicField
                    type="input"
                    name="aadhaar"
                    placeholder="Enter 12-Digit Aadhaar number"
                    className="only-number no-space limit-12"
                    validationType="aadhaar"
                  />
                </Row>
                <Row label="PAN Number">
                  <DynamicField
                    type="input"
                    name="pan"
                    placeholder="Enter 10-Digit PAN number"
                    className="alphanumeric-uppercase no-space limit-10"
                    validationType="pan"
                  />
                </Row>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t bg-white px-3 py-3 sm:gap-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || designationLoading}>
            {loading ? "Submitting..." : "Add Staff"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this staff?"
      />
    </FormProvider>
  );
}
