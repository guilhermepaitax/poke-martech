#!/bin/sh
set -eu

minio server /data --address ":9000" --console-address ":9001" &
minio_pid=$!

cleanup() {
  kill "$minio_pid" 2>/dev/null || true
}
trap cleanup INT TERM

ready=0
i=0
while [ "$i" -lt 30 ]; do
  if mc alias set local "http://127.0.0.1:9000" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; then
    ready=1
    break
  fi
  i=$((i + 1))
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "MinIO did not become ready." >&2
  cleanup
  exit 1
fi

mc mb --ignore-existing "local/${MINIO_BUCKET}"
mc anonymous set download "local/${MINIO_BUCKET}"

wait "$minio_pid"
