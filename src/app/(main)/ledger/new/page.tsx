"use client";

import { Suspense, useEffect, useState } from "react";
import { FormProvider, type SubmitHandler, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

import { postAPI } from "@/app/utils/helpers/api";
import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import {
  isLedgerApiSuccess,
  LEDGER_TYPE_OPTIONS,
  mapLedgerRecord,
} from "@/app/utils/helpers/ledgerConfig";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type LedgerFormValues = {
  ledger_type: string;
  ledger_name: string;
  ledger_description: string;
 
};

const DEFAULT_VALUES: LedgerFormValues = {
  ledger_type: "",
  ledger_name: "",
  ledger_description: "",
 
};

function NewLedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit-id");

  const methods = useForm<LedgerFormValues>({ defaultValues: DEFAULT_VALUES });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<LedgerFormValues | null>(null);
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

  useEffect(() => {
    if (!editId) return;

    const fetchLedger = async () => {
      setLoading(true);
      try {
        const response = await postAPI(
          "GET_LEDGER_BY_ID",
          { data: { ledger_id: Number(editId) } },
          true,
        );

        if (!isLedgerApiSuccess(response) || !response.data) {
          throw new Error(response.message || "Failed to load ledger");
        }

        const record = mapLedgerRecord(response.data?.data ?? response.data);
        methods.reset({
          ledger_type: record.ledger_type,
          ledger_name: record.ledger_name,
          ledger_description: record.ledger_description || "",
         
        });
      } catch (error: any) {
        showToast(error.message || "Failed to load ledger", "error");
      } finally {
        setLoading(false);
      }
    };

    void fetchLedger();
  }, [editId, methods]);

  const handleFormSubmit: SubmitHandler<LedgerFormValues> = (data) => {
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
      const response = await postAPI(
        "NEW_LEDGER",
        {
          data: {
            id: editId ? Number(editId) : 0,
            ledgerType: pendingData.ledger_type,
            ledgerName: pendingData.ledger_name.trim(),
            ledgerDescription: pendingData.ledger_description.trim(),
           
          },
        },
        true,
      );

      if (!isLedgerApiSuccess(response)) {
        throw new Error(response.message || "Operation failed");
      }

      showToast(
        response.message ||
          (editId
            ? "Ledger updated successfully"
            : "Ledger added successfully"),
      );
      methods.reset(DEFAULT_VALUES);
      window.setTimeout(() => router.push("/ledger/list"), 1000);
    } catch (error: any) {
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    methods.reset(DEFAULT_VALUES);
    setShowConfirm(false);
    router.push("/ledger/list");
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
          <div className="max-w-4xl space-y-6">
            <h3 className="text-md mb-2 font-medium text-[#103BB5]">
              Ledger Details
            </h3>

            <div className="space-y-4">
              <Row label="Ledger Type" required>
                <DynamicField
                  type="typeahead"
                  name="ledger_type"
                  placeholder="Select ledger type"
                  options={LEDGER_TYPE_OPTIONS.slice(1).map((option) => ({
                    ...option,
                  }))}
                  required
                  validation={{ required: "Please select a ledger type" }}
                />
              </Row>

              <Row label="Ledger Name" required>
                <DynamicField
                  type="input"
                  name="ledger_name"
                  placeholder="Enter ledger name"
                  className="capitalize limit-100"
                  required
                  validation={{
                    required: "Ledger name is required",
                    minLength: {
                      value: 2,
                      message: "Ledger name must contain at least 2 characters",
                    },
                    maxLength: {
                      value: 100,
                      message: "Ledger name cannot exceed 100 characters",
                    },
                  }}
                />
              </Row>

              <Row label="Description">
                <DynamicField
                  type="textarea"
                  name="ledger_description"
                  placeholder="Enter description (optional)"
                  validation={{
                    maxLength: {
                      value: 500,
                      message: "Description cannot exceed 500 characters",
                    },
                  }}
                />
              </Row>

              
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
          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : editId
                ? "Update Ledger"
                : "Add Ledger"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message={
          editId
            ? "Are you sure you want to update this ledger?"
            : "Are you sure you want to add this ledger?"
        }
      />
    </FormProvider>
  );
}

export default function NewLedgerPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading ledger form...</div>}>
      <NewLedgerContent />
    </Suspense>
  );
}
