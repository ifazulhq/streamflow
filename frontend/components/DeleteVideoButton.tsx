"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Trash2, Loader2, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteVideoButtonProps {
  videoId: string;
  videoTitle?: string;
  onDeleted?: (videoId: string) => void;
}

export default function DeleteVideoButton({
  videoId,
  videoTitle,
  onDeleted,
}: DeleteVideoButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Magnetic hover motion values
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 350, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || isDeleting || isSuccess) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.2);
    mouseY.set((e.clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDeleting(true);
    setError(null);

    const deletePromise = (async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Failed to delete (status ${res.status})`);
      }

      return res;
    })();

    toast.promise(deletePromise, {
      loading: "Purging assets from MinIO...",
      success: "Asset permanently deleted",
      error: "Failed to delete asset",
    });

    try {
      await deletePromise;

      // Trigger success micro-animation
      setIsDeleting(false);
      setIsSuccess(true);

      // Allow the user to enjoy the fluid checkmark morph animation before purging from UI
      setTimeout(() => {
        if (onDeleted) {
          onDeleted(videoId);
        }
        // Revalidate server data
        router.refresh();
      }, 750);
    } catch (err) {
      console.error("Failed to delete video:", err);
      setIsDeleting(false);
      setError(err instanceof Error ? err.message : "Deletion failed");
      setTimeout(() => setError(null), 3500);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <AnimatePresence mode="wait">
        {/* State 1: Success Micro-Animation (Fluid Checkmark Morph) */}
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-emerald-400 text-xs font-sans font-semibold tracking-wide uppercase"
          >
            {/* Animated SVG Checkmark Drawing */}
            <svg
              className="w-4 h-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.circle
                cx="12"
                cy="12"
                r="9"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                stroke="currentColor"
                strokeOpacity="0.4"
              />
              <motion.path
                d="M8 12.5l2.5 2.5 5.5-5.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
              />
            </svg>
            <span className="font-semibold text-emerald-200">Purged!</span>
          </motion.div>
        ) : showConfirm ? (
          /* State 2: Confirmation / Active Deletion Popover */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.9, y: 2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 2 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 p-1 rounded-md bg-[#050505]/95 border border-white/10 text-rose-200 text-xs shadow-2xl backdrop-blur-md"
          >
            <span className="text-[10px] font-sans font-medium px-1.5 text-rose-300">
              {isDeleting ? "Purging MinIO & DB..." : "Purge Assets?"}
            </span>

            {/* Confirm Purge Button */}
            <motion.button
              whileHover={isDeleting ? undefined : { scale: 1.05 }}
              whileTap={isDeleting ? undefined : { scale: 0.95 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-2.5 py-1 rounded-md text-white font-sans font-semibold text-[10px] tracking-wide uppercase transition-all inline-flex items-center gap-1 ${
                isDeleting
                  ? "bg-rose-700/60 cursor-not-allowed"
                  : "bg-rose-600/80 hover:bg-rose-600 border border-rose-500/40"
              }`}
              title="Permanently delete from MinIO and PostgreSQL"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 animate-spin text-white" />
              ) : (
                <Trash2 className="w-3 h-3 text-white" />
              )}
              <span>{isDeleting ? "Purging..." : "Confirm"}</span>
            </motion.button>

            {/* Cancel Button */}
            {!isDeleting && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {error && (
              <span className="text-[10px] text-rose-400 font-sans font-medium pl-1">
                {error}
              </span>
            )}
          </motion.div>
        ) : (
          /* State 3: Resting Magnetic Delete Trigger */
          <motion.button
            key="idle"
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowConfirm(true);
            }}
            className="group relative p-2 rounded-md bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-colors shadow-sm"
            title={`Delete ${videoTitle || "video"} and purge MinIO S3 assets`}
          >
            <Trash2 className="w-4 h-4 transition-transform group-hover:scale-105" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
