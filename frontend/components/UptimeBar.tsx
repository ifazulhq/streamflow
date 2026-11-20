"use client";

import React from "react";

interface UptimeBarProps {
  isLiveOperational?: boolean;
}

export default function UptimeBar({ isLiveOperational = true }: UptimeBarProps) {
  const days = Array.from({ length: 90 });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-[2px] sm:gap-1 w-full">
        {days.map((_, i) => {
          const isDown = i === 89 && !isLiveOperational;
          return (
            <div
              key={i}
              className={`h-6 flex-1 rounded-sm transition-colors cursor-crosshair ${
                isDown
                  ? "bg-red-500 hover:bg-red-400"
                  : "bg-emerald-500 hover:bg-emerald-400"
              }`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[11px] font-sans font-medium text-slate-500 uppercase tracking-widest mt-2">
        <span>90 days ago</span>
        <span>99.99% Uptime</span>
        <span>Today</span>
      </div>
    </div>
  );
}
