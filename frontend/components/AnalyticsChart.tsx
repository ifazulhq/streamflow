"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface ChartDataPoint {
  name: string;
  views: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center font-sans font-medium text-xs text-slate-500">
        Initializing Telemetry Engine...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-sans font-medium text-xs text-slate-500">
        No Telemetry Data Available
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#ffffff10"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="var(--font-sans, 'Helvetica Neue', Helvetica, Arial, sans-serif)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "var(--font-sans, 'Helvetica Neue', Helvetica, Arial, sans-serif)" }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            fontFamily="var(--font-sans, 'Helvetica Neue', Helvetica, Arial, sans-serif)"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "var(--font-sans, 'Helvetica Neue', Helvetica, Arial, sans-serif)" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#050505",
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: "4px",
              color: "#cbd5e1",
              fontSize: "11px",
              fontFamily: "var(--font-sans, 'Helvetica Neue', Helvetica, Arial, sans-serif)",
            }}
            cursor={{ fill: "#ffffff05" }}
          />
          <Bar
            dataKey="views"
            fill="#cbd5e1"
            maxBarSize={40}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
