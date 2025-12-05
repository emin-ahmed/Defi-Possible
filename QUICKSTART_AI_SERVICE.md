# Quick Start Guide: AI Service Integration

## What Changed?

Your backend now uses the dedicated AI service from `Ai-Service-for-summarizing-document-content` instead of the local Ollama container with llama3.1:8b model.

The new setup:
- ✅ **AI Service** (FastAPI) - Handles document analysis
- ✅ **External Ollama** (10.17.10.255:11434) - Provides LLM capabilities  
- ✅ **Backend** (NestJS) - Calls AI service automatically
- ❌ **Local Ollama** - No longer needed (commented out)

## Prerequisites

Before starting, ensure:

1. **Ollama is running** at `10.17.10.255:11434`
   ```bash
   curl http://10.17.10.255:11434/api/tags
   ```

2. **Model is available** on the Ollama instance:
   ```bash
   # On the Ollama machine (10.17.10.255):
   ollama list
   # Should show llama3.2:3b
   # If not, pull it:
   ollama pull llama3.2:3b
   ```

3. **Network connectivity** from your machine to `10.17.10.255:11434`

## Step-by-Step Setup

### 1. Stop Running Services

```bash
cd /home/lavdal/Documents/projects/defi_neurostack
docker-compose down
```

### 2. Build and Start Services

```bash
# Build all services (including the new AI service)
docker-compose build

# Start all services
docker-compose up -d

# Or start specific services
docker-compose up -d ai-service backend
```

### 3. Verify Services Are Running

```bash
# Check status of all services
docker-compose ps

# Should see:
# - ai-service (Up)
# - backend (Up)
# - frontend (Up)
# - postgres (Up)
# - redis (Up)
# - mayan (Up)
# - postgres-mayan (Up)
# - redis-mayan (Up)
```

### 4. Check AI Service Health

```bash
# Quick health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "healthy",
#   "model": "llama3.2:3b",
#   "ollama_host": "10.17.10.255:11434",
#   "timestamp": "2025-12-05T..."
# }
```

### 5. Run Comprehensive Test

```bash
# Run the automated test script
./test-ai-service.sh
```

This script will:
- ✓ Check if AI service container is running
- ✓ Test AI service health endpoint
- ✓ Verify Ollama connectivity
- ✓ Test document analysis
- ✓ Check backend configuration
- ✓ Verify network connectivity

### 6. Test Document Analysis

```bash
# Test AI service directly
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test document about artificial intelligence and machine learning.",
    "language": "en"
  }'
```

Expected response:
```json
{
  "summary": "A brief summary...",
  "keywords": ["artificial intelligence", "machine learning", ...],
  "key_points": ["Key point 1", "Key point 2", ...],
  "processing_time": 2.5,
  "model_used": "llama3.2:3b"
}
```

## Viewing Logs

```bash
# View AI service logs
docker-compose logs -f ai-service

# View backend logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f
```

## Testing Through the Application

1. **Open the frontend:** http://localhost:3000

2. **Log in** with your credentials

3. **Upload a document** through the UI

4. **Wait for processing** - the document will be:
   - Uploaded to Mayan
   - OCR extracted (if needed)
   - Sent to AI service for analysis
   - Summary, keywords, and key points will be displayed

5. **Check logs** to see the flow:
   ```bash
   docker-compose logs -f backend ai-service
   ```

## Common Issues and Solutions

### Issue 1: AI Service Can't Connect to Ollama

**Symptoms:**
```
Failed to generate AI summary
Response status: 503
AI service unavailable
```

**Solution:**
```bash
# Test Ollama connectivity
curl http://10.17.10.255:11434/api/tags

# If this fails, check:
# 1. Ollama is running on that machine
# 2. Port 11434 is open
# 3. Your network can reach that IP
```

### Issue 2: Model Not Found

**Symptoms:**
```
Model 'llama3.2:3b' not found
```

**Solution:**
```bash
# On the Ollama machine (10.17.10.255):
ollama pull llama3.2:3b
```

### Issue 3: AI Service Container Not Starting

**Symptoms:**
```
docker-compose ps ai-service
# Shows: Exit 1 or Restarting
```

**Solution:**
```bash
# Check logs
docker-compose logs ai-service

# Rebuild the service
docker-compose build ai-service
docker-compose up -d ai-service
```

### Issue 4: Backend Can't Reach AI Service

**Symptoms:**
```
Backend logs show: Failed to connect to ai-service
```

**Solution:**
```bash
# Check if AI service is running
docker-compose ps ai-service

# Test network connectivity from backend
docker-compose exec backend curl http://ai-service:8000/health

# Restart both services
docker-compose restart ai-service backend
```

## Configuration

### Change AI Model

Edit `docker-compose.yml`:
```yaml
ai-service:
  environment:
    - MODEL_NAME=llama3.1:8b  # or any other model
```

Then restart:
```bash
docker-compose up -d ai-service
```

### Change Ollama Host

Edit `docker-compose.yml`:
```yaml
ai-service:
  environment:
    - OLLAMA_HOST=your-ollama-host:11434
```

### Use French Language

Edit `backend/src/modules/ai/ai.service.ts`:
```typescript
const response = await firstValueFrom(
  this.httpService.post(
    `${this.aiServiceUrl}/api/analyze`,
    {
      text: textContent,
      language: 'fr',  // Change from 'en' to 'fr'
    },
    { timeout: 120000 },
  ),
);
```

Then rebuild:
```bash
docker-compose build backend
docker-compose up -d backend
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web application |
| Backend API | http://localhost:8001 | NestJS API |
| AI Service | http://localhost:5000 | FastAPI service |
| AI Service Docs | http://localhost:5000/docs | Interactive API docs |
| AI Service Health | http://localhost:5000/health | Health check |
| Mayan EDMS | http://localhost:8000 | Document management |
| External Ollama | http://10.17.10.255:11434 | LLM service |

## Performance Expectations

- **Small documents** (< 1000 words): 2-5 seconds
- **Medium documents** (1000-5000 words): 5-15 seconds
- **Large documents** (> 5000 words): 15-30 seconds
- **Timeout:** 120 seconds

## Next Steps

1. ✅ Services are running
2. ✅ AI integration is working
3. 📝 Upload and test with real documents
4. 📊 Monitor performance and logs
5. 🔧 Adjust configuration as needed

## Need Help?

- **Check logs:** `docker-compose logs -f ai-service backend`
- **Run tests:** `./test-ai-service.sh`
- **Read detailed docs:** `AI_SERVICE_INTEGRATION.md`
- **Test manually:** Use curl commands above

## Rolling Back (If Needed)

If you need to revert to the old Ollama setup:

1. Edit `docker-compose.yml`:
   - Comment out `ai-service`
   - Uncomment `ollama` service
   - Change `AI_SERVICE_URL` back to `OLLAMA_URL`

2. Restart:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

**🎉 You're all set! The AI service is now integrated and ready to use.**

