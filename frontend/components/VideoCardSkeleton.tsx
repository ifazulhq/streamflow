import React from "react";

export default function VideoCardSkeleton() {
  return (
    <div className="group relative flex flex-col rounded-md bg-white/[0.02] border border-white/10 overflow-hidden p-3 animate-pulse select-none">
      {/* Thumbnail Frame (16:9) */}
      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-white/5 border border-white/5 flex items-center justify-center">
        {/* Pulsing Box placeholder */}
        <div className="w-10 h-10 rounded-full bg-white/5" />

        {/* Floating badge placeholders */}
        <div className="absolute top-2.5 right-2.5 w-14 h-4 rounded-sm bg-white/5" />
        <div className="absolute top-2.5 left-2.5 w-16 h-4 rounded-sm bg-white/5" />
        <div className="absolute bottom-2.5 right-2.5 w-16 h-4 rounded-sm bg-white/5" />
      </div>

      {/* Metadata Stack */}
      <div className="pt-3 px-1 flex flex-col gap-2">
        {/* Title Medium Bar */}
        <div className="h-3.5 bg-white/10 rounded-sm w-3/4" />

        {/* Sub-row: Timestamp & Video ID */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-2.5 bg-white/5 rounded-sm w-1/3" />
          <div className="h-2.5 bg-white/5 rounded-sm w-1/4" />
        </div>

        {/* Available Renditions Pills & Action Buttons */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
          {/* Rendition Badges */}
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-4 rounded-sm bg-white/5" />
            <div className="w-8 h-4 rounded-sm bg-white/5" />
            <div className="w-8 h-4 rounded-sm bg-white/5" />
          </div>

          {/* Action Button Mockups */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-white/5" />
            <div className="w-14 h-6 rounded-md bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
