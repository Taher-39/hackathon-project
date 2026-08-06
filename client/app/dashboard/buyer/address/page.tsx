"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { Reveal } from "@/components/motion/Reveal";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(5, "Required"),
  city: z.string().min(2, "Required"),
  postalCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow";

function AddressContent() {
  const { user, token, setAuth } = useAuthStore();
  const toast = useToastStore((s) => s.show);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.savedAddress?.fullName || "",
      phone: user?.savedAddress?.phone || "",
      address: user?.savedAddress?.address || "",
      city: user?.savedAddress?.city || "",
      postalCode: user?.savedAddress?.postalCode || "",
    },
  });

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const res = await api.put("/users/address", data);
      setAuth(res.data.data.user, token as string);
      toast("Address saved", "success");
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
            <MapPin size={18} />
          </span>
          Saved Address
        </h1>
        <p className="text-gray-500 text-sm mb-6">Used to prefill your shipping details at checkout.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input {...register("fullName")} className={inputClass} />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input {...register("phone")} className={inputClass} />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input {...register("address")} className={inputClass} />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input {...register("city")} className={inputClass} />
              {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal code</label>
              <input {...register("postalCode")} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save address"}
          </button>
        </form>
      </div>
    </Reveal>
  );
}

export default function BuyerAddressPage() {
  return (
    <ProtectedRoute role="buyer">
      <DashboardLayout>
        <AddressContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
