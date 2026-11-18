#!/bin/bash
# Build the public website into ./public — this folder is what Render publishes.
# Only the website goes live; the mockups, product shots, logo files and tools stay in the repo only.
#
# Run locally:  bash tools/build.sh   (then: python3 -m http.server 5174 -d public)
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf public
mkdir -p public
cp index.html dashboard.html styles.css script.js i18n.js dashboard.css dashboard.js public/
cp -R assets public/

echo "Built $(find public -type f | wc -l | tr -d ' ') files into public/"
