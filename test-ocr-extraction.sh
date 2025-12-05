#!/bin/bash

echo "=========================================="
echo "Testing OCR Extraction Endpoint"
echo "=========================================="
echo ""

# Step 1: Login
echo "Step 1: Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed!"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Step 2: Get list of documents
echo "Step 2: Getting list of documents..."
DOCUMENTS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:4000/documents)

echo "$DOCUMENTS" | jq '{total: .total, documents: [.documents[] | {id, filename, createdAt}]}'
echo ""

# Step 3: Extract OCR from first document
FIRST_DOC_ID=$(echo "$DOCUMENTS" | jq -r '.documents[0].id')

if [ "$FIRST_DOC_ID" == "null" ] || [ -z "$FIRST_DOC_ID" ]; then
  echo "❌ No documents found!"
  exit 1
fi

echo "Step 3: Extracting OCR text from document: $FIRST_DOC_ID"
echo "=========================================="
OCR_RESPONSE=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  "http://localhost:4000/documents/$FIRST_DOC_ID/ocr")

echo "$OCR_RESPONSE" | jq '{
  documentId,
  filename,
  textLength,
  extractedAt,
  ocrPreview: (.ocrText[0:500])
}'

echo ""
echo "=========================================="
echo "Full OCR Text:"
echo "=========================================="
echo "$OCR_RESPONSE" | jq -r '.ocrText'

