"use client";

import { useState } from "react";

interface MonthPoint {
  label: string;
  spend: number;
}

export default function SpendChart({ data }: { data: MonthPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 640;
  const height = 180;
  const paddingLeft = 40;
  const paddingBottom = 22;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingBottom - paddingTop;

  const maxSpend = Math.max(1, ...data.map((d) => d.spend));
  const barSlot = plotWidth / data.length;
  const barWidth = Math.max(10, barSlot * 0.5);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Spend per month">
        {[0, maxSpend / 2, maxSpend].map((t) => {
          const y = paddingTop + plotHeight - (t / maxSpend) * plotHeight;
          return (
            <g key={t}>
              <line x1={paddingLeft} x2={width} y1={y} y2={y} stroke="currentColor" className="text-gray-200" strokeWidth={1} />
              <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="fill-gray-400 text-[9px]">
                ${Math.round(t)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = maxSpend > 0 ? (d.spend / maxSpend) * plotHeight : 0;
          const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2;
          const y = paddingTop + plotHeight - barHeight;
          const isHovered = hovered === i;

          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={x}
                y={barHeight > 0 ? y : y - 2}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                className={isHovered ? "fill-indigo-700" : "fill-indigo-400"}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              <rect
                x={paddingLeft + i * barSlot}
                y={paddingTop}
                width={barSlot}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" className="fill-gray-400 text-[9px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 pointer-events-none -translate-x-1/2"
          style={{ left: `${((paddingLeft + hovered * barSlot + barSlot / 2) / width) * 100}%`, top: 0 }}
        >
          <p className="font-medium">${data[hovered].spend.toFixed(2)}</p>
          <p className="text-gray-300">{data[hovered].label}</p>
        </div>
      )}
    </div>
  );
}
