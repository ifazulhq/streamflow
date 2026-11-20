"use client";

import React, { useState, useEffect, MouseEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { Orbit } from "lucide-react";
import HeroPipelineExplorer from "@/components/HeroPipelineExplorer";
import AuthModal from "@/components/AuthModal";
import AuthWidget from "@/components/AuthWidget";

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [mouseX, mouseY]);

  function handleMouseMove({ clientX, clientY }: MouseEvent) {
    mouseX.set(clientX);
    mouseY.set(clientY);
  }

  const handleLaunch = () => {
    if (isTransitioning) return;
    if (status === "authenticated") {
      setIsTransitioning(true);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#050505] relative flex flex-col items-center pt-32 selection:bg-indigo-500/30 selection:text-white group"
    >
      {/* Top Header Rail */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="text-2xl md:text-3xl font-black tracking-tighter text-white hover:text-indigo-400 transition-colors uppercase">
                STREAMFLOW
              </span>
            </Link>

            {/* Central Navigation Links: Only rendered if pathname !== '/' */}
            {pathname !== "/" && (
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
                  className="px-3 py-1.5 text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
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
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <AuthWidget onOpenAuth={() => setShowAuthModal(true)} />
          </div>
        </div>
      </header>
      {/* Layer 1: The Ambient Aurora (Idle State) */}
      <motion.div
        animate={{ x: [-100, 100, -100], y: [-50, 50, -50], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ x: [100, -100, 100], y: [50, -50, 50], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0"
      />

      {/* Layer 2: The Flashlight Grid Reveal (Unified Global Dynamic Background) */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition duration-500 group-hover:opacity-100 opacity-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.4) 2px, transparent 2px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage: useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, black 15%, transparent 80%)`,
          maskImage: useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, black 15%, transparent 80%)`,
        }}
      />

      {/* Hero Typography */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center relative z-10 px-4"
      >
        <p className="text-[10px] tracking-wider uppercase text-slate-400 font-sans font-bold mb-6">
          Platform
        </p>

        <h1 className="text-6xl md:text-7xl font-light tracking-tight text-white/90">
          The Video OS
        </h1>

        <h2 className="text-6xl md:text-7xl font-light tracking-tight text-slate-500 mt-2">
          for real-world infrastructure
        </h2>
      </motion.div>

      {/* Isometric Centerpiece & UI Accents */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl h-[500px] mt-20 flex justify-center items-center px-4"
      >
        {/* Faint Corner Brackets: [ ] framing effect */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/10 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/10 pointer-events-none" />

        {/* Left UI (Layers) */}
        <div className="absolute left-4 md:left-8 flex flex-col gap-6 text-[10px] font-sans font-semibold tracking-wide uppercase text-slate-500 select-none">
          {["05", "04", "03", "02", "01"].map((num) => (
            <div key={num} className="flex items-center gap-3">
              <div
                className="w-4 h-4 border border-slate-600 flex-shrink-0"
                style={{ transform: "rotateX(60deg) rotateZ(-45deg)" }}
              />
              <span>{num}</span>
            </div>
          ))}
        </div>

        {/* Right UI (Tech Stack) */}
        <div className="absolute right-4 md:right-8 flex flex-col gap-8 text-[9px] font-sans font-bold tracking-wider text-slate-500 text-right select-none">
          {[
            "STORAGE GATEWAY",
            "TRANSCODING WORKERS",
            "HLS PACKAGER",
            "TELEMETRY ENGINE",
          ].map((label) => (
            <div key={label} className="flex items-center justify-end gap-3">
              <div className="w-12 h-px bg-white/10" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Center 3D Stack */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-48 h-48 flex items-center justify-center"
            style={{
              transform: "rotateX(60deg) rotateZ(-45deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Ambient Ground Glow */}
            <div
              className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"
              style={{ transform: "translateZ(-40px)" }}
            />

            {/* Layer 1 (Base Layer) */}
            <div
              className="w-48 h-48 border border-white/10 bg-white/[0.02] backdrop-blur-sm absolute rounded-2xl shadow-sm"
              style={{ transform: "translateZ(0px)" }}
            >
              <div className="absolute inset-2 border border-white/[0.03] rounded-xl pointer-events-none" />
            </div>

            {/* Layer 2 */}
            <div
              className="w-48 h-48 border border-white/10 bg-white/[0.02] backdrop-blur-sm absolute rounded-2xl shadow-sm"
              style={{ transform: "translateZ(36px)" }}
            >
              <div className="absolute inset-3 border border-white/[0.04] rounded-xl pointer-events-none" />
            </div>

            {/* Layer 3 */}
            <div
              className="w-48 h-48 border border-white/10 bg-white/[0.02] backdrop-blur-sm absolute rounded-2xl shadow-sm"
              style={{ transform: "translateZ(72px)" }}
            >
              <div className="absolute inset-4 border border-indigo-500/10 rounded-xl pointer-events-none" />
            </div>

            {/* Layer 4 (Top Layer with Animated Core) */}
            <div
              className="w-48 h-48 border border-indigo-500/30 bg-indigo-500/[0.03] backdrop-blur-sm absolute rounded-2xl overflow-hidden flex items-center justify-center shadow-[0_0_35px_rgba(99,102,241,0.15)]"
              style={{ transform: "translateZ(108px)" }}
            >
              <div className="absolute inset-0 border border-indigo-400/20 rounded-2xl pointer-events-none" />
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full flex items-center justify-center relative"
              >
                <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full scale-150" />
                <Orbit
                  className="w-16 h-16 text-indigo-400 relative z-10"
                  strokeWidth={1}
                  style={{ filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.6))" }}
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* The Smooth Page Transition Button */}
      <button
        id="launch-studio-btn"
        onClick={handleLaunch}
        disabled={isTransitioning}
        className="mt-12 mb-12 z-20 cursor-pointer disabled:opacity-50 group relative inline-flex items-center justify-center px-8 py-4 font-sans font-bold uppercase tracking-[0.2em] text-xl md:text-2xl text-slate-400 transition-all duration-300 hover:text-white hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        Launch Studio -&gt;
      </button>

      {/* System Architecture Topology & Pipeline Explorer */}
      <div className="w-full relative z-20">
        <HeroPipelineExplorer />
      </div>

      {/* Full-Screen Black Overlay Transition (bottom to top) */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ height: "0vh" }}
            animate={{ height: "100vh" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => {
              router.push("/studio");
            }}
            className="fixed bottom-0 left-0 right-0 w-full bg-[#050505] z-50 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
