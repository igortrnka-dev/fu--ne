#!/bin/bash
# Export dashboard product shots (2x PNG) with headless Google Chrome.
#
# NOTE: this shoots the old static demo (dashboard.html). The shots the website shows (desk, mobile,
# profit, roster, chat, queue in assets/dashboard and product-shots) now come from the real app:
# see scripts/capture-landing.ts in the fune-app repository. Use this script only for the demo page.
#
# 1) Start a local server in the FUNE folder:   python3 -m http.server 5173
# 2) Run:                                        bash tools/export-shots.sh
#    Only some parts:                            ONLY="desk mobile" bash tools/export-shots.sh
#
# Output: product-shots/fune-dashboard-<part>-<en|sk>.png
# Uses a throwaway Chrome profile, so your normal Chrome is not touched.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/product-shots"
PROFILE="${TMPDIR:-/tmp}/fune-chrome-shots"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="${URL:-http://localhost:5173}"

shoot() { # shoot <png> <width> <height> <url>
  "$CH" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
    --user-data-dir="$PROFILE" --force-device-scale-factor=2 --window-size="$2,$3" \
    --virtual-time-budget=7000 --run-all-compositor-stages-before-draw \
    --screenshot="$1" "$4" >/dev/null 2>&1
}
enc() { python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"; }

mkdir -p "$OUT"
# part:width:height (CSS px; images come out 2x)
SHOTS=("desk:1440:900" "mobile:390:844" "full:1440:1654" "profit:1280:386" "kpis:1280:171" "roster:1100:633" "chat:520:587" "queue:600:568" "revenue:460:465" "log:680:400")
for lang in en sk; do
  for s in "${SHOTS[@]}"; do
    IFS=: read -r k w h <<< "$s"
    if [ -n "${ONLY:-}" ] && [[ " $ONLY " != *" $k "* ]]; then continue; fi
    png="$OUT/fune-dashboard-$k-$lang.png"
    case "$k" in
      desk)   shoot "$png" "$w" "$h" "$URL/dashboard.html?lang=$lang&shot=full" ;;
      mobile) # Chrome windows can't be narrower than ~500px: render a centered 390px frame, then crop
              shoot "$png" 600 "$h" "$URL/tools/capture.html?w=$w&h=$h&src=$(enc "../dashboard.html?shot=full&lang=$lang")"
              sips --cropToHeightWidth $((h * 2)) $((w * 2)) "$png" >/dev/null 2>&1 ;;
      *)      shoot "$png" "$w" "$h" "$URL/dashboard.html?lang=$lang&shot=$k" ;;
    esac
    echo "✓ $k ($lang)"
  done
done
echo "Saved to $OUT"
