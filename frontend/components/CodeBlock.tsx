"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="relative border border-white/10 bg-black/50 rounded-md p-4 overflow-x-auto mt-4 group">
      {/* Top Bar / Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {language && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 hidden sm:inline px-1.5 py-0.5 rounded border border-white/5 bg-white/[0.02]">
            {language}
          </span>
        )}
        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md p-1.5 transition-all text-[10px] font-mono flex items-center gap-1 active:scale-95"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px] hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Snippet Pre */}
      <pre className="text-[11px] font-mono text-slate-300 pr-16 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
