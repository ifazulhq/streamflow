"use client";

import React, { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal, { ShareModalVideo } from "./ShareModal";
import InteractiveButton from "./InteractiveButton";

interface ShareButtonProps {
  videoId?: string;
  videoTitle?: string;
  video?: ShareModalVideo;
  variant?: "primary" | "secondary" | "ghost" | "watch";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export default function ShareButton({
  videoId,
  videoTitle,
  video,
  variant = "secondary",
  size = "sm",
  className = "",
  showText = true,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeVideo = video || {
    id: videoId || "",
    title: videoTitle,
    originalName: videoTitle,
  };

  return (
    <>
      <InteractiveButton
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
        title="Share & Embed Video"
        icon={<Share2 className="w-3.5 h-3.5 text-indigo-400" />}
      >
        {showText && <span>Share</span>}
      </InteractiveButton>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        video={activeVideo}
      />
    </>
  );
}
