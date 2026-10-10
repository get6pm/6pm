#!/usr/bin/env bash
# Sends a signed store build to App Store Connect (TestFlight) with `eas submit`, straight from the
# runner that built it: the .ipa is never an artifact or a release asset of this public repository.
#
#   tools/scripts/native-submit-ios.sh <profile> <path to the .ipa>
#
# A submission that runs unattended needs the App Store Connect app id and an API key in the submit
# profile. They are written into this checkout's eas.json only (never committed): the key file
# lives in the runner's temp folder and is removed when the script ends.
#
# Env: EXPO_TOKEN, ASC_API_KEY_P8 (the key file's contents), EXPO_ASC_KEY_ID, EXPO_ASC_ISSUER_ID,
# ASC_APP_ID, EAS_CLI (the pinned eas-cli package).
set -euo pipefail

profile=$1
ipa=$2
repo_root=$(cd "$(dirname "$0")/../.." && pwd)

for name in EXPO_TOKEN ASC_API_KEY_P8 EXPO_ASC_KEY_ID EXPO_ASC_ISSUER_ID ASC_APP_ID; do
  [ -n "${!name:-}" ] || { echo "::error::$name is missing: nothing was submitted"; exit 1; }
done
[ -s "$ipa" ] || { echo "::error::No signed build at $ipa"; exit 1; }

key_file=${RUNNER_TEMP:-$(mktemp -d)}/asc-api-key.p8
trap 'rm -f "$key_file"' EXIT
(umask 077 && printf '%s' "$ASC_API_KEY_P8" >"$key_file")

cd "$repo_root/apps/mobile"
jq --arg profile "$profile" --arg app "$ASC_APP_ID" --arg key "$key_file" \
  --arg key_id "$EXPO_ASC_KEY_ID" --arg issuer "$EXPO_ASC_ISSUER_ID" \
  '.submit[$profile].ios = ((.submit[$profile].ios // {}) + {
     ascAppId: $app, ascApiKeyPath: $key, ascApiKeyId: $key_id, ascApiKeyIssuerId: $issuer
   })' eas.json >eas.json.new
mv eas.json.new eas.json

# The same key lets eas-cli check the app's TestFlight setup without an Apple ID login.
export EXPO_ASC_API_KEY_PATH=$key_file
export EXPO_APPLE_TEAM_ID=YFND2EEW8S EXPO_APPLE_TEAM_TYPE=INDIVIDUAL
npx --yes "${EAS_CLI:?}" submit --profile "$profile" --platform ios --path "$ipa" \
  --non-interactive --no-wait

echo "Submitted the \`$profile\` build of \`$(git rev-parse --short=12 HEAD)\` to App Store Connect; it appears in TestFlight when Apple has processed it." \
  >>"${GITHUB_STEP_SUMMARY:-/dev/stdout}"
