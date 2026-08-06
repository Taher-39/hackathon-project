import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full"
      title="Verified Supplier"
    >
      <BadgeCheck size={size} className="text-blue-600" /> Verified
    </span>
  );
}
