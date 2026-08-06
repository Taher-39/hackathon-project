"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/lib/store";

const STYLES: Record<string, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: "bg-green-600" },
  error: { icon: XCircle, classes: "bg-red-600" },
  info: { icon: Info, classes: "bg-gray-800" },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-80">
      {toasts.map((t) => {
        const { icon: Icon, classes } = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            className={`${classes} text-white rounded-lg shadow-lg px-3 py-2.5 flex items-start gap-2 text-sm animate-[fadeIn_0.15s_ease-out]`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="shrink-0">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
