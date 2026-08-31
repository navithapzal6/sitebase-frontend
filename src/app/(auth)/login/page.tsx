 


"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, SubmitHandler } from "react-hook-form";

import DynamicField from "@/app/utils/components/DynamicField";
import { Button } from "@/app/utils/components/Button";
import PasswordField from "@/app/utils/components/PasswordField";
import Loader from "@/app/utils/components/Loader";
import { Toaster } from "@/app/utils/components/Toaster";
import { postAPI  } from "@/app/utils/helpers/api";
import { type SessionUser } from "@/app/utils/helpers/permissions";

type LoginForm = {
  username: string;
  password: string;
};

type FieldWrapperProps = {
  label: string;
  children: React.ReactNode;
};

function FieldWrapper({ label, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const submitLockRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const methods = useForm<LoginForm>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    // React state updates are asynchronous. Keep a synchronous lock as well so
    // one fast double-click can never create two login requests/sessions.
    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setLoading(true);

    try {
      const response = await postAPI(
        "LOGIN",
        {
          username: data.username.trim(),
          password: data.password,
        },
        false
      );

      if (!response.data) {
        throw new Error(response.message || "Unable to complete login");
      }

      // Store only non-sensitive user information.
      const sessionUser: SessionUser = {
        username: response.data.username,
        user_type: response.data.user_type,
        user_id: response.data.user_id,
        is_primary_admin: Boolean(response.data.is_primary_admin),
        must_change_password: Boolean(response.data.must_change_password),
        permissions: Array.isArray(response.data.permissions)
          ? response.data.permissions
          : [],
        allowed_routes: Array.isArray(response.data.allowed_routes)
          ? response.data.allowed_routes
          : [],
        home_route: response.data.home_route,
      };

      localStorage.setItem("user", JSON.stringify(sessionUser));

      setToast({
        message: response.message || "Login successful",
        type: "success",
      });

      router.replace("/clients/list");
    } catch (error: any) {
      submitLockRef.current = false;
      setLoading(false);
      setToast({
        message: error.message || "Invalid credentials",
        type: "error",
      });
    }
  };
  const handleToastClose = () => setToast(null);

  return (
    <>
      {loading && <Loader />}

      {toast && (
        <Toaster
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h2 className="text-3xl font-bold text-[#103BB5] mb-6 text-center">
            Login
          </h2>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
              <FieldWrapper label="Username">
                <DynamicField
                  name="username"
                  type="input"
                  placeholder="Enter Username" required
                  validation={{ required: "Username is required" }}
                />
              </FieldWrapper>

              <FieldWrapper label="Password">
                <PasswordField
                  name="password"
                  placeholder="Enter Password"
                  validation={{ required: "Password is required" }}
                />
              </FieldWrapper>

              <Button type="submit" className="w-full bg-[#103BB5]" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="text-[#103BB5] font-medium hover:underline"
                >
                  Create Account
                </button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </>
  );
}