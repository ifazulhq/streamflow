# Engineering & AI Guardrails (Rules.md)
## Scalable Video Streaming Platform

**Status:** Mandatory & Strictly Enforced  
**Applies To:** All Engineers, Code Contributors, and AI Coding Agents  
**Target Architecture:** Enterprise-grade Microservices Monorepo  

---

## 1. Core Philosophy & Architectural Invariants

This codebase is engineered to enterprise / MNC production standards. Every change must adhere to strict boundary isolation, asynchronous non-blocking patterns, and resilient fault domains. Shortcuts that compromise horizontal scalability, event-loop performance, or database schema consistency are strictly forbidden.

---

## 2. Backend & Ingestion Guardrails (`api-server`)

### Rule 2.1: Never Block the Node.js Event Loop
- **Prohibited:** Any synchronous compute or heavy CPU operation inside `api-server` (e.g., synchronous file hashing, synchronous cryptographic operations, synchronous compression, or CPU-bound loops).
- **Enforced:** The API server must remain purely an I/O gateway. It handles request validation, authentication, Tus protocol chunk negotiation, database metadata writes, and job dispatching.

### Rule 2.2: Mandatory Worker Offloading for Compute
- **Prohibited:** Executing FFmpeg, `fluent-ffmpeg`, `ffprobe`, media transcode operations, or video thumbnail generation directly within the `api-server` process or its child processes.
- **Enforced:** All media processing and transcoding tasks MUST be dispatched as asynchronous jobs to the `transcoding-worker` via BullMQ and Redis.
- **Payload Discipline:** Queue payloads must remain minimal and serializable (pass resource IDs, storage keys, and metadata; NEVER pass file buffers or raw binary streams through Redis).

---

## 3. Database Layer & Prisma v8 Standards (`api-server/src/prisma`)

### Rule 3.1: Strict Prisma v8 Syntax Exclusive Enforcement
- **Prohibited:** Legacy Prisma conventions, directives, or patterns from Prisma v4/v5/v6/v7 that conflict with Prisma v8 contracts.
- **Prohibited Directives:**
  - ❌ Do **NOT** use legacy `@default(now())` for timestamps.
  - ❌ Do **NOT** use legacy `@updatedAt` annotations.
- **Enforced Functions:**
  - ✅ Use `temporal.createdAt()` for record creation timestamps.
  - ✅ Use `temporal.updatedAt()` for record modification timestamps.
- **Reference Schema Standard:**
  ```prisma
  // use prisma-8

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

### Rule 3.2: Contract Synchronization Discipline
- Whenever [`contract.prisma`](file:///c:/Users/IFAZUL%20HAQUE/scalable-video-streaming/api-server/src/prisma/contract.prisma) is modified, developers and AI agents must run:
  ```bash
  npx prisma contract emit
  ```
  to regenerate `contract.json` and `contract.d.ts`. Never manually edit generated `.d.ts` or `.json` contract artifacts.

---

## 4. Frontend Architecture & React Server Components (`frontend`)

### Rule 4.1: Next.js App Router Exclusivity
- **Prohibited:** Legacy Pages Router patterns (`pages/` directory, `getServerSideProps`, `getStaticProps`).
- **Enforced:** Build exclusively within the `app/` directory utilizing React Server Components (RSC) by default.

### Rule 4.2: Strict Segregation of Server & Client Components
- **Server Components (Default):**
  - Used for static layouts, server-side data fetching, page shells, metadata generation, and read-only catalog listings.
  - Must never import client-only hooks (`useState`, `useEffect`, `useRef`, `useCallback`) or browser APIs (`window`, `navigator`, `localStorage`).
- **Client Components (`"use client"`):**
  - Reserved exclusively for interactive elements:
    1. **Upload Interfaces:** Drag-and-drop file zones, file pickers, and upload progress bars managing `tus-js-client` upload instances.
    2. **Video Players:** Media Source Extensions (MSE) playback containers (`Hls.js`, `Video.js`).
    3. **Interactive Controls:** Dynamic resolution pickers, real-time status polling indicators, and user notification toasts.
  - Client components must be leaf components situated at the lowest possible level in the component tree to maximize server-side rendering benefits.

---

## 5. Error Handling & Worker Resilience

### Rule 5.1: Universal Endpoint Error Handling
- **Enforced:** Every Express route handler, middleware, and Tus event listener must be encapsulated in structured `try/catch` blocks.
- **Standard Error Response:** Uncaught exceptions must never crash the server or leak raw internal stack traces to the client. Responses must return consistent JSON:
  ```json
  {
    "success": false,
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "A descriptive, sanitized error message"
    }
  }
  ```

### Rule 5.2: Transcoding Worker Retry Policies & Dead-Letter Queues (DLQ)
- **Retry Logic:** All BullMQ jobs processed by `transcoding-worker` must define explicit retry counts and backoff curves:
  ```javascript
  {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 // 5s, 10s, 20s
    },
    removeOnComplete: true,
    removeOnFail: false
  }
  ```
- **Dead-Letter Queue (DLQ) / Failure State:** When job attempts are exhausted:
  1. The worker must capture the error trace.
  2. The corresponding database record status must be set to `'FAILED'` with a descriptive error message.
  3. The job is placed in BullMQ's failed set (acting as a dead-letter queue) for administrative inspection and replay.

### Rule 5.3: Idempotent Processing & Scratch Cleanup
- If a worker crashes mid-transcode and restarts, it must clean up partial local files before retrying.
- Temporary working files (`./temp`, `/tmp`, segmented `.ts` chunks) must be purged in a `finally` block or error handler to prevent disk exhaustion.

---

## 6. File Uploads & Protocol Enforcement

### Rule 6.1: Absolute Prohibition of Standard Multipart/Form-Data
- **Prohibited:** Standard HTTP `multipart/form-data` uploads (e.g., `multer`, `busboy`, raw multipart POST endpoints) for video ingestion.
- **Reasoning:** Standard multipart uploads cannot survive network disconnects, fail catastrophically on large files, and buffer uncontrollably in memory.

### Rule 6.2: Strict Enforcement of Tus Protocol
- **Enforced:** All video file uploads must strictly adhere to the **Tus 1.0.0 protocol** implemented via `@tus/server` on the backend and `tus-js-client` on the frontend.
- **Mandatory Capabilities:**
  - Resumable chunked file transfers.
  - Byte-offset tracking via `HEAD /uploads/:id`.
  - Chunk streaming via `PATCH /uploads/:id`.
  - Client-side automatic exponential backoff retry.
- **Memory Discipline:** Ingested chunks must stream directly from the incoming HTTP stream to the designated store (`FileStore` or `@tus/s3-store`). Chunks must NEVER be accumulated in Node.js heap memory.

---

## 7. Security, Environment, & Configuration

1. **No Hardcoded Credentials:** Database connection strings, S3/MinIO access keys, Redis URLs, and ports must be read exclusively from environment variables via `process.env` (loaded via `dotenv`).
2. **CORS Headers:** The API server must expose all headers required by Tus:
   ```javascript
   exposedHeaders: ['Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Location', 'Upload-Metadata']
   ```
3. **Container Parity:** Development services running in Docker Compose (`video_postgres`, `video_redis`, `video_minio`) must mirror production configurations and ports.
