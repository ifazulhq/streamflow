"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-slate-300 font-sans">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex-1 flex flex-col w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
