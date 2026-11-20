# Design System & UI/UX Specifications (Design.md)
## Scalable Video Streaming Platform — Cinematic Obsidian Design System

**Document Version:** 1.0.0  
**Design Theme:** Cinematic Obsidian (Dark-Mode First, High-Contrast Media Surfaces)  
**Target Clients:** Next.js App Router, Tailwind CSS, Media Source Extensions (Hls.js)  

---

## 1. Design Vision & Philosophy

The user experience is engineered around a **"Cinematic Obsidian"** aesthetic inspired by modern enterprise media studios and premium streaming services (Apple TV+, Linear, Netflix Studio). 

### Guiding Principles:
1. **Content is the Hero:** Backgrounds and chrome are subdued deep zincs and slates so video thumbnails, live scrubbers, and playback streams draw total visual focus.
2. **Vibrant Kinetic Feedback:** Accent colors (Electric Indigo, Neon Violet, and Cyan) are reserved for active interactions: upload progress indicators, buffering shimmers, and active resolution badges.
3. **Frosted Glassmorphism:** Floating overlays, controls, and flyout menus utilize translucent dark layers (`backdrop-blur-xl`, subtle 1px border glows) to create depth without obstructing media content.
4. **Information Density & Clarity:** Metadata (resolutions, bitrates, file sizes, time remaining) is strictly formatted in clean tabular hierarchy with monospace clarity.

---

## 2. Color Palette & Token Architecture

The design system enforces a **strict dark-mode default**. High-contrast slate and zinc neutrals minimize eye fatigue while glowing neon accents provide crisp operational feedback.

### 2.1 Core Neutral & Surface Colors

```
┌────────────────────────────────────────────────────────┐
│ Deep Obsidian Background (#090A0F)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Surface Card Base (#11141D)                      │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │ Surface Card Elevated (#181D29)            │  │  │
│  │  │  ┌──────────────────────────────────────┐  │  │  │
│  │  │  │ Glass Overlay: rgba(24, 29, 41, 0.7) │  │  │  │
│  │  │  └──────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

| Token Name | HEX Code | CSS Variable | Tailwind Equivalent | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `#090A0F` | `--bg-canvas` | `bg-[#090A0F]` / `bg-zinc-950` | Primary app canvas and player container background. |
| **Surface Base** | `#11141D` | `--bg-surface-base` | `bg-[#11141D]` / `bg-zinc-900` | Sidebar, header rails, and card base containers. |
| **Surface Elevated** | `#181D29` | `--bg-surface-elevated`| `bg-[#181D29]` / `bg-zinc-800/80`| Hover states, dropzone active panels, modal bodies. |
| **Surface Glass** | `rgba(24, 29, 41, 0.75)` | `--bg-glass` | `backdrop-blur-xl bg-[#181D29]/75` | Floating player control bars and flyout menus. |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | `--border-subtle` | `border-white/10` | Default card dividers and container borders. |
| **Border Active** | `rgba(99, 102, 241, 0.4)` | `--border-active` | `border-indigo-500/40` | Hover states and drag-and-drop focus rings. |

---

### 2.2 Vibrant Brand & Accent Palette

| Accent Role | HEX Code | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `#6366F1` | `bg-indigo-500` / `text-indigo-400` | Primary action buttons, active tab indicators, timeline scrubber. |
| **Secondary Accent** | `#8B5CF6` | `bg-purple-500` / `text-purple-400` | Secondary highlights, gradient blends, resolution pills. |
| **Kinetic Cyan** | `#06B6D4` | `bg-cyan-500` / `text-cyan-400` | Real-time upload speed indicators, network throughput meters. |
| **Linear Brand Gradient** | `from-indigo-500 via-purple-500 to-cyan-400` | `bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400` | Animated upload progress bar fill, hero brand highlights. |

---

### 2.3 Semantic Status Colors

| State | Background / Glow | Text Pill | Icon | Semantic Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **UPLOADING** | `bg-blue-500/10 border-blue-500/30` | `text-blue-400` | Spinner | Chunked Tus upload actively in transmission. |
| **PROCESSING** | `bg-amber-500/10 border-amber-500/30` | `text-amber-400` | Pulse Gear | In BullMQ queue or FFmpeg actively transcoding renditions. |
| **READY** | `bg-emerald-500/10 border-emerald-500/30` | `text-emerald-400`| Check Circle | HLS playlists and `.ts` segments published; streamable. |
| **FAILED** | `bg-rose-500/10 border-rose-500/30` | `text-rose-400` | Alert Triangle | Transcoding or validation error encountered. |

---

## 3. Typography & Hierarchy

The platform employs a dual-font structure: **Geist Sans** (or **Inter**) for high-legibility UI typography and **Geist Mono** (or **JetBrains Mono**) for numerical metrics, timestamps, and bitrates.

```
Typography Scale:
┌─────────────────────────────────────────────────────────────┐
│ DISPLAY H1 (32px / 700 / Tight)  "Studio Media Library"     │
│ H2 SECTION (20px / 600 / Snug)   "Active Ingestions"        │
│ H3 CARD (15px / 600 / Normal)    "Product_Demo_4K.mp4"      │
│ BODY (14px / 400 / Relaxed)      "Transcoding 4 renditions" │
│ CAPTION (12px / 500 / Normal)    "Uploaded 2 hours ago"     │
│ MONO CODE (11px / 500 / Wide)    "1080p • 4,500 kbps • 4s"  │
└─────────────────────────────────────────────────────────────┘
```

### Typography Hierarchy Table:
| Level | Font Size | Weight | Tracking | Color | Tailwind Classes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title (H1)** | 32px (`2rem`) | Bold (`700`) | `-0.025em` | `#F8FAFC` | `text-2xl lg:text-3xl font-bold tracking-tight text-slate-100` |
| **Section Header (H2)**| 20px (`1.25rem`)| Semibold (`600`)| `-0.02em` | `#F1F5F9` | `text-lg lg:text-xl font-semibold tracking-tight text-slate-200` |
| **Card Title (H3)** | 15px (`0.938rem`)| Semibold (`600`)| Normal | `#E2E8F0` | `text-sm lg:text-base font-semibold text-slate-200 truncate` |
| **Body Primary** | 14px (`0.875rem`)| Regular (`400`) | Normal | `#94A3B8` | `text-sm font-normal text-slate-400` |
| **Metadata / Subtitle**| 12px (`0.75rem`) | Medium (`500`) | `+0.01em` | `#64748B` | `text-xs font-medium text-slate-500` |
| **Technical Badges** | 11px (`0.688rem`)| Medium (`500`) | `+0.05em` | `#CBD5E1` | `font-mono text-[11px] uppercase tracking-wider text-slate-300` |

---

## 4. Component Specifications

### 4.1 Resumable Drag-and-Drop Ingestion Zone (`UploadDropzone.tsx`)

A full-featured ingestion component designed to handle multi-gigabyte uploads with continuous visual feedback.

```
┌ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┐
┆                         [ Upload Icon ]                       ┆
┆                Drag & Drop Video Files to Upload              ┆
┆             Supports MP4, MOV, MKV up to 50 GB                ┆
┆                                                               ┆
┆                   [ Browse Files Button ]                     ┆
└ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┘

Active Upload State:
┌───────────────────────────────────────────────────────────────┐
│ [Video Icon]  Product_Launch_2026_4K.mov             1.8 GB   │
│                                                               │
│ [======================== 64% ==================-----------]   │
│ 1.15 GB of 1.80 GB • 24.5 MB/s • 26s remaining     [Pause] [x]│
└───────────────────────────────────────────────────────────────┘
```

#### States & Micro-Interactions:
1. **Resting State:**
   - 2px dashed border: `border-dashed border-zinc-700/60 hover:border-indigo-500/50`.
   - Subtle background: `bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-300`.
   - Centered glowing upload icon with gentle hover bounce animation.
2. **Drag-Over State:**
   - Border transitions to solid vivid accent: `border-indigo-400 bg-indigo-950/20`.
   - Ambient drop glow: `shadow-[0_0_40px_rgba(99,102,241,0.15)] scale-[1.01]`.
   - Cursor changes to `copy`.
3. **Active Chunked Upload State:**
   - Switches from dropzone box to an elevated card surface (`bg-[#11141D] border border-white/10 rounded-2xl p-6`).
   - Progress Bar: Height 6px (`h-1.5`), rounded full (`rounded-full`), track `bg-zinc-800`.
   - Fill Bar: Animated gradient `bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400` with animated CSS keyframe shimmer.
   - Dynamic Telemetry Row (Geist Mono):
     - Upload percentage: `64%`
     - Bytes uploaded vs total: `1.15 GB / 1.80 GB`
     - Instantaneous transfer speed: `24.5 MB/s`
     - ETA counter: `26s remaining`
4. **Resumption & Control Actions:**
   - **Pause Button:** Pauses `tus-js-client` upload, changes icon to Play. Fill bar transitions from gradient to static amber.
   - **Resume Button:** Re-triggers `upload.start()`. Client sends `HEAD` request, matches remote offset, and resumes without restarting.
   - **Cancel Button:** Emits `DELETE` to purge partial upload and resets component state.

---

### 4.2 Cinematic ABR Video Player (`VideoPlayer.tsx`)

A minimalist, dark-mode video player integrating `Hls.js` with responsive overlay controls and an adaptive bitrate switcher.

```
┌───────────────────────────────────────────────────────────────┐
│ [▶ Play]  04:12 / 12:45                        [Auto (1080p)] [⛶]│
│ ────────────────────────●──────────────────────────────────── │
│ ▲ Ambient Glow Container (Radial blur under player)           │
└───────────────────────────────────────────────────────────────┘
```

#### Player Controls & Anatomy:
1. **Aspect Ratio Container:** Fixed 16:9 aspect ratio (`aspect-video w-full rounded-2xl overflow-hidden bg-black relative group`).
2. **Ambient Backlight Glow:** Optional background pseudo-element with radial blur (`blur-3xl opacity-20 -z-10 bg-indigo-600/30`) projecting video ambiance behind the screen.
3. **Floating Glassmorphic Control Bar:**
   - Anchored at the bottom with 16px inset padding: `absolute bottom-4 left-4 right-4`.
   - Glass backdrop: `bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3`.
   - Auto-hides on inactivity after 3 seconds of mouse stillness (`opacity-0 group-hover:opacity-100 transition-opacity duration-300`).
4. **Dual-Layer Scrub Bar:**
   - **Track (Buffer Bar):** `bg-white/20 h-1 rounded-full relative`. Buffered range fills with `bg-white/40`.
   - **Progress Bar:** High-visibility gradient `bg-indigo-500 h-1 rounded-full`.
   - **Scrubber Thumb:** 14px white circle with drop shadow (`shadow-md scale-0 group-hover/scrub:scale-100 transition-transform`).
   - **Hover Timestamp Tooltip:** Floating bubble above scrubber displaying hovered video time (`04:32`).
5. **Quality Toggle Flyout Menu (Gear Icon):**
   - Clickable gear icon opens a floating popover anchored above the button:
     ```
     ┌──────────────────────┐
     │ Playback Quality     │
     │ ──────────────────── │
     │ ✓ Auto (1080p)       │
     │   1080p  (4.5 Mbps)  │
     │   720p   (2.5 Mbps)  │
     │   480p   (1.2 Mbps)  │
     │   360p   (600 kbps)  │
     └──────────────────────┘
     ```
   - Auto option dynamically displays the currently resolved level in parentheses (e.g., `Auto (720p)`).
   - Selecting a specific resolution overrides ABR rules and locks the stream to the selected rendition.
6. **Auxiliary Controls:**
   - Play/Pause toggle with spacebar keyboard shortcut.
   - Volume slider with animated mute toggle icon.
   - Time elapsed / total duration in Geist Mono (`02:14 / 10:45`).
   - Fullscreen toggle button with Esc hotkey support.

---

## 5. Layout Architecture & Navigation

The application interface is structured around a persistent sidebar rail and a high-density, responsive media gallery grid.

```
┌─────────┬─────────────────────────────────────────────────────┐
│ Brand   │ Header: Search, Creator Profile, Quick Upload [+]   │
│ ────────┼─────────────────────────────────────────────────────┤
│ 📁 Studio│ Main Workspace:                                     │
│ 🎬 Videos│                                                     │
│ ⚙️ Queue │  [+ Drag-and-Drop Ingestion Zone]                   │
│ 📊 Stats │                                                     │
│         │  Recently Uploaded Videos (16:9 Grid)               │
│         │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│         │  │ [Thumbnail]  │ │ [Thumbnail]  │ │ [Thumbnail]  │ │
│         │  │ Title        │ │ Title        │ │ Title        │ │
│         │  │ 1080p • Ready│ │ 720p • Proc. │ │ 1080p • Ready│ │
│         │  └──────────────┘ └──────────────┘ └──────────────┘ │
└─────────┴─────────────────────────────────────────────────────┘
```

### 5.1 Persistent Side Navigation Bar (`Sidebar.tsx`)
- **Desktop Layout:** Fixed left rail (`w-64 min-h-screen bg-[#11141D] border-r border-white/5 flex flex-col justify-between p-4`).
- **Collapsed Tablet Mode:** Automatically contracts to `w-20` showing icon-only buttons with hover tooltips.
- **Mobile Mode:** Collapses into a bottom navigation tab bar on viewports `< 768px`.
- **Navigation Links:**
  - **Studio / Ingest:** Upload dropzone and active upload monitoring.
  - **Video Library:** Published catalog with status filtering.
  - **Transcoding Queue:** Live BullMQ job monitor and worker telemetry.
  - **System Settings:** S3 storage configuration, API keys, and CORS settings.

---

### 5.2 Responsive Video Gallery Grid (`VideoGrid.tsx`)

The video catalog utilizes a responsive CSS auto-fill grid to maximize screen real estate across diverse monitor sizes.

#### Grid Breakpoints:
- **Mobile (`< 640px`):** 1 Column (`grid-cols-1 gap-4`)
- **Tablet (`640px - 1024px`):** 2 Columns (`grid-cols-2 gap-6`)
- **Desktop (`1024px - 1536px`):** 3 Columns (`grid-cols-3 gap-6`)
- **Ultra-Wide (`> 1536px`):** 4 Columns (`grid-cols-4 gap-8`)

#### Video Card Anatomy (`VideoCard.tsx`):
1. **Thumbnail Frame (16:9):**
   - Container: `relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-indigo-500/40 transition-colors`.
   - Hover Play Overlay: Subtle gradient darkening with centered glowing play button.
   - Status Badge (Top-Right): Floating pill displaying `READY` (green), `PROCESSING` (amber), or `FAILED` (red).
   - Duration Tag (Bottom-Right): Monospace time badge `14:28` with `bg-black/80 px-1.5 py-0.5 rounded text-[11px] text-white`.
2. **Metadata Stack:**
   - **Title (H3):** `text-sm font-semibold text-slate-200 mt-3 truncate group-hover:text-indigo-400 transition-colors`.
   - **Sub-row:** Upload relative timestamp (`2 hours ago`) alongside file size (`1.4 GB`).
   - **Available Renditions Pills:** Mini horizontal badges indicating generated HLS levels:
     ```html
     <span class="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">1080p</span>
     <span class="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">720p</span>
     <span class="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded">480p</span>
     ```

---

## 6. Micro-Interactions & Animation Standards

1. **Spring Transitions:** Modals, quality dropdowns, and button hovers utilize spring physics:
   ```css
   transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
   ```
2. **Shimmer Loading Skeletons:** While video cards load from PostgreSQL, placeholders feature an animated left-to-right gradient sweep (`animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900`).
3. **Processing Pulse:** Videos in `PROCESSING` state exhibit a subtle breathing border glow to communicate active FFmpeg background work without distracting the user.

---

## 7. Accessibility & Ergonomics (WCAG 2.1 AA)

- **Contrast Ratios:** All body text meets a minimum contrast ratio of `4.5:1` against dark backgrounds; headline elements exceed `7:1`.
- **Keyboard Navigation:**
  - Full tab-index traversal across dropzone, upload cancel buttons, and video player controls.
  - Standard media hotkeys: `Space` (Play/Pause), `M` (Mute), `F` (Fullscreen), `Left/Right Arrow` (Seek ±5s), `Up/Down Arrow` (Volume ±10%).
- **Screen Reader Announcements:** ARIA labels on all icon-only buttons (`aria-label="Toggle Quality Menu"`). Live region (`aria-live="polite"`) updates screen readers when an upload reaches 100% or transcoding completes.
