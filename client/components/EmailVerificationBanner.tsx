"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuthStore, useToastStore } from "@/lib/store";

export default function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const toast = useToastStore((s) => s.show);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.isEmailVerified || sent) return null;

  async function resend() {
    setSending(true);
    try {
      await api.post("/auth/resend-verification");
      setSent(true);
      toast("Verification email sent — check your inbox", "success");
    } catch (err) {
      toast(apiErrorMessage(err), "error");
    } finally {
      setSending(false);
    }
  }

  const action = user.role === "supplier" ? "adding" : "selling";

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5 mb-4">
      <span className="flex items-center gap-2">
        <MailWarning size={16} className="shrink-0" />
        Your email address isn&apos;t verified yet. Verify it before {action} products.
      </span>
      <button
        onClick={resend}
        disabled={sending}
        className="shrink-0 font-medium underline hover:no-underline disabled:opacity-60"
      >
        {sending ? "Sending..." : "Resend email"}
      </button>
    </div>
  );
}
