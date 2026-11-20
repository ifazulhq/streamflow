import React from "react";
import Link from "next/link";
import StudioTable, { VideoRecord } from "@/components/StudioTable";
import StudioHeader from "@/components/StudioHeader";
import InteractiveButton from "@/components/InteractiveButton";
import AuthWidget from "@/components/AuthWidget";
import {
  Upload,
  HardDrive,
  Database,
  RefreshCw,
} from "lucide-react";

export const instant = false;

async function getAllVideos(): Promise<VideoRecord[]> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/videos`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to load videos for Creator Studio:", err);
    return [];
  }
}

export const metadata = {
  title: "Creator Studio — Video Management | StreamFlow",
  description: "Manage uploaded videos, monitor transcoding status, and purge MinIO S3 assets.",
};

export default async function StudioPage() {
  const videos = await getAllVideos();

  const totalCount = videos.length;
  const readyCount = videos.filter((v) => v.status === "READY").length;
  const processingCount = videos.filter(
    (v) => v.status === "PROCESSING" || v.status === "UPLOADING"
  ).length;
  const failedCount = videos.filter((v) => v.status === "FAILED").length;
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Atmospheric Subtle Light Bleed */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Top Header Rail */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors uppercase">
                STREAMFLOW
              </span>
            </Link>

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
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
              >
                Creator Management
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
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Status
              </Link>
            </nav>
          </div>

          {/* Right Header Actions with Interactive Buttons */}
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

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-8">
        {/* Page Title & KPI Ribbon with Staggered Motion Reveals */}
        <StudioHeader
          videos={videos}
          totalCount={totalCount}
          readyCount={readyCount}
          processingCount={processingCount}
          failedCount={failedCount}
          totalViews={totalViews}
        />

        {/* Responsive Data Table with Staggered Rows & Purge Transitions */}
        <section className="w-full">
          <StudioTable initialVideos={videos} />
        </section>

        {/* Technical Architecture Info Section */}
        <section className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <Database className="w-4 h-4 text-slate-400" />
              <span>Prisma Schema 8 Sync</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Video entity states in PostgreSQL track upload and transcode milestones with temporal creation timestamps.
            </p>
          </div>

          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>S3 Asset Purge Cascade</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Deleting a record executes <code className="text-slate-300">DeleteObjectsCommand</code> to purge raw uploads and segmented chunks from MinIO.
            </p>
          </div>

          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Next.js Server Revalidation</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              The delete action triggers <code className="text-slate-300">router.refresh()</code>, immediately updating the server payload without a hard browser reload.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
