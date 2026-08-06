"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function StarDisplay({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            className={n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-gray-500">({count})</span>}
    </div>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            className={n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}
