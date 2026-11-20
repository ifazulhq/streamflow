require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const ffmpeg = require('fluent-ffmpeg');
const { Worker } = require('bullmq');
const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    HeadBucketCommand,
    CreateBucketCommand,
    PutBucketPolicyCommand
} = require('@aws-sdk/client-s3');
const { PrismaClient } = require('../api-server/src/prisma/client');

const prisma = new PrismaClient();

// Configure FFmpeg binary paths (auto-detect Winget or default system PATH)
const wingetFfmpeg = 'C:\\Users\\IFAZUL HAQUE\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const wingetFfprobe = 'C:\\Users\\IFAZUL HAQUE\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';

if (fs.existsSync(wingetFfmpeg)) {
    ffmpeg.setFfmpegPath(wingetFfmpeg);
}
if (fs.existsSync(wingetFfprobe)) {
    ffmpeg.setFfprobePath(wingetFfprobe);
}

// Cloud S3 & MinIO Configuration (Supabase Storage, AWS S3, MinIO)
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
const S3_PUBLIC_URL = (process.env.S3_PUBLIC_URL || S3_ENDPOINT || 'http://localhost:9000').replace(/\/$/, '');
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || 'admin';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || 'password123';
const RAW_BUCKET = process.env.S3_RAW_BUCKET || process.env.S3_BUCKET || 'raw-videos';
const HLS_BUCKET = process.env.S3_HLS_BUCKET || process.env.S3_BUCKET || 'hls-streams';

const s3Client = new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true,
});

// Ensure buckets and public read policy exist (gracefully skips for cloud-managed buckets)
async function initStorage() {
    const buckets = Array.from(new Set([RAW_BUCKET, HLS_BUCKET]));
    for (const bucket of buckets) {
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch {
            try {
                await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
                console.log(`[Worker Storage] Created bucket: ${bucket}`);
            } catch (err) {
                console.warn(`[Worker Storage] Note: Bucket "${bucket}" creation skipped (managed via cloud console):`, err.message);
            }
        }
    }

    const publicPolicy = {
        Version: '2012-10-17',
        Statement: [
            {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${HLS_BUCKET}/*`],
            },
        ],
    };

    try {
        await s3Client.send(new PutBucketPolicyCommand({
            Bucket: HLS_BUCKET,
            Policy: JSON.stringify(publicPolicy),
        }));
        console.log(`[Worker Storage] Public read policy applied to bucket "${HLS_BUCKET}"`);
    } catch (policyErr) {
        console.warn('[Worker Storage] Note: Bucket policy setting skipped (managed via cloud console):', policyErr.message);
    }
}
initStorage().catch(console.error);

// Redis Connection configuration (Upstash rediss:// or local Redis)
const IORedis = require('ioredis');

let redisConnection;
if (process.env.REDIS_URL) {
    const isTls = process.env.REDIS_URL.startsWith('rediss://');
    redisConnection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
    });
} else {
    redisConnection = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    };
}

const QUEUE_NAME = 'video-transcoding-queue';

// Adaptive Bitrate Rendition Matrix
const RENDITIONS = [
    {
        name: '1080p',
        height: 1080,
        videoBitrate: '4500k',
        audioBitrate: '192k',
        bandwidth: 5000000,
        resolution: '1920x1080',
    },
    {
        name: '720p',
        height: 720,
        videoBitrate: '2500k',
        audioBitrate: '128k',
        bandwidth: 2800000,
        resolution: '1280x720',
    },
    {
        name: '480p',
        height: 480,
        videoBitrate: '1500k',
        audioBitrate: '96k',
        bandwidth: 1600000,
        resolution: '854x480',
    },
    {
        name: '360p',
        height: 360,
        videoBitrate: '800k',
        audioBitrate: '64k',
        bandwidth: 900000,
        resolution: '640x360',
    },
];

// Helper: Recursively retrieve all file paths in a directory
function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

console.log(`[Worker] Starting Transcoding Worker listening to queue: "${QUEUE_NAME}"...`);

const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        const { videoId, uploadId } = job.data;
        console.log(`\n======================================================`);
        console.log(`[Worker] Processing Job ID: ${job.id}`);
        console.log(`[Worker] Video ID: ${videoId}`);
        console.log(`[Worker] Upload ID: ${uploadId}`);
        console.log(`======================================================`);

        // Scratch directory for stateless processing (using relative path to avoid path space issues in FFmpeg)
        const scratchDir = path.join('temp', videoId);
        const outputBaseDir = path.join(scratchDir, 'hls');

        try {
            // 1. Update Video status in Prisma to PROCESSING
            await prisma.video.update({
                where: { id: videoId },
                data: {
                    status: 'PROCESSING',
                    progress: 0,
                },
            });
            console.log(`[Worker] Updated Video ${videoId} status to PROCESSING in Prisma`);

            // Prepare local scratch folders
            fs.mkdirSync(outputBaseDir, { recursive: true });

            // 2. Fetch raw video directly from MinIO raw-videos bucket into scratch file
            const localInputPath = path.join(scratchDir, `raw_${uploadId}.mp4`).replace(/\\/g, '/');
            console.log(`[Worker] Downloading raw video from MinIO bucket "${RAW_BUCKET}" with key "${uploadId}"...`);

            const getObjectCmd = new GetObjectCommand({
                Bucket: RAW_BUCKET,
                Key: uploadId,
            });

            const s3Response = await s3Client.send(getObjectCmd);
            const writeStream = fs.createWriteStream(localInputPath);
            await pipeline(s3Response.Body, writeStream);
            console.log(`[Worker] Raw video cached in scratch for encoding: ${localInputPath}`);

            // 3. Transcode each rendition sequentially (1080p, 720p, 480p)
            for (let i = 0; i < RENDITIONS.length; i++) {
                const rendition = RENDITIONS[i];
                const renditionDir = path.join(outputBaseDir, rendition.name);

                if (!fs.existsSync(renditionDir)) {
                    fs.mkdirSync(renditionDir, { recursive: true });
                }

                const playlistPath = path.join(renditionDir, 'index.m3u8').replace(/\\/g, '/');
                const segmentPattern = path.join(renditionDir, 'segment_%03d.ts').replace(/\\/g, '/');

                console.log(`[Worker] Transcoding rendition: ${rendition.name} (${rendition.resolution})...`);

                await new Promise((resolve, reject) => {
                    ffmpeg(localInputPath)
                        .outputOptions([
                            '-vf', `scale=-2:${rendition.height}`,
                            '-c:v', 'libx264',
                            '-preset', 'veryfast',
                            '-threads', '1',
                            '-b:v', rendition.videoBitrate,
                            '-c:a', 'aac',
                            '-b:a', rendition.audioBitrate,
                            '-hls_time', '4',
                            '-hls_playlist_type', 'vod',
                            '-hls_segment_filename', segmentPattern,
                        ])
                        .output(playlistPath)
                        .on('start', (commandLine) => {
                            console.log(`[FFmpeg] Spawned: ${commandLine}`);
                        })
                        .on('progress', (progress) => {
                            if (progress.percent) {
                                console.log(`[FFmpeg] [${rendition.name}] Progress: ${progress.percent.toFixed(1)}%`);
                            }
                        })
                        .on('end', () => {
                            console.log(`[Worker] Successfully completed rendition: ${rendition.name}`);
                            resolve();
                        })
                        .on('error', (err, stdout, stderr) => {
                            console.error(`[Worker] FFmpeg error on ${rendition.name}:`, err.message);
                            console.error(`[FFmpeg stderr]:`, stderr);
                            reject(err);
                        })
                        .run();
                });

                // Update intermediate progress in database
                const progressPercentage = Math.round(((i + 1) / RENDITIONS.length) * 75);
                await prisma.video.update({
                    where: { id: videoId },
                    data: {
                        progress: progressPercentage,
                    },
                });
            }

            // 4. Poster Frame: Extract a single high-quality frame at the 3-second mark
            const posterPath = path.join(outputBaseDir, 'poster.webp').replace(/\\/g, '/');
            console.log(`[Worker] Extracting high-quality poster frame at 3-second mark...`);

            // Probe duration to guard against videos shorter than 3s
            let videoDuration = 10;
            try {
                const probeData = await new Promise((resolve, reject) => {
                    ffmpeg.ffprobe(localInputPath, (err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
                });
                if (probeData?.format?.duration) {
                    videoDuration = parseFloat(probeData.format.duration);
                }
            } catch (probeErr) {
                console.warn(`[Worker] Warning probing video duration:`, probeErr.message);
            }

            const posterTimestamp = videoDuration > 3 ? 3 : (videoDuration > 1 ? 1 : 0);

            await new Promise((resolve, reject) => {
                ffmpeg(localInputPath)
                    .seekInput(posterTimestamp)
                    .frames(1)
                    .outputOptions([
                        '-threads', '1',
                        '-vcodec', 'libwebp',
                        '-quality', '90',
                        '-compression_level', '6',
                    ])
                    .output(posterPath)
                    .on('end', () => {
                        console.log(`[Worker] Successfully extracted poster.webp at ${posterTimestamp}s`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`[Worker] Error extracting poster frame:`, err.message);
                        reject(err);
                    })
                    .run();
            });

            // 5. Storyboard Sprite: Generate grid of thumbnails (160x90 every 5 seconds) and storyboard.vtt
            const spritePath = path.join(outputBaseDir, 'sprite.webp').replace(/\\/g, '/');
            const vttPath = path.join(outputBaseDir, 'storyboard.vtt');
            const thumbInterval = 5;
            const totalThumbs = Math.max(1, Math.ceil(videoDuration / thumbInterval));
            const cols = Math.min(5, totalThumbs);
            const rows = Math.ceil(totalThumbs / cols);

            console.log(`[Worker] Generating storyboard sprite (${totalThumbs} thumbnails every ${thumbInterval}s, grid ${cols}x${rows})...`);

            await new Promise((resolve, reject) => {
                ffmpeg(localInputPath)
                    .outputOptions([
                        '-threads', '1',
                        '-vf', `fps=1/${thumbInterval},scale=160:90,tile=${cols}x${rows}`,
                        '-vcodec', 'libwebp',
                        '-quality', '80',
                    ])
                    .output(spritePath)
                    .on('end', () => {
                        console.log(`[Worker] Successfully generated sprite.webp`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`[Worker] Error generating storyboard sprite:`, err.message);
                        reject(err);
                    })
                    .run();
            });

            // Helper to format seconds to WebVTT timestamp (HH:MM:SS.mmm)
            function formatVttTime(seconds) {
                const hrs = Math.floor(seconds / 3600);
                const mins = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const ms = Math.floor((seconds % 1) * 1000);
                return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
            }

            let vttContent = 'WEBVTT\n\n';
            for (let i = 0; i < totalThumbs; i++) {
                const startSec = i * thumbInterval;
                const endSec = Math.min((i + 1) * thumbInterval, videoDuration);
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * 160;
                const y = row * 90;

                vttContent += `${formatVttTime(startSec)} --> ${formatVttTime(endSec)}\n`;
                vttContent += `sprite.webp#xywh=${x},${y},160,90\n\n`;
            }

            fs.writeFileSync(vttPath, vttContent, 'utf-8');
            console.log(`[Worker] Generated storyboard.vtt at: ${vttPath}`);

            // 6. Generate Master Playlist (.m3u8) linking all renditions
            let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

            for (const rendition of RENDITIONS) {
                masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${rendition.bandwidth},RESOLUTION=${rendition.resolution},NAME="${rendition.name}"\n`;
                masterContent += `${rendition.name}/index.m3u8\n\n`;
            }

            const masterPlaylistPath = path.join(outputBaseDir, 'master.m3u8');
            fs.writeFileSync(masterPlaylistPath, masterContent, 'utf-8');
            console.log(`[Worker] Generated Master Playlist at: ${masterPlaylistPath}`);

            // 7. S3 Export: Upload all generated HLS, poster, and storyboard artifacts to MinIO bucket
            const artifacts = getAllFiles(outputBaseDir);
            console.log(`[Worker] Uploading ${artifacts.length} media artifacts to MinIO bucket "${HLS_BUCKET}"...`);

            for (const filePath of artifacts) {
                const relativePath = path.relative(outputBaseDir, filePath).replace(/\\/g, '/');
                const s3Key = `${videoId}/${relativePath}`;

                let contentType = 'application/octet-stream';
                let cacheControl = 'public, max-age=31536000, immutable';

                if (filePath.endsWith('.m3u8')) {
                    contentType = 'application/vnd.apple.mpegurl';
                    cacheControl = 'no-cache, no-store, must-revalidate';
                } else if (filePath.endsWith('.ts')) {
                    contentType = 'video/mp2t';
                } else if (filePath.endsWith('.webp')) {
                    contentType = 'image/webp';
                    cacheControl = 'public, max-age=31536000, immutable';
                } else if (filePath.endsWith('.vtt')) {
                    contentType = 'text/vtt; charset=utf-8';
                    cacheControl = 'public, max-age=31536000, immutable';
                }

                const fileBuffer = fs.readFileSync(filePath);
                await s3Client.send(new PutObjectCommand({
                    Bucket: HLS_BUCKET,
                    Key: s3Key,
                    Body: fileBuffer,
                    ContentType: contentType,
                    CacheControl: cacheControl,
                }));
            }
            console.log(`[Worker] Successfully exported all HLS, poster, and storyboard artifacts to MinIO bucket "${HLS_BUCKET}" under prefix "${videoId}/"!`);

            // 8. Database Update: Save master playlist, posterUrl, and storyboardUrl
            const publicMasterPlaylistUrl = `${S3_PUBLIC_URL}/${HLS_BUCKET}/${videoId}/master.m3u8`;
            const publicPosterUrl = `${S3_PUBLIC_URL}/${HLS_BUCKET}/${videoId}/poster.webp`;
            const publicStoryboardUrl = `${S3_PUBLIC_URL}/${HLS_BUCKET}/${videoId}/storyboard.vtt`;

            const updatedVideo = await prisma.video.update({
                where: { id: videoId },
                data: {
                    status: 'READY',
                    progress: 100,
                    masterPlaylist: publicMasterPlaylistUrl,
                    resolutions: RENDITIONS.map(r => r.name),
                    posterUrl: publicPosterUrl,
                    storyboardUrl: publicStoryboardUrl,
                },
            });

            console.log(`[Worker] Video ${videoId} successfully marked as READY in Prisma!`);
            console.log(`[Worker] Public Master Playlist URL: ${publicMasterPlaylistUrl}`);

            return { success: true, masterPlaylistUrl: publicMasterPlaylistUrl, video: updatedVideo };
        } catch (error) {
            console.error(`[Worker] Transcoding failed for Video ${videoId}:`, error);

            // Mark status as FAILED in Prisma
            try {
                await prisma.video.update({
                    where: { id: videoId },
                    data: {
                        status: 'FAILED',
                    },
                });
                console.log(`[Worker] Marked Video ${videoId} as FAILED in database.`);
            } catch (statusErr) {
                console.error(`[Worker] Could not update Video ${videoId} status to FAILED:`, statusErr);
            }

            throw error; // Re-throw to allow BullMQ retry policies to handle failure
        } finally {
            // Rule 5.3: Scratch cleanup - purge temporary working files to keep worker 100% stateless
            try {
                if (fs.existsSync(scratchDir)) {
                    fs.rmSync(scratchDir, { recursive: true, force: true });
                    console.log(`[Worker] Purged local scratch directory: ${scratchDir}`);
                }
            } catch (cleanupErr) {
                console.warn(`[Worker] Failed to clean up scratch directory:`, cleanupErr);
            }
        }
    },
    {
        connection: redisConnection,
        concurrency: 1, // Process 1 video at a time to prevent CPU exhaustion
    }
);

worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed successfully!`);
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

worker.on('error', (err) => {
    console.error(`[Worker] Worker error:`, err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[Worker] Shutting down worker...');
    await worker.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('[Worker] Shutting down worker...');
    await worker.close();
    process.exit(0);
});
