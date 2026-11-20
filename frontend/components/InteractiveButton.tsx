"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export type ButtonVariant = "primary" | "secondary" | "watch" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface InteractiveButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  magnetic?: boolean;
  glow?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
}

export default function InteractiveButton({
  children,
  variant = "primary",
  size = "md",
  magnetic = true,
  glow = true,
  href,
  onClick,
  disabled = false,
  className = "",
  title,
  type = "button",
  icon,
}: InteractiveButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for magnetic pull
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics conforming to micro-interaction standards (stiffness: 350, damping: 25)
  const springX = useSpring(mouseX, { stiffness: 350, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 25 });

  // Mouse position within button for ambient radial glow spotlight
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (magnetic) {
      // Subtle magnetic attraction factor
      const deltaX = (e.clientX - centerX) * 0.22;
      const deltaY = (e.clientY - centerY) * 0.22;
      mouseX.set(deltaX);
      mouseY.set(deltaY);
    }

    if (glow) {
      glowX.set(e.clientX - rect.left);
      glowY.set(e.clientY - rect.top);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  // Base and variant styles adhering to Arrakis AI minimalist theme
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/10 hover:text-white hover:border-white/20 transition-all";
      case "watch":
        return "border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/10 hover:text-white hover:border-white/20 transition-all";
      case "secondary":
        return "border border-white/10 bg-transparent text-slate-400 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/5 hover:text-slate-200 hover:border-white/20 transition-all";
      case "danger":
        return "border border-rose-500/20 bg-rose-500/5 text-rose-300/80 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-200 transition-all";
      case "ghost":
        return "border border-transparent bg-transparent text-slate-400 font-sans font-semibold text-[10px] tracking-wide uppercase hover:text-white hover:bg-white/5 transition-all";
      default:
        return "border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/10 hover:text-white transition-all";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-[9px] rounded-md gap-1.5";
      case "md":
        return "px-4 py-2 text-[10px] rounded-md gap-2";
      case "lg":
        return "px-5 py-2.5 text-xs rounded-md gap-2.5";
      case "icon":
        return "p-2 rounded-md";
      default:
        return "px-4 py-2 text-[10px] rounded-md gap-2";
    }
  };

  const content = (
    <>
      {/* Ambient subtle cursor spotlight */}
      {glow && isHovered && !disabled && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-40 transition-opacity duration-300"
          style={{
            background: `radial-gradient(100px circle at ${glowX.get()}px ${glowY.get()}px, rgba(255, 255, 255, 0.08), transparent 70%)`,
          }}
        />
      )}

      {/* Button Children Content */}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    </>
  );

  const sharedClassName = `relative inline-flex items-center justify-center font-sans font-semibold select-none overflow-hidden transition-colors duration-200 ${getVariantStyles()} ${getSizeStyles()} ${
    disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
  } ${className}`;

  if (href && !disabled) {
    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="inline-block"
      >
        <Link href={href} className={sharedClassName} title={title}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="inline-block"
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={sharedClassName}
        title={title}
      >
        {content}
      </button>
    </motion.div>
  );
}
