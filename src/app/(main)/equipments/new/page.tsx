"use client";

import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type EquipmentForm = {
  equipment_name: string;
  ledger_id: string;
  equipment_description: string;
  total_quantity: string;
  remarks: string;
};

type LedgerOption = {
  label: string;
  value: string;
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
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
      <label className="w-full font-medium text-black text-[15px] sm:w-1/3">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-2/3">{children}</div>
    </div>
  );
}

const isSuccess = (response: Awaited<ReturnType<typeof postAPI>>) =>
  response.success === true ||
  response.status === true ||
  response.status === "success";

const getLedgerRows = (response: Awaited<ReturnType<typeof postAPI>>) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (Array.isArray(response.data?.ledgers)) return response.data.ledgers;
  return [];
};

export default function NewEquipmentPage() {
  const router = useRouter();

  const methods = useForm<EquipmentForm>({
    defaultValues: {
      equipment_name: "",
      ledger_id: "",
      equipment_description: "",
      total_quantity: "",
      remarks: "",
    },
  });

  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<EquipmentForm | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchEquipmentLedgers = useCallback(async () => {
    setLedgerLoading(true);

    try {
      const response = await postAPI(
        "LEDGER_LIST",
        {
          data: {
            conditions: {
              ledger_type: "equipment_ledger",
            },
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to fetch equipment ledgers");
      }

      const rows = getLedgerRows(response);

      setLedgerOptions(
        rows
          .filter(
            (ledger: any) =>
              String(ledger?.ledger_type ?? ledger?.ledgerType ?? "") ===
                "equipment_ledger" ||
              !String(ledger?.ledger_type ?? ledger?.ledgerType ?? ""),
          )
          .map((ledger: any) => ({
            label: String(
              ledger?.ledger_name ??
                ledger?.ledgerName ??
                ledger?.name ??
                "",
            ),
            value: String(ledger?.id ?? ledger?.ID ?? ""),
          }))
          .filter((option: LedgerOption) => option.label && option.value),
      );
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEquipmentLedgers();
  }, [fetchEquipmentLedgers]);

  const onSubmit: SubmitHandler<EquipmentForm> = (data) => {
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
      const response = await postAPI(
        "ADD_EQUIPMENT",
        {
          data: {
            equipment_name: pendingData.equipment_name.trim(),
            equipment_category: Number(pendingData.ledger_id),
            equipment_description: pendingData.equipment_description.trim(),
            total_quantity: Number(pendingData.total_quantity),
            remarks: pendingData.remarks.trim(),
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to add equipment");
      }

      setToast({
        message: response.message || "Equipment created successfully",
        type: "success",
      });

      methods.reset();

      setTimeout(() => {
        router.push("/equipments/list");
      }, 900);
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
        className="flex h-full min-h-0 flex-col overflow-hidden bg-white py-4"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-md mb-2 font-medium text-[#103BB5]">
                Equipment Details
              </h3>
              <div className="space-y-4">
                <FieldRow label="Equipment Name" required>
                  <DynamicField
                    type="input"
                    name="equipment_name"
                    placeholder="Enter equipment name"
                    required
                    capitalize
                    validation={{
                      required: "Equipment name is required",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Equipment Category" required>
                  <DynamicField
                    type="typeahead"
                    name="ledger_id"
                    placeholder={
                      ledgerLoading
                        ? "Loading equipment categories..."
                        : "Select equipment category"
                    }
                    options={ledgerOptions}
                    required
                    validation={{
                      required: "Please select an equipment category",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Equipment Description">
                  <DynamicField
                    type="textarea"
                    name="equipment_description"
                    placeholder="Enter equipment description"
                  />
                </FieldRow>

                <FieldRow label="Total Quantity" required>
                  <DynamicField
                    type="input"
                    name="total_quantity"
                    placeholder="Enter total quantity"
                    className="only-number no-space"
                    required
                    validation={{
                      required: "Total quantity is required",
                      pattern: {
                        value: /^[1-9]\d*$/,
                        message: "Enter a valid quantity",
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow label="Remarks">
                  <DynamicField
                    type="textarea"
                    name="remarks"
                    placeholder="Enter remarks"
                  />
                </FieldRow>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t bg-white px-3 py-3 sm:gap-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => router.push("/equipments/list")}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading || ledgerLoading}>
            {loading ? "Submitting..." : "Add Equipment"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this equipment?"
      />
    </FormProvider>
  );
}