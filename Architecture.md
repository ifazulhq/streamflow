# System Architecture Document
## Scalable Video Streaming Platform

**Document Version:** 1.0.0  
**Target Infrastructure:** Distributed Microservices Monorepo  
**Primary Objectives:** Resilient chunked ingestion, asynchronous media transcoding, Adaptive Bitrate Streaming (ABR)  

---

## 1. System Overview & Architectural Paradigm

This platform is engineered around an **Event-Driven, Decoupled Architecture**. Ingestion and heavy media crunching are strictly segregated to ensure that network-intensive uploads do not starve CPU-intensive transcoding pipelines, and vice versa.

The architecture centers around five core pillars:
1. **Resilient Chunked Ingestion:** Tus protocol decouples upload progress from uninterrupted network sessions.
2. **Asynchronous Message Broker:** BullMQ backed by Redis isolates HTTP request handling from transcoding compute workloads.
3. **Stateless Worker Cluster:** Dedicated Node.js worker nodes manage FFmpeg processes, allowing compute resources to scale horizontally.
4. **Unified Object Storage:** S3-compatible object storage (MinIO locally, AWS S3 in production) serves as the persistent source of truth for both raw uploads and chunked HLS media segments.
5. **Adaptive Bitrate Delivery:** HLS (HTTP Live Streaming) playlists segment video into 4-second chunks at multiple resolutions, dynamically adapting to client bandwidth conditions.

---

## 2. End-to-End System Flow (Video Lifecycle)

The lifecycle of a video traverses eight distinct phases across seven architectural tiers:

```
[1. Next.js Client] ──(Tus Upload Chunks)──► [2. Express API Server]
                                                        │
                                                        ▼
                                             [3. Local FileStore / Ingestion]
                                                        │
                                                        ├─► [4. PostgreSQL (Prisma ORM)]
                                                        │   (Video State: UPLOADING)
                                                        │
                                                        ▼
                                             [5. Redis BullMQ Queue]
                                             (transcode-video job)
                                                        │
                                                        ▼
                                             [6. Transcoding Worker]
                                                        │
                                                        ├─► [7. FFmpeg ABR Processing]
                                                        │   (1080p, 720p, 480p, 360p .ts/.m3u8)
                                                        │
                                                        ▼
                                             [8. MinIO / S3 Storage]
                                             (master.m3u8 + variant playlists + .ts)
                                                        │
                                                        ▼
[1. Next.js Client / HLS.js Player] ◄──(HLS Playback)───┘
```

### Detailed Lifecycle Phases:

#### Phase 1: Upload Initialization & Chunk Streaming
1. **Handshake (`POST /uploads`):** The Next.js client initiates an upload via `tus-js-client`. The Express API server (`@tus/server`) validates request metadata (filename, file size, MIME type) and allocates an upload instance, returning a unique `uploadId` and location URI (`/uploads/:id`).
2. **Chunk Transmission (`PATCH /uploads/:id`):** The client slices the source video into discrete binary chunks and sends them sequentially with `Upload-Offset` headers. 
3. **Storage Ingestion:** The `@tus/server` engine delegates incoming chunks to its datastore (`FileStore` on `./uploads`, designed for drop-in migration to `@tus/s3-store`).
4. **Network Drop Recovery (`HEAD /uploads/:id`):** If network connectivity fails, the client automatically re-queries the server's byte offset and resumes transmission without re-sending previously acknowledged chunks.

#### Phase 2: Ingestion Finalization & Database Registration
5. **Completion Event (`EVENTS.POST_FINISH`):** When the final byte chunk is written and verified, `@tus/server` emits `EVENTS.POST_FINISH`.
6. **State Persistence:** The Express server traps this event, connects to PostgreSQL via Prisma ORM, and inserts a new `Video` record:
   - `uploadId`: Tus file identifier.
   - `title` / `originalName`: Extracted from upload metadata.
   - `status`: `'UPLOADING'` (or initial queued state).
   - `progress`: `100` (upload completed).
7. **Job Enqueueing:** The API server enqueues a background job into Redis via BullMQ (`transcode-queue`):
   ```json
   {
     "videoId": "uuid-v4",
     "uploadId": "tus-upload-id",
     "sourcePath": "./uploads/tus-upload-id",
     "originalName": "presentation.mp4"
   }
   ```

#### Phase 3: Background Worker Processing
8. **Job Consumption:** An idle Node.js transcoding worker pulls the job from the BullMQ queue using a reliable lock mechanism.
9. **Status Transition:** The worker updates the database record to `status = 'PROCESSING'` and sets `progress = 0`.
10. **Pre-Flight Inspection (`ffprobe`):** The worker inspects the source media to validate container integrity, stream codecs, source resolution, and duration. Corrupt or unreadable files fail immediately with detailed diagnostics.

#### Phase 4: FFmpeg Transcoding & ABR Packaging
11. **Multi-Rendition Transcoding:** The worker executes `fluent-ffmpeg` to encode the source video into targeted ABR renditions:
    - **1080p** (1920x1080 @ 4500 kbps)
    - **720p** (1280x720 @ 2500 kbps)
    - **480p** (854x480 @ 1200 kbps)
    - **360p** (640x360 @ 600 kbps)
    *(Capped at the original source resolution to prevent artificial upscaling).*
12. **Segmentation:** FFmpeg splits each rendition into self-contained 4-second MPEG-2 Transport Stream (`.ts`) segments and generates corresponding variant index playlists (`720p/index.m3u8`, etc.).
13. **Master Playlist Construction:** The worker constructs a `master.m3u8` manifest tying together all available resolution variants with their respective bandwidth, codec (`avc1.4d401f`), and resolution attributes.

#### Phase 5: Storage Upload & Finalization
14. **Asset Publishing:** The worker transfers all `.m3u8` playlists and `.ts` segment chunks into MinIO/S3 under `videos/:videoId/hls/`.
15. **Database Finalization:** Once S3 uploads verify:
    - `status` updates to `'READY'`.
    - `progress` updates to `100`.
    - `masterPlaylist` is populated with the playback URL/key.
    - `resolutions` array updates with generated profiles (`["1080p", "720p", "480p", "360p"]`).
16. **Scratch Cleanup:** The worker purges local temporary segment files and raw ingestion artifacts from disk.

#### Phase 6: Adaptive Client Playback
17. **Manifest Request:** The Next.js client initializes an HLS player (e.g., `Hls.js` or `Video.js`) targeting `master.m3u8`.
18. **Dynamic ABR Switching:** The player evaluates available bandwidth, device viewport, and buffer health, requesting optimal `.ts` chunks dynamically (e.g., dropping from 1080p to 480p if network throughput drops, and stepping back up when stabilized).

---

## 3. Technology Stack Breakdown

| Layer | Technology | Primary Role / Justification |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (App Router)** | Server-side rendering, optimized client routing, upload UI, and media dashboard. |
| | **Tailwind CSS** | Design system styling, responsive layouts, dark mode support. |
| | **HLS.js / Video.js** | Client-side MSE (Media Source Extensions) playback, dynamic ABR bitrate switching, and buffer management. |
| | **tus-js-client** | Client-side chunk slicing, offset negotiation, and exponential backoff retry. |
| **Backend API** | **Express.js (v5)** | High-throughput HTTP API gateway, route handling, and middleware integration. |
| | **@tus/server** | Official Node.js Tus 1.0.0 protocol implementation handling chunked resumable streams. |
| | **@tus/file-store** | Local filesystem chunk storage engine (pluggable to `@tus/s3-store`). |
| | **CORS** | Exposes Tus-specific headers (`Upload-Offset`, `Upload-Length`, `Tus-Resumable`, `Upload-Metadata`). |
| **State & ORM** | **PostgreSQL (v15)** | Relational database maintaining video records, processing states, rendition catalogs, and user identities. |
| | **Prisma ORM (v8)** | Type-safe database queries, data contract enforcement (`contract.prisma`), and schema migrations. |
| **Queue / Broker**| **Redis (v7 Alpine)** | In-memory broker managing distributed task queues, locks, and worker heartbeats. |
| | **BullMQ (v6)** | Enterprise distributed message queue with stalled-job detection, job retries, backpressure, and concurrency controls. |
| **Transcoding** | **Node.js Worker** | Dedicated daemon consuming BullMQ jobs, detached from the HTTP server lifecycle. |
| | **fluent-ffmpeg** | Node.js abstraction layer over native FFmpeg CLI binaries. |
| | **FFmpeg & ffprobe** | Industrial-grade media processing engine for demuxing, video scaling, H.264/AAC encoding, and HLS segmentation. |
| **Storage & Infra**| **MinIO (S3-Compatible)**| High-performance distributed object storage housing segmented video assets and raw master files. |
| | **Docker Compose** | Multi-container local development orchestrator bundling PostgreSQL, Redis, and MinIO. |

---

## 4. Monorepo Directory Structure

The project is structured as a modular monorepo cleanly isolating concerns between client interfaces, API ingestion, background media processing, and container infrastructure:

```
scalable-video-streaming/
├── PRD.md                         # Product Requirements Document
├── Architecture.md                # System Architecture & Technical Specifications (This file)
├── docker-compose.yml             # Local infrastructure stack (Postgres, Redis, MinIO)
│
├── api-server/                    # Ingestion & Gateway Service (Express + Tus)
│   ├── index.js                   # Express server entry point, Tus setup, Prisma logging
│   ├── package.json               # Dependencies (@tus/server, @prisma/client, express, cors)
│   ├── .env                       # Environment variables (PORT, DATABASE_URL)
│   ├── uploads/                   # Staging directory for local Tus chunked uploads
│   ├── prisma.config.ts           # Prisma 8 CLI configuration
│   └── src/
│       └── prisma/
│           ├── contract.prisma    # Declarative data contract & schema definition
│           ├── contract.d.ts      # Generated TypeScript type definitions
│           ├── contract.json      # Compiled model metadata
│           └── db.ts              # Exported PostgreSQL database client instance
│
├── transcoding-worker/            # Background Media Processing Service
│   ├── package.json               # Dependencies (bullmq, fluent-ffmpeg, ioredis, dotenv)
│   ├── index.js                   # BullMQ queue consumer, job coordinator, and status reporter
│   ├── Dockerfile                 # Worker container definition with pre-installed FFmpeg
│   └── .env                       # Worker environment variables (REDIS_URL, S3_ENDPOINT, DB_URL)
│
└── frontend/                      # Client Application (Next.js App Router)
    ├── package.json               # Dependencies (next, react, tus-js-client, hls.js, tailwindcss)
    ├── next.config.ts             # Next.js build configuration
    ├── tsconfig.json              # TypeScript configuration
    ├── public/                    # Static assets & player icons
    └── app/
        ├── layout.tsx             # Root layout with HTML headers and styling wrappers
        ├── page.tsx               # Creator upload dashboard and video player interface
        └── globals.css            # Base Tailwind styles and CSS variables
```

---

## 5. Data Model & Video State Machine

### 5.1 Database Schema (`Video` Entity)

The `Video` entity in [api-server/src/prisma/contract.prisma](file:///c:/Users/IFAZUL%20HAQUE/scalable-video-streaming/api-server/src/prisma/contract.prisma) models the end-to-end lifecycle and metadata:

```prisma
model Video {
  id              String      @id @default(uuid())
  title           String?     @default("Untitled Video")
  originalName    String?
  uploadId        String      @unique
  status          String      @default("UPLOADING")
  progress        Int         @default(0)
  masterPlaylist  String?
  resolutions     String[]    @default([])
  createdAt       temporal.createdAt()
  updatedAt       temporal.updatedAt()
}
```

### 5.2 Video State Machine

The video record transitions deterministically through four primary operational states:

```
            [ UPLOADING ]
                  │
                  │ Tus EVENTS.POST_FINISH
                  ▼
             [ QUEUED ]
                  │
                  │ Worker picks up BullMQ job
                  ▼
            [ PROCESSING ] ──(FFmpeg / I/O Error)──► [ FAILED ]
                  │
                  │ All HLS segments uploaded & verified
                  ▼
              [ READY ]
```

#### State Definitions & Invariants:
1. **`UPLOADING` (Initial State):**
   - **Trigger:** First chunk arrives via Tus or client registers upload.
   - **Progress:** Reflects upload percentage (0–100%).
   - **Invariant:** `masterPlaylist` is `null`. File is not yet streamable.
2. **`QUEUED`:**
   - **Trigger:** Tus emits `POST_FINISH`. Upload bytes fully written to disk or object storage.
   - **Progress:** Fixed at `100` (upload complete).
   - **Action:** Job dispatched to Redis queue. Awaiting worker availability.
3. **`PROCESSING`:**
   - **Trigger:** Worker consumes job and begins `ffprobe` / `ffmpeg` execution.
   - **Progress:** Reflects real-time transcoding progress (0–99%) mapped from FFmpeg timestamps against total duration.
   - **Invariant:** In-flight lock maintained via Redis heartbeat to prevent duplicate processing.
4. **`READY` (Terminal Success State):**
   - **Trigger:** Variant playlists and all `.ts` segments uploaded to MinIO/S3; master playlist compiled.
   - **Progress:** `100`.
   - **Fields Populated:** `masterPlaylist` contains the stream URI; `resolutions` contains the available profile array (e.g., `["1080p", "720p", "480p", "360p"]`).
5. **`FAILED` (Terminal Error State):**
   - **Trigger:** Unrecoverable encoding error, invalid video stream, or disk/network I/O failure exceeding retry threshold.
   - **Action:** Error diagnostics logged; temporary working files cleaned up.

---

## 6. Communication Protocols & Network Interfaces

1. **Client to Ingestion API (Tus 1.0.0 over HTTP/1.1 or HTTP/2):**
   - Resumable file transfer utilizing standard HTTP methods (`POST`, `HEAD`, `PATCH`, `DELETE`).
   - Standardized headers: `Upload-Offset`, `Upload-Length`, `Tus-Resumable: 1.0.0`, `Upload-Metadata`.
2. **API Server to Database (PostgreSQL Wire Protocol):**
   - Managed via Prisma ORM client with connection pooling (`DATABASE_URL`).
3. **API Server to Worker Cluster (Redis Protocol / RESP):**
   - BullMQ produces and consumes job payloads over persistent TCP connections to Redis.
   - Heartbeat stall timers (`lockDuration: 30000ms`) detect worker node terminations.
4. **Worker to Object Storage (S3 API / HTTP REST):**
   - Multipart parallel uploads for media segments into MinIO/S3.
5. **Client to Object Storage / CDN (HTTP Live Streaming over HTTPS):**
   - Client requests `master.m3u8` playlist.
   - Media chunks (`.ts`) fetched via standard HTTP `GET` requests with aggressive CDN edge caching headers.

---

## 7. Scalability & Resilience Guarantees

- **No Upload Interruption from Restarts:** Because Tus writes byte offsets persistently, restarting the Express API server does not invalidate in-flight client uploads; clients query `HEAD` and resume immediately.
- **Worker Crash Recovery:** If a worker node crashes mid-transcode (OOM or node preemption), BullMQ identifies the expired stall lock, clears the stale job, and reassigns it to another worker node automatically.
- **Resource Protection:** Workers process tasks with controlled concurrency (typically 1–2 concurrent FFmpeg jobs per node), preventing CPU exhaustion and ensuring predictable transcode throughput.
- **Storage Independence:** Local storage in `api-server/uploads` acts as a temporary buffer during development, with an immediate production path to direct MinIO/S3 streaming via `@tus/s3-store`.
