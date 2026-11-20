"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthWidget from "@/components/AuthWidget";

interface NavbarProps {
  onOpenAuth?: () => void;
  rightAction?: React.ReactNode;
}

export function Navbar({ onOpenAuth, rightAction }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
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
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/ingest"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Studio / Ingest
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/dashboard"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Video Library
              </Link>
              <Link
                href="/studio"
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/studio"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Creator Studio
              </Link>
              <Link
                href="/analytics"
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/analytics"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/developers"
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/developers"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Developers
              </Link>
              <Link
                href="/status"
                className={`px-3 py-1.5 tracking-wider uppercase transition-colors ${
                  pathname === "/status"
                    ? "text-white border-b border-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Status
              </Link>
            </nav>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {rightAction}
          <AuthWidget onOpenAuth={onOpenAuth} />
        </div>
      </div>
    </header>
  );
}

export default Navbar;

