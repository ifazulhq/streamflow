"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Hls from "hls.js";

export interface AssetInspectorVideo {
  id: string;
  uploadId?: string;
  title?: string;
  originalName?: string;
  status?: string;
  progress?: number;
  masterPlaylist?: string;
  resolutions?: string[];
  posterUrl?: string;
  storyboardUrl?: string;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AssetInspectorProps {
  video: AssetInspectorVideo | null;
  onClose: () => void;
}

export default function AssetInspector({ video, onClose }: AssetInspectorProps) {
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && video) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [video, onClose]);

  // Lock background scrolling while drawer is active
  useEffect(() => {
    if (video) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [video]);

  // Attach stream source to mini player
  useEffect(() => {
    if (!video || !videoRef.current) return;

    const streamUrl =
      video.masterPlaylist ||
      video.url ||
      (video.id
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/uploads/${video.id}/master.m3u8`
        : "");

    if (!streamUrl) return;

    if (Hls.isSupported() && streamUrl.includes(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      return () => {
        hls.destroy();
      };
    } else if (
      videoRef.current.canPlayType("application/vnd.apple.mpegurl") ||
      !streamUrl.includes(".m3u8")
    ) {
      videoRef.current.src = streamUrl;
    }
  }, [video]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-end"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-[#050505] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/10">
              <div>
                <h3 className="font-sans font-bold text-white text-base tracking-wide">
                  Asset Inspector
                </h3>
                <p className="text-[11px] font-sans font-medium text-slate-500 truncate max-w-[280px] mt-0.5">
                  {video.title || video.originalName || "Video Telemetry"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mini Player */}
            <video
              ref={videoRef}
              controls
              muted
              playsInline
              poster={video.posterUrl}
              className="w-full aspect-video bg-black border-y border-white/10 object-contain"
            />

            {/* The JSON Block */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="font-sans font-semibold text-[10px] uppercase text-slate-500 mb-2">
                RAW DATABASE RECORD
              </div>
              <pre className="font-mono text-[11px] text-emerald-400 bg-[#0a0a0a] p-4 rounded-md border border-white/5 overflow-x-auto">
                <code>{JSON.stringify(video, null, 2)}</code>
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
