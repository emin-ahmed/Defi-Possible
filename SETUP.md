# MayanConnect Setup Guide

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of free RAM
- Ports 3000, 8000, 8001, 5432, 6379, 11434 available

## Quick Start

### 1. Clone and Navigate

```bash
cd /home/lavdal/Documents/projects/defi_neurostack
```

### 2. Create Environment File

Create `backend/.env` with the following content:

```env
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mayanconnect

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT - CHANGE THIS!
JWT_SECRET=your-generated-secret-here-use-openssl-rand-hex-32
JWT_EXPIRATION=30m
JWT_REFRESH_EXPIRATION=7d

# Mayan EDMS (will be configured after first run)
MAYAN_URL=http://mayan:8000
MAYAN_API_TOKEN=

# AI Service
OLLAMA_URL=http://ollama:11434
```

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```
Replace `your-generated-secret-here-use-openssl-rand-hex-32` with the output.

### 3. Start Services

```bash
docker-compose up -d
```

Wait 2-3 minutes for all services to initialize.

### 4. Configure Mayan EDMS

1. Create Mayan superuser (interactive):
```bash
docker-compose exec -it mayan /opt/mayan-edms/bin/mayan-edms.py createsuperuser
```

Or create it non-interactively (username: admin, password: adminpass123):
```bash
docker-compose exec mayan /opt/mayan-edms/bin/mayan-edms.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123') if not User.objects.filter(username='admin').exists() else None"
```

2. Login to Mayan at http://localhost:8000 with the credentials you just created

3. Navigate to: **System → Setup → API → Tokens** (or **Tools → API** depending on version)

4. Click "Create" and copy the token

5. Update `backend/.env` with the token:
```env
MAYAN_API_TOKEN=your_copied_token_here
```

6. Restart backend:
```bash
docker-compose restart backend
```

### 5. Pull AI Model

```bash
docker-compose exec ollama ollama pull llama3.1:8b
```

This will take 5-10 minutes depending on your internet speed.

### 6. Create Admin Account

```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123",
    "fullName": "Admin User"
  }'
```

Then upgrade to admin role:
```bash
docker-compose exec postgres psql -U postgres -d mayanconnect \
  -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

### 7. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **API Docs:** http://localhost:8001/api/docs
- **Mayan EDMS:** http://localhost:8000

## Usage

### Login
Navigate to http://localhost:3000 and login with your credentials.

### Upload Documents
1. Click "Upload Document"
2. Select a PDF, DOCX, JPG, or PNG file (max 10MB)
3. Wait for processing (OCR + AI summary)
4. View results in document list

### Access Control (Admin Only)
Admins can grant temporary access to users via the API:

```bash
curl -X POST http://localhost:8001/api/access/grant \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-here",
    "startDate": "2024-12-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }'
```

## Troubleshooting

### Backend won't start
- Check if DATABASE_URL is correct
- Ensure PostgreSQL is running: `docker-compose ps postgres`
- View logs: `docker-compose logs backend`

### Mayan OCR not working
- Wait longer (OCR can take 30-60 seconds)
- Check Mayan logs: `docker-compose logs mayan`
- Verify Mayan is accessible: `curl http://localhost:8000`

### AI summary fails
- Ensure Ollama model is downloaded: `docker-compose exec ollama ollama list`
- Check Ollama logs: `docker-compose logs ollama`
- Restart Ollama: `docker-compose restart ollama`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8001/api/auth/me`
- Check CORS settings in `backend/src/main.ts`
- Clear browser cache and reload

## Development

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### View All Logs
```bash
docker-compose logs -f
```

### Stop Services
```bash
docker-compose down
```

### Reset Everything
```bash
docker-compose down -v
rm -rf backend/node_modules frontend/node_modules
```

## Production Deployment

1. Change `NODE_ENV=production` in backend/.env
2. Generate new, secure JWT_SECRET
3. Use strong database passwords
4. Configure proper CORS origins
5. Set up SSL/TLS certificates
6. Use proper secrets management (not .env files)
7. Set `synchronize: false` in `backend/src/config/database.config.ts`
8. Create and run database migrations

## Architecture

- **Backend:** NestJS REST API with Bull Queue for async processing
- **Frontend:** React SPA with React Query for data fetching
- **Database:** PostgreSQL for relational data
- **Cache/Queue:** Redis for Bull queue management
- **OCR:** Mayan EDMS handles document processing
- **AI:** Ollama with Llama 3.1 8B for summarization

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token
- GET `/api/auth/me` - Get current user

### Documents
- POST `/api/documents/upload` - Upload document
- GET `/api/documents` - List documents
- GET `/api/documents/:id` - Get document details
- GET `/api/documents/:id/summary` - Get AI summary
- GET `/api/documents/:id/file` - Download document
- DELETE `/api/documents/:id` - Delete document

### Access Control (Admin only)
- POST `/api/access/grant` - Grant access to user
- GET `/api/access/rules` - List all access rules
- PUT `/api/access/rules/:id` - Update access rule
- DELETE `/api/access/rules/:id` - Delete access rule
- GET `/api/access/check` - Check current user access

## License

MIT

