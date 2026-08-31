"use client";

import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type MaterialForm = {
  material_name: string;
  ledger_id: string;
  material_description: string;
  unit_of_measurement: string;
  minimum_stock_level: string;
  reorder_level: string;
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

export default function NewMaterialPage() {
  const router = useRouter();

  const methods = useForm<MaterialForm>({
    defaultValues: {
      material_name: "",
      ledger_id: "",
      material_description: "",
      unit_of_measurement: "",
      minimum_stock_level: "",
      reorder_level: "",
      remarks: "",
    },
  });

  const [categoryOptions, setCategoryOptions] = useState<LedgerOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<LedgerOption[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<MaterialForm | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchLedgerOptions = useCallback(
    async (ledgerType: "material_ledger" | "unit_ledger") => {
      const response = await postAPI(
        "LEDGER_LIST",
        {
          data: {
            conditions: {
              ledger_type: ledgerType,
            },
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to fetch ledgers");
      }

      return getLedgerRows(response)
        .filter(
          (ledger: any) =>
            String(ledger?.ledger_type ?? ledger?.ledgerType ?? "") ===
              ledgerType ||
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
        .filter((option: LedgerOption) => option.label && option.value);
    },
    [],
  );

  const fetchLedgers = useCallback(async () => {
    setLedgerLoading(true);

    try {
      const [materialCategories, units] = await Promise.all([
        fetchLedgerOptions("material_ledger"),
        fetchLedgerOptions("unit_ledger"),
      ]);

      setCategoryOptions(materialCategories);
      setUnitOptions(units);
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLedgerLoading(false);
    }
  }, [fetchLedgerOptions]);

  useEffect(() => {
    void fetchLedgers();
  }, [fetchLedgers]);

  const onSubmit: SubmitHandler<MaterialForm> = (data) => {
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
        "NEW_MATERIAL",
        {
          data: {
            material_name: pendingData.material_name.trim(),
            material_category: Number(pendingData.ledger_id),
            material_description:
              pendingData.material_description.trim(),

            // unit_ledger: UI shows ledger_name, payload sends selected ledger ID
            unit_of_measurement: Number(
              pendingData.unit_of_measurement,
            ),

            minimum_stock_level: Number(
              pendingData.minimum_stock_level,
            ),
            reorder_level: Number(pendingData.reorder_level),
            remarks: pendingData.remarks.trim(),
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to add material");
      }

      setToast({
        message: response.message || "Material created successfully",
        type: "success",
      });

      methods.reset();
      setTimeout(() => router.push("/materials/list"), 900);
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
                Material Details
              </h3>
              <div className="space-y-4">
                <FieldRow label="Material Name" required>
                  <DynamicField
                    type="input"
                    name="material_name"
                    placeholder="Enter material name"
                    required
                    capitalize
                    validation={{
                      required: "Material name is required",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Material Category" required>
                  <DynamicField
                    type="typeahead"
                    name="ledger_id"
                    placeholder={
                      ledgerLoading
                        ? "Loading material categories..."
                        : "Select material category"
                    }
                    options={categoryOptions}
                    required
                    validation={{
                      required: "Please select a material category",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Material Description">
                  <DynamicField
                    type="textarea"
                    name="material_description"
                    placeholder="Enter material description"
                  />
                </FieldRow>

                <FieldRow label="Unit of Measurement" required>
                  <DynamicField
                    type="typeahead"
                    name="unit_of_measurement"
                    placeholder={
                      ledgerLoading
                        ? "Loading units..."
                        : "Select unit of measurement"
                    }
                    options={unitOptions}
                    required
                    validation={{
                      required:
                        "Please select a unit of measurement",
                    }}
                  />
                </FieldRow>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <FieldRow label="Minimum Stock Level" required>
                  <DynamicField
                    type="input"
                    name="minimum_stock_level"
                    placeholder="Enter minimum stock level"
                    className="only-number no-space"
                    required
                    validation={{
                      required:
                        "Minimum stock level is required",
                      pattern: {
                        value: /^\d+$/,
                        message: "Enter a valid stock level",
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow label="Reorder Level" required>
                  <DynamicField
                    type="input"
                    name="reorder_level"
                    placeholder="Enter reorder level"
                    className="only-number no-space"
                    required
                    validation={{
                      required: "Reorder level is required",
                      pattern: {
                        value: /^\d+$/,
                        message: "Enter a valid reorder level",
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
            onClick={() => router.push("/materials/list")}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading || ledgerLoading}>
            {loading ? "Submitting..." : "Add Material"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this material?"
      />
    </FormProvider>
  );
}