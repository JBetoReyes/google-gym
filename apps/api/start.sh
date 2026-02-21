#!/bin/sh
# Production startup script.
# Runs Alembic migrations to head, then starts uvicorn.
# Using 'exec' so uvicorn becomes PID 1 and receives OS signals correctly.
set -e

export PYTHONPATH=/app

echo "[start] Running database migrations..."
alembic upgrade head

echo "[start] Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --workers "${WORKERS:-1}"
