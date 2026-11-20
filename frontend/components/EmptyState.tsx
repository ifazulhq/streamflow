"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { VideoOff, Sparkles, ArrowRight } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="relative w-full max-w-xl mx-auto rounded-md border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-sm p-10 sm:p-14 text-center flex flex-col items-center justify-center gap-6 group hover:bg-white/[0.04] hover:border-white/20 transition-all"
    >
      {/* Large Subtle Icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-slate-200 transition-colors">
          {icon || <VideoOff className="w-8 h-8 text-slate-500" />}
        </div>
      </div>

      {/* Content Stack */}
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-xl font-sans font-light tracking-tight text-white/90">{title}</h3>
        <p className="text-xs font-sans font-medium text-slate-500 leading-relaxed">{description}</p>
      </div>

      {/* Minimalist Action Button */}
      <div className="pt-2">
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase px-4 py-2 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all rounded-md"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
