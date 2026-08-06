"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useWishlistStore } from "@/lib/store";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function loginWithCredentials(credentials: FormData) {
    setServerError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", credentials);
      const { user, token } = res.data.data;
      setAuth(user, token);
      useWishlistStore.getState().setIds((user.wishlist || []).map(String));
      if (!user.isOnboarded) {
        router.push(user.role === "buyer" ? "/onboarding/buyer" : "/onboarding/supplier");
      } else {
        router.push(user.role === "buyer" ? "/dashboard/buyer" : "/dashboard/supplier");
      }
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(data: FormData) {
    return loginWithCredentials(data);
  }

  function demoLogin(role: "buyer" | "supplier") {
    return loginWithCredentials(
      role === "buyer"
        ? { email: "demo.buyer@textilehub.com", password: "Demo@1234" }
        : { email: "demo.supplier@textilehub.com", password: "Demo@1234" }
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Log in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register("email")} className="w-full border rounded-md px-3 py-2" placeholder="you@company.com" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Password</label>
            <a href="/forgot-password" className="text-xs text-indigo-700 hover:underline">
              Forgot password?
            </a>
          </div>
          <input type="password" {...register("password")} className="w-full border rounded-md px-3 py-2" />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500 uppercase tracking-wide">Quick demo access</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => demoLogin("buyer")}
          disabled={loading}
          className="border border-indigo-200 text-indigo-700 py-2 rounded-md hover:bg-indigo-50 disabled:opacity-60 text-sm font-medium"
        >
          Demo Buyer Login
        </button>
        <button
          type="button"
          onClick={() => demoLogin("supplier")}
          disabled={loading}
          className="border border-indigo-200 text-indigo-700 py-2 rounded-md hover:bg-indigo-50 disabled:opacity-60 text-sm font-medium"
        >
          Demo Supplier Login
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Don&apos;t have an account?{" "}
        <a href="/register" className="text-indigo-700 font-medium">
          Register
        </a>
      </p>
    </div>
  );
}
