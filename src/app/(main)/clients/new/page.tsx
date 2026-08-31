"use client";

import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { Button } from "@/app/utils/components/Button";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import DynamicField from "@/app/utils/components/DynamicField";
import ConfirmModal from "@/app/utils/components/ConfirmationModal";
import { Toaster } from "@/app/utils/components/Toaster";

import { postAPI } from "@/app/utils/helpers/api";

type FormValues = {
  full_name: string;
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

  gst_no: string;
  aadhaar: string;
  pan: string;
  registeration_id: string;
};

function NewClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit-id");

  const methods = useForm<FormValues>({
    defaultValues: {
      full_name: "",
      phone: "",
      alternate_phone: "",
      email: "",

      address: "",
      address2: "",
      city: "",
      state: "",
      pincode: "",

      bank_account: "",
      ifsc: "",
      branch_name: "",
      bank_name: "",

      aadhaar: "",
      pan: "",
      registeration_id: "",
      gst_no: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormValues | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Fetch for Edit
  useEffect(() => {
    if (!editId) return;

    const fetchClient = async () => {
      setLoading(true);
      try {
        const response = await postAPI(
          "GET_CLIENT_BY_ID",
          { data: { client_id: Number(editId) } },
          true,
        );

        if (
          (response.success === true || response.status === true) &&
          response.data
        ) {
          const c = response.data;
          methods.reset({
            full_name: c.client_name || c.full_name || "",
            phone: c.phone_number || c.phone || "",
            alternate_phone:
              c.alternate_phone_number || c.alternate_phone || "",
            email: c.email || "",
            address: c.address_line1 || c.address || "",
            address2: c.address_line2 || "",
            city: c.city || "",
            pincode: c.pincode || "",
            state: c.state || "",
            bank_account: c.bank_account_number || c.bank_account || "",
            ifsc: c.ifsc_code || c.ifsc || "",
            branch_name: c.branch_name || "",
            bank_name: c.bank_name || "",
            aadhaar: c.aadhaar_number || c.aadhaar || "",
            pan: c.pan_number || c.pan || "",
            registeration_id: c.registration_id || "",
            gst_no: c.gstin || c.gst_no || "",
          });
        } else {
          showToast(response.message || "Failed to load client", "error");
        }
      } catch (err: any) {
        showToast(err.message || "Failed to load client data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [editId, methods]);

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setFormData(data);
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    if (!formData) return;
    setLoading(true);

    try {
      const payload = {
        clientName: formData.full_name,
        phoneNumber: formData.phone,
        alternatePhoneNumber: formData.alternate_phone,

        email: formData.email,

        addressLine1: formData.address,
        addressLine2: formData.address2,

        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,

        bankName: formData.bank_name,
        branchName: formData.branch_name,
        bankAccountNumber: formData.bank_account,
        ifscCode: formData.ifsc,

        gstin: formData.gst_no,
        aadhaarNumber: formData.aadhaar,
        panNumber: formData.pan,
        registrationId: formData.registeration_id,

        ...(editId && { client_id: Number(editId) }),
      };
      const response = await postAPI("ADD_CLIENT", { data: payload }, true);
      console.log(response);
      if (response.success === true) {
        showToast(
          editId ? "Client updated successfully" : "Client added successfully",
          "success",
        );
        methods.reset();
        setTimeout(() => router.push("/clients/list"), 1200);
      } else {
        showToast(response.message || "Operation failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    methods.reset();
    setShowConfirm(false);
    router.push("/clients/list");
  };

  const onInvalid = () => {
    showToast("Please fill all mandatory fields ❗", "error");
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
      <label className="w-full font-medium text-black text-[15px] sm:w-1/3">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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
        onSubmit={methods.handleSubmit(handleFormSubmit, onInvalid)}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Basic Details */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-[#103BB5] mb-2">
                Basic Details
              </h3>
              <div className="space-y-4">
                <Row label="Full Name" required>
                  <DynamicField
                    type="input"
                    name="full_name"
                    placeholder="Enter Full name"
                    className="capitalize"
                    validation={{ required: "Client Name is required" }}
                    required
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
                    required
                    name="address"
                    placeholder="Enter address"
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
                  <DynamicField
                    type="input"
                    name="city"
                    placeholder="Enter City"
                  />
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

            {/* Bank & Proof Details */}
            <div className="space-y-6">
              <h3 className="text-md font-medium text-[#103BB5] mt-6">
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

              <h3 className="text-md font-medium text-[#103BB5] mt-6">
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
                <Row label="Registration ID">
                  <DynamicField
                    type="input"
                    name="registeration_id"
                    placeholder="Enter Registration ID"
                    className="alphanumeric-uppercase"
                  />
                </Row>
                <Row label="GST Number">
                  <DynamicField
                    type="input"
                    name="gst_no"
                    placeholder="Enter GST Number"
                    className="alphanumeric-uppercase no-space limit-15"
                    validationType="gstin"
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
          <Button type="submit" disabled={loading}>
            {loading
              ? "Submitting..."
              : editId
                ? "Update Client"
                : "Add Client"}
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
            ? "Are you sure you want to update this client?"
            : "Are you sure you want to add this client?"
        }
      />
    </FormProvider>
  );
}

export default function NewClientPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading client form...</div>}>
      <NewClientContent />
    </Suspense>
  );
}
