import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CinemaPlayer from "@/components/CinemaPlayer";

export const instant = false;


interface VideoData {
  id: string;
  uploadId: string;
  title?: string;
  originalName?: string;
  status: string;
  progress: number;
  masterPlaylist?: string;
  resolutions: string[];
  posterUrl?: string;
  storyboardUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVideo(id: string): Promise<VideoData | null> {
  const apiUrl = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/videos/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch video: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching video data for embed:", err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    return {
      title: "Stream Not Found | StreamFlow Embed",
      robots: { index: false, follow: false },
    };
  }

  const title = video.title || video.originalName || "StreamFlow Video Player";

  return {
    title: `${title} | StreamFlow Embed Player`,
    description: `Embedded adaptive bitrate video player for ${title}`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) {
    return (
      <div className="w-screen h-screen m-0 p-0 flex flex-col items-center justify-center bg-black text-slate-400 font-sans font-medium text-xs">
        <p>Video stream not found.</p>
      </div>
    );
  }

  const videoTitle = video.title || video.originalName || "Cinema Adaptive Stream";

  return (
    <main className="w-screen h-screen m-0 p-0 overflow-hidden bg-black flex items-center justify-center">
      <CinemaPlayer
        src={video.masterPlaylist || ""}
        title={videoTitle}
        originalName={video.originalName}
        videoId={video.id}
        resolutions={video.resolutions}
        posterUrl={video.posterUrl}
        storyboardUrl={video.storyboardUrl}
        autoPlay={true}
        isEmbed={true}
      />
    </main>
  );
}
