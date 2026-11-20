"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Check,
  Code,
  Link as LinkIcon,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface ShareModalVideo {
  id: string;
  title?: string;
  originalName?: string;
  url?: string;
  [key: string]: any;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  video?: ShareModalVideo;
  videoId?: string;
  videoTitle?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  video,
  videoId,
  videoTitle,
}: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [origin, setOrigin] = useState(
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeVideo = video || {
    id: videoId || "",
    title: videoTitle,
    originalName: videoTitle,
  };
  const activeId = activeVideo.id || videoId || "";
  const activeTitle =
    activeVideo.title || activeVideo.originalName || videoTitle || "Untitled Video";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scrolling behind modal when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const embedUrl = `${origin}/embed/${activeId}`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const copyToClipboard = useCallback(
    async (text: string, type: "snippet" | "link") => {
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (err) {
        console.warn("navigator.clipboard.writeText failed, using fallback:", err);
      }

      if (!copied) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          copied = true;
        } catch (err) {
          console.error("Failed to copy text to clipboard:", err);
        }
      }

      toast.success(
        type === "snippet" ? "Embed code copied to clipboard!" : "Direct link copied to clipboard!"
      );

      if (type === "snippet") {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    },
    []
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#050505] border border-white/10 rounded-xl p-8 shadow-2xl flex flex-col gap-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header / Title & Video Filename */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 text-white/80 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-sans font-light tracking-tight text-white/95">
                  Share & Embed Video
                </h3>
                <p className="text-xs font-sans font-medium text-slate-400 truncate max-w-sm mt-0.5">
                  {activeTitle}
                </p>
                {activeId && (
                  <p className="text-[10px] font-sans font-medium text-slate-500 truncate mt-0.5">
                    ID: {activeId}
                  </p>
                )}
              </div>
            </div>

            {/* Embed Snippet Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-sans font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-slate-400" />
                  <span>IFrame Embed Code</span>
                </label>
                <span className="border border-white/10 bg-transparent text-slate-400 font-sans font-semibold tracking-wide uppercase text-[9px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50" />
                  <span>Chromeless (100vw × 100vh)</span>
                </span>
              </div>

              {/* Code Snippet Box */}
              <div className="relative group rounded-md bg-white/[0.02] border border-white/10 p-4 text-xs text-slate-300 overflow-hidden">
                <div className="overflow-x-auto pr-28 scrollbar-thin scrollbar-thumb-zinc-700">
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed font-mono">
                    {iframeSnippet}
                  </pre>
                </div>

                {/* Floating Copy Embed Button */}
                <button
                  onClick={() => copyToClipboard(iframeSnippet, "snippet")}
                  className={`absolute top-3 right-3 px-3 py-1.5 rounded-md text-[10px] font-sans font-semibold tracking-wide uppercase flex items-center gap-1.5 transition-all active:scale-95 border ${
                    copiedSnippet
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Embed</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] font-sans font-medium text-slate-500">
                Paste this HTML snippet into any blog, webpage, or CMS to embed the chromeless video player.
              </p>
            </div>

            {/* Direct Watch / Embed Link Section */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs font-sans font-bold tracking-wider uppercase text-slate-300 flex items-center gap-2">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Direct Embed URL</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedUrl}
                  className="flex-1 bg-white/[0.02] border border-white/10 rounded-md px-3 py-2 text-xs font-sans font-medium text-slate-300 focus:outline-none focus:border-white/20 select-all truncate"
                />

                <button
                  onClick={() => copyToClipboard(embedUrl, "link")}
                  className={`px-3 py-2 rounded-md text-[10px] font-sans font-semibold tracking-wide uppercase flex items-center gap-1.5 transition-all active:scale-95 border ${
                    copiedLink
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  title="Open Embed in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Specs Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-sans font-semibold tracking-wide uppercase text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Stateless HLS via MinIO
              </span>
              <span>Dimensions: 640 × 360 (16:9)</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
