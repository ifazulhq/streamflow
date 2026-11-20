"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import AuthModal from "@/components/AuthModal";

interface AuthWidgetProps {
  onOpenAuth?: () => void;
}

export function AuthWidget({ onOpenAuth }: AuthWidgetProps) {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSignInClick = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSignOutClick = () => {
    setIsDropdownOpen(false);
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {status === "authenticated" && session?.user ? (
        <div className="relative">
          {/* Profile Picture Trigger */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center focus:outline-none"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="User profile menu"
          >
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || "User Avatar"}
                className="w-8 h-8 rounded-full border border-white/10 hover:border-slate-400/50 cursor-pointer transition-all object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border border-white/10 hover:border-slate-400/50 bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 uppercase cursor-pointer transition-all">
                {session.user.name ? session.user.name.charAt(0) : "U"}
              </div>
            )}
          </button>

          {/* Logout Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-lg p-2 z-50 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
              {/* Optional User Details */}
              {(session.user.name || session.user.email) && (
                <div className="px-2 py-1.5 border-b border-white/5 mb-1">
                  {session.user.name && (
                    <p className="text-xs font-semibold text-white truncate font-sans">
                      {session.user.name}
                    </p>
                  )}
                  {session.user.email && (
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {session.user.email}
                    </p>
                  )}
                </div>
              )}

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleSignOutClick}
                className="text-slate-400 hover:text-white hover:bg-white/5 w-full text-left text-xs tracking-widest uppercase p-2 rounded transition-colors cursor-pointer font-sans"
              >
                SIGN OUT
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Unauthenticated or Loading State */
        <button
          type="button"
          onClick={handleSignInClick}
          className="text-slate-400 hover:text-white font-sans text-xs tracking-widest uppercase transition-colors cursor-pointer py-1.5 px-3 rounded hover:bg-white/5"
        >
          SIGN IN
        </button>
      )}

      {/* Internal Modal Fallback if not controlled by parent */}
      {!onOpenAuth && (
        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default AuthWidget;

