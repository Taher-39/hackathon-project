"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /** Shows a single-line text input (e.g. a suspension reason) below the description. */
  withReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

// Replaces window.prompt()/confirm() for admin moderation actions with a
// styled dialog that matches the rest of the app (same overlay/card pattern
// as the supplier product form modal) instead of a native browser popup.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  withReason = false,
  reasonLabel = "Reason (optional)",
  reasonPlaceholder = "",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const danger = tone === "danger";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-2">
              <span className={`rounded-lg p-2 ${danger ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
                {danger ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
              </div>
              <button onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {withReason && (
              <div className="mt-3">
                <label htmlFor="confirm-dialog-reason" className="mb-1 block text-xs font-medium text-gray-600">
                  {reasonLabel}
                </label>
                <input
                  id="confirm-dialog-reason"
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={reasonPlaceholder}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => onConfirm(reason)}
                disabled={loading}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                  danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Working..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
