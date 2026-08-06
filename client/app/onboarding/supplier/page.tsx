"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import WizardProgress from "@/components/WizardProgress";

const schema = z.object({
  businessName: z.string().min(2, "Required"),
  businessType: z.string().min(2, "Required"),
  contactInfo: z.string().min(5, "Required"),
  address: z.string().min(5, "Required"),
  operatingHours: z.string().min(1, "Required"),
  productCategories: z.string().min(1, "Enter at least one category"),
  fabricTypes: z.string().min(1, "Enter at least one fabric type"),
  moq: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

const STEPS: { label: string; fields: (keyof FormData)[] }[] = [
  { label: "Business", fields: ["businessName", "businessType", "contactInfo"] },
  { label: "Location", fields: ["address", "operatingHours"] },
  { label: "Catalog", fields: ["productCategories", "fabricTypes", "moq"] },
];

function SupplierOnboardingForm() {
  const router = useRouter();
  const { token, setAuth } = useAuthStore();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function goNext() {
    const valid = await trigger(STEPS[step].fields);
    if (valid) setStep((s) => s + 1);
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    setLoading(true);
    try {
      const payload = {
        ...data,
        productCategories: data.productCategories.split(",").map((s) => s.trim()).filter(Boolean),
        fabricTypes: data.fabricTypes.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.post("/users/onboarding/supplier", payload);
      setAuth(res.data.data.user, token as string);
      router.push("/dashboard/supplier");
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Tell us about your business</h1>
      <p className="text-gray-600 mb-6">This will appear on your supplier profile for buyers.</p>

      <WizardProgress step={step} labels={STEPS.map((s) => s.label)} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          isLastStep ? handleSubmit(onSubmit)(e) : goNext();
        }}
        className="space-y-4"
      >
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Business name</label>
              <input {...register("businessName")} className="w-full border rounded-md px-3 py-2" />
              {errors.businessName && <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business type</label>
              <input {...register("businessType")} className="w-full border rounded-md px-3 py-2" placeholder="Manufacturer, Wholesaler, ..." />
              {errors.businessType && <p className="text-red-600 text-sm mt-1">{errors.businessType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact info</label>
              <input {...register("contactInfo")} className="w-full border rounded-md px-3 py-2" placeholder="Phone / email" />
              {errors.contactInfo && <p className="text-red-600 text-sm mt-1">{errors.contactInfo.message}</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input {...register("address")} className="w-full border rounded-md px-3 py-2" />
              {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Operating hours</label>
              <input {...register("operatingHours")} className="w-full border rounded-md px-3 py-2" placeholder="Mon-Fri, 9am-6pm" />
              {errors.operatingHours && <p className="text-red-600 text-sm mt-1">{errors.operatingHours.message}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Product categories offered</label>
              <input {...register("productCategories")} className="w-full border rounded-md px-3 py-2" placeholder="Cotton fabric, Denim, ... (comma separated)" />
              {errors.productCategories && <p className="text-red-600 text-sm mt-1">{errors.productCategories.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fabric types offered</label>
              <input {...register("fabricTypes")} className="w-full border rounded-md px-3 py-2" placeholder="Cotton, Silk, Polyester, ... (comma separated)" />
              {errors.fabricTypes && <p className="text-red-600 text-sm mt-1">{errors.fabricTypes.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum order quantity (MOQ)</label>
              <input {...register("moq")} className="w-full border rounded-md px-3 py-2" placeholder="e.g. 100 units" />
              {errors.moq && <p className="text-red-600 text-sm mt-1">{errors.moq.message}</p>}
            </div>
          </>
        )}

        {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex-1 border py-2 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : isLastStep ? "Finish onboarding" : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SupplierOnboardingPage() {
  return (
    <ProtectedRoute role="supplier">
      <SupplierOnboardingForm />
    </ProtectedRoute>
  );
}
