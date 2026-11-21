# StreamFlow

**The Video OS for real-world infrastructure.**  
StreamFlow is a scalable, full-stack video ingestion, transcoding, and adaptive streaming platform built for resilient uploads and buffer-free playback.

**Live Demo:** [streamflow-nu-nine.vercel.app](https://streamflow-nu-nine.vercel.app)

## Key Features
* **Resumable Chunked Ingestion:** Byte-offset resumable video uploads powered by the Tus protocol (`@tus/server` & `tus-js-client`)—immune to network drops.
* **Asynchronous Transcoding Pipeline:** Background video processing orchestrated with BullMQ and Redis.
* **Adaptive Bitrate Playback:** Multi-resolution HLS delivery (1080p–360p) backed by S3-compatible object storage.
* **Creator Studio & Analytics:** Dedicated dashboard for managing video libraries, viewing analytics, generating embeddable players (`/embed/[id]`), and monitoring live system health (`/status`).
* **Authentication:** Secure Google OAuth integration via NextAuth.

## Tech Stack
* **Frontend:** Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS, NextAuth
* **Backend & Worker:** Node.js, Express 5, `@tus/server`, BullMQ, AWS S3 SDK
* **Database & Storage:** PostgreSQL (Neon), Prisma ORM 7 (`@prisma/adapter-pg`), Redis (Upstash), Supabase S3 Storage
* **Infrastructure:** Vercel (Frontend), Render (Dockerized Backend & Worker)

## Architecture
1. **Ingest:** Clients upload video chunks directly to the Express + Tus gateway, which streams raw assets to Supabase S3.
2. **Queue & Transcode:** Completed uploads trigger a BullMQ job on Upstash Redis; the worker transcodes the video into adaptive HLS segments and uploads them to S3.
3. **Stream:** Metadata is persisted in Neon PostgreSQL via Prisma 7, and the Next.js frontend serves the HLS manifest for adaptive playback and embeds.
