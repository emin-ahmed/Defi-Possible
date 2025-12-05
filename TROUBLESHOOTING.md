# MayanConnect Troubleshooting Guide

## ✅ System Status Checklist

Run these commands to verify everything is working:

```bash
cd /home/lavdal/Documents/projects/defi_neurostack

# 1. Check all services are running
docker-compose ps

# 2. Check Mayan OCR workers
docker-compose exec mayan ps aux | grep celery | grep ocr

# 3. Check Ollama has the model
docker-compose exec ollama ollama list

# 4. Verify Mayan API token
docker-compose exec backend printenv | grep MAYAN_API_TOKEN

# 5. Test Mayan API access
curl -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  http://localhost:8000/api/v4/documents/ | jq '.count'
```

## 🐛 Common Issues

### Issue: "summaryStatus": "failed"

**Check OCR Processing:**
```bash
# Get latest document ID
DOC_ID=$(curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/" | jq -r '.results[-1].id')

echo "Document ID: $DOC_ID"

# Check versions
curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/" | jq '.results'

# Get version ID (usually matches document ID or is the first result)
VER_ID=$(curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/" | jq -r '.results[0].id')

# Check pages
curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/$VER_ID/pages/" | jq '.results'

# Get page ID
PAGE_ID=$(curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/$VER_ID/pages/" | jq -r '.results[0].id')

# Check for OCR content
curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/$VER_ID/pages/$PAGE_ID/" | jq '.ocr_content'
```

**Check Backend Logs:**
```bash
docker-compose logs --tail=50 backend | grep -E "Processing|OCR|Extracted|Failed|ERROR"
```

**Check Mayan Logs:**
```bash
docker-compose logs --tail=50 mayan
```

### Issue: OCR Timeout

The polling waits 60 seconds. For large documents, you may need to increase it.

Edit `backend/src/modules/mayan/mayan.service.ts`:
```typescript
async waitForOcr(documentId: string, maxWaitSeconds: number = 120) {  // Increase to 120
```

### Issue: AI Summary Fails

**Test Ollama directly:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Summarize this: Hello world",
  "stream": false
}'
```

**Check AI service logs:**
```bash
docker-compose logs backend | grep -i "AI\|ollama\|summary"
```

## 📝 Testing OCR Manually

Submit a document for OCR:
```bash
# Upload a test PDF/image first via frontend, then:
DOC_ID=<your_document_id>

# Manually trigger OCR
curl -X POST -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/ocr/submit/"

# Wait 10-30 seconds, then check
curl -s -H "Authorization: Token 408078e5e29f061f9ac229abde11acad39c98d05" \
  "http://localhost:8000/api/v4/documents/$DOC_ID/versions/" | jq '.results[0]'
```

## 🔍 Debug Full Pipeline

```bash
# Watch all logs in real-time
docker-compose logs -f backend mayan ollama
```

Upload a document and watch for:
1. ✅ "Document uploaded to Mayan: X"
2. ✅ "OCR processing triggered for document: X"
3. ✅ "Processing document: X"
4. ✅ "Getting OCR text for document X"
5. ✅ "Extracted N pages of OCR text"
6. ✅ "Document processed successfully: X"

## ⚠️ Important Notes

- **Plain text files** don't need OCR (they're already text!)
- **PDF/Images** require OCR processing (30-60 seconds)
- **Large files** (>5 pages) may take longer
- **First upload** after restart might be slower

## 🎯 Recommended Test

Upload a simple PDF with text:
1. Create test PDF or use an image with text
2. Upload via http://localhost:3000
3. Watch logs: `docker-compose logs -f backend`
4. Wait 60-90 seconds
5. Check document list for summary

