"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Reveal } from "@/components/motion/Reveal";

const schema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(3, "Required"),
  message: z.string().min(10, "Please add a bit more detail").max(5000, "Message is too long"),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const user = useAuthStore((s) => s.user);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  async function onSubmit(data: FormData) {
    setServerError("");
    setLoading(true);
    try {
      await api.post("/contact", data);
      setSent(true);
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
      <Reveal>
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-8">
          Have a question about sourcing, an order, or becoming a supplier? Send us a message and
          we&apos;ll reply by email.
        </p>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-50 text-indigo-600 rounded-lg p-2">
              <Mail size={18} />
            </span>
            support@textilehub.com
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-50 text-indigo-600 rounded-lg p-2">
              <Phone size={18} />
            </span>
            +880-1700-000000
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-indigo-50 text-indigo-600 rounded-lg p-2">
              <MapPin size={18} />
            </span>
            Dhaka, Bangladesh
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border rounded-lg bg-white p-6 text-center shadow-sm"
          >
            <CheckCircle2 size={36} className="mx-auto text-green-600 mb-3" />
            <h2 className="text-lg font-bold mb-1">Message sent!</h2>
            <p className="text-gray-600 text-sm">
              Thanks for reaching out — we&apos;ve emailed you a confirmation and will reply soon.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg bg-white p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input {...register("name")} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow" />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input {...register("email")} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow" placeholder="you@company.com" />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input {...register("subject")} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow" />
              {errors.subject && <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea {...register("message")} rows={5} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow" />
              {errors.message && <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>}
            </div>

            {serverError && <p className="text-red-600 text-sm">{serverError}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
      </Reveal>
    </div>
  );
}
