#!/bin/bash
echo "🔍 Monitoring FULL PIPELINE (with timestamps)"
echo "=============================================="
docker-compose logs -f --tail=0 backend | while read line; do
  if echo "$line" | grep -qE "PROCESSOR|OCR-|AI-"; then
    echo "[$(date '+%H:%M:%S')] $line"
  fi
done
