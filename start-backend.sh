#!/bin/bash
set -e

echo "=================================================="
echo "Starting StreamFlow Backend Production Container"
echo "Port: ${PORT:-4000}"
echo "Node Environment: ${NODE_ENV:-production}"
echo "=================================================="

# Ensure scratch and upload directories exist
mkdir -p /app/transcoding-worker/temp
mkdir -p /app/api-server/uploads

# Start the FFmpeg Transcoding Worker in the background
echo "[Backend] Starting FFmpeg Transcoding Worker..."
cd /app/transcoding-worker
node worker.js &
WORKER_PID=$!

# Start the Express API Server in the background
echo "[Backend] Starting Express API Gateway..."
cd /app/api-server
node index.js &
API_PID=$!

# Trap termination signals for clean shutdown of both processes
cleanup() {
    echo "[Backend] Termination signal caught. Stopping worker (PID $WORKER_PID) and API server (PID $API_PID)..."
    kill -TERM "$WORKER_PID" 2>/dev/null || true
    kill -TERM "$API_PID" 2>/dev/null || true
    wait "$WORKER_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
    echo "[Backend] All backend processes gracefully stopped."
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for either process to terminate
wait -n "$WORKER_PID" "$API_PID"
EXIT_STATUS=$?

echo "[Backend] A process exited with status $EXIT_STATUS."
cleanup

