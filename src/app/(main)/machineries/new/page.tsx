"use client";

import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type MachineryForm = {
  machinery_name: string;
  ledger_id: string;
  machinery_description: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: string;
  last_maintenance_date: string;
  next_maintenance_date: string;
  remarks: string;
};

type LedgerOption = {
  label: string;
  value: string;
};

const toApiDate = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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

export default function NewMachineryPage() {
  const router = useRouter();
  const today = format(new Date(), "dd/MM/yyyy");

  const methods = useForm<MachineryForm>({
    defaultValues: {
      machinery_name: "",
      ledger_id: "",
      machinery_description: "",
      manufacturer: "",
      model: "",
      serial_number: "",
      purchase_date: today,
      purchase_cost: "",
      last_maintenance_date: today,
      next_maintenance_date: today,
      remarks: "",
    },
  });

  const [ledgerOptions, setLedgerOptions] = useState<LedgerOption[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<MachineryForm | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchMachineryLedgers = useCallback(async () => {
    setLedgerLoading(true);

    try {
      const response = await postAPI(
        "LEDGER_LIST",
        {
          data: {
            conditions: {
              ledger_type: "machinery_ledger",
            },
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(
          response.message || "Failed to fetch machinery ledgers",
        );
      }

      const rows = getLedgerRows(response);

      setLedgerOptions(
        rows
          .filter(
            (ledger: any) =>
              String(ledger?.ledger_type ?? ledger?.ledgerType ?? "") ===
                "machinery_ledger" ||
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
    void fetchMachineryLedgers();
  }, [fetchMachineryLedgers]);

  const onSubmit: SubmitHandler<MachineryForm> = (data) => {
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
        "ADD_MACHINERY",
        {
          data: {
            machinery_name: pendingData.machinery_name.trim(),
            machinery_category: Number(pendingData.ledger_id),
            machinery_description:
              pendingData.machinery_description.trim(),
            manufacturer: pendingData.manufacturer.trim(),
            model: pendingData.model.trim(),
            serial_number: pendingData.serial_number.trim(),
            purchase_date: toApiDate(pendingData.purchase_date),
            purchase_cost: Number(pendingData.purchase_cost),
            last_maintenance_date: toApiDate(
              pendingData.last_maintenance_date,
            ),
            next_maintenance_date: toApiDate(
              pendingData.next_maintenance_date,
            ),
            remarks: pendingData.remarks.trim(),
          },
        },
        true,
      );

      if (!isSuccess(response)) {
        throw new Error(response.message || "Failed to add machinery");
      }

      setToast({
        message: response.message || "Machinery created successfully",
        type: "success",
      });

      methods.reset();

      setTimeout(() => {
        router.push("/machineries/list");
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
                Machinery Details
              </h3>
              <div className="space-y-4">
                <FieldRow label="Machinery Name" required>
                  <DynamicField
                    type="input"
                    name="machinery_name"
                    placeholder="Enter machinery name"
                    required
                    capitalize
                    validation={{
                      required: "Machinery name is required",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Machinery Category" required>
                  <DynamicField
                    type="typeahead"
                    name="ledger_id"
                    placeholder={
                      ledgerLoading
                        ? "Loading machinery categories..."
                        : "Select machinery category"
                    }
                    options={ledgerOptions}
                    required
                    validation={{
                      required: "Please select a machinery category",
                    }}
                  />
                </FieldRow>

                <FieldRow label="Machinery Description">
                  <DynamicField
                    type="textarea"
                    name="machinery_description"
                    placeholder="Enter machinery description"
                  />
                </FieldRow>

                <FieldRow label="Manufacturer">
                  <DynamicField
                    type="input"
                    name="manufacturer"
                    placeholder="Enter manufacturer"
                    capitalize
                  />
                </FieldRow>

                <FieldRow label="Model">
                  <DynamicField
                    type="input"
                    name="model"
                    placeholder="Enter model"
                  />
                </FieldRow>

                <FieldRow label="Serial Number">
                  <DynamicField
                    type="input"
                    name="serial_number"
                    placeholder="Enter serial number"
                    className="alphanumeric-uppercase no-space"
                  />
                </FieldRow>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <FieldRow label="Purchase Date">
                  <DynamicField
                    type="datepicker"
                    name="purchase_date"
                    placeholder="Select purchase date"
                  />
                </FieldRow>

                <FieldRow label="Purchase Cost">
                  <DynamicField
                    type="input"
                    name="purchase_cost"
                    placeholder="Enter purchase cost"
                    className="only-number no-space"
                  />
                </FieldRow>

                <FieldRow label="Last Maintenance Date">
                  <DynamicField
                    type="datepicker"
                    name="last_maintenance_date"
                    placeholder="Select last maintenance date"
                  />
                </FieldRow>

                <FieldRow label="Next Maintenance Date">
                  <DynamicField
                    type="datepicker"
                    name="next_maintenance_date"
                    placeholder="Select next maintenance date"
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
            onClick={() => router.push("/machineries/list")}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={loading || ledgerLoading}>
            {loading ? "Submitting..." : "Add Machinery"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message="Are you sure you want to add this machinery?"
      />
    </FormProvider>
  );
}
