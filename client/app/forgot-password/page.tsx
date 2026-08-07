"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/lib/store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setSent(true);
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <MailCheck size={40} className="mx-auto text-indigo-600 mb-4" />
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-gray-600 text-sm">
          If that email is registered, we&apos;ve sent a password reset link. It expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
      <p className="text-gray-600 text-sm mb-6">
        Enter your account email and we&apos;ll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register("email")} className="w-full border rounded-md px-3 py-2" placeholder="you@company.com" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        <a href="/login" className="text-indigo-700 font-medium">
          Back to login
        </a>
      </p>
    </div>
  );
}
