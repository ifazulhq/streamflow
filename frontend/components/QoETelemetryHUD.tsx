"use client";

import React, { useState, useEffect } from "react";

interface QoETelemetryHUDProps {
  onClose?: () => void;
}

export default function QoETelemetryHUD({ onClose }: QoETelemetryHUDProps) {
  // 30-second buffer health data array (values between 15 and 30)
  const [bufferData, setBufferData] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => Math.floor(Math.random() * 12) + 18)
  );

  const [activeProfile, setActiveProfile] = useState<"AUTO" | "4G" | "3G">(
    "AUTO"
  );

  // Interval pushing simulated live buffer measurements
  useEffect(() => {
    const interval = setInterval(() => {
      const newPoint = Math.floor(Math.random() * 16) + 15; // 15 to 30
      setBufferData((prev) => [...prev.slice(1), newPoint]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-4 left-4 z-50 w-80 bg-[#0a0a0a]/90 backdrop-blur-md border border-slate-400/20 rounded-lg p-4 flex flex-col gap-4 shadow-2xl pointer-events-auto transition-opacity select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-sans font-bold text-[9px] tracking-[0.2em] text-slate-400 uppercase">
            QoE TELEMETRY EDGE
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs p-1"
            aria-label="Close Diagnostics"
          >
            ✕
          </button>
        )}
      </div>

      {/* Real-Time Metrics Grid (2x2) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-sans text-slate-400 tracking-wider uppercase">
            DECODED FPS
          </span>
          <span className="text-sm font-mono text-white">60</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-sans text-slate-400 tracking-wider uppercase">
            DROPPED FRAMES
          </span>
          <span className="text-sm font-mono text-white">0</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-sans text-slate-400 tracking-wider uppercase">
            LATENCY
          </span>
          <span className="text-sm font-mono text-white">45ms</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-sans text-slate-400 tracking-wider uppercase">
            THROUGHPUT
          </span>
          <span className="text-sm font-mono text-white">4.5 Mbps</span>
        </div>
      </div>

      {/* Buffer Oscilloscope (Sparkline) */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase">
          BUFFER HEALTH (30s window)
        </span>
        <div className="h-12 w-full flex items-end gap-[2px] border-b border-slate-400/20 pb-1">
          {bufferData.map((value, idx) => (
            <div
              key={idx}
              className={`w-full transition-all duration-300 ${
                idx === bufferData.length - 1 ? "bg-white" : "bg-slate-400/40"
              }`}
              style={{ height: `${(value / 30) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Network ABR Throttler Simulation */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-sans font-bold text-slate-400 tracking-wider uppercase">
          NETWORK SIMULATION
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveProfile("AUTO")}
            className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeProfile === "AUTO"
                ? "bg-slate-400/20 border-slate-400 text-white"
                : "bg-transparent border-slate-400/20 text-slate-400 hover:text-white"
            }`}
          >
            AUTO
          </button>

          <button
            onClick={() => setActiveProfile("4G")}
            className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeProfile === "4G"
                ? "bg-slate-400/20 border-slate-400 text-white"
                : "bg-transparent border-slate-400/20 text-slate-400 hover:text-white"
            }`}
          >
            4G - 1080p
          </button>

          <button
            onClick={() => setActiveProfile("3G")}
            className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-1 rounded border transition-colors cursor-pointer ${
              activeProfile === "3G"
                ? "bg-slate-400/20 border-slate-400 text-white"
                : "bg-transparent border-slate-400/20 text-slate-400 hover:text-white"
            }`}
          >
            3G - 480p
          </button>
        </div>
      </div>
    </div>
  );
}

