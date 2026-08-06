import { Check } from "lucide-react";

export default function WizardProgress({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="flex items-center w-full mb-8">
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-[5rem]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`text-[11px] text-center leading-tight ${
                  active ? "text-indigo-700 font-medium" : done ? "text-green-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-green-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
