# 🔍 Check Document Processing Status

## Quick Check Current Document

Run this after uploading a document:

```bash
# Get your JWT token first
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123"}' | jq -r '.accessToken')

# Get latest document
curl -s -X GET http://localhost:8001/api/documents \
  -H "Authorization: Bearer $TOKEN" | jq '.documents[0]'
```

## Monitor Logs in Real-Time

```bash
./monitor-upload.sh
```

Or manually:
```bash
docker-compose logs -f backend
```

## What To Look For

### ✅ Successful Flow:

```
[PROCESSOR] Starting document processing
[PROCESSOR] Document ID: xxx-xxx-xxx
[PROCESSOR] Mayan Document ID: 5
----------------------------------------
[PROCESSOR] Step 1: Updating status to PROCESSING
[PROCESSOR] ✓ Status updated
----------------------------------------
[PROCESSOR] Step 2: Waiting for OCR to complete...
[OCR-1] Getting versions for document 5
[OCR-1] API Call: GET http://mayan:8000/api/v4/documents/5/versions/
[OCR-1] ✓ Found 1 version(s)
[OCR-2] Using version 5
[OCR-2] API Call: GET http://mayan:8000/api/v4/documents/5/versions/5/pages/
[OCR-2] ✓ Found 1 page(s)
[OCR-3.1] Getting page 144 (page number 1)
[OCR-3.1] ✓ Found 1 OCR content item(s)
[OCR-3.1] ✓ OCR content: 234 chars - "This is the document text..."
[OCR-4] ✓ Total extracted: 1 pages, 234 characters
[PROCESSOR] ✓ OCR ready
----------------------------------------
[PROCESSOR] Step 3: Extracting OCR text...
[PROCESSOR] ✓ OCR text extracted: 234 characters
----------------------------------------
[PROCESSOR] Step 4: Generating AI summary...
[AI-1] Received text content: 234 characters
[AI-1] Text preview: "This is the document text..."
[AI-2] Sending to Ollama: http://ollama:11434/api/generate
[AI-2] Model: llama3.1:8b
[AI-3] ✓ Received response from Ollama
[AI-3] Raw AI response: {"summary": "...", "key_points": [...], ...}
[AI-4] ✓ Found JSON in response
[AI-5] ✓ Generated summary: This document discusses...
[AI-5] ✓ Generated 5 key points
[AI-5] ✓ Generated 5 keywords
[PROCESSOR] ✓ AI summary generated
----------------------------------------
[PROCESSOR] Step 5: Saving summary to database...
[PROCESSOR] ✓ Summary saved
[PROCESSOR] ✓✓✓ Document processed successfully
```

### ❌ Common Errors:

**OCR Timeout:**
```
[PROCESSOR] Step 2: Waiting for OCR to complete...
[PROCESSOR] ✗✗✗ Failed to process document
[PROCESSOR] Error: OCR processing timeout
```
**Solution:** OCR workers may be busy. Wait and try again.

**No OCR Text:**
```
[OCR-2] ✓ Found 1 page(s)
[OCR-3.1] ✓ Found 0 OCR content item(s)
[PROCESSOR] Error: No OCR text extracted
```
**Solution:** OCR hasn't run yet. Check if Mayan OCR workers are running.

**AI Connection Error:**
```
[AI-2] Sending to Ollama: http://ollama:11434/api/generate
[AI-ERROR] Failed to generate AI summary: connect ECONNREFUSED
```
**Solution:** Ollama isn't running. Check: `docker-compose ps ollama`

## 📋 Detailed API Call Trace

The logs will show every API call with:
- [OCR-1] Versions API
- [OCR-2] Pages API  
- [OCR-3.X] Individual page details (with OCR content)
- [AI-1] Input text received
- [AI-2] Ollama API call
- [AI-3] Response received
- [AI-4] JSON parsing
- [AI-5] Final result

## 🎯 Run The Test

1. Start monitoring: `./monitor-upload.sh`
2. In another terminal or browser: Upload a document at http://localhost:3000
3. Watch the logs in real-time!

You'll see **exactly where it succeeds or fails**.

