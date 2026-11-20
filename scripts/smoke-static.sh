#!/usr/bin/env bash
# Smoke the deployed static site: pages, feeds, sitemap, search index, 404
# handling, and security headers.
#
# Usage:
#   scripts/smoke-static.sh <origin> [expected-canonical-origin]
#
#   scripts/smoke-static.sh https://blog.example.com
#   scripts/smoke-static.sh http://localhost:8787 https://blog.example.com
#
# The second argument is only needed when the build's PUBLIC_SITE_URL differs
# from the origin being tested (a local `cf dev` against a production build).
# Exits non-zero on the first failed assertion group; prints one line per check.
set -euo pipefail

ORIGIN="${1:-}"
CANONICAL="${2:-$ORIGIN}"

if [ -z "$ORIGIN" ]; then
  printf 'usage: %s <origin> [expected-canonical-origin]\n' "$0" >&2
  exit 2
fi
ORIGIN="${ORIGIN%/}"
CANONICAL="${CANONICAL%/}"

failures=0

pass() { printf 'ok   %s\n' "$1"; }
fail() {
  printf 'FAIL %s\n' "$1"
  failures=$((failures + 1))
}

status_of() {
  curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$ORIGIN$1" || printf '000'
}

check_status() {
  local path="$1" want="$2" got
  got="$(status_of "$path")"
  if [ "$got" = "$want" ]; then
    pass "$got $path"
  else
    fail "$got (want $want) $path"
  fi
}

body_of() {
  curl -sS --max-time 20 "$ORIGIN$1"
}

# --- Routes that must exist -------------------------------------------------
for path in \
  /vi/ /en/ \
  /vi/posts/ /en/posts/ \
  /vi/tags/ /en/tags/ \
  /vi/about/ /en/about/ \
  /vi/search/ \
  /vi/rss.xml /en/rss.xml \
  /vi/feed.json /en/feed.json \
  /sitemap-index.xml \
  /robots.txt \
  /pagefind/pagefind.js; do
  check_status "$path" 200
done

# --- Unknown paths ----------------------------------------------------------
check_status "/this-path-does-not-exist-$$" 404

# --- Security headers -------------------------------------------------------
headers="$(curl -sSI --max-time 20 "$ORIGIN/vi/" || true)"
for header in strict-transport-security x-content-type-options x-frame-options; do
  if printf '%s' "$headers" | grep -qi "^$header:"; then
    pass "header $header"
  else
    fail "header $header missing"
  fi
done

# --- Canonical origin is the environment's own ------------------------------
canonical="$(body_of /vi/ | grep -o '<link rel="canonical" href="[^"]*"' | head -1 | sed 's/.*href="//; s/"$//')"
if [ -z "$canonical" ]; then
  fail "canonical link missing on /vi/"
elif [ "${canonical#"$CANONICAL"}" != "$canonical" ]; then
  pass "canonical $canonical"
else
  fail "canonical $canonical (want prefix $CANONICAL)"
fi

# --- Feeds name the same origin --------------------------------------------
rss_body="$(body_of /vi/rss.xml)"
if printf '%s' "$rss_body" | grep -q "<link>$CANONICAL/"; then
  pass "rss.xml origin"
else
  fail "rss.xml does not link $CANONICAL"
fi

# --- The 404 page is the site's own, not a platform page --------------------
not_found_body="$(body_of "/this-path-does-not-exist-$$")"
if printf '%s' "$not_found_body" | grep -qi '<html'; then
  pass "404 page is HTML"
else
  fail "404 body is not the site's page"
fi

if [ "$failures" -ne 0 ]; then
  printf '\n%d check(s) failed against %s\n' "$failures" "$ORIGIN" >&2
  exit 1
fi

printf '\nall checks passed against %s\n' "$ORIGIN"
