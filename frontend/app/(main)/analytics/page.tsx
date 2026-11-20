import React from "react";
import Link from "next/link";
import { Upload, Activity, Layers, BarChart2 } from "lucide-react";
import AnalyticsChart, { ChartDataPoint } from "@/components/AnalyticsChart";
import InteractiveButton from "@/components/InteractiveButton";
import AuthWidget from "@/components/AuthWidget";
export const instant = false;

interface VideoRecord {
  id: string;
  uploadId: string;
  title?: string;
  originalName?: string;
  status: string;
  progress: number;
  resolutions: string[];
  views?: number;
  createdAt: string;
  updatedAt: string;
}

async function getVideos(): Promise<VideoRecord[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/videos`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch videos: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to load videos for Telemetry Engine:", err);
    return [];
  }
}

export const metadata = {
  title: "Telemetry Engine — System Analytics | StreamFlow",
  description: "Global playback telemetry, views aggregation, and adaptive streaming analytics.",
};

export default async function AnalyticsPage() {
  const videos = await getVideos();

  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const readyStreams = videos.filter((v) => v.status === "READY").length;
  const totalAssets = videos.length;

  // Map top 5 videos by views for the chart
  const topVideos = [...videos]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const chartData: ChartDataPoint[] = topVideos.map((v) => {
    const rawName = v.title || v.originalName || "Stream";
    const name = rawName.length > 20 ? `${rawName.slice(0, 18)}…` : rawName;
    return {
      name,
      views: v.views || 0,
    };
  });

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Atmospheric Subtle Light Bleed */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors uppercase">
                STREAMFLOW
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-white/10 text-xs font-sans font-bold tracking-wider">
              <Link
                href="/ingest"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Studio / Ingest
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Video Library
              </Link>
              <Link
                href="/studio"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Creator Studio
              </Link>
              <Link
                href="/analytics"
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/developers"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Developers
              </Link>
              <Link
                href="/status"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Status
              </Link>
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <InteractiveButton
              href="/ingest"
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              <span>Upload Video</span>
            </InteractiveButton>
            <AuthWidget />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-10">
        {/* Page Header */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white/90">
            Telemetry Engine
          </h1>
          <p className="text-sm font-sans font-medium text-slate-500 tracking-wider uppercase mt-2">
            Global System Analytics
          </p>
        </div>

        {/* KPI Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* KPI 1: Total Views */}
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 flex flex-col gap-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500">
                Total Playback Views
              </span>
              <Activity className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-4xl font-light text-white/90 mt-1">
              {totalViews.toLocaleString()}
            </div>
            <span className="text-[9px] font-sans font-medium text-slate-500 mt-1">
              Aggregated Stream Telemetry
            </span>
          </div>

          {/* KPI 2: Ready Streams */}
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 flex flex-col gap-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500">
                Ready ABR Streams
              </span>
              <Layers className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-4xl font-light text-white/90 mt-1">
              {readyStreams.toLocaleString()}
            </div>
            <span className="text-[9px] font-sans font-medium text-slate-500 mt-1">
              Multi-Bitrate HLS Packages
            </span>
          </div>

          {/* KPI 3: Total Media Assets */}
          <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 flex flex-col gap-2 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500">
                Ingested Assets
              </span>
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-4xl font-light text-white/90 mt-1">
              {totalAssets.toLocaleString()}
            </div>
            <span className="text-[9px] font-sans font-medium text-slate-500 mt-1">
              MinIO Storage Objects
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 mt-8 h-[400px] flex flex-col rounded-md">
          <div className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-500 mb-6 flex items-center justify-between">
            <span>Top Performing Video Streams (Total Views)</span>
            <span className="text-[9px] text-slate-600">Sample Limit: Top 5</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <AnalyticsChart data={chartData} />
          </div>
        </div>
      </main>
    </div>
  );
}
