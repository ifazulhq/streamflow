"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Play, Film, Clock, Share2 } from "lucide-react";
import InteractiveButton from "@/components/InteractiveButton";
import ShareModal from "@/components/ShareModal";

export interface VideoData {
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
  createdAt: string;
  updatedAt: string;
}

interface VideoCardProps {
  video: VideoData;
  cardVariants?: Variants;
}

export default function VideoCard({ video, cardVariants }: VideoCardProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        whileHover={{ y: -7, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="group relative flex flex-col rounded-md bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all overflow-hidden p-3 backdrop-blur-sm"
      >
        {/* Thumbnail Frame (16:9) */}
        <Link
          href={`/watch/${video.id}`}
          className="relative aspect-video w-full rounded-md overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center block"
        >
          {/* Poster Frame or Fallback Gradient */}
          {video.posterUrl ? (
            <Image
              src={video.posterUrl}
              alt={video.title || video.originalName || "Video thumbnail"}
              fill
              className="object-cover bg-white/5 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-white/[0.02] group-hover:scale-105 transition-transform duration-500" />
              <Film className="w-10 h-10 text-white/20 group-hover:text-white/30 transition-colors" />
            </>
          )}

          {/* Centered Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 text-white flex items-center justify-center backdrop-blur-sm group-hover:scale-105 group-hover:bg-white/20 transition-all">
              <Play className="w-4 h-4 fill-current ml-0.5 text-white/90" />
            </div>
          </div>

          {/* Status Badge (Top-Right) */}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 text-[9px] font-sans font-semibold tracking-wide flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span>READY</span>
          </div>

          {/* Stream Protocol Badge (Bottom-Right) */}
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-400 text-[9px] font-sans font-semibold tracking-wide uppercase border border-white/10">
            Cinema Watch
          </div>

          {/* Top-Left Rendition Counter */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-400 text-[9px] font-sans font-semibold tracking-wide uppercase border border-white/10">
            {(video.resolutions || []).length || 4} Renditions
          </div>
        </Link>

        {/* Metadata Stack */}
        <div className="pt-3 px-1 flex flex-col gap-2">
          {/* Title */}
          <Link href={`/watch/${video.id}`}>
            <h3
              className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors"
              title={video.title || video.originalName}
            >
              {video.title || video.originalName || "Untitled Video"}
            </h3>
          </Link>

          {/* Sub-row: Timestamp & Video ID */}
          <div className="flex items-center justify-between text-[10px] font-sans font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatDate(video.createdAt)}
            </span>
            <span className="text-slate-500">
              ID: {video.id.slice(0, 6)}
            </span>
          </div>

          {/* Available Renditions Pills & Interactive Watch Action */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(video.resolutions && video.resolutions.length > 0
                ? video.resolutions
                : ["1080p", "720p", "480p", "360p"]
              ).map((res) => (
                <span
                  key={res}
                  className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold tracking-wide uppercase text-[9px] px-2 py-1 rounded-sm"
                >
                  {res}
                </span>
              ))}
            </div>

            {/* Card Actions: Share & Watch */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Share & Embed Video"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <InteractiveButton
                href={`/watch/${video.id}`}
                variant="watch"
                size="sm"
                title="Watch Stream"
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                <span>Watch</span>
              </InteractiveButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Animated Share Modal breaking out of card overflow */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        video={video}
      />
    </>
  );
}
