"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Video, AlertCircle, Eye, Download } from "lucide-react";
import { VideoRecord } from "@/components/StudioTable";

interface StudioHeaderProps {
  totalCount: number;
  readyCount: number;
  processingCount: number;
  failedCount: number;
  totalViews?: number;
  videos?: VideoRecord[];
}

export default function StudioHeader({
  totalCount,
  readyCount,
  processingCount,
  failedCount,
  totalViews = 0,
  videos = [],
}: StudioHeaderProps) {
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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10"
    >
      <div className="space-y-1">
        <motion.p
          variants={itemVariants}
          className="text-[10px] tracking-wider uppercase text-slate-500 font-sans font-bold mb-2"
        >
          Creator Management
        </motion.p>

        <motion.h1
          variants={itemVariants}
          className="text-3xl md:text-4xl font-sans font-light tracking-tight text-white/90"
        >
          Video Catalog & Assets
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-sm font-sans font-medium text-slate-500 tracking-wider uppercase"
        >
          Inspect metadata, monitor ABR transcoding, purge S3 objects
        </motion.p>
      </div>

      {/* KPI Ribbon */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Total Badge */}
        <div className="px-3 py-1.5 rounded-md border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <Video className="w-3 h-3 text-slate-400" />
          <span>Total: {totalCount}</span>
        </div>

        {/* Total Views Badge */}
        <div className="px-3 py-1.5 rounded-md border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>Views: {totalViews.toLocaleString()}</span>
        </div>

        {/* Ready Badge */}
        <div className="px-3 py-1.5 rounded-md border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
          <span>Ready: {readyCount}</span>
        </div>

        {/* Processing Badge */}
        {processingCount > 0 && (
          <div className="px-3 py-1.5 rounded-md border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
            <span>Processing: {processingCount}</span>
          </div>
        )}

        {/* Failed Badge */}
        {failedCount > 0 && (
          <div className="px-3 py-1.5 rounded-md border border-white/10 bg-transparent text-[9px] font-sans font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
            <span>Failed: {failedCount}</span>
          </div>
        )}

        {/* Export CSV Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors rounded text-[10px] font-sans font-semibold text-slate-300 uppercase tracking-widest cursor-pointer"
        >
          <Download size={12} /> Export CSV
        </button>
      </motion.div>
    </motion.div>
  );
}
