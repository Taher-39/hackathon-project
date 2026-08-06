"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = ["Pending", "Accepted", "Preparing", "Ready for Dispatch", "Completed"];

export default function OrderStatusStepper({ status }: { status: string }) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-center w-full my-3">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[4.5rem]">
              <motion.div
                initial={false}
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </motion.div>
              <span
                className={`text-[10px] text-center leading-tight ${
                  active ? "text-indigo-700 font-medium" : done ? "text-green-700" : "text-gray-400"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 flex-1 mx-1 bg-gray-200 overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-green-600"
                  initial={false}
                  animate={{ scaleX: i < currentIndex ? 1 : 0 }}
                  style={{ transformOrigin: "left" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
