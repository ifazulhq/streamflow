import React from "react";
import StudioTableSkeleton from "@/components/StudioTableSkeleton";

export default function StudioLoading() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans">
      {/* Main Workspace Area matching studio/page.tsx */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-8">
        {/* Header KPI Ribbon Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-sm bg-white/5" />
            <div className="h-8 w-64 rounded-md bg-white/10" />
            <div className="h-3 w-80 max-w-full rounded-sm bg-white/5" />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-20 rounded-md bg-white/5" />
            <div className="h-7 w-20 rounded-md bg-white/5" />
            <div className="h-7 w-20 rounded-md bg-white/5" />
          </div>
        </div>

        {/* StudioTableSkeleton */}
        <section className="w-full">
          <StudioTableSkeleton />
        </section>
      </main>
    </div>
  );
}
