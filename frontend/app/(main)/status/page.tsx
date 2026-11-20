import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Upload } from "lucide-react";
import InteractiveButton from "@/components/InteractiveButton";
import AuthWidget from "@/components/AuthWidget";
import UptimeBar from "@/components/UptimeBar";
import { connection } from "next/server";
import { getSystemHealth } from "@/lib/health";

export const instant = false;

export const metadata: Metadata = {
  title: "System Status — Infrastructure & Health | StreamFlow",
  description: "Real-time infrastructure health and uptime monitoring for StreamFlow video streaming platform.",
};

export default async function StatusPage() {
  await connection();
  const health = await getSystemHealth();
  const isAllOperational = health.database === "operational" && health.gateway === "operational";

  const isDbOperational = health.database === "operational";
  const isGatewayOperational = health.gateway === "operational";
  const isMinioOperational = health.minio !== "down";
  const isWorkerOperational = health.workers !== "down";

  const services = [
    {
      name: "Next.js Edge Gateway",
      description: "Application router, SSR, and chromeless embed delivery",
      isLiveOperational: isGatewayOperational,
      statusText: isGatewayOperational ? "Operational" : "Degraded",
    },
    {
      name: "MinIO S3 Object Storage",
      description: "Stateless video chunks & master playlist origin",
      isLiveOperational: isMinioOperational,
      statusText: isMinioOperational ? "Operational" : "Degraded",
    },
    {
      name: "BullMQ / Redis Workers",
      description: "Distributed multi-rendition FFmpeg pipeline",
      isLiveOperational: isWorkerOperational,
      statusText: isWorkerOperational ? "Operational" : "Degraded",
    },
    {
      name: "PostgreSQL Database",
      description: "Prisma schema & video telemetry registry",
      isLiveOperational: isDbOperational,
      statusText: isDbOperational ? "Operational" : "Down",
    },
  ];

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
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
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
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-8">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-3xl md:text-4xl font-sans font-black tracking-tight text-white">System Status</h1>
          <p className="text-sm font-sans font-medium text-slate-400 tracking-wide mt-2">Real-time infrastructure health and uptime monitoring</p>
        </div>

        {/* Dynamic Operational Banner */}
        <div className="mt-8 border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md p-6 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="relative flex h-4 w-4">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isAllOperational ? "bg-emerald-400 opacity-75" : "bg-amber-400 opacity-75"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${
                  isAllOperational ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span
              className={`font-sans font-bold text-xl tracking-wide ${
                isAllOperational ? "text-emerald-500" : "text-amber-400"
              }`}
            >
              {isAllOperational ? "All Systems Operational" : "Degraded System Performance"}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-sans font-medium text-slate-400">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAllOperational ? "bg-emerald-500/50" : "bg-amber-500/50"
              }`}
            />
            <span>Live Health Ping ({isAllOperational ? "100% Operational" : "Degraded Performance"})</span>
          </div>
        </div>

        {/* Dynamic Infrastructure Grid */}
        <div className="flex flex-col gap-4 mt-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md p-6 rounded-xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-sans font-bold text-white tracking-wide">
                    {service.name}
                  </h3>
                  <span className="hidden sm:inline-block text-xs font-sans font-medium text-slate-500">
                    • {service.description}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-sans font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                      service.isLiveOperational ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        service.isLiveOperational ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    {service.statusText}
                  </span>
                </div>
              </div>
              <UptimeBar isLiveOperational={service.isLiveOperational} />
            </div>
          ))}
        </div>

        {/* Past Incident History & Reliability Metrics */}
        <div className="mt-6 pt-8 border-t border-white/10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-wide">
                Past Incident History
              </h2>
              <p className="text-xs font-sans font-medium text-slate-400 mt-1">
                Continuous uptime records and zero-downtime cluster logs
              </p>
            </div>
            <span className="border border-white/10 bg-white/5 text-slate-400 font-sans font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md">
              90-Day Window
            </span>
          </div>

          <div className="border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-sans font-medium text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>No incidents or service degradations recorded across cluster nodes in the past 90 days.</span>
            </div>
            <span className="text-xs font-sans font-semibold text-emerald-400 uppercase tracking-widest shrink-0">
              99.99% Guaranteed SLA
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
