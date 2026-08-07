"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Building2, UserRound, ShieldCheck, Lock } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";

const adminSchema = z.object({
  name: z.string().min(2, "Required"),
});

const buyerSchema = z.object({
  name: z.string().min(2, "Required"),
  businessType: z.string().min(2, "Required"),
  industry: z.string().min(2, "Required"),
  productCategories: z.string(),
  fabricTypes: z.string(),
  typicalOrderQuantity: z.string(),
  budgetRange: z.string(),
});

const supplierSchema = z.object({
  name: z.string().min(2, "Required"),
  businessName: z.string().min(2, "Required"),
  businessType: z.string(),
  contactInfo: z.string().min(5, "Required"),
  address: z.string().min(5, "Required"),
  operatingHours: z.string(),
  productCategories: z.string(),
  fabricTypes: z.string(),
  moq: z.string(),
});

type AdminForm = z.infer<typeof adminSchema>;
type BuyerForm = z.infer<typeof buyerSchema>;
type SupplierForm = z.infer<typeof supplierSchema>;
const inputClass = "w-full rounded-md border px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

function AdminProfileForm() {
  const { user, token, setAuth } = useAuthStore();
  const toast = useToastStore((state) => state.show);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: { name: user?.name || "" },
  });
  async function save(data: AdminForm) {
    setSaving(true);
    try {
      const res = await api.put("/users/profile", data);
      setAuth(res.data.data.user, token as string);
      toast("Profile updated", "success");
    } catch (error) { toast(apiErrorMessage(error), "error"); } finally { setSaving(false); }
  }
  return (
    <ProfileCard title="Admin Profile" icon={<ShieldCheck size={18} />}>
      {user?.isProtected && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
          <Lock size={13} /> This is the protected demo admin account — its role can&apos;t be changed by anyone.
        </div>
      )}
      <form onSubmit={handleSubmit(save)} className="space-y-4">
        <Field label="Your name" error={errors.name?.message}>
          <input {...register("name")} className={inputClass} />
        </Field>
        <Field label="Email">
          <input value={user?.email || ""} disabled className={`${inputClass} bg-gray-50 text-gray-500`} />
        </Field>
        <SaveButton saving={saving} />
      </form>
    </ProfileCard>
  );
}

function BuyerProfileForm() {
  const { user, token, setAuth } = useAuthStore();
  const toast = useToastStore((state) => state.show);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<BuyerForm>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      name: user?.name || "", businessType: user?.buyerProfile?.businessType || "", industry: user?.buyerProfile?.industry || "",
      productCategories: user?.buyerProfile?.productCategories?.join(", ") || "", fabricTypes: user?.buyerProfile?.fabricTypes?.join(", ") || "",
      typicalOrderQuantity: user?.buyerProfile?.typicalOrderQuantity || "", budgetRange: user?.buyerProfile?.budgetRange || "",
    },
  });
  async function save(data: BuyerForm) {
    setSaving(true);
    try {
      const res = await api.put("/users/profile", { ...data, buyerProfile: { ...data, productCategories: splitList(data.productCategories), fabricTypes: splitList(data.fabricTypes) } });
      setAuth(res.data.data.user, token as string); toast("Profile updated", "success");
    } catch (error) { toast(apiErrorMessage(error), "error"); } finally { setSaving(false); }
  }
  return <ProfileCard title="Buyer Profile" icon={<UserRound size={18} />}><form onSubmit={handleSubmit(save)} className="space-y-4"><Field label="Your name" error={errors.name?.message}><input {...register("name")} className={inputClass} /></Field><Field label="Business type" error={errors.businessType?.message}><input {...register("businessType")} className={inputClass} /></Field><Field label="Industry" error={errors.industry?.message}><input {...register("industry")} className={inputClass} /></Field><Field label="Product categories (comma separated)"><input {...register("productCategories")} className={inputClass} /></Field><Field label="Preferred fabric types (comma separated)"><input {...register("fabricTypes")} className={inputClass} /></Field><Field label="Typical order quantity"><input {...register("typicalOrderQuantity")} className={inputClass} /></Field><Field label="Budget range"><input {...register("budgetRange")} className={inputClass} /></Field><SaveButton saving={saving} /></form></ProfileCard>;
}

function SupplierProfileForm() {
  const { user, token, setAuth } = useAuthStore();
  const toast = useToastStore((state) => state.show);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: user?.name || "", businessName: user?.supplierProfile?.businessName || "", businessType: user?.supplierProfile?.businessType || "",
      contactInfo: user?.supplierProfile?.contactInfo || "", address: user?.supplierProfile?.address || "", operatingHours: user?.supplierProfile?.operatingHours || "",
      productCategories: user?.supplierProfile?.productCategories?.join(", ") || "", fabricTypes: user?.supplierProfile?.fabricTypes?.join(", ") || "", moq: user?.supplierProfile?.moq || "",
    },
  });
  async function save(data: SupplierForm) {
    setSaving(true);
    try {
      const res = await api.put("/users/profile", { name: data.name, supplierProfile: { ...data, productCategories: splitList(data.productCategories), fabricTypes: splitList(data.fabricTypes) } });
      setAuth(res.data.data.user, token as string); toast("Business profile updated", "success");
    } catch (error) { toast(apiErrorMessage(error), "error"); } finally { setSaving(false); }
  }
  return <ProfileCard title="Business Profile" icon={<Building2 size={18} />}><form onSubmit={handleSubmit(save)} className="space-y-4"><Field label="Your name" error={errors.name?.message}><input {...register("name")} className={inputClass} /></Field><Field label="Business name" error={errors.businessName?.message}><input {...register("businessName")} className={inputClass} /></Field><Field label="Business type"><input {...register("businessType")} className={inputClass} /></Field><Field label="Contact information" error={errors.contactInfo?.message}><input {...register("contactInfo")} className={inputClass} /></Field><Field label="Business address" error={errors.address?.message}><input {...register("address")} className={inputClass} /></Field><Field label="Operating hours"><input {...register("operatingHours")} className={inputClass} /></Field><Field label="Product categories (comma separated)"><input {...register("productCategories")} className={inputClass} /></Field><Field label="Fabric types (comma separated)"><input {...register("fabricTypes")} className={inputClass} /></Field><Field label="Minimum order quantity"><input {...register("moq")} className={inputClass} /></Field><SaveButton saving={saving} /></form></ProfileCard>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div><label className="mb-1 block text-sm font-medium">{label}</label>{children}{error && <p className="mt-1 text-sm text-red-600">{error}</p>}</div>; }
function SaveButton({ saving }: { saving: boolean }) { return <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>; }
function ProfileCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="mx-auto max-w-xl rounded-xl border bg-white p-6 shadow-sm"><h1 className="mb-1 flex items-center gap-2 text-xl font-bold"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">{icon}</span>{title}</h1><p className="mb-6 text-sm text-gray-500">Keep your marketplace information up to date.</p>{children}</div>; }

function ProfileContent() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === "supplier") return <SupplierProfileForm />;
  if (role === "admin") return <AdminProfileForm />;
  return <BuyerProfileForm />;
}
export default function ProfilePage() { return <ProtectedRoute><DashboardLayout><ProfileContent /></DashboardLayout></ProtectedRoute>; }
