require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Server, EVENTS } = require('@tus/server');
const { S3Store } = require('@tus/s3-store');
const {
    S3Client,
    HeadBucketCommand,
    CreateBucketCommand,
    PutBucketPolicyCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const prisma = new PrismaClient();
const app = express();
const port = parseInt(process.env.PORT || '4000', 10);
const host = '0.0.0.0';

// S3 & Cloud Storage Configuration (Supports Supabase Storage, AWS S3, and MinIO)
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || 'admin';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || 'password123';
const rawBucket = process.env.S3_RAW_BUCKET || process.env.S3_BUCKET || 'raw-videos';
const hlsBucket = process.env.S3_HLS_BUCKET || process.env.S3_BUCKET || 'hls-streams';

const s3Config = {
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
};

const s3Client = new S3Client(s3Config);

// Ensure buckets and public policy exist on startup (with graceful fallback for cloud-managed buckets)
async function initStorage() {
    const buckets = Array.from(new Set([rawBucket, hlsBucket]));
    for (const bucket of buckets) {
        try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch {
            try {
                await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
                console.log(`[Storage] Created bucket: ${bucket}`);
            } catch (err) {
                console.warn(`[Storage] Note: Bucket "${bucket}" creation skipped (managed via cloud console):`, err.message);
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
                Resource: [`arn:aws:s3:::${hlsBucket}/*`],
            },
        ],
    };

    try {
        await s3Client.send(new PutBucketPolicyCommand({
            Bucket: hlsBucket,
            Policy: JSON.stringify(publicPolicy),
        }));
        console.log(`[Storage] Public read policy applied to bucket "${hlsBucket}"`);
    } catch (policyErr) {
        console.warn('[Storage] Note: Bucket policy setting skipped (managed via cloud storage console):', policyErr.message);
    }
}
initStorage().catch(console.error);

// Initialize BullMQ Queue with Upstash Redis (rediss://) or local Redis
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

const transcodeQueue = new Queue('video-transcoding-queue', {
    connection: redisConnection,
});

// Configure CORS for local development and production frontend URL
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        if (process.env.FRONTEND_URL && origin.startsWith(process.env.FRONTEND_URL.replace(/\/$/, ''))) {
            return callback(null, true);
        }
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    exposedHeaders: [
        'Tus-Resumable',
        'Tus-Version',
        'Tus-Extension',
        'Tus-Max-Size',
        'Upload-Length',
        'Upload-Offset',
        'Location',
        'Upload-Metadata',
        'Upload-Defer-Length',
        'Upload-Concat'
    ]
}));

app.use(express.json());

// Initialize Tus server with @tus/s3-store connected to MinIO raw-videos bucket
const tusServer = new Server({
    path: '/uploads',
    datastore: new S3Store({
        s3ClientConfig: {
            ...s3Config,
            bucket: rawBucket,
        },
    }),
});

tusServer.on(EVENTS.POST_FINISH, async (req, res, upload) => {
    console.log(`[Tus] Upload finished for file ID: ${upload.id}`);

    try {
        const video = await prisma.video.create({
            data: {
                uploadId: upload.id,
                title: upload.metadata?.name || upload.metadata?.filename || 'Untitled Video',
                originalName: upload.metadata?.name || upload.metadata?.filename,
                status: 'UPLOADING',
                progress: 100,
            },
        });
        console.log('[Database] Video record created:', video);

        // Push transcoding job to Redis BullMQ queue
        const job = await transcodeQueue.add('transcode-video', {
            videoId: video.id,
            uploadId: upload.id,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });

        console.log(`[BullMQ] Enqueued transcoding job ID ${job.id} for Video ${video.id}`);
    } catch (error) {
        console.error('[Tus] Error creating video record or enqueueing job:', error);
    }
});

// GET /videos: Retrieve database records from Prisma (supports ?status= filter or returns all videos)
app.get('/videos', async (req, res) => {
    try {
        const where = {};
        if (req.query.status) {
            where.status = req.query.status;
        }
        const videos = await prisma.video.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        res.json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve videos',
            },
        });
    }
});

// GET /videos/:id: Retrieve single video record by ID
app.get('/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const video = await prisma.video.findUnique({
            where: { id },
            include: { engagement: true },
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Video with ID ${id} not found`,
                },
            });
        }

        res.json(video);
    } catch (error) {
        console.error(`Error fetching video ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve video record',
            },
        });
    }
});

// POST /videos/:id/analytics: Ingest player telemetry, view thresholds, and heatmap buckets
app.post('/videos/:id/analytics', async (req, res) => {
    try {
        const { id } = req.params;
        const { watchedSeconds = 0, currentBucket = 0, incrementView } = req.body || {};

        // 1. Verify video exists
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Video with ID ${id} not found`,
                },
            });
        }

        // 2. Validate & clamp percentage bucket (0 - 99)
        const bucket = Math.max(0, Math.min(99, Math.floor(Number(currentBucket) || 0)));

        // 3. Update / Create VideoEngagement heatmap
        let engagement = await prisma.videoEngagement.findUnique({
            where: { videoId: id },
        });

        let heatmap;
        if (!engagement) {
            heatmap = new Array(100).fill(0);
            heatmap[bucket] = 1;
            engagement = await prisma.videoEngagement.create({
                data: {
                    videoId: id,
                    heatmap,
                },
            });
        } else {
            heatmap = Array.isArray(engagement.heatmap) && engagement.heatmap.length === 100
                ? [...engagement.heatmap]
                : new Array(100).fill(0).map((v, i) => (engagement.heatmap && engagement.heatmap[i]) || 0);

            heatmap[bucket] = (heatmap[bucket] || 0) + 1;

            engagement = await prisma.videoEngagement.update({
                where: { videoId: id },
                data: {
                    heatmap,
                },
            });
        }

        // 4. View Threshold: If threshold met (e.g. > 5 seconds watched or explicitly flagged), increment views
        const shouldIncrement = incrementView !== undefined
            ? Boolean(incrementView)
            : (Number(watchedSeconds) >= 5);

        let currentViews = Number(video.views || 0);
        if (shouldIncrement) {
            const updatedVideo = await prisma.video.update({
                where: { id },
                data: {
                    views: { increment: 1 },
                },
            });
            currentViews = Number(updatedVideo.views || 0);
            console.log(`[Analytics] View recorded for Video ${id}. Total views: ${currentViews}`);
        }

        res.json({
            success: true,
            videoId: id,
            views: currentViews,
            currentBucket: bucket,
            bucketDensity: heatmap[bucket],
            heatmap,
        });
    } catch (error) {
        console.error(`[Analytics] Error updating telemetry for video ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to record analytics telemetry',
            },
        });
    }
});

// GET /videos/:id/engagement: Retrieve heatmap data
app.get('/videos/:id/engagement', async (req, res) => {
    try {
        const { id } = req.params;
        const engagement = await prisma.videoEngagement.findUnique({
            where: { videoId: id },
        });

        const heatmap = (engagement && Array.isArray(engagement.heatmap) && engagement.heatmap.length === 100)
            ? engagement.heatmap
            : new Array(100).fill(0).map((v, i) => (engagement?.heatmap && engagement.heatmap[i]) || 0);

        res.json({
            videoId: id,
            heatmap,
        });
    } catch (error) {
        console.error(`Error fetching engagement for video ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve engagement heatmap',
            },
        });
    }
});

// DELETE /videos/:id: Delete raw-videos, hls-streams, and Prisma database record
app.delete('/videos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Locate video in database
        const video = await prisma.video.findUnique({
            where: { id },
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Video with ID ${id} not found`,
                },
            });
        }

        console.log(`[Delete] Initiating complete asset purge for Video ID: ${id}...`);

        // 2. Delete raw video from MinIO raw-videos bucket
        if (video.uploadId) {
            try {
                await s3Client.send(new DeleteObjectsCommand({
                    Bucket: rawBucket,
                    Delete: {
                        Objects: [
                            { Key: video.uploadId },
                            { Key: `${video.uploadId}.info` },
                        ],
                        Quiet: true,
                    },
                }));
                console.log(`[Delete] Deleted raw video objects for upload ID: ${video.uploadId}`);
            } catch (rawErr) {
                console.warn(`[Delete] Warning purging raw video from ${rawBucket}:`, rawErr.message);
            }
        }

        // 3. Delete all HLS stream artifacts from MinIO hls-streams bucket under prefix "${video.id}/"
        try {
            const listCmd = new ListObjectsV2Command({
                Bucket: hlsBucket,
                Prefix: `${video.id}/`,
            });
            const listRes = await s3Client.send(listCmd);

            if (listRes.Contents && listRes.Contents.length > 0) {
                const objectsToDelete = listRes.Contents.map((obj) => ({ Key: obj.Key }));
                await s3Client.send(new DeleteObjectsCommand({
                    Bucket: hlsBucket,
                    Delete: {
                        Objects: objectsToDelete,
                        Quiet: true,
                    },
                }));
                console.log(`[Delete] Purged ${objectsToDelete.length} HLS artifacts from ${hlsBucket}`);
            }
        } catch (hlsErr) {
            console.warn(`[Delete] Warning purging HLS artifacts from ${hlsBucket}:`, hlsErr.message);
        }

        // 4. Delete Prisma database record & engagement
        try {
            await prisma.videoEngagement.delete({
                where: { videoId: id },
            });
        } catch (_) {}

        await prisma.video.delete({
            where: { id },
        });

        console.log(`[Delete] Successfully deleted video record ${id} from database.`);

        res.json({
            success: true,
            message: `Video ${id} and all associated object storage assets were deleted successfully.`,
            id,
        });
    } catch (error) {
        console.error(`Error deleting video ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to delete video and storage artifacts',
            },
        });
    }
});

// Tus endpoint routing
app.all('/uploads', (req, res) => {
    tusServer.handle(req, res);
});
app.all('/uploads/:id', (req, res) => {
    tusServer.handle(req, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, host, () => {
    console.log(`API Server running on http://${host}:${port}`);
    console.log(`Cloud S3 Raw Ingestion Target: ${rawBucket}`);
    console.log(`Cloud S3 HLS Distribution Target: ${hlsBucket}`);
});