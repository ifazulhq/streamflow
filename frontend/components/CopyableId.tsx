"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyableIdProps {
  id: string;
  truncateLength?: number;
}

export default function CopyableId({ id, truncateLength = 8 }: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(id);
        success = true;
      }
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, using fallback:", err);
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = id;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch (err) {
        console.error("Fallback clipboard copy failed:", err);
      }
    }

    setCopied(true);
    toast.success("Video ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      title={id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-sans font-semibold tracking-wide uppercase text-[10px] transition-all cursor-pointer select-none"
    >
      <span className="truncate max-w-[100px]">
        {id.slice(0, truncateLength)}...
      </span>

      {copied ? (
        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-white shrink-0 transition-opacity duration-200" />
      )}
    </motion.button>
  );
}
