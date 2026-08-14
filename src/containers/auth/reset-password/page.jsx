"use client";

import React, { useMemo, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordField } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import { toast, Toaster } from "sonner";

const PASSWORD_REQUIREMENTS = [
  { test: (value) => value.length >= 8, message: "At least 8 characters" },
  { test: (value) => /[A-Z]/.test(value), message: "One uppercase letter" },
  { test: (value) => /[a-z]/.test(value), message: "One lowercase letter" },
  { test: (value) => /\d/.test(value), message: "One number" },
  {
    test: (value) => /[^A-Za-z0-9]/.test(value),
    message: "One special character",
  },
];

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [successMessage, setSuccessMessage] = useState("");
  const [serverErrors, setServerErrors] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const passwordValue = watch("password");

  const passwordHelperText = useMemo(() => {
    if (!passwordValue) return PASSWORD_REQUIREMENTS.map((req) => req.message);
    return PASSWORD_REQUIREMENTS.filter((req) => !req.test(passwordValue)).map(
      (req) => req.message
    );
  }, [passwordValue]);

  const onSubmit = async ({ password, confirmPassword }) => {
    clearErrors(["password", "confirmPassword"]);
    setServerErrors([]);

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    try {
      const response = await axiosInstance.post(
        `/auth/reset-password?token=${token}`,
        {
          new_password: password,
          confirm_password: confirmPassword,
        }
      );

      const message =
        response?.data?.message ||
        "Password reset successfully. Try logging in again.";

      toast.success(message);
      reset();
      setSuccessMessage(
        `${message} Please try logging back into your application.`
      );
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;

      if (apiErrors) {
        const formattedErrors = [];

        Object.entries(apiErrors).forEach(([field, messages]) => {
          const firstMessage = Array.isArray(messages) ? messages[0] : messages;
          formattedErrors.push(firstMessage);

          if (field === "confirm_password") {
            setError("confirmPassword", {
              type: "server",
              message: firstMessage,
            });
          }

          if (field === "new_password" || field === "password") {
            setError("password", { type: "server", message: firstMessage });
          }
        });

        setServerErrors([...new Set(formattedErrors)]);
      } else {
        const message =
          error?.response?.data?.message || "Failed to reset password.";
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Toaster position="top-center" />
        {successMessage ? (
          <div className="text-center space-y-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Password reset successfully
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">{successMessage}</p>
            <Button asChild className="w-full cursor-pointer">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 p-2">
                <ShieldCheck className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Enter a new password below. Your account security matters to us.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div>
                <PasswordField
                  label="New Password"
                  name="password"
                  placeholder="Enter a strong password"
                  register={register}
                  errors={errors}
                  validation={{
                    required: "Password is required",
                    validate: {
                      hasMinLength: (value) =>
                        (value?.length ?? 0) >= 8 ||
                        "Use at least 8 characters",
                      hasUpperCase: (value) =>
                        /[A-Z]/.test(value || "") ||
                        "Include at least one uppercase letter",
                      hasLowerCase: (value) =>
                        /[a-z]/.test(value || "") ||
                        "Include at least one lowercase letter",
                      hasNumber: (value) =>
                        /\d/.test(value || "") || "Include at least one number",
                      hasSpecialChar: (value) =>
                        /[^A-Za-z0-9]/.test(value || "") ||
                        "Include at least one special character",
                    },
                  }}
                />

                {passwordHelperText.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {passwordHelperText.map((requirement) => (
                      <li key={requirement} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                register={register}
                errors={errors}
                validation={{
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === passwordValue || "Passwords do not match",
                }}
              />

              {serverErrors.length > 0 && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {serverErrors.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer">
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating password...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary/80">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
