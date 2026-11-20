import React from "react";
import Link from "next/link";
import VideoUploader from "@/components/VideoUploader";
import InteractiveButton from "@/components/InteractiveButton";
import AuthWidget from "@/components/AuthWidget";
import {
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  Server,
  Database,
  PlaySquare,
} from "lucide-react";

export default function IngestPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Atmospheric Subtle Light Bleed */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors uppercase">
                STREAMFLOW
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-white/10 text-xs font-sans font-bold tracking-wider">
              <Link
                href="/ingest"
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
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
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Status
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans font-medium">
            <InteractiveButton
              href="/dashboard"
              variant="primary"
              size="sm"
              icon={<PlaySquare className="w-3.5 h-3.5" />}
            >
              <span>Watch Streams</span>
            </InteractiveButton>
            <AuthWidget />
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-12">
        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <p className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-bold mb-2">
            Ingestion & Protocol
          </p>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white/90 leading-tight">
            High-Speed Resumable Video Ingestion
          </h1>
          <p className="text-sm font-sans font-medium text-slate-500 tracking-wider uppercase">
            Byte-offset chunking immune to network drops
          </p>
        </div>

        {/* Video Uploader Component */}
        <section className="w-full">
          <VideoUploader />
        </section>

        {/* Architectural Highlights Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
          {/* Card 1: Resumable Uploads */}
          <div className="p-6 rounded-md bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all backdrop-blur-sm group">
            <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center mb-4 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1 font-sans uppercase tracking-wider">
              Never Lose Progress
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              If your internet drops or your device goes to sleep, your massive video uploads will automatically pause. When you reconnect, they resume exactly where they left off.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-sans font-semibold tracking-wide uppercase text-slate-500">
              <span>PATCH /uploads/:id</span>
            </div>
          </div>

          {/* Card 2: Async BullMQ Transcoding */}
          <div className="p-6 rounded-md bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all backdrop-blur-sm group">
            <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center mb-4 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1 font-sans uppercase tracking-wider">
              Background Processing
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Once you drop a file, our cloud servers immediately take over. You can safely close the tab or move on to other work while we process heavy videos behind the scenes.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-sans font-semibold tracking-wide uppercase text-slate-500">
              <span>BullMQ • Redis 7</span>
            </div>
          </div>

          {/* Card 3: Multi-Bitrate HLS ABR */}
          <div className="p-6 rounded-md bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all backdrop-blur-sm group">
            <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center mb-4 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 mb-1 font-sans uppercase tracking-wider">
              Buffer-Free Playback
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Every video is converted into multiple qualities. Just like Netflix, the player instantly adjusts to your viewer's internet speed so they never see a loading screen.
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-[10px] font-sans font-semibold tracking-wide uppercase text-slate-500">
              <span>HLS • 1080p - 360p</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs font-sans font-medium text-slate-500 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>StreamFlow Enterprise Video</span>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Built for creators, businesses, and global scale.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
