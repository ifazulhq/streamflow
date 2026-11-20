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
  Tv,
  Info,
  Gauge,
  Wifi,
  Film,
  HardDrive,
  Cpu,
  Share2,
} from "lucide-react";
import ShareModal from "@/components/ShareModal";
import RetentionWaveform from "@/components/RetentionWaveform";
import QoETelemetryHUD from "@/components/QoETelemetryHUD";

interface CinemaPlayerProps {
  src: string;
  title?: string;
  originalName?: string;
  videoId?: string;
  resolutions?: string[];
  posterUrl?: string;
  storyboardUrl?: string;
  autoPlay?: boolean;
  isEmbed?: boolean;
  onTheaterChange?: (isTheater: boolean) => void;
  heatmap?: number[];
}

interface QualityLevel {
  index: number;
  height: number;
  width?: number;
  bitrate: number;
  name: string;
  codec?: string;
}

interface StoryboardCue {
  start: number;
  end: number;
  spriteUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TelemetryState {
  resolution: string;
  bitrate: number; // in bps
  bandwidthEstimate: number; // in Mbps
  droppedFrames: number;
  totalFrames: number;
  bufferLength: number; // in seconds
  codecs: string;
  currentLevelIdx: number;
  currentPts: number;
  playerWidth: number;
  playerHeight: number;
}

export default function CinemaPlayer({
  src,
  title,
  originalName,
  videoId,
  resolutions,
  posterUrl,
  storyboardUrl,
  autoPlay = true,
  isEmbed = false,
  onTheaterChange,
  heatmap: initialHeatmap,
}: CinemaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Storyboard WebVTT state
  const [storyboardCues, setStoryboardCues] = useState<StoryboardCue[]>([]);
  const [isScrubberHovered, setIsScrubberHovered] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverX, setHoverX] = useState(0);

  // Engagement Heatmap State (100 density buckets, 0-99)
  const [heatmap, setHeatmap] = useState<number[]>(initialHeatmap || []);
  const hasCountedViewRef = useRef(false);
  const activePlaySecondsRef = useRef(0);

  // Live Progress State for Retention Waveform
  const [progress, setProgress] = useState(0);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Quality State
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = Auto
  const [activeAutoLevelName, setActiveAutoLevelName] = useState<string>("");
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Stats for Nerds HUD State
  const [showNerdStats, setShowNerdStats] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    resolution: "1920x1080",
    bitrate: 0,
    bandwidthEstimate: 0,
    droppedFrames: 0,
    totalFrames: 0,
    bufferLength: 0,
    codecs: "avc1.4d401f, mp4a.40.2",
    currentLevelIdx: -1,
    currentPts: 0,
    playerWidth: 0,
    playerHeight: 0,
  });

  // Resolve direct streaming URL (MinIO S3 or Express fallback)
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

  // Fetch and parse storyboard.vtt for thumbnail scrubbing previews
  useEffect(() => {
    if (!storyboardUrl) {
      setStoryboardCues([]);
      return;
    }

    let isMounted = true;
    const loadVtt = async () => {
      try {
        const res = await fetch(storyboardUrl);
        if (!res.ok) throw new Error(`VTT request failed: status ${res.status}`);
        const vttText = await res.text();

        const baseUrl = storyboardUrl.substring(0, storyboardUrl.lastIndexOf("/") + 1);
        const cues: StoryboardCue[] = [];
        const lines = vttText.split(/\r?\n/);
        let i = 0;

        const parseTimestamp = (tStr: string): number => {
          const parts = tStr.trim().split(":");
          if (parts.length === 3) {
            const [h, m, s] = parts;
            return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
          } else if (parts.length === 2) {
            const [m, s] = parts;
            return parseFloat(m) * 60 + parseFloat(s);
          }
          return 0;
        };

        while (i < lines.length) {
          const line = lines[i].trim();
          if (line.includes("-->")) {
            const [startStr, endStr] = line.split("-->").map((s) => s.trim());
            const start = parseTimestamp(startStr);
            const end = parseTimestamp(endStr);

            let j = i + 1;
            while (j < lines.length && !lines[j].trim()) {
              j++;
            }

            if (j < lines.length) {
              const mediaRef = lines[j].trim();
              const match = mediaRef.match(/^(.*?)#xywh=(\d+),(\d+),(\d+),(\d+)$/);
              if (match) {
                const rawUrl = match[1];
                const spriteUrl = rawUrl.startsWith("http")
                  ? rawUrl
                  : `${baseUrl}${rawUrl}`;
                const x = parseInt(match[2], 10);
                const y = parseInt(match[3], 10);
                const w = parseInt(match[4], 10);
                const h = parseInt(match[5], 10);

                cues.push({ start, end, spriteUrl, x, y, w, h });
              }
            }
            i = j + 1;
          } else {
            i++;
          }
        }

        if (isMounted) {
          setStoryboardCues(cues);
          console.log(`[CinemaPlayer] Parsed ${cues.length} storyboard cues from ${storyboardUrl}`);
        }
      } catch (err) {
        console.warn("[CinemaPlayer] Warning loading storyboard.vtt:", err);
      }
    };

    loadVtt();
    return () => {
      isMounted = false;
    };
  }, [storyboardUrl]);

  // Reset view session counter if video ID changes
  useEffect(() => {
    hasCountedViewRef.current = false;
    activePlaySecondsRef.current = 0;
  }, [videoId]);

  // Fetch engagement heatmap data on mount
  useEffect(() => {
    if (!videoId) return;

    let isMounted = true;
    const fetchHeatmap = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/videos/${videoId}/engagement`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.heatmap) && data.heatmap.length > 0) {
            setHeatmap(data.heatmap);
          }
        }
      } catch (err) {
        console.warn("[CinemaPlayer] Failed to load engagement heatmap:", err);
      }
    };

    fetchHeatmap();
    return () => {
      isMounted = false;
    };
  }, [videoId]);

  // Telemetry interval: Every 5s of active playback, calculate percentage bucket & ping API
  useEffect(() => {
    if (!videoId || !isPlaying) return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;

      const dur = video.duration || 0;
      if (dur <= 0) return;

      const curr = video.currentTime || 0;
      const pct = Math.floor((curr / dur) * 100);
      const bucket = Math.max(0, Math.min(99, pct));

      activePlaySecondsRef.current += 5;
      const isFirstView =
        !hasCountedViewRef.current && activePlaySecondsRef.current >= 5;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${baseUrl}/videos/${videoId}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            watchedSeconds: 5,
            currentBucket: bucket,
            incrementView: isFirstView,
          }),
        });

        if (isFirstView) {
          hasCountedViewRef.current = true;
        }

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.heatmap)) {
            setHeatmap(data.heatmap);
          }
        }
      } catch (err) {
        console.warn("[CinemaPlayer] Failed to dispatch analytics telemetry:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, videoId]);

  // Generate smoothed Catmull-Rom / Bezier SVG paths for engagement heatmap
  const { heatmapAreaPath, heatmapLinePath, hasEngagement, isNearPeak } =
    React.useMemo(() => {
      if (!heatmap || heatmap.length === 0) {
        return {
          heatmapAreaPath: "",
          heatmapLinePath: "",
          hasEngagement: false,
          isNearPeak: false,
        };
      }

      const maxVal = Math.max(...heatmap, 0);
      if (maxVal <= 0) {
        return {
          heatmapAreaPath: "",
          heatmapLinePath: "",
          hasEngagement: false,
          isNearPeak: false,
        };
      }

      const maxIdx = heatmap.reduce(
        (maxI, val, i, arr) => (val > arr[maxI] ? i : maxI),
        0
      );

      // Map 100 buckets to SVG coordinates: viewBox="0 0 1000 60"
      const pts = heatmap.map((val, i) => {
        const x = (i / 99) * 1000;
        const norm = val / maxVal;
        // y: 56 (baseline) down to 8 (peak height)
        const y = 56 - norm * 48;
        return { x, y };
      });

      // Smooth path calculation using Catmull-Rom to Cubic Bezier spline
      let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }

      const area = `${d} L 1000,58 L 0,58 Z`;

      const currHoverBucket = Math.min(
        99,
        Math.max(0, Math.floor((hoverTime / (duration || 1)) * 100))
      );
      const nearPeak = maxVal >= 1 && Math.abs(currHoverBucket - maxIdx) <= 4;

      return {
        heatmapAreaPath: area,
        heatmapLinePath: d,
        hasEngagement: true,
        isNearPeak: nearPeak,
      };
    }, [heatmap, hoverTime, duration]);

  // Scrubber hover calculations for YouTube-style preview thumbnails
  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(rect.width, rawX));
    const percent = clampedX / (rect.width || 1);
    const time = percent * (duration || 0);

    setHoverX(clampedX);
    setHoverTime(time);
    setIsScrubberHovered(true);
  };

  const handleScrubberMouseLeave = () => {
    setIsScrubberHovered(false);
  };

  // Find active storyboard thumbnail cue
  const activeCue =
    storyboardCues.length > 0
      ? storyboardCues.find((c) => hoverTime >= c.start && hoverTime < c.end) ||
        storyboardCues[storyboardCues.length - 1]
      : null;

  // Clamped position for floating preview thumbnail box
  const previewWidth = activeCue ? activeCue.w : 160;
  const halfWidth = previewWidth / 2;
  const scrubberTotalWidth = scrubberRef.current ? scrubberRef.current.clientWidth : 800;
  const clampedPreviewLeft = Math.max(halfWidth, Math.min(scrubberTotalWidth - halfWidth, hoverX));
  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode((prev) => {
      const next = !prev;
      if (onTheaterChange) onTheaterChange(next);
      return next;
    });
  }, [onTheaterChange]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // 10-second Skip Controls
  const handleSkipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  }, []);

  const handleSkipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  }, []);

  // Update viewport dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current) {
        setTelemetry((prev) => ({
          ...prev,
          playerWidth: videoRef.current?.clientWidth || 0,
          playerHeight: videoRef.current?.clientHeight || 0,
        }));
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Hotkeys Listener: Spacebar, F, T, S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused on an input element
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "KeyF":
          if (isEmbed) break;
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyT":
          if (isEmbed) break;
          e.preventDefault();
          toggleTheaterMode();
          break;
        case "KeyS":
          if (isEmbed) break;
          e.preventDefault();
          setShowNerdStats((prev) => !prev);
          break;
        case "KeyD":
          if (isEmbed) break;
          e.preventDefault();
          setShowDiagnostics((prev) => !prev);
          break;
        case "KeyM":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(
              videoRef.current.duration || 0,
              videoRef.current.currentTime + 5
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(false);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            if (nextVol === 0) setIsMuted(true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, toggleFullscreen, toggleTheaterMode, isEmbed]);

  // Initialize Hls.js with Low-Level Telemetry Event Bindings
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    setStreamError(null);

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

      // 1. MANIFEST_PARSED: Collect renditions
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("[CinemaPlayer] Manifest parsed, available levels:", data.levels);

        const parsedLevels: QualityLevel[] = data.levels.map((lvl, idx) => ({
          index: idx,
          height: lvl.height,
          width: lvl.width,
          bitrate: lvl.bitrate,
          name: lvl.height ? `${lvl.height}p` : `Level ${idx}`,
          codec: lvl.codecSet || lvl.videoCodec || "avc1.4d401f",
        }));

        setLevels(parsedLevels);
        setCurrentLevel(hls.currentLevel);

        if (data.levels.length > 0) {
          const firstLvl = data.levels[0];
          setTelemetry((prev) => ({
            ...prev,
            resolution: `${firstLvl.width || Math.round((firstLvl.height * 16) / 9)}x${firstLvl.height}`,
            bitrate: firstLvl.bitrate,
            codecs: firstLvl.codecSet || "avc1.4d401f, mp4a.40.2",
          }));
        }

        if (autoPlay) {
          video.play().catch(() => {
            console.log("[CinemaPlayer] Autoplay prevented, awaiting user gesture");
          });
        }
      });

      // 2. LEVEL_SWITCHED: Update active resolution and bitrate
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          const resStr = `${lvl.width || Math.round((lvl.height * 16) / 9)}x${lvl.height}`;
          setActiveAutoLevelName(`${lvl.height}p`);
          setTelemetry((prev) => ({
            ...prev,
            resolution: resStr,
            bitrate: lvl.bitrate,
            codecs: lvl.codecSet || lvl.videoCodec || prev.codecs,
            currentLevelIdx: data.level,
          }));
        }
      });

      // 3. FRAG_BUFFERED / FRAG_LOADED: Read bandwidth estimate and dropped frames
      const handleFragTelemetry = () => {
        const bwMbps = hls.bandwidthEstimate
          ? Number((hls.bandwidthEstimate / 1000000).toFixed(2))
          : 0;

        let dropped = 0;
        let total = 0;
        if (video && typeof video.getVideoPlaybackQuality === "function") {
          const q = video.getVideoPlaybackQuality();
          dropped = q.droppedVideoFrames;
          total = q.totalVideoFrames;
        }

        setTelemetry((prev) => ({
          ...prev,
          bandwidthEstimate: bwMbps,
          droppedFrames: dropped,
          totalFrames: total,
        }));
      };

      hls.on(Hls.Events.FRAG_LOADED, handleFragTelemetry);
      hls.on(Hls.Events.FRAG_BUFFERED, handleFragTelemetry);

      // Error handling
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("[CinemaPlayer] Fatal HLS error:", data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamError("Network connection lost. Attempting auto-recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamError("Media decoding error. Recovering buffer stream...");
              hls.recoverMediaError();
              break;
            default:
              setStreamError("Unrecoverable playback error. Please verify object storage stream.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple Safari HLS
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        if (autoPlay) video.play().catch(() => {});
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

  // Native <video> timeupdate: Calculate live buffer length
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    // Live buffer calculation: video.buffered.end(video.buffered.length - 1) - video.currentTime
    let liveBufferLength = 0;
    const buf = video.buffered;
    if (buf && buf.length > 0) {
      try {
        const lastEnd = buf.end(buf.length - 1);
        liveBufferLength = Math.max(0, Number((lastEnd - video.currentTime).toFixed(2)));
        setBufferedEnd(lastEnd);
      } catch {
        // Fallback for fragmented ranges
      }
    }

    setTelemetry((prev) => ({
      ...prev,
      bufferLength: liveBufferLength,
      currentPts: Number(video.currentTime.toFixed(2)),
    }));
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

  const handleQualityChange = (levelIdx: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIdx;
    setCurrentLevel(levelIdx);
    setShowQualityMenu(false);
  };

  // Activity timer to hide bottom controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showNerdStats && !showDiagnostics) {
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

  const currentQualityLabel =
    currentLevel === -1
      ? `Auto${activeAutoLevelName ? ` (${activeAutoLevelName})` : ""}`
      : levels.find((l) => l.index === currentLevel)?.name || "Quality";

  const playerContent = (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !showNerdStats && !showDiagnostics && setShowControls(false)}
      className={`relative overflow-hidden bg-black select-none ${
        isEmbed
          ? "w-full h-full max-w-full rounded-none border-0 shadow-none m-0 p-0 aspect-auto"
          : `w-full aspect-video rounded-md border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] transition-all duration-500 ${
              isTheaterMode ? "max-w-full" : "max-w-6xl mx-auto"
            }`
      }`}
    >
      {/* Ambient Halo Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />

      {/* Video Element */}
      <video
        ref={videoRef}
        poster={posterUrl}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={(e) => {
          handleTimeUpdate();
          const target = e.target as HTMLVideoElement;
          if (target.duration) setProgress((target.currentTime / target.duration) * 100);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause}
        className={`w-full h-full object-contain ${isEmbed ? "" : "cursor-pointer"}`}
      />

      {/* TOP BAR: Title & Badges */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between z-20 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/80 backdrop-blur-md shrink-0">
            <Film className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-xs sm:max-w-lg drop-shadow-md">
              {title || originalName || "Cinema Adaptive Stream"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] font-sans font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                HLS ABR
              </span>
              <span>•</span>
              <span className="text-slate-400">MinIO S3</span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        {!isEmbed && (
          <div className="flex items-center gap-2.5">
            {/* Share & Embed Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-sans font-semibold text-slate-300 hover:text-white backdrop-blur-md uppercase tracking-wide transition-all cursor-pointer"
              title="Share & Embed Video"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Share</span>
            </button>

            {/* Hotkey Guide Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-sans font-semibold text-slate-400 backdrop-blur-md uppercase tracking-wide">
              <span>[Space] Play</span>
              <span>•</span>
              <span>[F] Fullscreen</span>
              <span>•</span>
              <span>[T] Theater</span>
              <span>•</span>
              <span>[S] Stats</span>
            </div>
          </div>
        )}
      </div>

      {/* STATS FOR NERDS HUD OVERLAY */}
      {!isEmbed && showNerdStats && (
        <div className="absolute top-16 left-6 z-40 w-80 sm:w-96 rounded-md bg-[#050505]/95 backdrop-blur-2xl border border-white/10 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2 text-white/80">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-sans font-bold tracking-wider uppercase text-white/90">
                Stats for Nerds
              </span>
            </div>
            <button
              onClick={() => setShowNerdStats(false)}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 font-sans font-medium text-[11px] text-slate-300">
            {/* Resolution */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Active Resolution:</span>
              <span className="text-slate-200 font-medium">{telemetry.resolution}</span>
            </div>

            {/* Bitrate */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Video Bitrate:</span>
              <span className="text-slate-200">
                {(telemetry.bitrate / 1000000).toFixed(2)} Mbps
              </span>
            </div>

            {/* Bandwidth Estimate */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Bandwidth Est:</span>
              <span className="text-slate-200 font-medium">
                {telemetry.bandwidthEstimate > 0 ? `${telemetry.bandwidthEstimate} Mbps` : "Measuring..."}
              </span>
            </div>

            {/* Buffer Length */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Live Buffer Length:</span>
              <span className={`font-medium ${telemetry.bufferLength > 5 ? "text-emerald-400" : "text-amber-400"}`}>
                {telemetry.bufferLength} s
              </span>
            </div>

            {/* Dropped Frames */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Dropped Frames:</span>
              <span className={telemetry.droppedFrames > 0 ? "text-rose-400" : "text-slate-300"}>
                {telemetry.droppedFrames} / {telemetry.totalFrames}{" "}
                {telemetry.totalFrames > 0
                  ? `(${((telemetry.droppedFrames / telemetry.totalFrames) * 100).toFixed(2)}%)`
                  : ""}
              </span>
            </div>

            {/* Viewport Dimensions */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Viewport Dimensions:</span>
              <span className="text-slate-300">
                {telemetry.playerWidth} x {telemetry.playerHeight}
              </span>
            </div>

            {/* Codecs */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-500">Codecs:</span>
              <span className="text-slate-300 truncate max-w-[180px]">{telemetry.codecs}</span>
            </div>

            {/* Video ID */}
            {videoId && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Video ID:</span>
                <span className="text-slate-400 truncate max-w-[180px]">{videoId}</span>
              </div>
            )}

            {/* Source Storage */}
            <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 truncate">
              Source: <span className="text-slate-400">{streamUrl}</span>
            </div>
          </div>
        </div>
      )}

      {/* QoE TELEMETRY OSCILLOSCOPE OVERLAY */}
      {!isEmbed && showDiagnostics && (
        <QoETelemetryHUD onClose={() => setShowDiagnostics(false)} />
      )}

      {/* ERROR BANNER */}
      {streamError && (
        <div className="absolute top-16 left-6 right-6 p-4 rounded-md bg-[#050505]/95 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between backdrop-blur-xl z-30 shadow-2xl">
          <span>{streamError}</span>
          <button
            onClick={() => {
              if (hlsRef.current) hlsRef.current.startLoad();
            }}
            className="px-3 py-1.5 border border-white/10 bg-white/5 rounded-md text-white font-sans font-semibold text-[10px] tracking-wide uppercase hover:bg-white/10 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* FLOATING BOTTOM CONTROL BAR */}
      <div
        className={`absolute bottom-4 left-4 right-4 p-3.5 rounded-md bg-[#050505]/90 backdrop-blur-2xl border border-white/10 shadow-2xl z-20 flex flex-col gap-3 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Scrubber Timeline with YouTube-Style Storyboard Previews & Heatmap Sparkline */}
        <div
          ref={scrubberRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
          className="relative group/scrub py-2 cursor-pointer flex flex-col justify-end"
        >
          {/* Floating YouTube-style Storyboard Thumbnail Preview */}
          {isScrubberHovered && (
            <div
              className="absolute bottom-full mb-2 pointer-events-none z-50 flex flex-col items-center -translate-x-1/2 transition-opacity duration-150 animate-in fade-in zoom-in-95"
              style={{ left: `${clampedPreviewLeft}px` }}
            >
              {/* Floating Thumbnail Box */}
              <div className="p-1.5 rounded-md bg-zinc-950/95 border border-white/10 shadow-2xl shadow-black backdrop-blur-xl flex flex-col items-center">
                {activeCue ? (
                  <div
                    className="rounded-sm overflow-hidden bg-black shadow-inner"
                    style={{
                      width: `${activeCue.w}px`,
                      height: `${activeCue.h}px`,
                      backgroundImage: `url("${activeCue.spriteUrl}")`,
                      backgroundPosition: `-${activeCue.x}px -${activeCue.y}px`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                ) : (
                  <div
                    className="rounded-xl overflow-hidden bg-zinc-900 border border-white/5 flex items-center justify-center text-slate-500 font-sans font-medium text-[10px]"
                    style={{ width: "160px", height: "90px" }}
                  >
                    <span>Preview</span>
                  </div>
                )}

                {/* Timestamp Badge */}
                <div className="mt-1 px-2.5 py-0.5 rounded-md bg-black/90 border border-white/10 text-white font-sans font-semibold text-[11px] tracking-wide uppercase">
                  {formatTime(hoverTime)}
                </div>

                {/* Most Rewatched YouTube-style Pill */}
                {isNearPeak && (
                  <div className="mt-1 px-2.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[9px] uppercase tracking-wide flex items-center gap-1 shadow-md">
                    <Sparkles className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Most rewatched</span>
                  </div>
                )}
              </div>

              {/* Downward Indicator Arrow */}
              <div className="w-2.5 h-2.5 bg-zinc-950 border-r border-b border-white/20 rotate-45 -mt-1 shadow-sm" />
            </div>
          )}

          {/* Heatmap UI Overlay (Recreating YouTube 'Most Rewatched') */}
          {hasEngagement && (
            <div className="w-full h-7 mb-0.5 pointer-events-none relative overflow-hidden select-none transition-opacity duration-300 opacity-75 group-hover/scrub:opacity-100">
              <svg
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id={`heatmapGrad-${videoId || "stream"}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.55" />
                    <stop offset="60%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={heatmapAreaPath} fill={`url(#heatmapGrad-${videoId || "stream"})`} />
                <path
                  d={heatmapLinePath}
                  fill="none"
                  stroke="#a5b4fc"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Scrubber Range & Buffer Track Container */}
          <div className="relative w-full h-2 flex items-center">
            {/* Buffer Track */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-white/20 rounded-full pointer-events-none transition-all duration-300"
              style={{ width: `${(bufferedEnd / (duration || 1)) * 100}%` }}
            />

            {/* Hover Cursor Track */}
            {isScrubberHovered && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/60 pointer-events-none -translate-x-1/2"
                style={{ left: `${hoverX}px` }}
              />
            )}

            {/* Range Input */}
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
        </div>

        {/* Primary Control Buttons Row */}
        <div className="flex items-center justify-between gap-4 text-slate-200 text-xs">
          {/* Left: Play/Pause, Skip Buttons, Volume, Time */}
          <div className="flex items-center gap-3">
            {/* Skip Backward 10s */}
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
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              type="button"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            {/* Skip Forward 10s */}
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
                title="Mute (M)"
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
                className="w-16 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-white/80 opacity-60 group-hover/vol:opacity-100 transition-opacity"
              />
            </div>

            {/* Time Stamp */}
            <span className="font-sans font-medium text-[11px] text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right: Stats for Nerds, Quality Selector, Theater, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Stats for Nerds Toggle Button */}
            {!isEmbed && (
              <button
                onClick={() => setShowNerdStats((prev) => !prev)}
                className={`p-2 rounded-md text-xs font-sans font-medium border transition-all ${
                  showNerdStats
                    ? "bg-white/20 text-white border-white/40 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white"
                }`}
                title="Stats for Nerds (S)"
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
            )}

            {/* QoE Telemetry Diagnostics Toggle Button */}
            {!isEmbed && (
              <button
                onClick={() => setShowDiagnostics((prev) => !prev)}
                className={`p-2 rounded-md text-xs font-sans font-medium border transition-all ${
                  showDiagnostics
                    ? "bg-white/20 text-white border-white/40 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white"
                }`}
                title="QoE Telemetry Diagnostics (D)"
              >
                <Gauge className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quality Selector Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-semibold border transition-all ${
                  showQualityMenu
                    ? "bg-white/20 text-white border-white/40 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-200 border-white/10 hover:text-white"
                }`}
                title="Resolution Settings"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentQualityLabel}</span>
              </button>

              {/* Frosted Flyout Quality Menu */}
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-3 w-52 rounded-md bg-[#050505]/95 border border-white/15 p-2 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[9px] font-sans font-bold tracking-wider text-slate-500 uppercase border-b border-white/10 mb-1 flex items-center justify-between">
                    <span>Quality Mode</span>
                    <Sparkles className="w-3 h-3 text-slate-400" />
                  </div>

                  {/* Auto (ABR) */}
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans font-medium transition-colors ${
                      currentLevel === -1
                        ? "bg-white/15 text-white font-semibold"
                        : "hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>Auto</span>
                      <span className="text-[10px] text-slate-500 font-sans font-medium">
                        Adaptive Bitrate (ABR)
                      </span>
                    </div>
                    {currentLevel === -1 && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  {/* Discrete Renditions */}
                  {levels.map((lvl) => (
                    <button
                      key={lvl.index}
                      onClick={() => handleQualityChange(lvl.index)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-sans font-medium transition-colors ${
                        currentLevel === lvl.index
                          ? "bg-white/15 text-white font-semibold"
                          : "hover:bg-white/5 text-slate-300"
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
                      {currentLevel === lvl.index && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode Button */}
            {!isEmbed && (
              <button
                onClick={toggleTheaterMode}
                className={`p-2 rounded-md text-xs font-sans font-medium border transition-all ${
                  isTheaterMode
                    ? "bg-white/20 text-white border-white/40 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:text-white"
                }`}
                title="Theater Mode (T)"
              >
                <Tv className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Global Animated Share Modal */}
      {!isEmbed && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          video={{
            id: videoId || "",
            title: title || originalName || "Cinema Adaptive Stream",
            originalName,
            url: streamUrl,
          }}
        />
      )}
    </div>
  );

  if (isEmbed) {
    return playerContent;
  }

  return (
    <div className="w-full space-y-4">
      {playerContent}
      <RetentionWaveform
        heatmap={heatmap}
        progressPercentage={progress}
      />
    </div>
  );
}
