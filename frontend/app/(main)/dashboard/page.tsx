"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveButton from "@/components/InteractiveButton";
import ShareButton from "@/components/ShareButton";
import EmptyState from "@/components/EmptyState";
import VideoCardSkeleton from "@/components/VideoCardSkeleton";
import VideoCard from "@/components/VideoCard";
import AuthWidget from "@/components/AuthWidget";
import {
  Film,
  Play,
  RotateCw,
  Sparkles,
  Server,
  Upload,
  Clock,
  AlertCircle,
  ChevronRight,
  Activity,
  Tv,
} from "lucide-react";

interface VideoRecord {
  id: string;
  uploadId: string;
  title?: string;
  originalName?: string;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  progress: number;
  masterPlaylist?: string;
  resolutions: string[];
  posterUrl?: string;
  storyboardUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/videos`);
      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }
      const data: VideoRecord[] = await res.json();
      setVideos(data);
    } catch (err: unknown) {
      console.error("Failed to load ready videos:", err);
      const message =
        err instanceof Error
          ? err.message
          : `Unable to connect to API server at ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}`;
      setError(message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Motion reveal variants using strict spring physics standards
  const headerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const headerItemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 350,
        damping: 25,
      },
    },
  };

  const catalogContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 350,
        damping: 25,
      },
    },
  };

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
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
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

          {/* Right Header Actions with Interactive Button */}
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
        {/* Page Title & Stats Ribbon with Staggered Motion Reveals */}
        <motion.div
          variants={headerContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10"
        >
          <div className="space-y-1">
            <p className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-bold mb-2">
              Catalog & Playback
            </p>

            <motion.h1
              variants={headerItemVariants}
              className="text-3xl md:text-4xl font-light tracking-tight text-white/90"
            >
              Ready Video Catalog
            </motion.h1>

            <motion.p
              variants={headerItemVariants}
              className="text-sm font-sans font-medium text-slate-500 tracking-wider uppercase"
            >
              Select stream to launch cinema playback
            </motion.p>
          </div>

          <motion.div
            variants={headerItemVariants}
            className="flex items-center gap-3"
          >
            {/* Interactive Refresh Button */}
            <InteractiveButton
              onClick={fetchVideos}
              variant="secondary"
              size="sm"
              disabled={isRefreshing}
              icon={
                <RotateCw
                  className={`w-3.5 h-3.5 text-slate-400 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
              }
            >
              <span>Refresh</span>
            </InteractiveButton>

            {/* Ready Count Badge */}
            <div className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold tracking-wide uppercase text-[9px] px-3 py-1.5 rounded-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              <span>
                {videos.length} Ready Stream{videos.length === 1 ? "" : "s"}
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Video Gallery Grid with Staggered Card Entrance */}
        <section className="w-full">
          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              <VideoCardSkeleton />
              <VideoCardSkeleton />
              <VideoCardSkeleton />
              <VideoCardSkeleton />
            </div>
          ) : error ? (
            /* Error Display */
            <div className="p-8 rounded-md bg-white/[0.02] border border-white/10 text-center max-w-lg mx-auto space-y-4 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-md bg-white/5 text-rose-400 flex items-center justify-center mx-auto border border-white/10">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-light uppercase tracking-wider text-white/90">Unable to Fetch Videos</h3>
                <p className="text-xs text-slate-500 mt-1 font-sans font-medium">{error}</p>
              </div>
              <InteractiveButton
                onClick={fetchVideos}
                variant="danger"
                size="md"
              >
                Retry Connection
              </InteractiveButton>
            </div>
          ) : videos.length === 0 ? (
            /* Empty State */
            <EmptyState
              actionHref="/ingest"
              actionLabel="Ingest First Video"
              description="Upload and transcode a video to see it appear in your catalog."
              title="No Ready Streams Found"
            />
          ) : (
            /* Staggered Video Catalog Cards */
            <motion.div
              variants={catalogContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  cardVariants={cardVariants}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* Technical Architecture Info Section */}
        <section className="pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <Tv className="w-4 h-4 text-slate-400" />
              <span>Dedicated Cinema Page</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Every video opens in a dedicated <code className="text-slate-300">/watch/:id</code> route with dynamic OpenGraph meta tags, theater mode, and hotkey controls.
            </p>
          </div>

          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <Activity className="w-4 h-4 text-slate-400" />
              <span>Stats for Nerds HUD</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Low-level HLS telemetry reads active rendition, Mbps bitrate, bandwidth estimate, dropped frames, and live buffer lengths in real time.
            </p>
          </div>

          <div className="p-5 rounded-md bg-white/[0.02] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-sans font-bold tracking-wider uppercase">
              <Server className="w-4 h-4 text-slate-400" />
              <span>Stateless Object Storage</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
              Chunks served directly from MinIO S3 object storage via public <code className="text-slate-300">hls-streams</code> bucket with zero Express API bottleneck.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
