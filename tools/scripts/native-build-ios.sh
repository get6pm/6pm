#!/usr/bin/env bash
# Builds the iOS app on this machine (a GitHub macOS runner) with `eas build --local`: no EAS build
# minutes. EAS still supplies the project, the build number and, for a store profile, the
# distribution certificate and the provisioning profiles of every target, through EXPO_TOKEN.
#
#   tools/scripts/native-build-ios.sh <e2e-test|dev|prd> <out dir>
#
# Writes <out dir>/sixpm-<profile>-ios.tar.gz (the simulator app) or .ipa (the signed store
# build), and its path as the `artifact` step output.
#
# Env: EXPO_TOKEN, EAS_CLI (the pinned eas-cli package). For a store profile, optionally
# ASC_API_KEY_P8 (the key file's contents), EXPO_ASC_KEY_ID and EXPO_ASC_ISSUER_ID: with them
# EAS can sign in to App Store Connect and make or renew a provisioning profile that is missing
# or no longer valid (a new extension, a capability added to an App ID). Without them a build
# whose profiles are all in place still signs, and one that needs a new profile stops and says so.
set -uo pipefail

profile=$1
out_dir=$2
repo_root=$(cd "$(dirname "$0")/../.." && pwd)

[ -n "${EXPO_TOKEN:-}" ] || { echo "::error::The EXPO_TOKEN secret is missing"; exit 1; }
case "$profile" in
  e2e-test) extension=tar.gz ;;
  dev|prd) extension=ipa ;;
  *) echo "::error::profile must be e2e-test, dev or prd, not \"$profile\""; exit 1 ;;
esac

mkdir -p "$out_dir"
artifact=$(cd "$out_dir" && pwd)/sixpm-$profile-ios.$extension

# Only a signed build is given the key, and only as a file nobody else on the runner can read.
if [ "$profile" != e2e-test ] && [ -n "${ASC_API_KEY_P8:-}" ] && [ -n "${EXPO_ASC_KEY_ID:-}" ] &&
  [ -n "${EXPO_ASC_ISSUER_ID:-}" ]; then
  key_file=${RUNNER_TEMP:-$(mktemp -d)}/asc-api-key.p8
  trap 'rm -f "$key_file"' EXIT
  (umask 077 && printf '%s' "$ASC_API_KEY_P8" >"$key_file")
  export EXPO_ASC_API_KEY_PATH=$key_file
  export EXPO_APPLE_TEAM_ID=YFND2EEW8S EXPO_APPLE_TEAM_TYPE=INDIVIDUAL
fi
unset ASC_API_KEY_P8

cd "$repo_root/apps/mobile" || exit 1
started=$SECONDS
# EAS syncs the App ID's capabilities (App Groups, Associated Domains) from app.config.ts.
npx --yes "${EAS_CLI:?}" build --local --profile "$profile" \
  --platform ios --non-interactive --output "$artifact"
status=$?
minutes=$(((SECONDS - started + 30) / 60))
if [ "$status" != 0 ] || [ ! -s "$artifact" ]; then
  echo "::error::eas build --local failed (exit $status) after $minutes min"
  exit 1
fi

size=$(du -h "$artifact" | cut -f1)
echo "artifact=$artifact" >>"${GITHUB_OUTPUT:-/dev/null}"
{
  echo "### Native build: \`$profile\` ios at \`$(git rev-parse --short=12 HEAD)\`"
  echo "Built on this runner in $minutes min ($size)."
} >>"${GITHUB_STEP_SUMMARY:-/dev/stdout}"
