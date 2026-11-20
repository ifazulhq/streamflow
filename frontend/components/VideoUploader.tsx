"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import * as tus from "tus-js-client";
import {
  UploadCloud,
  FileVideo,
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type UploadStatus = "idle" | "uploading" | "paused" | "completed" | "error";

interface UploadTelemetry {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
  speedMBps: number;
  estimatedSecondsRemaining: number;
}

export default function VideoUploader() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const [telemetry, setTelemetry] = useState<UploadTelemetry>({
    bytesUploaded: 0,
    bytesTotal: 0,
    percentage: 0,
    speedMBps: 0,
    estimatedSecondsRemaining: 0,
  });

  const uploadRef = useRef<tus.Upload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProgressRef = useRef<{ bytes: number; time: number }>({
    bytes: 0,
    time: 0,
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatSeconds = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) return "calculating...";
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${minutes}m ${secs}s remaining`;
  };

  const startUpload = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setStatus("uploading");
    setErrorMessage(null);
    setUploadUrl(null);
    setUploadId(null);

    lastProgressRef.current = {
      bytes: 0,
      time: Date.now(),
    };

    const upload = new tus.Upload(selectedFile, {
      endpoint: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/uploads`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: 5 * 1024 * 1024, // 5MB chunks for optimal resumability
      metadata: {
        filename: selectedFile.name,
        filetype: selectedFile.type || "video/mp4",
        name: selectedFile.name,
      },
      onError: (error) => {
        console.error("Tus upload failed:", error);
        setStatus("error");
        setErrorMessage(
          error.message || "Network error occurred during chunk transfer. Please retry."
        );
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const now = Date.now();
        const timeDiffSec = (now - lastProgressRef.current.time) / 1000;
        const bytesDiff = bytesUploaded - lastProgressRef.current.bytes;

        let speed = 0;
        let eta = 0;

        if (timeDiffSec >= 0.5 && bytesDiff > 0) {
          speed = bytesDiff / timeDiffSec / (1024 * 1024); // MB/s
          const remainingBytes = bytesTotal - bytesUploaded;
          eta = remainingBytes / (speed * 1024 * 1024);
          lastProgressRef.current = { bytes: bytesUploaded, time: now };
        }

        const percentage = Number(((bytesUploaded / bytesTotal) * 100).toFixed(1));

        setTelemetry((prev) => ({
          bytesUploaded,
          bytesTotal,
          percentage,
          speedMBps: speed > 0 ? Number(speed.toFixed(2)) : prev.speedMBps,
          estimatedSecondsRemaining: eta > 0 ? eta : prev.estimatedSecondsRemaining,
        }));
      },
      onSuccess: () => {
        const fullUrl = upload.url || "";
        const id = fullUrl.split("/").pop() || "unknown-id";
        setUploadUrl(fullUrl);
        setUploadId(id);
        setStatus("completed");
        setTelemetry((prev) => ({
          ...prev,
          percentage: 100,
          bytesUploaded: prev.bytesTotal,
        }));
        toast.success("Video ingested successfully. Transcoding started.");
      },
    });

    uploadRef.current = upload;

    // Check for previous incomplete upload to resume seamlessly
    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch((err) => {
        console.warn("Could not check previous uploads, starting fresh:", err);
        upload.start();
      });
  }, []);

  const handlePause = () => {
    if (uploadRef.current && status === "uploading") {
      uploadRef.current.abort();
      setStatus("paused");
    }
  };

  const handleResume = () => {
    if (uploadRef.current && status === "paused") {
      uploadRef.current.start();
      setStatus("uploading");
    }
  };

  const handleCancel = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setFile(null);
    setStatus("idle");
    setTelemetry({
      bytesUploaded: 0,
      bytesTotal: 0,
      percentage: 0,
      speedMBps: 0,
      estimatedSecondsRemaining: 0,
    });
    setErrorMessage(null);
    setUploadUrl(null);
    setUploadId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/") || /\.(mp4|mov|mkv|avi|webm)$/i.test(droppedFile.name)) {
        startUpload(droppedFile);
      } else {
        setStatus("error");
        setErrorMessage("Please select a valid video file (MP4, MOV, MKV, AVI, WebM).");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="video/mp4,video/quicktime,video/x-matroska,video/x-msvideo,video/webm"
        className="hidden"
      />

      {/* STATE 1: Idle (Dropzone) */}
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-md border-2 border-dashed transition-all duration-300 p-12 text-center flex flex-col items-center justify-center overflow-hidden bg-white/[0.02] backdrop-blur-sm ${
            isDragOver
              ? "border-white/40 bg-white/[0.04]"
              : "border-white/10 hover:bg-white/[0.04] hover:border-white/20"
          }`}
        >
          {/* Icon Container */}
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
              <UploadCloud className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-xl font-sans font-light tracking-tight text-white/90 mb-2">
            Drag & Drop video file here
          </h3>
          <p className="text-xs font-sans font-medium text-slate-500 max-w-md mb-6 leading-relaxed uppercase tracking-wider">
            Chunked, resumable uploads powered by the Tus Protocol
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase px-4 py-2 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all rounded-md cursor-pointer"
            >
              <FileVideo className="w-3.5 h-3.5" />
              Browse Video File
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 text-[9px] font-sans font-semibold text-slate-500 uppercase tracking-wide">
            <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent">MP4, MOV, MKV, WebM</span>
            <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent">5MB Resumable Chunks</span>
            <span className="px-2.5 py-1 rounded-md border border-white/10 bg-transparent">Up to 50 GB</span>
          </div>
        </div>
      )}

      {/* STATE 2 & 3: Uploading or Paused */}
      {(status === "uploading" || status === "paused") && file && (
        <div className="rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-sm p-6 shadow-2xl relative overflow-hidden">
          {/* Top Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-sans font-medium text-slate-200 truncate">
                  {file.name}
                </h4>
                <p className="text-[10px] font-sans font-medium text-slate-500 mt-0.5">
                  {formatBytes(telemetry.bytesUploaded)} of {formatBytes(telemetry.bytesTotal)}
                </p>
              </div>
            </div>

            {/* Action Buttons: Pause/Resume + Cancel */}
            <div className="flex items-center gap-2 shrink-0">
              {status === "uploading" ? (
                <button
                  onClick={handlePause}
                  title="Pause Upload"
                  className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  title="Resume Upload"
                  className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleCancel}
                title="Cancel Upload"
                className="p-2 rounded-md bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 border border-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-Time Progress Bar */}
          <div className="relative mb-4">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  status === "paused"
                    ? "bg-amber-400/80"
                    : "bg-white/80"
                }`}
                style={{ width: `${Math.max(telemetry.percentage, 1)}%` }}
              />
            </div>
          </div>

          {/* Telemetry Stats Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs font-sans font-medium text-slate-400 pt-2 border-t border-white/10 gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                status === "paused" ? "bg-amber-500/50" : "bg-emerald-500/50 animate-pulse"
              }`} />
              <span className="font-sans font-semibold text-[10px] uppercase tracking-wide text-slate-300">
                {status === "paused" ? "UPLOAD PAUSED" : `${telemetry.percentage}% COMPLETED`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[10px] font-sans font-medium text-slate-500">
              {status === "uploading" && telemetry.speedMBps > 0 && (
                <span className="text-slate-300">
                  {telemetry.speedMBps} MB/s
                </span>
              )}
              <span>{formatSeconds(telemetry.estimatedSecondsRemaining)}</span>
            </div>
          </div>

          {/* Protocol Note Banner */}
          <div className="mt-4 px-3 py-2 rounded-md bg-white/[0.01] border border-white/10 flex items-center justify-between text-[10px] font-sans font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Tus Resumable Protocol active • Automatic byte resumption
            </span>
            <span>Chunk Size: 5 MB</span>
          </div>
        </div>
      )}

      {/* STATE 4: Completed (Success) */}
      {status === "completed" && file && (
        <div className="rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl relative overflow-hidden text-center">
          {/* Checkmark Box */}
          <div className="w-14 h-14 rounded-md bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-sans font-light tracking-tight text-white/90 mb-1">
            Upload Completed Successfully
          </h3>
          <p className="text-xs font-sans font-medium text-slate-500 max-w-md mx-auto mb-6 uppercase tracking-wider">
            Video payload received by storage gateway. Asynchronous ABR transcoding queued.
          </p>

          {/* Metadata Card */}
          <div className="max-w-lg mx-auto bg-white/[0.01] border border-white/10 rounded-md p-4 text-left font-sans font-medium text-xs mb-6 space-y-2">
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span className="text-slate-500">File Name:</span>
              <span className="truncate max-w-[280px] text-white/90">{file.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span className="text-slate-500">File Size:</span>
              <span>{formatBytes(file.size)}</span>
            </div>
            {uploadId && (
              <div className="flex justify-between items-center text-slate-300 text-[11px]">
                <span className="text-slate-500">Upload ID:</span>
                <span className="text-slate-400 truncate max-w-[280px]">{uploadId}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span className="text-slate-500">Pipeline Status:</span>
              <span className="text-slate-400 inline-flex items-center gap-1.5 font-sans font-semibold text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border border-white/10 bg-transparent">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" /> Queued for FFmpeg
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-slate-300 font-sans font-semibold text-[10px] tracking-wide uppercase px-4 py-2 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all rounded-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Watch in Video Library
            </Link>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 border border-white/10 bg-transparent text-slate-400 font-sans font-semibold text-[10px] tracking-wide uppercase px-4 py-2 hover:bg-white/5 hover:text-slate-200 hover:border-white/20 transition-all rounded-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Upload Another Video
            </button>
          </div>
        </div>
      )}

      {/* STATE 5: Error */}
      {status === "error" && (
        <div className="rounded-md border border-rose-500/20 bg-white/[0.02] backdrop-blur-sm p-6 shadow-2xl relative text-left">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-sans font-medium text-rose-200 mb-1">
                Upload Encountered An Error
              </h4>
              <p className="text-xs font-sans font-medium text-rose-300/80 mb-4 leading-relaxed">
                {errorMessage || "An unexpected error occurred while communicating with the ingestion server."}
              </p>
              <div className="flex items-center gap-3">
                {file && (
                  <button
                    onClick={() => startUpload(file)}
                    className="inline-flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 text-rose-200 font-sans font-semibold text-[10px] tracking-wide uppercase px-3 py-1.5 hover:bg-rose-500/20 transition-colors rounded-md cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry Upload
                  </button>
                )}
                <button
                  onClick={handleCancel}
                  className="border border-white/10 bg-white/5 text-slate-400 font-sans font-semibold text-[10px] tracking-wide uppercase px-3 py-1.5 hover:bg-white/10 hover:text-white transition-colors rounded-md cursor-pointer"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
