#!/bin/bash
# Export dashboard mockups (2x PNG) with headless Google Chrome.
#
# Needs the product shots first (bash tools/export-shots.sh) and a local server:
#   python3 -m http.server 5173
# Run:  bash tools/export-mockups.sh        (add LOGO=1 to put the fu—ne logo in the corner)
#
# Output: mockups/fune-mockup-<hero|browser|laptop|phone>-<en|sk>.png
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/mockups"
PROFILE="${TMPDIR:-/tmp}/fune-chrome-shots"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="${URL:-http://localhost:5173}"
LOGO="${LOGO:-0}"

mkdir -p "$OUT"
MOCKS=("hero:1920:1200" "browser:1600:1000" "laptop:1600:1000" "phone:1200:1000")
for lang in en sk; do
  for s in "${MOCKS[@]}"; do
    IFS=: read -r m w h <<< "$s"
    "$CH" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
      --user-data-dir="$PROFILE" --force-device-scale-factor=2 --window-size="$w,$h" \
      --virtual-time-budget=7000 --run-all-compositor-stages-before-draw \
      --screenshot="$OUT/fune-mockup-$m-$lang.png" \
      "$URL/mockups.html?m=$m&lang=$lang&logo=$LOGO" >/dev/null 2>&1
    echo "✓ $m ($lang)"
  done
done
echo "Saved to $OUT"
