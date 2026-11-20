import React from "react";
import VideoCardSkeleton from "@/components/VideoCardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans">
      {/* Main Content Area matching dashboard/page.tsx */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-10">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded-sm bg-white/5" />
            <div className="h-8 w-64 rounded-md bg-white/10" />
            <div className="h-3 w-80 max-w-full rounded-sm bg-white/5" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-7 w-20 rounded-md bg-white/5" />
            <div className="h-7 w-28 rounded-md bg-white/5" />
          </div>
        </div>

        {/* Video Gallery Grid populated with array of 3 VideoCardSkeleton components */}
        <section className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </div>
        </section>
      </main>
    </div>
  );
}
