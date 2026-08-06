"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(apiErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {status === "loading" && (
        <>
          <Loader2 size={40} className="mx-auto text-indigo-600 mb-4 animate-spin" />
          <p className="text-gray-600">Verifying your email...</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 size={40} className="mx-auto text-green-600 mb-4" />
          <h1 className="text-xl font-bold mb-2">Email verified!</h1>
          <p className="text-gray-600 text-sm mb-6">Your email has been confirmed.</p>
          <a href="/login" className="text-indigo-700 font-medium">
            Continue to login
          </a>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle size={40} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-xl font-bold mb-2">Verification failed</h1>
          <p className="text-gray-600 text-sm">{message}</p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16 text-center text-gray-500">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
