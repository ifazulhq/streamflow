import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const instant = false;

import CinemaPlayer from "@/components/CinemaPlayer";
import InteractiveButton from "@/components/InteractiveButton";
import ShareButton from "@/components/ShareButton";
import AuthWidget from "@/components/AuthWidget";
import {
  Film,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Server,
  Activity,
  HardDrive,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Eye,
} from "lucide-react";

interface VideoData {
  id: string;
  uploadId: string;
  title?: string;
  originalName?: string;
  status: string;
  progress: number;
  masterPlaylist?: string;
  resolutions: string[];
  posterUrl?: string;
  storyboardUrl?: string;
  views?: number;
  engagement?: {
    heatmap?: number[];
  };
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVideo(id: string): Promise<VideoData | null> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/videos/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch video: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching video data:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    return {
      title: "Video Not Found | StreamFlow Cinema",
      description: "The requested adaptive stream could not be found.",
    };
  }

  const title = video.title || video.originalName || "Untitled Video";
  const description = `Stream ${title} with adaptive bitrate streaming (up to 1080p). Master playlist powered by stateless MinIO S3 object storage.`;

  return {
    title: `${title} — Cinema Watch | StreamFlow`,
    description,
    openGraph: {
      title: `${title} | StreamFlow ABR Cinema`,
      description,
      type: "video.other",
      url: `${process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:3000"}/watch/${id}`,
      siteName: "StreamFlow Enterprise Video Platform",
      videos: video.masterPlaylist
        ? [
            {
              url: video.masterPlaylist,
              type: "application/vnd.apple.mpegurl",
            },
          ]
        : [],
    },
    twitter: {
      card: "player",
      title: `${title} | StreamFlow Cinema`,
      description,
    },
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full rounded-md bg-white/[0.02] border border-white/10 p-8 text-center space-y-6 backdrop-blur-sm relative z-10">
          <div className="w-12 h-12 rounded-md bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-tight text-white/90">Stream Not Found</h1>
            <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
              Unable to locate video stream with ID <span className="text-slate-300">{id}</span>.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const videoTitle = video.title || video.originalName || "Cinema Adaptive Stream";
  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      {/* Background Atmospheric Light Bleed */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header Rail */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand & Breadcrumb */}
          <div className="flex items-center gap-4">
            <InteractiveButton
              href="/dashboard"
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              <span>Catalog</span>
            </InteractiveButton>

            <span className="text-white/20 font-sans font-bold text-xs">/</span>

            <div className="flex items-center gap-2 truncate max-w-sm sm:max-w-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shrink-0" />
              <span className="text-xs font-sans font-medium text-slate-300 truncate">
                {videoTitle}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <ShareButton
              videoId={video.id}
              videoTitle={videoTitle}
              variant="primary"
              size="sm"
            />

            <div className="hidden sm:inline-block">
              <InteractiveButton
                href="/studio"
                variant="secondary"
                size="sm"
              >
                <span>Creator Studio</span>
              </InteractiveButton>
            </div>

            <div className="hidden sm:inline-block">
              <InteractiveButton
                href="/ingest"
                variant="secondary"
                size="sm"
              >
                <span>+ Ingest</span>
              </InteractiveButton>
            </div>

            <div className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold text-[9px] uppercase tracking-wide px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50" />
              <span>Cinema Mode</span>
            </div>

            <AuthWidget />
          </div>
        </div>
      </header>

      {/* Main Theater Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 relative z-10">
        {/* Cinema Video Player Viewport with Live Retention Telemetry */}
        <section className="w-full">
          <CinemaPlayer
            src={video.masterPlaylist || ""}
            title={videoTitle}
            originalName={video.originalName}
            videoId={video.id}
            resolutions={video.resolutions}
            posterUrl={video.posterUrl}
            storyboardUrl={video.storyboardUrl}
            autoPlay={true}
            heatmap={video.engagement?.heatmap}
          />
        </section>

        {/* Video Telemetry & Meta Data Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Metadata & Renditions (2 cols) */}
          <div className="lg:col-span-2 rounded-md bg-white/[0.02] border border-white/10 p-6 sm:p-8 space-y-6 backdrop-blur-sm">
            {/* Title & Status */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white/90">
                  {videoTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-sans font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Transcoded on {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {(video.views || 0).toLocaleString()} views
                  </span>
                  <span>•</span>
                  <span>File: {video.originalName || "stream.mp4"}</span>
                </div>
              </div>

              {/* Actions & Status Pill */}
              <div className="flex items-center gap-2.5 self-start">
                <ShareButton
                  videoId={video.id}
                  videoTitle={videoTitle}
                  variant="secondary"
                  size="sm"
                />
                <div className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold text-[9px] uppercase tracking-wide px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                  <span>{video.status}</span>
                </div>
              </div>
            </div>

            {/* Rendition Matrix */}
            <div className="space-y-3">
              <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Adaptive Bitrate Renditions Generated
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: "1080p", res: "1920x1080", bitrate: "4.5 Mbps" },
                  { name: "720p", res: "1280x720", bitrate: "2.5 Mbps" },
                  { name: "480p", res: "854x480", bitrate: "1.5 Mbps" },
                  { name: "360p", res: "640x360", bitrate: "800 kbps" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-md bg-white/[0.02] border border-white/10 space-y-1 hover:bg-white/[0.04] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold text-xs text-white/90">
                        {item.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold uppercase tracking-wide text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                        Ready
                      </span>
                    </div>
                    <div className="text-[10px] font-sans font-medium text-slate-500">
                      {item.res} • {item.bitrate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Playlist URL Field */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Public Object Storage Manifest (.m3u8):</span>
                <span className="text-slate-400 text-[9px] uppercase tracking-wide font-sans font-semibold border border-white/10 px-1.5 py-0.5 rounded-md">MinIO S3</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={video.masterPlaylist || ""}
                  className="flex-1 bg-white/[0.02] border border-white/10 rounded-md px-4 py-2 text-xs font-sans font-medium text-slate-300 focus:outline-none focus:border-white/20 select-all truncate"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Engine Architecture Card (1 col) */}
          <div className="rounded-md bg-white/[0.02] border border-white/10 p-6 sm:p-8 space-y-6 backdrop-blur-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/80">
                <Zap className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-white/90">
                  Streaming Engine
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                This stream is served 100% statelessly directly from MinIO object storage. The Next.js client decodes 4-second MPEG-TS segments with dynamic buffer health adaptation.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-3 rounded-md bg-white/[0.02] border border-white/10 text-xs font-sans font-medium">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Protocol:</span>
                  <span className="text-slate-300 text-[11px]">Apple HLS v3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-white/[0.02] border border-white/10 text-xs font-sans font-medium">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Segment Size:</span>
                  <span className="text-slate-300 text-[11px]">4.0 Seconds</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-white/[0.02] border border-white/10 text-xs font-sans font-medium">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider">Storage Target:</span>
                  <span className="text-slate-300 text-[11px]">MinIO `hls-streams`</span>
                </div>
              </div>
            </div>

            {/* Hotkeys Mini-Cheatsheet */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/10 space-y-2 text-xs font-sans font-medium">
              <span className="text-[9px] uppercase text-slate-500 font-sans font-bold tracking-wider block">
                Keyboard Controls
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-sans font-medium">
                <div><kbd className="text-white/80 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold mr-1.5">[Space]</kbd>Play/Pause</div>
                <div><kbd className="text-white/80 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold mr-1.5">[F]</kbd>Fullscreen</div>
                <div><kbd className="text-white/80 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold mr-1.5">[T]</kbd>Theater</div>
                <div><kbd className="text-white/80 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold mr-1.5">[S]</kbd>Stats HUD</div>
                <div><kbd className="text-white/80 border border-white/10 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold mr-1.5">[D]</kbd>QoE HUD</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
