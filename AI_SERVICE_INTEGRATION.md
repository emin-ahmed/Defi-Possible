# AI Service Integration

## Overview

The project now uses the dedicated AI service from `Ai-Service-for-summarizing-document-content` instead of the local Ollama container with llama3.1:8b.

## Architecture

```
┌─────────────────┐
│   Backend       │
│   (NestJS)      │
│   Port: 8001    │
└────────┬────────┘
         │
         │ HTTP Requests to
         │ http://ai-service:8000/api/analyze
         │
         ▼
┌─────────────────┐
│   AI Service    │
│   (FastAPI)     │
│   Port: 5000    │ (mapped from 8000)
└────────┬────────┘
         │
         │ HTTP Requests to
         │ 10.17.10.255:11434
         │
         ▼
┌─────────────────┐
│ External Ollama │
│   llama3.2:3b   │
│ 10.17.10.255    │
└─────────────────┘
```

## Changes Made

### 1. Docker Compose Configuration

**Added `ai-service` container:**
- **Image:** Built from `./Ai-Service-for-summarizing-document-content/Dockerfile`
- **Port Mapping:** `5000:8000` (host:container)
- **Environment Variables:**
  - `OLLAMA_HOST=10.17.10.255:11434` - External Ollama instance
  - `MODEL_NAME=llama3.2:3b` - AI model to use
  - `MAX_TOKENS=500` - Maximum response length
  - `LOG_LEVEL=info` - Logging verbosity

**Updated `backend` service:**
- Changed `OLLAMA_URL` to `AI_SERVICE_URL=http://ai-service:8000`
- Updated `depends_on` to include `ai-service` instead of `ollama`

**Commented out local `ollama` service:**
- No longer needed as we use external Ollama through the AI service

### 2. Backend Configuration

The backend AI service (`backend/src/modules/ai/ai.service.ts`) is already configured to:
- Read `AI_SERVICE_URL` environment variable
- Call `/api/analyze` endpoint
- Send document text and language
- Parse response with summary, keywords, and key points

### 3. API Endpoints

The AI service exposes:

#### `POST /api/analyze`
**Request:**
```json
{
  "text": "Document content here...",
  "language": "en",  // "en" or "fr"
  "document_id": "optional-id"
}
```

**Response:**
```json
{
  "summary": "Document summary...",
  "keywords": ["keyword1", "keyword2", ...],
  "key_points": ["Point 1", "Point 2", ...],
  "document_id": "optional-id",
  "processing_time": 2.5,
  "model_used": "llama3.2:3b"
}
```

#### `GET /health`
Health check endpoint to verify AI service is running and can connect to Ollama.

## Prerequisites

1. **External Ollama Instance:**
   - Must be running at `10.17.10.255:11434`
   - Must have `llama3.2:3b` model pulled: `ollama pull llama3.2:3b`
   - Must be accessible from Docker containers

2. **Network Connectivity:**
   - Docker containers must be able to reach `10.17.10.255` on port `11434`
   - Firewall rules should allow this connection

## Usage

### Starting the Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View AI service logs
docker-compose logs -f ai-service

# View backend logs
docker-compose logs -f backend
```

### Testing the AI Service

**Test AI service directly:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Sample document text here...",
    "language": "en"
  }'
```

**Check AI service health:**
```bash
curl http://localhost:5000/health
```

### Testing Through Backend

The backend will automatically use the AI service when processing documents. Upload a document through the frontend or API, and the AI service will be called automatically.

## Troubleshooting

### AI Service Can't Connect to Ollama

**Symptoms:**
- AI service returns 503 errors
- Logs show "Ollama service not available"

**Solutions:**
1. Verify Ollama is running on `10.17.10.255:11434`
2. Test connectivity: `curl http://10.17.10.255:11434/api/tags`
3. Check firewall rules
4. Verify the model is pulled: `ollama list` on the Ollama machine

### AI Service Not Starting

**Symptoms:**
- Container keeps restarting
- Health check fails

**Solutions:**
1. Check logs: `docker-compose logs ai-service`
2. Verify Dockerfile dependencies are installed
3. Rebuild the service: `docker-compose up -d --build ai-service`

### Backend Can't Reach AI Service

**Symptoms:**
- Backend logs show connection errors to AI service
- Document processing fails

**Solutions:**
1. Verify AI service is running: `docker-compose ps ai-service`
2. Check service health: `curl http://localhost:5000/health`
3. Verify backend environment variable: `docker-compose exec backend env | grep AI_SERVICE_URL`
4. Check Docker network: `docker network inspect defi_neurostack_default`

## Configuration Options

### Changing the Ollama Host

Edit `docker-compose.yml`:
```yaml
ai-service:
  environment:
    - OLLAMA_HOST=your-ollama-host:11434
```

### Changing the AI Model

Edit `docker-compose.yml`:
```yaml
ai-service:
  environment:
    - MODEL_NAME=llama3.1:8b  # or any other model
```

Make sure the model is pulled on the Ollama instance.

### Changing Language

The backend currently uses English (`en`) by default. To use French:

Edit `backend/src/modules/ai/ai.service.ts`:
```typescript
{
  text: textContent,
  language: 'fr', // Change to 'fr' for French
}
```

### Increasing Response Length

Edit `docker-compose.yml`:
```yaml
ai-service:
  environment:
    - MAX_TOKENS=1000  # Increase from 500
```

## Service URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **AI Service:** http://localhost:5000
- **AI Service API Docs:** http://localhost:5000/docs
- **AI Service Health:** http://localhost:5000/health
- **Mayan EDMS:** http://localhost:8000
- **External Ollama:** http://10.17.10.255:11434

## Performance

- **Typical Response Time:** 2-5 seconds for small documents
- **Large Documents:** May take 10-30 seconds
- **Timeout:** 120 seconds (configurable in backend)

## Security Notes

1. **External Ollama Access:** The AI service connects to an external Ollama instance. Ensure this connection is on a trusted network.

2. **No Authentication:** The AI service currently has no authentication. It should not be exposed to the public internet.

3. **Data Privacy:** Document text is sent to the external Ollama instance for processing. Ensure compliance with your data privacy requirements.

## Future Improvements

1. Add authentication to AI service
2. Support multiple AI models
3. Add caching for frequently analyzed documents
4. Implement batch processing
5. Add monitoring and metrics
6. Support custom prompts
7. Add entity extraction endpoint

