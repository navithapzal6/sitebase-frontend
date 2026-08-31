"use client";

import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import { Toaster } from "@/app/utils/components/Toaster";

type WarehouseFormValues = {
  warehouse_name: string;
  phone: string;
  address: string;
  pincode: string;
  state: string;
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

function NewWarehouseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit-id");

  const methods = useForm<WarehouseFormValues>({
    defaultValues: {
      warehouse_name: "",
      phone: "",
      address: "",
      pincode: "",
      state: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<WarehouseFormValues | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  

  const onSubmit: SubmitHandler<WarehouseFormValues> = (data) => {
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
        "ADD_WAREHOUSE",
        {
          data: {
            warehouse_name: pendingData.warehouse_name.trim(),
            phone_number: pendingData.phone.trim(),
            address: pendingData.address.trim(),
            pincode: pendingData.pincode.trim(),
            state: pendingData.state.trim(),
            ...(editId && { warehouse_id: Number(editId) }),
          },
        },
        true,
      );

      if (response.success !== true) {
        throw new Error(response.message || "Warehouse operation failed");
      }

      setToast({
        message:
          response.message ||
          (editId
            ? "Warehouse updated successfully"
            : "Warehouse added successfully"),
        type: "success",
      });
      methods.reset();
      setTimeout(() => router.push("/warehouse/list"), 900);
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
                Warehouse Details
              </h3>
             
              <div className="space-y-4">
                <FieldRow label="Warehouse Name" required>
                  <DynamicField
                    type="input"
                    name="warehouse_name"
                    placeholder="Enter Warehouse name"
                    className="capitalize"
                    validation={{ required: "Warehouse Name is required" }}
                  />
                </FieldRow>

                <FieldRow label="Phone Number" required>
                  <DynamicField
                    type="input"
                    name="phone"
                    placeholder="Enter 10 Digit Phone number"
                    className="only-number no-space limit-10"
                    required
                    validationType="phone"
                  />
                </FieldRow>

                <FieldRow label="Address" required>
                  <DynamicField
                    type="textarea"
                    name="address"
                    placeholder="Enter full address"
                    validation={{ required: "Address is required" }}
                  />
                </FieldRow>

                <FieldRow label="Pincode">
                  <DynamicField
                    type="input"
                    name="pincode"
                    placeholder="Enter 6-Digit Pincode"
                    className="only-number no-space limit-6"
                    validationType="pincode"
                  />
                </FieldRow>

                <FieldRow label="State">
                  <DynamicField
                    type="input"
                    name="state"
                    placeholder="Enter State"
                    className="uppercase"
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
            onClick={() => router.push("/warehouse/list")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : editId
                ? "Update Warehouse"
                : "Add Warehouse"}
          </Button>
        </footer>
      </form>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        loading={loading}
        title="Confirm Submission"
        message={`Are you sure you want to ${editId ? "update" : "add"} this warehouse?`}
      />
    </FormProvider>
  );
}

export default function NewWarehousePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading warehouse form...</div>}>
      <NewWarehouseContent />
    </Suspense>
  );
}
