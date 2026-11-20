import React from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import InteractiveButton from "@/components/InteractiveButton";
import ManifestTokenizer from "@/components/ManifestTokenizer";
import AuthWidget from "@/components/AuthWidget";

export const instant = false;

export const metadata = {
  title: "API Reference & Developer Hub | StreamFlow",
  description: "Developer integration guide, REST API specifications, and drop-in player embeds.",
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Atmospheric Subtle Light Bleed */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[600px] bg-indigo-300/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors uppercase">
                STREAMFLOW
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-white/10 text-xs font-sans font-bold tracking-wider">
              <Link
                href="/ingest"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Studio / Ingest
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Video Library
              </Link>
              <Link
                href="/studio"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Creator Studio
              </Link>
              <Link
                href="/analytics"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/developers"
                className="px-3 py-1.5 text-white border-b border-white tracking-wider uppercase font-medium transition-colors"
              >
                Developers
              </Link>
              <Link
                href="/status"
                className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
              >
                Status
              </Link>
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <InteractiveButton
              href="/ingest"
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              <span>Upload Video</span>
            </InteractiveButton>
            <AuthWidget />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 md:py-10 flex flex-col gap-10">
        {/* Page Header */}
        <div className="pb-6 border-b border-white/10">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white/90">
            API Reference
          </h1>
          <p className="text-sm font-sans font-medium text-slate-500 tracking-wider uppercase mt-2">
            Developer Integration Guide
          </p>
        </div>

        {/* Live Interactive HLS Manifest Tokenizer & API Inspector */}
        <div className="flex flex-col gap-8 mt-2">
          <ManifestTokenizer />
        </div>
      </main>
    </div>
  );
}
