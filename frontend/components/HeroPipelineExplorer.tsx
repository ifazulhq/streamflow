"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, Zap } from "lucide-react";

interface PipelineMetric {
  key: string;
  value: string;
}

interface PipelineNode {
  id: number;
  title: string;
  stageName: string;
  badge: string;
  description: string;
  metrics: PipelineMetric[];
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: 1,
    title: "TUS INGEST GATEWAY",
    stageName: "Resumable Ingest Gateway",
    badge: "EDGE INGESTION",
    description:
      "Chunked resumable upload protocol terminating directly into object storage. Handles high-latency connections, automatic pause/resume, and SHA-256 byte-offset checksum verification.",
    metrics: [
      { key: "PROTOCOL", value: "Tus v1.0.0 (RFC 7233)" },
      { key: "CHUNK SIZE", value: "5.0 MB Slices" },
      { key: "CHECKPOINTING", value: "Byte-Offset Resumable" },
      { key: "TARGET BUCKET", value: "s3://raw-videos" },
    ],
  },
  {
    id: 2,
    title: "BULLMQ DISTRIBUTED QUEUE",
    stageName: "Distributed Queue Broker",
    badge: "TASK BROKER",
    description:
      "High-throughput Redis-backed message broker dispatching transcode jobs. Manages concurrency pools, exponential backoff retries, and real-time progress events.",
    metrics: [
      { key: "BACKING STORE", value: "Redis 7.0 In-Memory" },
      { key: "QUEUE TOPIC", value: "video-transcoding-queue" },
      { key: "RETRY POLICY", value: "Exponential (3 Attempts)" },
      { key: "JOB LIFECYCLE", value: "FIFO Concurrency Safe" },
    ],
  },
  {
    id: 3,
    title: "FFMPEG TRANSCODING WORKERS",
    stageName: "Multi-Rendition Encoder",
    badge: "TRANSCODE WORKER",
    description:
      "Parallel transcoding pipeline generating multi-bitrate H.264 video and AAC audio renditions. Enforces uniform keyframe intervals (GOP) for seamless adaptive streaming.",
    metrics: [
      { key: "RENDITIONS", value: "1080p, 720p, 480p, 360p" },
      { key: "GOP SIZE", value: "48 Frames (Fixed Keyframe)" },
      { key: "CODEC PROFILE", value: "H.264 High / AAC-LC" },
      { key: "SEGMENT TARGET", value: "4.000s MPEG-TS Chunks" },
    ],
  },
  {
    id: 4,
    title: "MINIO HLS PACKAGER",
    stageName: "Stateless Storage Tier",
    badge: "STATELESS STORAGE",
    description:
      "High-performance S3-compatible storage cluster serving master playlists, multi-bitrate variants, and WebVTT scrub preview sprites with public read access.",
    metrics: [
      { key: "STORAGE ENGINE", value: "MinIO S3 Cluster" },
      { key: "MANIFEST TYPE", value: "Master & Variant .m3u8" },
      { key: "BUCKET POLICY", value: "PublicReadGetObject" },
      { key: "SERVE TARGET", value: "s3://hls-streams" },
    ],
  },
  {
    id: 5,
    title: "CINEMA TELEMETRY EDGE",
    stageName: "Adaptive Cinema Runtime",
    badge: "CLIENT RUNTIME",
    description:
      "Enterprise chromeless video player utilizing Hls.js Media Source Extensions (MSE) with dynamic buffer health regulation and sub-second quality switching.",
    metrics: [
      { key: "STREAM SPEC", value: "Apple HLS v3 (RFC 8216)" },
      { key: "ABR CONTROLLER", value: "Bandwidth & Buffer Dual-Mode" },
      { key: "BUFFER TARGET", value: "30.0s Ahead of Playhead" },
      { key: "PLAYBACK ENGINE", value: "Hls.js + HTML5 Video" },
    ],
  },
];

export default function HeroPipelineExplorer() {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const activeData = PIPELINE_NODES.find((node) => node.id === activeNode);

  return (
    <section className="w-full py-24 relative overflow-hidden bg-transparent">
      {/* Atmospheric Ambient Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[350px] bg-slate-500/5 blur-[160px] pointer-events-none rounded-full" />

      {/* Section Header */}
      <div className="relative z-10 text-center mb-8 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-sm mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400">
            Engineering Schematic
          </span>
        </div>

        <h2 className="font-sans font-black text-3xl md:text-4xl text-white tracking-tight">
          System Architecture
        </h2>
      </div>

      {/* Schematic Vertical List Container */}
      <div className="relative z-10 flex flex-col gap-12 items-start pl-4 md:pl-32 max-w-4xl mx-auto pt-12">
        {PIPELINE_NODES.map((node) => (
          <motion.div
            key={node.id}
            onMouseEnter={() => setActiveNode(node.id)}
            onClick={() => setActiveNode(node.id)}
            className="flex items-center group cursor-crosshair w-full relative"
          >
            {/* The Connector Line */}
            <div
              className={`h-[1px] w-12 md:w-32 mr-6 transition-all duration-300 ${
                activeNode === node.id
                  ? "bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.4)]"
                  : "bg-slate-700 group-hover:bg-slate-500"
              }`}
            />

            {/* The Typography */}
            <span
              className={`font-sans font-bold uppercase tracking-[0.25em] text-sm md:text-lg transition-colors duration-300 ${
                activeNode === node.id
                  ? "text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.6)]"
                  : "text-slate-500 group-hover:text-slate-300"
              }`}
            >
              {node.title}
            </span>
          </motion.div>
        ))}

        {/* Technical Detail HUD Panel */}
        <AnimatePresence mode="wait">
          {activeData && (
            <motion.div
              key={activeData.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6 w-full max-w-3xl p-6 md:p-8 rounded-xl bg-[#0a0a0a]/80 backdrop-blur-md border border-slate-400/30 shadow-[0_0_35px_rgba(148,163,184,0.08)] flex flex-col md:flex-row gap-8 relative select-none"
            >
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNode(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                aria-label="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Left Column: Stage Info */}
              <div className="md:w-1/2 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border border-white/20 bg-white/10 text-white text-[9px] font-sans font-bold tracking-wider uppercase">
                    <Zap className="w-3 h-3 text-white" />
                    <span>{activeData.badge}</span>
                  </div>

                  <h3 className="text-xl font-sans font-bold text-white tracking-tight">
                    {activeData.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                    {activeData.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-500 font-sans">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hardware-accelerated pipeline spec</span>
                </div>
              </div>

              {/* Right Column: Terminal Key-Value Metrics */}
              <div className="md:w-1/2 rounded-lg bg-black/40 border border-white/5 p-4 flex flex-col justify-center space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                    Engine Parameter
                  </span>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-500">
                    Configuration
                  </span>
                </div>

                {activeData.metrics.map((metric, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1 border-b border-white/[0.03] last:border-none"
                  >
                    <span className="font-sans text-xs text-slate-500 uppercase tracking-wide">
                      {metric.key}:
                    </span>
                    <span className="font-mono text-[11px] text-white tracking-tight">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
