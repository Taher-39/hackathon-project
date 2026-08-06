"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Lock } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal } from "@/components/motion/Reveal";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow";

function SecurityContent() {
  const toast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      await api.put("/users/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast("Password updated", "success");
      reset();
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Reveal>
      <div className="bg-white border rounded-xl p-6 max-w-lg shadow-sm">
        <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
          <span className="bg-indigo-50 text-indigo-600 rounded-lg p-2">
            <Lock size={18} />
          </span>
          Change Password
        </h1>
        <p className="text-gray-500 text-sm mb-6">Update the password used to log in to your account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current password</label>
            <input type="password" {...register("currentPassword")} className={inputClass} />
            {errors.currentPassword && <p className="text-red-600 text-sm mt-1">{errors.currentPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input type="password" {...register("newPassword")} className={inputClass} />
            {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm new password</label>
            <input type="password" {...register("confirmPassword")} className={inputClass} />
            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </Reveal>
  );
}

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SecurityContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
