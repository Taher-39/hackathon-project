"use client";

import { useState } from "react";

interface WeekPoint {
  weekStart: string;
  orders: number;
  revenue: number;
}

export default function OrdersChart({ data }: { data: WeekPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const width = 640;
  const height = 200;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 12;
  const plotWidth = width - paddingLeft - 8;
  const plotHeight = height - paddingBottom - paddingTop;

  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const barSlot = plotWidth / data.length;
  const barWidth = Math.max(6, barSlot * 0.55);

  const yTicks = [0, Math.ceil(maxOrders / 2), maxOrders];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Orders per week">
        {yTicks.map((t) => {
          const y = paddingTop + plotHeight - (t / maxOrders) * plotHeight;
          return (
            <g key={t}>
              <line
                x1={paddingLeft}
                x2={width}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-gray-200"
                strokeWidth={1}
              />
              <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="fill-gray-400 text-[9px]">
                {t}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = maxOrders > 0 ? (d.orders / maxOrders) * plotHeight : 0;
          const x = paddingLeft + i * barSlot + (barSlot - barWidth) / 2;
          const y = paddingTop + plotHeight - barHeight;
          const isHovered = hovered === i;

          return (
            <g key={d.weekStart}>
              <rect
                x={x}
                y={barHeight > 0 ? y : y - 2}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                className={isHovered ? "fill-indigo-700" : "fill-indigo-500"}
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
              {(i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)) && (
                <text
                  x={x + barWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-gray-400 text-[9px]"
                >
                  {new Date(d.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 pointer-events-none -translate-x-1/2"
          style={{
            left: `${((paddingLeft + hovered * barSlot + barSlot / 2) / width) * 100}%`,
            top: 0,
          }}
        >
          <p className="font-medium">{data[hovered].orders} orders</p>
          <p className="text-gray-300">${data[hovered].revenue.toFixed(2)} revenue</p>
        </div>
      )}
    </div>
  );
}
