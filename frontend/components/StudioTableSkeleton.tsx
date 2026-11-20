import React from "react";

export default function StudioTableSkeleton() {
  return (
    <div className="w-full rounded-md bg-white/[0.02] border border-white/10 shadow-2xl overflow-x-auto backdrop-blur-sm animate-pulse select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Header Row */}
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.01] text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider select-none">
              <th className="py-4 px-6 font-semibold">Title & Source File</th>
              <th className="py-4 px-6 font-semibold">Video ID</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Renditions</th>
              <th className="py-4 px-6 font-semibold">Views</th>
              <th className="py-4 px-6 font-semibold">Created At</th>
              <th className="py-4 px-6 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          {/* 4 Rows of Pulsing Horizontal Bars */}
          <tbody className="divide-y divide-white/5">
            {[1, 2, 3, 4].map((i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {/* Title & Thumbnail */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-9 h-9 rounded-md bg-white/5 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-white/10 rounded-sm w-36" />
                      <div className="h-2.5 bg-white/5 rounded-sm w-24" />
                    </div>
                  </div>
                </td>

                {/* Video ID */}
                <td className="py-4 px-6">
                  <div className="h-5 w-20 rounded-md bg-white/5" />
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <div className="h-5 w-20 rounded-md bg-white/5" />
                </td>

                {/* Renditions */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-9 rounded-sm bg-white/5" />
                    <div className="h-4 w-9 rounded-sm bg-white/5" />
                    <div className="h-4 w-9 rounded-sm bg-white/5" />
                  </div>
                </td>

                {/* Views */}
                <td className="py-4 px-6">
                  <div className="h-5 w-12 rounded-md bg-white/5" />
                </td>

                {/* Created At */}
                <td className="py-4 px-6">
                  <div className="h-3 bg-white/5 rounded-sm w-24" />
                </td>

                {/* Actions */}
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-7 w-16 rounded-md bg-white/5" />
                    <div className="h-7 w-7 rounded-md bg-white/5" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
