#!/usr/bin/env bash
set -u

CACHE_DIR="${1:-cache/public-sources}"
OUTPUT_DIR="${2:-tmp}"
mkdir -p "$CACHE_DIR" "$OUTPUT_DIR"

USER_AGENT="FishCast-Romania/3.1 (GitHub Actions; public data catalog)"
DATASET_ID="99886f1e-a89e-4d65-9a6c-2fd64a2d1713"

curl_common=(
  -4
  --http1.1
  --fail
  --location
  --silent
  --show-error
  --connect-timeout 12
  --max-time 75
  --retry 2
  --retry-delay 3
  --retry-connrefused
  -A "$USER_AGENT"
)

valid_zip() {
  local file="$1"
  [ -s "$file" ] && unzip -tq "$file" >/dev/null 2>&1
}

fetch_to() {
  local url="$1"
  local target="$2"
  local partial="${target}.part"
  rm -f "$partial"
  if curl "${curl_common[@]}" -o "$partial" "$url"; then
    if valid_zip "$partial"; then
      mv "$partial" "$target"
      return 0
    fi
  fi
  rm -f "$partial"
  return 1
}

resource_url_from_ckan() {
  local resource_id="$1"
  local json
  json=$(mktemp)
  if curl "${curl_common[@]}" \
    -H "Accept: application/json" \
    -o "$json" \
    "https://data.gov.ro/api/3/action/resource_show?id=${resource_id}"; then
    jq -r '.result.url // empty' "$json" 2>/dev/null || true
  fi
  rm -f "$json"
}

download_resource() {
  local label="$1"
  local resource_id="$2"
  local filename="$3"
  local direct_url="$4"
  local cache_file="$CACHE_DIR/$filename"
  local output_file="$OUTPUT_DIR/$filename"

  echo "[FishCast] Sursa optionala: $label"

  local discovered_url
  discovered_url=$(resource_url_from_ckan "$resource_id" || true)

  local urls=()
  if [ -n "$discovered_url" ]; then urls+=("$discovered_url"); fi
  urls+=("$direct_url")

  for url in "${urls[@]}"; do
    [ -n "$url" ] || continue
    echo "[FishCast] Incerc IPv4/HTTP1.1: $url"
    if fetch_to "$url" "$output_file"; then
      cp "$output_file" "$cache_file"
      echo "[FishCast] Descarcare reusita: $label"
      return 0
    fi
  done

  if valid_zip "$cache_file"; then
    cp "$cache_file" "$output_file"
    echo "::warning title=Sursa folosita din cache::$label nu a raspuns; folosesc ultima copie valida din cache-ul GitHub."
    return 0
  fi

  rm -f "$output_file"
  echo "::warning title=Sursa optionala indisponibila::$label nu poate fi accesata acum. Catalogul continua cu OpenStreetMap, Wikidata si ANPA."
  return 0
}

download_resource \
  "Apele Romane - lacuri naturale" \
  "a3e316f7-2392-41e4-9b85-1bf679835a11" \
  "natural.zip" \
  "https://data.gov.ro/dataset/${DATASET_ID}/resource/a3e316f7-2392-41e4-9b85-1bf679835a11/download/lacurinaturale.zip"

download_resource \
  "Apele Romane - lacuri de acumulare" \
  "9e0a1517-2889-41f1-95b4-485ee234768d" \
  "reservoirs.zip" \
  "https://data.gov.ro/dataset/${DATASET_ID}/resource/9e0a1517-2889-41f1-95b4-485ee234768d/download/lacuriacumulare.zip"

download_resource \
  "Apele Romane - corpuri de apa de suprafata" \
  "4b2bc115-8776-45af-9ea0-c846e2a23a88" \
  "surface.zip" \
  "https://data.gov.ro/dataset/f10e9283-3cae-4d0f-9549-d9ccb7a4269b/resource/4b2bc115-8776-45af-9ea0-c846e2a23a88/download/corpuriapasuprafata.zip"

exit 0
