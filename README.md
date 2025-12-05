# MayanConnect - Secure Document Management with AI

A middleware application that connects users to Mayan EDMS with AI-powered document analysis.

## Features

- 📁 Document upload and management
- 🤖 AI-powered document summarization
- 🔐 Temporary access control system
- 🔍 OCR text extraction via Mayan EDMS
- 📊 Admin dashboard for access management

## Tech Stack

**Backend:** NestJS, TypeORM, PostgreSQL, Bull Queue, Redis  
**Frontend:** React, TypeScript, Vite, Tailwind CSS  
**Services:** Mayan EDMS, Ollama (Llama 3.1 8B)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd defi_neurostack
```

2. **Create environment file**
```bash
cp backend/.env.example backend/.env
```

3. **Generate JWT secret**
```bash
openssl rand -hex 32
```
   Add this to `backend/.env` as `JWT_SECRET`

4. **Start all services**
```bash
docker-compose up -d
```

5. **Wait for services to initialize** (2-3 minutes)

6. **Setup Mayan EDMS**
```bash
# Create Mayan superuser (interactive)
docker-compose exec -it mayan /opt/mayan-edms/bin/mayan-edms.py createsuperuser

# Login at http://localhost:8000
# Go to System > API > Create API token
# Copy the token and add to backend/.env as MAYAN_API_TOKEN
```

7. **Pull AI model**
```bash
docker-compose exec ollama ollama pull llama3.1:8b
```

8. **Restart backend services**
```bash
docker-compose restart backend
```

9. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001/api
   - API Docs: http://localhost:8001/api/docs
   - Mayan EDMS: http://localhost:8000

### Default Admin Account

After first run, create an admin account via API or directly in database:
```bash
# Using API (recommended)
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123",
    "fullName": "Admin User"
  }'

# Then manually update role in database:
docker-compose exec postgres psql -U postgres -d mayanconnect \
  -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

## Project Structure

```
mayanconnect/
├── backend/          # NestJS backend
├── frontend/         # React frontend
├── docs/            # Documentation
└── docker-compose.yml
```

## Development

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once running, visit http://localhost:8001/api/docs for Swagger documentation.

## Troubleshooting

**Mayan OCR not working:**
- Ensure Mayan container has fully initialized
- Check logs: `docker-compose logs mayan`

**AI summary failing:**
- Verify Ollama model is downloaded: `docker-compose exec ollama ollama list`
- Check Ollama logs: `docker-compose logs ollama`

**Database connection errors:**
- Ensure PostgreSQL is running: `docker-compose ps postgres`
- Check connection string in backend/.env

## License

MIT License

