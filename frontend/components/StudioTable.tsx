"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import DeleteVideoButton from "@/components/DeleteVideoButton";
import InteractiveButton from "@/components/InteractiveButton";
import EmptyState from "@/components/EmptyState";
import CopyableId from "@/components/CopyableId";
import {
  Film,
  Play,
  Upload,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  Settings2,
  Eye,
  Edit,
  Code,
  Download,
  Search,
} from "lucide-react";
import EditVideoModal from "@/components/EditVideoModal";
import AssetInspector from "@/components/AssetInspector";

export interface VideoRecord {
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
  views?: number;
  createdAt: string;
  updatedAt: string;
}

interface StudioTableProps {
  initialVideos: VideoRecord[];
}

export default function StudioTable({ initialVideos }: StudioTableProps) {
  const [videos, setVideos] = useState<VideoRecord[]>(initialVideos);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' or 'READY'
  const [editingVideo, setEditingVideo] = useState<VideoRecord | null>(null);
  const [inspectingVideo, setInspectingVideo] = useState<VideoRecord | null>(null);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  const handleExportCSV = () => {
    let csvContent = "ID,Title,Views,Status,Created At\n";
    videos.forEach((v) => {
      const safeTitle = (v.title || "").replace(/"/g, '""'); // Escape quotes for CSV
      const date = new Date(v.createdAt).toISOString();
      csvContent += `"${v.id}","${safeTitle}","${v.views || 0}","${v.status}","${date}"\n`;
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "streamflow_video_metrics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVideoUpdated = ({ id, title }: { id: string; title: string }) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title } : v))
    );
  };

  const handleRowPurged = (deletedId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== deletedId));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Animation variants for staggered table rows using spring physics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 16, filter: "blur(2px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 350,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      x: -40,
      scale: 0.96,
      filter: "blur(4px)",
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  if (videos.length === 0) {
    return (
      <EmptyState
        actionHref="/"
        actionLabel="Go to Ingest"
        description="Your creator studio is empty. Upload a new video to start managing your assets."
        title="No Videos Ingested"
      />
    );
  }

  const filteredVideos = videos.filter((video) => {
    const title = video.title || video.originalName || "";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ? true : video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        {/* The Search Bar */}
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a]/50 border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-white font-sans focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-600"
          />
        </div>

        {/* The Status Toggles */}
        <div className="flex bg-white/[0.02] border border-white/10 rounded-md overflow-hidden text-[11px] font-sans font-semibold tracking-widest uppercase">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-2 transition-colors ${statusFilter === "ALL" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("READY")}
            className={`px-4 py-2 transition-colors ${statusFilter === "READY" ? "bg-white/10 text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}
          >
            Ready Only
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full rounded-md bg-white/[0.02] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Table Header Bar with Stats Pills and Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-3.5 border-b border-white/10 bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-sans font-bold text-white tracking-wider uppercase">Catalog Records</span>
          <span className="text-[10px] font-sans font-medium text-slate-500">({videos.length} items)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-2.5 py-1 rounded border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-slate-500">TOTAL:</span>
            <span>{videos.length}</span>
          </div>
          <div className="px-2.5 py-1 rounded border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-slate-500">VIEWS:</span>
            <span>{videos.reduce((acc, v) => acc + (v.views || 0), 0).toLocaleString()}</span>
          </div>
          <div className="px-2.5 py-1 rounded border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span className="text-slate-500">READY:</span>
            <span>{videos.filter((v) => v.status === "READY").length}</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors rounded text-[10px] font-sans font-semibold text-slate-300 uppercase tracking-widest cursor-pointer"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.01] text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider select-none">
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  <span>Title & Source File</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Video ID</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span>Status</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Renditions</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Views</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Created At</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold text-right">
                <div className="flex items-center justify-end gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body with Staggered Motion and Exit Transitions */}
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-white/5 text-xs text-slate-300"
          >
            {filteredVideos.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0 border-none">
                  <div className="p-8 text-center text-slate-500 font-sans text-sm">
                    No videos match your search criteria.
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredVideos.map((video) => {
                const isReady = video.status === "READY";
                const isProcessing =
                  video.status === "PROCESSING" || video.status === "UPLOADING";
                const isFailed = video.status === "FAILED";

                return (
                  <motion.tr
                    key={video.id}
                    layout
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Column 1: Title & File */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div className="w-9 h-9 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 shrink-0 group-hover:border-white/20 transition-all relative overflow-hidden">
                          {video.posterUrl ? (
                            <Image
                              src={video.posterUrl}
                              alt={video.title || "thumbnail"}
                              fill
                              className="object-cover bg-white/5"
                              sizes="40px"
                            />
                          ) : (
                            <Film className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-sans font-medium text-slate-200 block truncate group-hover:text-white transition-colors">
                            {video.title || video.originalName || "Untitled Video"}
                          </span>
                          <span className="text-[10px] font-sans font-medium text-slate-500 block truncate mt-0.5">
                            {video.originalName || "video-source.mp4"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Video ID */}
                    <td className="py-4 px-6 font-sans font-medium text-[11px] text-slate-400">
                      <CopyableId id={video.id} />
                    </td>

                    {/* Column 3: Status Badge */}
                    <td className="py-4 px-6">
                      {isReady && (
                        <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent text-slate-300 text-[9px] font-sans font-semibold inline-flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                          <span>READY</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent text-slate-300 text-[9px] font-sans font-semibold inline-flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                          <span>{video.status} ({video.progress}%)</span>
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent text-slate-300 text-[9px] font-sans font-semibold inline-flex items-center gap-1.5 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>

                    {/* Column 4: Renditions */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(video.resolutions && video.resolutions.length > 0
                          ? video.resolutions
                          : ["1080p", "720p", "480p", "360p"]
                        ).map((res) => (
                          <span
                            key={res}
                            className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold text-[9px] uppercase tracking-wide px-2 py-1 rounded-sm"
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Column 5: Total Views */}
                    <td className="py-4 px-6 font-sans font-medium text-xs text-slate-300 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/10 bg-transparent font-sans font-semibold text-[10px] tracking-wide text-slate-300">
                        <Eye className="w-3 h-3 text-slate-400" />
                        <span>{(video.views || 0).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Column 6: Created At */}
                    <td className="py-4 px-6 font-sans font-medium text-[10px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Interactive Watch Button */}
                        {isReady ? (
                          <InteractiveButton
                            href={`/watch/${video.id}`}
                            variant="watch"
                            size="sm"
                            title="Watch in Cinema Player"
                            icon={<Play className="w-3 h-3 fill-current" />}
                          >
                            <span>Watch</span>
                          </InteractiveButton>
                        ) : (
                          <button
                            disabled
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-500 text-[10px] font-sans font-semibold uppercase tracking-wide cursor-not-allowed"
                          >
                            <Play className="w-3 h-3" />
                            <span>Transcoding</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingVideo(video)}
                          className="p-2 text-slate-500 hover:text-white transition-colors"
                          title="Edit Video Title"
                        >
                          <Edit size={16} />
                        </button>

                        {/* Inspect Asset Button */}
                        <button
                          type="button"
                          onClick={() => setInspectingVideo(video)}
                          className="p-2 text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer"
                          title="Inspect Asset"
                        >
                          <Code size={16} />
                        </button>

                        {/* Enhanced Delete Action Component */}
                        <DeleteVideoButton
                          videoId={video.id}
                          videoTitle={video.title || video.originalName}
                          onDeleted={handleRowPurged}
                        />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          )}
        </motion.tbody>
      </table>
    </div>

    {/* Edit Video Modal */}
    <EditVideoModal
      video={editingVideo}
      onClose={() => setEditingVideo(null)}
      onUpdated={handleVideoUpdated}
    />

    {/* Asset Inspector Slide-Out Drawer */}
    <AssetInspector
      video={inspectingVideo}
      onClose={() => setInspectingVideo(null)}
    />
  </div>
  </div>
);
}
