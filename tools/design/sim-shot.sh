#!/usr/bin/env bash
# Drives the developer build on a booted simulator with no taps, then screenshots it:
#   tools/design/sim-shot.sh <device-udid> '<dev-command json>' <out.png> [wait-seconds]
# The command is read once by the app's DevCommands (seed a fixture, pin the clock, open a route).
# Launching with --initialUrl avoids the "Open in …?" prompt that a URL open shows.
set -euo pipefail
device="$1"; command="$2"; out="$3"; wait="${4:-12}"
bundle=ai.sixpm.app.dev
container="$(xcrun simctl get_app_container "$device" "$bundle" data)"
mkdir -p "$container/Documents"
printf '%s' "$command" > "$container/Documents/dev-command.json"
xcrun simctl launch --terminate-running-process "$device" "$bundle" --initialUrl "http://127.0.0.1:8081" >/dev/null
sleep "$wait"
xcrun simctl io "$device" screenshot "$out" >/dev/null
echo "$out"
