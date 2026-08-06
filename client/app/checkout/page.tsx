"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useCartStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(5, "Required"),
  city: z.string().min(2, "Required"),
  postalCode: z.string().min(2, "Required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function CheckoutContent() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const { user } = useAuthStore();
  const toast = useToastStore((s) => s.show);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const {
    register,
    handleSubmit,
    reset,
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

  // ProtectedRoute only mounts this component once the persisted auth store
  // has rehydrated, but guard with an effect too in case the saved address
  // arrives a tick later (e.g. store hydration race) so it still autofills.
  useEffect(() => {
    if (user?.savedAddress) {
      reset({
        fullName: user.savedAddress.fullName || "",
        phone: user.savedAddress.phone || "",
        address: user.savedAddress.address || "",
        city: user.savedAddress.city || "",
        postalCode: user.savedAddress.postalCode || "",
      });
    }
  }, [user?.savedAddress, reset]);

  async function onSubmit(data: FormData) {
    setServerError("");
    setLoading(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size })),
        shippingInfo: data,
      });
      setPlaced(res.data.data.order._id);
      clear();
      toast("Order placed successfully!", "success");
    } catch (err) {
      const message = apiErrorMessage(err);
      setServerError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (placed) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-2">Order placed!</h1>
        <p className="text-gray-600 mb-6">Order #{placed.slice(-6).toUpperCase()} has been sent to the supplier(s).</p>
        <button
          onClick={() => router.push("/dashboard/buyer")}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
        >
          View my orders
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-500">
        Your cart is empty. <a href="/" className="text-indigo-700 font-medium">Browse products</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Shipping information</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input {...register("fullName")} className="w-full border rounded-md px-3 py-2" />
            {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input {...register("phone")} className="w-full border rounded-md px-3 py-2" />
            {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input {...register("address")} className="w-full border rounded-md px-3 py-2" />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input {...register("city")} className="w-full border rounded-md px-3 py-2" />
              {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postal code</label>
              <input {...register("postalCode")} className="w-full border rounded-md px-3 py-2" />
              {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea {...register("notes")} className="w-full border rounded-md px-3 py-2" rows={2} />
          </div>

          {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Placing order..." : "Place Order"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Order summary</h2>
        <div className="border rounded-lg bg-white divide-y">
          {items.map((item) => (
            <div key={`${item.productId}-${item.size || ""}`} className="flex justify-between p-3 text-sm">
              <span>
                {item.name}
                {item.size ? ` (${item.size})` : ""} × {item.quantity}
              </span>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between p-3 font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute role="buyer">
      <CheckoutContent />
    </ProtectedRoute>
  );
}
