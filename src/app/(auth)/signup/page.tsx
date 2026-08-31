"use client";

import { useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { postAPI } from "@/app/utils/helpers/api";
import { Button } from "@/app/utils/components/Button";
import DynamicField from "@/app/utils/components/DynamicField";
import Loader from "@/app/utils/components/Loader";
import PasswordField from "@/app/utils/components/PasswordField";
import { Toaster } from "@/app/utils/components/Toaster";

type SignupForm = {
  company_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
};

const hasSpecialCharacter = (value: string) => /[\p{P}\p{S}]/u.test(value);

type FieldWrapperProps = {
  label: string;
  children: React.ReactNode;
};

function FieldWrapper({ label, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const methods = useForm<SignupForm>({
    defaultValues: {
      company_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    setLoading(true);

    try {
      const email = data.email.trim().toLowerCase();
      const phone = data.phone.trim();

      const response = await postAPI(
        "REGISTER",
        {
          company_name: data.company_name.trim(),
          email,
          phone,
          password: data.password,
        },
        false
      );

      if (response.status !== true) {
        throw new Error(response.message || "Signup failed");
      }

      setToast({
        message: `${response.message || "Company created successfully"}\nAdmin User Name: ${response.data?.username || ""}`,
        type: "success",
      });
      methods.reset();
      setTimeout(() => router.push("/login"), 1200);
    } catch (error: any) {
      setToast({
        message: error.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}

      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex min-h-screen items-start justify-center bg-gray-100 px-4 py-4 sm:items-center sm:py-5">
        <div className="w-full max-w-[440px] rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-lg">
          <h2 className="mb-4 text-center text-2xl font-bold leading-tight text-[#103BB5]">
            Create Company
          </h2>

          <FormProvider {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              <FieldWrapper label="Company Name">
                <DynamicField
                  name="company_name"
                  type="input"
                  placeholder="Enter Company Name"
                  required
                  capitalize
                  validation={{
                    required: "Company name is required",
                    minLength: {
                      value: 2,
                      message: "Company name must contain at least 2 characters",
                    },
                  }}
                />
              </FieldWrapper>

              <FieldWrapper label="Email">
                <DynamicField
                  name="email"
                  type="input"
                  placeholder="Enter Email Address"
                  required
                  validationType="email"
                  maxLength={255}
                  className="no-space"
                />
              </FieldWrapper>

              <FieldWrapper label="Phone Number">
                <DynamicField
                  name="phone"
                  type="input"
                  placeholder="Enter 10 Digit Phone Number"
                  required
                  validationType="phone"
                  maxLength={10}
                  className="only-number no-space limit-10"
                />
              </FieldWrapper>

              <FieldWrapper label="Password">
                <PasswordField
                  name="password"
                  placeholder="Enter Password"
                  validation={{
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must contain at least 8 characters",
                    },
                    validate: {
                      uppercase: (value) =>
                        /[A-Z]/.test(String(value)) ||
                        "Password must contain at least one capital letter",
                      special: (value) =>
                        hasSpecialCharacter(String(value)) ||
                        "Password must contain at least one special character",
                    },
                  }}
                />
                <p className="text-[11px] leading-4 text-gray-500">
                  Minimum 8 characters with at least 1 capital letter and 1 special character.
                </p>
              </FieldWrapper>

              <FieldWrapper label="Confirm Password">
                <PasswordField
                  name="confirm_password"
                  placeholder="Re-enter Password"
                  validation={{
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === methods.getValues("password") ||
                      "Passwords do not match",
                  }}
                />
              </FieldWrapper>

              <Button
                type="submit"
                className="h-10 w-full bg-[#103BB5]"
                disabled={loading}
              >
                {loading ? "Creating Company..." : "Create Company"}
              </Button>

              <div className="pt-1 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-medium text-[#103BB5] hover:underline"
                >
                  Login
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </>
  );
}
