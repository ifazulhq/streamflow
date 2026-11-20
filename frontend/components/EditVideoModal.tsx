"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface EditVideoData {
  id: string;
  title?: string;
  originalName?: string;
  [key: string]: any;
}

export interface EditVideoModalProps {
  isOpen?: boolean;
  video: EditVideoData | null;
  onClose: () => void;
  onUpdated?: (updatedVideo: { id: string; title: string }) => void;
}

export default function EditVideoModal({
  isOpen,
  video,
  onClose,
  onUpdated,
}: EditVideoModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showModal = isOpen !== undefined ? isOpen && !!video : !!video;

  useEffect(() => {
    if (video) {
      setNewTitle(video.title || video.originalName || "");
    }
  }, [video]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handleSave = async () => {
    if (!video || !newTitle.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update video metadata");
      }

      toast.success("Video title updated successfully");

      if (onUpdated) {
        onUpdated({ id: video.id, title: newTitle.trim() });
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {showModal && video && (
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

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 text-white/80 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-sans font-light tracking-tight text-white/95">
                  Edit Video Metadata
                </h3>
                <p className="text-xs font-sans font-medium text-slate-400 truncate max-w-sm mt-0.5">
                  Original: {video.originalName || "Untitled Video"}
                </p>
                <p className="text-[10px] font-sans font-medium text-slate-500 truncate mt-0.5">
                  ID: {video.id}
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-2">
              <label className="text-xs font-sans font-bold tracking-wider uppercase text-slate-300">
                Video Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSaving) {
                    handleSave();
                  }
                }}
                placeholder="Enter video title..."
                className="w-full bg-white/5 border border-white/10 rounded-md p-3 text-white font-sans focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <p className="text-[11px] font-sans font-medium text-slate-500">
                This title will be displayed across the library, player chrome, and embed headers.
              </p>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-md border border-white/10 bg-transparent text-slate-400 hover:text-white font-sans text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !newTitle.trim()}
                className="bg-white text-black font-sans font-bold px-4 py-2 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
