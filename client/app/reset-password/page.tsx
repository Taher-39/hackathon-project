"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";

const schema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: data.newPassword });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-red-600">
        Missing or invalid reset link. Please request a new one from the{" "}
        <a href="/forgot-password" className="underline">
          forgot password
        </a>{" "}
        page.
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle2 size={40} className="mx-auto text-green-600 mb-4" />
        <h1 className="text-xl font-bold mb-2">Password reset!</h1>
        <p className="text-gray-600 text-sm">Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Reset password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input type="password" {...register("newPassword")} className="w-full border rounded-md px-3 py-2" />
          {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm new password</label>
          <input type="password" {...register("confirmPassword")} className="w-full border rounded-md px-3 py-2" />
          {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center text-gray-500">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
