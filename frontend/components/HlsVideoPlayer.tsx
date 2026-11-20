"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Check,
  RotateCcw,
  RotateCw,
  Sparkles,
  Layers,
  X,
  Activity,
} from "lucide-react";

interface HlsVideoPlayerProps {
  src: string;
  title?: string;
  autoPlay?: boolean;
  onClose?: () => void;
}

interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  name: string;
}

export default function HlsVideoPlayer({
  src,
  title,
  autoPlay = true,
  onClose,
}: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Quality State
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
  const [activeAutoLevelName, setActiveAutoLevelName] = useState<string>("");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Resolve streaming URL
  const getStreamUrl = useCallback((inputSrc: string): string => {
    if (!inputSrc) return "";
    if (inputSrc.startsWith("http://") || inputSrc.startsWith("https://")) {
      return inputSrc;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    if (inputSrc.includes("uploads")) {
      const relativePart = inputSrc
        .split("uploads")[1]
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");
      return `${baseUrl}/uploads/${relativePart}`;
    }
    const cleanPath = inputSrc.startsWith("/") ? inputSrc : `/${inputSrc}`;
    return `${baseUrl}${cleanPath}`;
  }, []);

  const streamUrl = getStreamUrl(src);

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setStreamError(null);

    // Destroy existing Hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("[HLS] Manifest parsed, available levels:", data.levels);

        const parsedLevels: QualityLevel[] = data.levels.map((lvl, idx) => ({
          index: idx,
          height: lvl.height,
          bitrate: lvl.bitrate,
          name: lvl.height ? `${lvl.height}p` : `Level ${idx}`,
        }));

        setLevels(parsedLevels);
        setCurrentLevel(hls.currentLevel);

        if (autoPlay) {
          video.play().catch((err) => {
            console.log("[Video] Autoplay prevented, waiting for user gesture:", err);
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setActiveAutoLevelName(`${lvl.height}p`);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("[HLS] Fatal error:", data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamError("Network error loading stream. Attempting recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamError("Media decoding error. Recovering...");
              hls.recoverMediaError();
              break;
            default:
              setStreamError("Unrecoverable playback error. Please try again.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
    } else {
      setStreamError("HLS playback is not supported in this browser.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, autoPlay]);

  // Video event listeners for time and buffer
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    // Calculate buffer progress
    if (video.buffered.length > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.buffered.start(i) <= video.currentTime &&
          video.currentTime <= video.buffered.end(i)
        ) {
          setBufferedEnd(video.buffered.end(i));
          break;
        }
      }
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = parseFloat(e.target.value);
    video.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleQualityChange = (levelIdx: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIdx;
    setCurrentLevel(levelIdx);
    setShowQualityMenu(false);
  };

  // Activity timer to hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (!isFinite(secs) || isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const currentQualityLabel = currentLevel === -1
    ? `Auto${activeAutoLevelName ? ` (${activeAutoLevelName})` : ""}`
    : levels.find((l) => l.index === currentLevel)?.name || "Quality";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl group select-none"
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />

      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-20 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 truncate max-w-md drop-shadow-md">
              {title || "Adaptive Bitrate Stream"}
            </h3>
            <span className="text-[11px] font-sans font-medium text-indigo-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HLS Protocol • Master Playlist
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/60 hover:bg-zinc-800 text-slate-300 hover:text-white transition-colors border border-white/10 backdrop-blur-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Banner */}
      {streamError && (
        <div className="absolute top-16 left-6 right-6 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between backdrop-blur-md z-30">
          <span>{streamError}</span>
          <button
            onClick={() => {
              if (hlsRef.current) hlsRef.current.startLoad();
            }}
            className="px-3 py-1 bg-rose-600 rounded-lg text-white font-medium hover:bg-rose-500"
          >
            Retry
          </button>
        </div>
      )}

      {/* Floating Glassmorphic Bottom Control Bar */}
      <div
        className={`absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/10 shadow-2xl z-20 flex flex-col gap-2.5 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Scrubber Timeline */}
        <div className="relative group/scrub py-1 cursor-pointer">
          {/* Buffer Bar */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-white/20 rounded-full pointer-events-none transition-all"
            style={{ width: `${(bufferedEnd / (duration || 1)) * 100}%` }}
          />
          {/* Playback Range Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
          />
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between gap-4 text-slate-200 text-xs">
          {/* Left: Play/Pause, Skip Buttons, Volume, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkipBackward}
              className="text-slate-300 hover:text-white transition-colors w-5 h-5 cursor-pointer flex items-center justify-center"
              title="Rewind 10s"
              type="button"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              type="button"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={handleSkipForward}
              className="text-slate-300 hover:text-white transition-colors w-5 h-5 cursor-pointer flex items-center justify-center"
              title="Forward 10s"
              type="button"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-slate-300" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500 opacity-60 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time Display */}
            <span className="font-sans font-medium text-[11px] text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Quality Selector & Fullscreen */}
          <div className="flex items-center gap-3 relative">
            {/* Quality Selector Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-semibold border transition-all ${
                  showQualityMenu
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900/80 hover:bg-zinc-800 text-slate-200 border-white/10"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentQualityLabel}</span>
              </button>

              {/* Frosted Glass Quality Flyout Menu */}
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-48 rounded-xl bg-zinc-950/95 border border-white/15 p-1.5 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-sans font-bold tracking-wider text-slate-500 uppercase border-b border-white/5 mb-1 flex items-center justify-between">
                    <span>Quality Selection</span>
                    <Activity className="w-3 h-3 text-indigo-400" />
                  </div>

                  {/* Option: Auto (Adaptive) */}
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentLevel === -1
                        ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                        : "hover:bg-zinc-800 text-slate-300"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>Auto</span>
                      <span className="text-[10px] text-slate-500 font-sans font-medium">
                        Adaptive Bitrate (ABR)
                      </span>
                    </div>
                    {currentLevel === -1 && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>

                  {/* Discrete Level Options */}
                  {levels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => handleQualityChange(lvl.index)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        currentLevel === lvl.index
                          ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                          : "hover:bg-zinc-800 text-slate-300"
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span>{lvl.name}</span>
                        {lvl.bitrate > 0 && (
                          <span className="text-[10px] text-slate-500 font-sans font-medium">
                            {(lvl.bitrate / 1000000).toFixed(1)} Mbps
                          </span>
                        )}
                      </div>
                      {currentLevel === lvl.index && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
