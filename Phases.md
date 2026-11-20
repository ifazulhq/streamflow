# Implementation Roadmap & Phases (Phases.md)
## Scalable Video Streaming Platform

**Document Version:** 1.0.0  
**Status:** Active Execution Guide  
**Execution Model:** Sequential Phase-Gate Milestones  

---

## Roadmap Overview

```
┌─────────────────────────────────┐
│ Phase 1: Foundation             │  [COMPLETED]
│ (Docker, Postgres, Redis, MinIO)│
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 2: Resumable Ingestion    │  [COMPLETED]
│ (tus-js-client + Express Hooks) │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 3: Transcoding Pipeline   │  [COMPLETED]
│ (BullMQ + FFmpeg + MinIO S3)    │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 4: Adaptive Playback      │  [COMPLETED]
│ (Next.js Dashboard + HLS.js)    │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 5: Object Storage         │  [COMPLETED]
│ (Tus S3Store + MinIO + Worker)  │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ Phase 6: Cloud Deployment       │  [UPCOMING]
│ (Vercel + AWS S3 + Railway/ECS) │
└─────────────────────────────────┘
```

---

## Phase 1: Foundation (COMPLETED)

### Goal
Stand up the core local containerized infrastructure, initialize the shared relational database schema via Prisma v8 declarative contracts, configure environment variables, and establish the baseline Express server with Tus protocol plumbing.

### Technical Scope & Deliverables
1. **Container Infrastructure (`docker-compose.yml`):**
   - **PostgreSQL 15 (`video_postgres`):** Running on port `5432`, configured with persistent volume `postgres_data` and database `videodb`.
   - **Redis 7 Alpine (`video_redis`):** Running on port `6379` for BullMQ distributed queues.
   - **MinIO S3 (`video_minio`):** Running on ports `9000` (S3 API) and `9001` (Web Console) with persistent volume `minio_data`.
2. **Database Contract & Client (`api-server/src/prisma`):**
   - Configured Prisma 8 contract in `contract.prisma`.
   - Declared `Video` entity with `temporal.createdAt()` and `temporal.updatedAt()` timestamps.
   - Compiled contract metadata (`contract.json` and `contract.d.ts`) via `npx prisma contract emit`.
3. **API Server Skeleton (`api-server`):**
   - Express server listening on port `8000` with CORS configuration exposing Tus headers.
   - Initialized `@tus/server` with `@tus/file-store` on `./uploads`.
   - Express 5 routing handles `/uploads` and `/uploads/:id`.
   - Attached Prisma client logging on `EVENTS.POST_FINISH`.

### Exit Criteria
- [x] `docker compose up -d` brings up PostgreSQL, Redis, and MinIO in a healthy state.
- [x] `api-server` starts successfully on `http://localhost:8000` with no unhandled errors.
- [x] PostgreSQL connection string verified via `.env` (`DATABASE_URL`).
- [x] Prisma data contract compiles without syntax or type errors.

---

## Phase 2: Resumable Ingestion (IN PROGRESS)

### Goal
Build an enterprise-grade, resumable upload experience capable of surviving real-world network drops, browser crashes, and mobile handovers. Integrate a responsive drag-and-drop UI in Next.js using `tus-js-client` and complete the backend ingestion hooks in `api-server` to automatically persist metadata and push transcoding jobs to the Redis queue.

### Technical Scope & Deliverables
1. **Frontend Drag-and-Drop Ingestion UI (`frontend/app`):**
   - Create a dedicated Client Component (`UploadDropzone.tsx`) with drag-and-drop file selection.
   - File validation: Format restrictions (`video/*`, `.mp4`, `.mov`, `.mkv`, `.avi`), size calculation, and metadata parsing.
   - Integration with `tus-js-client`:
     - Chunk size configuration (default 5 MB per chunk).
     - Auto-resumption with exponential backoff on network dropouts.
     - Byte-accurate progress indicators (percentage, upload speed, estimated time remaining).
     - Pause, resume, and cancel buttons with immediate state reflection.
2. **API Server Hook Completion (`api-server`):**
   - Transition file storage handling to prepare for S3/MinIO streaming (`@tus/s3-store`).
   - Finalize `EVENTS.POST_FINISH` in `index.js`:
     - Write complete `Video` record into PostgreSQL (`uploadId`, `originalName`, `title`, `fileSize`, `status = 'UPLOADING'`, `progress = 100`).
     - Initialize BullMQ `Queue` instance (`video-transcoding-queue`).
     - Dispatch transcode job payload (`videoId`, `uploadId`, `sourcePath`, `originalName`) to Redis.
   - Expose REST endpoint `GET /api/videos` to supply video list for the dashboard.
   - Expose REST endpoint `GET /api/videos/:id/status` for real-time status polling.

### Exit Criteria
- [ ] Uploading a 1 GB+ video file via the Next.js dropzone completes successfully without UI lockups.
- [ ] **Resumption Test:** Simulating network disconnection (toggling network offline in browser DevTools midway through upload) and reconnecting resumes the upload from the exact byte offset without restarting from 0%.
- [ ] Upon upload completion, a valid `Video` row is written to PostgreSQL with correct metadata.
- [ ] A corresponding job is confirmed present in Redis under the BullMQ queue key (`bull:video-transcoding-queue:*`).

---

## Phase 3: The Transcoding Pipeline (UPCOMING)

### Goal
Implement a fully decoupled, resilient background media processing service in `transcoding-worker` that consumes jobs from BullMQ, validates and encodes video files via `fluent-ffmpeg` into an Adaptive Bitrate (ABR) HLS matrix, and uploads segmented `.ts` chunks and `.m3u8` playlists into MinIO/S3 object storage.

### Technical Scope & Deliverables
1. **BullMQ Worker Daemon (`transcoding-worker/index.js`):**
   - Initialize BullMQ `Worker` listening to `video-transcoding-queue` with controlled concurrency (1–2 concurrent tasks per worker node).
   - Configure job stall intervals and automatic retry policies (3 attempts with exponential backoff).
   - Implement graceful shutdown on `SIGTERM` and `SIGINT` ensuring in-flight jobs release locks.
2. **FFmpeg & ffprobe Media Pipeline (`transcoding-worker`):**
   - **Pre-flight Probe:** Run `ffprobe` on raw upload to verify container, codec, aspect ratio, audio channels, and duration.
   - **Multi-Rendition Transcoding:** Execute FFmpeg with `fluent-ffmpeg` to generate H.264/AAC variants:
     - `1080p` (1920x1080 @ 4500 kbps)
     - `720p` (1280x720 @ 2500 kbps)
     - `480p` (854x480 @ 1200 kbps)
     - `360p` (640x360 @ 600 kbps)
     *(Guard against upscaling source resolution).*
   - **HLS Packaging:** Slice streams into 4-second `.ts` segments, generating individual `index.m3u8` variant playlists and an aggregated `master.m3u8` playlist.
   - **Progress Reporting:** Extract FFmpeg progress timestamps and update database `progress` (0–100%) and `status = 'PROCESSING'`.
3. **Storage Publishing & Cleanup:**
   - Initialize AWS S3 / MinIO SDK client pointing to `video_minio` (`http://localhost:9000`).
   - Stream completed `.ts` chunks and `.m3u8` manifests into the `transcoded-videos` bucket under `videos/:videoId/hls/`.
   - Update database `status = 'READY'`, set `masterPlaylist` path, and register generated `resolutions`.
   - Purge local temporary segment files and raw upload files from scratch directories.
4. **Dead-Letter Queue (DLQ) & Failure Handling:**
   - If transcode fails after max retries, mark database `status = 'FAILED'`, record error diagnostics, and retain job in BullMQ failed set.

### Exit Criteria
- [ ] Transcoding worker automatically picks up jobs dispatched by `api-server`.
- [ ] Source video transcodes into 1080p, 720p, 480p, and 360p variants without process crashes or memory leaks.
- [ ] Generated `master.m3u8` and corresponding `.ts` segments exist and verify inside the MinIO bucket.
- [ ] Database record transitions predictably from `UPLOADING` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY`.
- [ ] If a worker process is forcefully terminated (`kill -9`) mid-transcode, the stalled lock expires and the job is picked up by a restarted worker.

---

## Phase 4: Adaptive Playback (COMPLETED)

### Goal
Construct an enterprise-grade client playback experience in Next.js. Build a dynamic video management catalog and an ABR video player powered by `hls.js` capable of seamless auto-quality adaptation, manual rendition selection, and zero-stutter playback.

### Technical Scope & Deliverables
1. **Video Catalog & Status Dashboard (`frontend/app/dashboard`):**
   - High-density responsive grid with dark-mode styling and status badges.
   - Catalog cards link directly to dedicated `/watch/:id` cinema routes.
2. **Dedicated Cinema Watch Route (`frontend/app/watch/[id]/page.tsx`):**
   - Next.js Server Component fetching stream metadata from `GET /videos/:id`.
   - Dynamic `generateMetadata()` generating rich OpenGraph tags (`video.other`, direct stream URLs) and Twitter cards.
3. **Cinematic Player & Telemetry Engine (`components/CinemaPlayer.tsx`):**
   - Client Component integrating `hls.js` and HTML5 `<video>`.
   - **Hotkeys Engine:** Spacebar (Play/Pause), `F` (Fullscreen), `T` (Theater mode toggle), `S` (Stats for Nerds HUD toggle), `M` (Mute), Arrow keys (Seek / Volume).
   - **Low-Level Telemetry HUD:** Monospace overlay displaying active resolution/bitrate from `LEVEL_SWITCHED`, bandwidth estimate & dropped frames from `FRAG_BUFFERED`/`FRAG_LOADED`, and live buffer length from `timeupdate`.
   - **Theater Mode:** Expands player to full-width viewport with ambient atmospheric backlighting.

### Exit Criteria
- [x] Dashboard displays catalog of uploaded videos with accurate processing statuses and links to dedicated cinema watch pages.
- [x] `GET /videos/:id` endpoint returns single video metadata and master playlist URL.
- [x] `/watch/:id` server route renders with dynamic OpenGraph preview tags.
- [x] Cinema player hotkeys (`Space`, `F`, `T`, `S`) operate smoothly.
- [x] Stats for Nerds HUD renders real-time ABR resolution, bitrate, bandwidth estimate, dropped frames, and buffer length.

---

## Phase 5: Object Storage Integration (COMPLETED)

### Goal
Refactor the storage pipeline to eliminate local disk dependencies and achieve complete statelessness. Direct raw video uploads stream to MinIO via `@tus/s3-store`, the transcoding worker pulls raw video from MinIO into temporary scratch for FFmpeg, exports generated HLS playlists and segments into a public MinIO bucket, and the API drops static media serving so clients stream directly from object storage.

### Technical Scope & Deliverables
1. **Tus S3 Integration (`api-server`):**
   - Swapped `@tus/file-store` for `@tus/s3-store`.
   - Integrated AWS SDK v3 `S3Client` with local MinIO (`http://localhost:9000`).
   - Configured direct raw upload streaming to the `raw-videos` MinIO bucket.
2. **Worker MinIO Ingestion (`transcoding-worker`):**
   - Worker fetches raw video objects from `raw-videos` bucket using `GetObjectCommand`.
   - Streams into isolated temporary scratch directory for FFmpeg multi-rendition encoding (`1080p`, `720p`, `480p`).
3. **Public HLS Export:**
   - Worker recursively uploads generated `master.m3u8`, variant playlists, and `.ts` chunks to the `hls-streams` MinIO bucket.
   - Sets appropriate MIME types (`application/vnd.apple.mpegurl`, `video/mp2t`) and cache headers.
   - Cleans up temporary scratch directory in `finally` block to guarantee 100% statelessness.
4. **Database State Persistence:**
   - Worker updates Prisma record status to `READY`, sets `progress = 100`, and stores public MinIO URL (`http://localhost:9000/hls-streams/:videoId/master.m3u8`).
5. **Stateless API Gateway Cleanup:**
   - Removed `express.static()` middleware from `api-server/index.js`.
   - Client players stream directly from MinIO object storage with zero Express API bottleneck.
6. **Creator Management Studio & Asset Purge (`frontend/app/studio`):**
   - Implemented `DELETE /videos/:id` cascading deletion across MinIO `raw-videos`, MinIO `hls-streams` prefix, and PostgreSQL via Prisma.
   - Built Next.js Server Component at `frontend/app/studio/page.tsx` with responsive data table, status badges, and KPI counters.
   - Client Component `DeleteVideoButton.tsx` sends API purge requests and revalidates server payloads via `router.refresh()`.

### Exit Criteria
- [x] Tus server streams chunked uploads directly to MinIO `raw-videos` bucket.
- [x] Worker reads raw video from MinIO `raw-videos` bucket and encodes into HLS matrix.
- [x] All `.m3u8` playlists and `.ts` segments uploaded to public `hls-streams` bucket.
- [x] Prisma database record contains public MinIO master playlist URL.
- [x] `express.static()` middleware removed from API server; client plays streams directly from MinIO.
- [x] Creator Studio data table lists all videos with live status indicators.
- [x] Cascade deletion successfully purges database record and associated MinIO raw and HLS assets.

---

## Phase 6: Cloud Deployment (UPCOMING)

### Goal
Transition the platform from local Docker Compose infrastructure to a production cloud deployment across AWS S3 (storage), Vercel (frontend), and Railway/Render/AWS ECS (backend API & transcoding worker cluster).

### Technical Scope & Deliverables
1. **Object Storage Migration (AWS S3 & CloudFront):**
   - Create S3 buckets: `prod-video-raw-uploads` and `prod-video-transcoded-hls`.
   - Configure S3 CORS policy for web playback and multipart chunked uploads.
   - Attach AWS CloudFront CDN distribution in front of `prod-video-transcoded-hls` with permanent caching for `.ts` segments and short TTL for `.m3u8`.
2. **Managed Database & Redis:**
   - Provision managed PostgreSQL on Neon, Supabase, or AWS RDS.
   - Provision managed Redis on Upstash or AWS ElastiCache.
   - Run Prisma migrations against production database: `npx prisma db migrate`.
3. **Frontend Deployment (Vercel):**
   - Deploy Next.js App Router application to Vercel.
   - Configure environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CDN_URL`).
4. **Backend & Worker Deployment (Railway / Render / AWS ECS):**
   - Deploy `api-server` as a stateless Node.js container with auto-scaling.
   - Deploy `transcoding-worker` as a dedicated container with FFmpeg binaries pre-installed.
   - Configure worker horizontal auto-scaling based on BullMQ queue depth.

### Exit Criteria
- [ ] End-to-end production workflow functions across public internet domains:
  $$\text{Vercel Frontend} \longrightarrow \text{Cloud Ingestion API} \longrightarrow \text{AWS S3} \longrightarrow \text{Cloud Worker} \longrightarrow \text{CloudFront CDN} \longrightarrow \text{Vercel Player}$$
- [ ] CloudFront successfully caches `.ts` video segments with high cache-hit ratio (> 95%).
- [ ] Zero local storage dependencies remain; all assets persist strictly in AWS S3.
- [ ] Uptime monitoring and error telemetry active (Sentry, Datadog, or CloudWatch).
