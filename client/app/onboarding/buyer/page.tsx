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
  businessType: z.string().min(2, "Required"),
  industry: z.string().min(2, "Required"),
  productCategories: z.string().min(1, "Enter at least one category"),
  fabricTypes: z.string().min(1, "Enter at least one fabric type"),
  typicalOrderQuantity: z.string().min(1, "Required"),
  budgetRange: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof schema>;

const STEPS: { label: string; fields: (keyof FormData)[] }[] = [
  { label: "Business", fields: ["businessType", "industry"] },
  { label: "Preferences", fields: ["productCategories", "fabricTypes"] },
  { label: "Scale", fields: ["typicalOrderQuantity", "budgetRange"] },
];

function BuyerOnboardingForm() {
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
      const res = await api.post("/users/onboarding/buyer", payload);
      setAuth(res.data.data.user, token as string);
      router.push("/dashboard/buyer");
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
      <p className="text-gray-600 mb-6">This helps suppliers understand what you&apos;re looking for.</p>

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
              <label className="block text-sm font-medium mb-1">Business type</label>
              <input {...register("businessType")} className="w-full border rounded-md px-3 py-2" placeholder="Retailer, Manufacturer, ..." />
              {errors.businessType && <p className="text-red-600 text-sm mt-1">{errors.businessType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <input {...register("industry")} className="w-full border rounded-md px-3 py-2" placeholder="Fashion, Home Textiles, ..." />
              {errors.industry && <p className="text-red-600 text-sm mt-1">{errors.industry.message}</p>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Product categories of interest</label>
              <input {...register("productCategories")} className="w-full border rounded-md px-3 py-2" placeholder="Cotton fabric, Denim, ... (comma separated)" />
              {errors.productCategories && <p className="text-red-600 text-sm mt-1">{errors.productCategories.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preferred fabric types</label>
              <input {...register("fabricTypes")} className="w-full border rounded-md px-3 py-2" placeholder="Cotton, Silk, Polyester, ... (comma separated)" />
              {errors.fabricTypes && <p className="text-red-600 text-sm mt-1">{errors.fabricTypes.message}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Typical order quantity</label>
              <input {...register("typicalOrderQuantity")} className="w-full border rounded-md px-3 py-2" placeholder="e.g. 500-1000 units" />
              {errors.typicalOrderQuantity && <p className="text-red-600 text-sm mt-1">{errors.typicalOrderQuantity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget range</label>
              <input {...register("budgetRange")} className="w-full border rounded-md px-3 py-2" placeholder="e.g. $1000-$5000" />
              {errors.budgetRange && <p className="text-red-600 text-sm mt-1">{errors.budgetRange.message}</p>}
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

export default function BuyerOnboardingPage() {
  return (
    <ProtectedRoute role="buyer">
      <BuyerOnboardingForm />
    </ProtectedRoute>
  );
}
