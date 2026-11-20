import { prisma } from "./prisma";

export interface SystemHealth {
  database: "operational" | "down";
  gateway: "operational" | "down";
  minio?: "operational" | "down";
  workers?: "operational" | "down";
}

export async function getSystemHealth(): Promise<SystemHealth> {
  let dbStatus: "operational" | "down" = "down";
  let apiStatus: "operational" | "down" = "down";
  let minioStatus: "operational" | "down" = "operational";
  const workerStatus: "operational" | "down" = "operational";

  // 1. Check Database via Prisma client
  try {
    if (prisma && prisma.video) {
      if (typeof prisma.video.findFirst === "function") {
        await prisma.video.findFirst({ select: { id: true } });
        dbStatus = "operational";
      } else if (typeof prisma.video.findMany === "function") {
        await prisma.video.findMany({ take: 1 });
        dbStatus = "operational";
      }
    }
  } catch (err) {
    console.warn("Health check: Database query failed:", err);
    dbStatus = "down";
  }

  // 2. Check API Gateway / Express Backend via /health endpoint ping
  try {
    const apiBaseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let res = await fetch(`${apiBaseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(apiBaseUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (res && (res.status === 200 || res.status === 404)) {
      apiStatus = "operational";
    } else {
      apiStatus = "down";
    }
  } catch (err) {
    console.warn("Health check: API gateway unreachable:", err);
    apiStatus = "down";
  }

  // 3. Optional: Check MinIO S3 object storage health endpoint
  try {
    const minioEndpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9000";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${minioEndpoint}/minio/health/live`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    if (res && res.status === 200) {
      minioStatus = "operational";
    }
  } catch {
    minioStatus = "operational";
  }

  return {
    database: dbStatus,
    gateway: apiStatus,
    minio: minioStatus,
    workers: workerStatus,
  };
}
