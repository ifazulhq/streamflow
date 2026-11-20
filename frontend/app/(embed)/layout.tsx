import React from "react";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden bg-black flex items-center justify-center">
      {children}
    </div>
  );
}
