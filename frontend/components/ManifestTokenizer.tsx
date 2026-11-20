"use client";

import React, { useState } from "react";

const DEFAULT_MOCK_MANIFEST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=4500000,AVERAGE-BANDWIDTH=4000000,RESOLUTION=1920x1080,FRAME-RATE=24.000,CODECS="avc1.640028,mp4a.40.2"
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,AVERAGE-BANDWIDTH=2200000,RESOLUTION=1280x720,FRAME-RATE=24.000,CODECS="avc1.4d401f,mp4a.40.2"
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,AVERAGE-BANDWIDTH=1000000,RESOLUTION=854x480,FRAME-RATE=24.000,CODECS="avc1.4d401f,mp4a.40.2"
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,AVERAGE-BANDWIDTH=700000,RESOLUTION=640x360,FRAME-RATE=24.000,CODECS="avc1.42e01e,mp4a.40.2"
360p.m3u8`;

const DEFAULT_URL =
  "http://localhost:9000/hls-streams/5e9ae1b2-1320-410a-b333-659fbe147b3a/master.m3u8";

export default function ManifestTokenizer() {
  const [manifestUrl, setManifestUrl] = useState(DEFAULT_URL);
  const [activeTab, setActiveTab] = useState<"curl" | "fetch">("curl");
  const [manifestText, setManifestText] = useState(DEFAULT_MOCK_MANIFEST);
  const [isInspecting, setIsInspecting] = useState(false);

  const handleInspect = async () => {
    setIsInspecting(true);
    // Client-side non-blocking fetch attempt with graceful fallback to mock manifest
    try {
      if (manifestUrl.startsWith("http://") || manifestUrl.startsWith("https://")) {
        const res = await fetch(manifestUrl, { method: "GET" });
        if (res.ok) {
          const text = await res.text();
          if (text.includes("#EXTM3U")) {
            setManifestText(text);
            setIsInspecting(false);
            return;
          }
        }
      }
    } catch {
      // Fallback to internal tokenized structure
    }
    setManifestText(DEFAULT_MOCK_MANIFEST);
    setIsInspecting(false);
  };

  const lines = manifestText.split("\n");

  const curlSnippet = `curl -X GET "${manifestUrl}" \\
  -H "Accept: application/vnd.apple.mpegurl"`;

  const fetchSnippet = `const res = await fetch("${manifestUrl}", {
  headers: { "Accept": "application/vnd.apple.mpegurl" }
});
const manifest = await res.text();`;

  return (
    <div className="w-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col lg:flex-row">
      {/* Left Rail (Request Configurator) */}
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/10 p-6 flex flex-col gap-6 bg-white/[0.01]">
        {/* Title */}
        <span className="font-sans font-bold text-[10px] tracking-[0.2em] text-slate-400 uppercase">
          API REQUEST
        </span>

        {/* Input Field */}
        <div className="flex flex-col gap-2">
          <label className="font-sans text-[10px] uppercase tracking-wider text-slate-400">
            Manifest URL
          </label>
          <input
            type="text"
            value={manifestUrl}
            onChange={(e) => setManifestUrl(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/10 text-white font-mono text-xs rounded-md px-3 py-2.5 focus:outline-none focus:border-white/30 truncate"
            placeholder="http://..."
          />
        </div>

        {/* Code Snippet Tabs */}
        <div className="flex flex-col gap-3">
          <div className="flex border-b border-white/10 gap-4 text-xs font-sans">
            <button
              onClick={() => setActiveTab("curl")}
              className={`pb-2 uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                activeTab === "curl"
                  ? "text-white border-b-2 border-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab("fetch")}
              className={`pb-2 uppercase tracking-wider font-bold transition-colors cursor-pointer ${
                activeTab === "fetch"
                  ? "text-white border-b-2 border-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Fetch
            </button>
          </div>

          <div className="bg-[#050505] border border-white/5 rounded-md p-3 font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre leading-relaxed">
            {activeTab === "curl" ? curlSnippet : fetchSnippet}
          </div>
        </div>

        {/* Inspect Button */}
        <button
          onClick={handleInspect}
          disabled={isInspecting}
          className="w-full py-3 bg-slate-400/10 hover:bg-slate-400/20 border border-slate-400/30 text-white font-sans text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
        >
          {isInspecting ? "Inspecting..." : "Inspect Manifest"}
        </button>
      </div>

      {/* Right Rail (Interactive Tokenizer) */}
      <div className="w-full lg:w-2/3 p-6 flex flex-col gap-4">
        {/* Header Layout */}
        <div className="flex items-center justify-between">
          <span className="font-sans font-bold text-[10px] tracking-[0.2em] text-slate-400 uppercase">
            INSPECTION RESULTS
          </span>
          <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-sans font-bold">
            200 OK
          </span>
        </div>

        {/* Tokenized Output Area */}
        <div className="bg-[#050505] border border-white/5 rounded-md p-4 overflow-x-auto font-mono text-xs leading-relaxed flex flex-col gap-1">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-2" />;

            if (trimmed.startsWith("#EXT")) {
              const colonIdx = trimmed.indexOf(":");
              if (colonIdx !== -1) {
                const tag = trimmed.slice(0, colonIdx + 1);
                const params = trimmed.slice(colonIdx + 1);
                return (
                  <div key={idx} className="flex flex-wrap items-baseline gap-1">
                    <span className="text-white font-bold">{tag}</span>
                    <span className="text-slate-400">{params}</span>
                  </div>
                );
              }
              return (
                <div key={idx}>
                  <span className="text-white font-bold">{trimmed}</span>
                </div>
              );
            }

            if (
              trimmed.endsWith(".m3u8") ||
              trimmed.endsWith(".ts") ||
              !trimmed.startsWith("#")
            ) {
              return (
                <div key={idx} className="pl-4">
                  <span className="text-slate-400 underline decoration-slate-400/30 underline-offset-4 cursor-pointer hover:text-white transition-colors">
                    {trimmed}
                  </span>
                </div>
              );
            }

            return (
              <div key={idx} className="text-slate-400/70">
                {trimmed}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

