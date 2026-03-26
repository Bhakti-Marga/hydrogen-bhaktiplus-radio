#!/usr/bin/env bash
set -e

# Skip if missing required env vars
if [ -z "$SENTRY_ORG" ] || [ -z "$SENTRY_PROJECT" ]; then
  echo "[Sentry] Missing SENTRY_ORG or SENTRY_PROJECT - skipping upload"
  exit 1
fi

if [ -z "$SENTRY_AUTH_TOKEN" ]; then
  echo "[Sentry] No auth token - skipping upload"
  exit 1
fi

# Detect build directory
if [ -d "./build" ]; then
  BUILD_DIR="build"
elif [ -d "./dist" ]; then
  BUILD_DIR="dist"
else
  echo "[Sentry] Could not find build directory"
  exit 1
fi

# Get release version
RELEASE=$(git rev-parse --short HEAD 2>/dev/null || echo "${SENTRY_RELEASE:-unknown}")

# Inject debug IDs
sentry-cli sourcemaps inject "$BUILD_DIR"
# Upload sourcemaps
sentry-cli sourcemaps upload --release="$RELEASE" "$BUILD_DIR"

echo "[Sentry] Removing source map files after sentry upload"
# Remove map files
find "$BUILD_DIR" -name "*.map" -type f -delete
echo "[Sentry] Removed source map files after sentry upload"

echo "[Sentry] ✅ Uploaded sourcemaps (release: $RELEASE)"
