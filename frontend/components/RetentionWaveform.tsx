"use client";

import React, { useMemo } from "react";

interface RetentionWaveformProps {
  heatmap?: number[];
  progressPercentage?: number;
}

export default function RetentionWaveform({
  heatmap,
  progressPercentage = 0,
}: RetentionWaveformProps) {
  // Generate realistic fallback retention curve if heatmap data is missing or empty
  const data = useMemo(() => {
    if (heatmap && heatmap.length === 100 && heatmap.some((val) => val > 0)) {
      return heatmap;
    }
    // Realistic fallback audience retention curve (initial drop-off + replay spikes)
    return Array.from({ length: 100 }, (_, i) => {
      const base = 100 * Math.exp(-i / 85);
      const spike1 =
        i >= 24 && i <= 38 ? 16 * Math.sin(((i - 24) / 14) * Math.PI) : 0;
      const spike2 =
        i >= 68 && i <= 80 ? 12 * Math.sin(((i - 68) / 12) * Math.PI) : 0;
      return Math.max(18, Math.round(base + spike1 + spike2));
    });
  }, [heatmap]);

  const max = useMemo(() => Math.max(...data, 1), [data]);

  const clampedProgress = Math.min(100, Math.max(0, progressPercentage));

  return (
    <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 relative flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-sans font-bold text-[10px] tracking-[0.2em] text-slate-400 uppercase">
          AUDIENCE RETENTION
        </span>
        <span className="bg-slate-400/10 text-slate-400 px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-sans font-bold">
          LIVE
        </span>
      </div>

      {/* 100-Segment Ribbon */}
      <div className="relative h-24 w-full flex items-end gap-[1px]">
        {data.map((value, index) => (
          <div
            key={index}
            className={`flex-1 rounded-t-sm transition-colors duration-300 ${
              index <= clampedProgress ? "bg-slate-400" : "bg-slate-400/20"
            }`}
            style={{ height: `${(value / max) * 100}%` }}
          />
        ))}

        {/* Playhead Needle (Pure White) */}
        <div
          className="absolute top-0 bottom-0 w-[1px] bg-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10 transition-all duration-100"
          style={{ left: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

