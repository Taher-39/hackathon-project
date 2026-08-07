"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["buyer", "supplier"], { message: "Select a role" }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: "buyer" } });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", data);
      const { user, token } = res.data.data;
      setAuth(user, token);
      router.push(user.role === "buyer" ? "/onboarding/buyer" : "/onboarding/supplier");
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input {...register("name")} className="w-full border rounded-md px-3 py-2" placeholder="Jane Doe" />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register("email")} className="w-full border rounded-md px-3 py-2" placeholder="you@company.com" />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border rounded-md px-3 py-2"
            placeholder="At least 6 characters"
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="border rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
              <input type="radio" value="buyer" {...register("role")} defaultChecked />
              Buyer
            </label>
            <label className="border rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
              <input type="radio" value="supplier" {...register("role")} />
              Supplier
            </label>
          </div>
          {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <a href="/login" className="text-indigo-700 font-medium">
          Log in
        </a>
      </p>
    </div>
  );
}
