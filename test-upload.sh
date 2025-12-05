#!/bin/bash

echo "🚀 Starting MayanConnect Upload Test with Full Logging"
echo "======================================================="
echo ""

# Step 1: Login
echo "📝 Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Upload document
echo "📤 Step 2: Uploading document..."
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8001/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test_document.txt")

echo "Response: $UPLOAD_RESPONSE"
DOC_ID=$(echo $UPLOAD_RESPONSE | jq -r '.documentId')

if [ "$DOC_ID" == "null" ] || [ -z "$DOC_ID" ]; then
  echo "❌ Upload failed!"
  exit 1
fi

echo "✅ Document uploaded: $DOC_ID"
echo ""

# Step 3: Monitor logs
echo "📊 Step 3: Monitoring backend logs (60 seconds)..."
echo "Looking for OCR and AI processing..."
echo ""
echo "Press Ctrl+C to stop monitoring"
echo "----------------------------------------"

docker-compose logs -f --tail=0 backend &
LOG_PID=$!

sleep 60

kill $LOG_PID 2>/dev/null

echo ""
echo "----------------------------------------"
echo "📋 Step 4: Checking final result..."

SUMMARY=$(curl -s -X GET http://localhost:8001/api/documents/$DOC_ID/summary \
  -H "Authorization: Bearer $TOKEN")

echo "Summary Response:"
echo $SUMMARY | jq '.'

echo ""
echo "✅ Test complete!"

