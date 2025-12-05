#!/bin/bash

# Test script for AI Service integration
# This script tests the AI service and backend integration

set -e

echo "======================================"
echo "AI Service Integration Test"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Test 1: Check if AI service container is running
echo "Test 1: Checking AI service container status..."
if docker-compose ps ai-service | grep -q "Up"; then
    print_success "AI service container is running"
else
    print_error "AI service container is not running"
    echo "Run: docker-compose up -d ai-service"
    exit 1
fi
echo ""

# Test 2: Check AI service health endpoint
echo "Test 2: Checking AI service health endpoint..."
if curl -s -f http://localhost:5000/health > /dev/null 2>&1; then
    print_success "AI service health endpoint is accessible"
    echo "Response:"
    curl -s http://localhost:5000/health | jq '.' || curl -s http://localhost:5000/health
else
    print_error "AI service health endpoint is not accessible"
    echo "Check logs: docker-compose logs ai-service"
    exit 1
fi
echo ""

# Test 3: Check Ollama connectivity from AI service
echo "Test 3: Testing Ollama connectivity..."
HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    print_success "AI service can connect to Ollama"
    echo "Ollama host: $(echo $HEALTH_RESPONSE | jq -r '.ollama_host' 2>/dev/null || echo '10.17.10.255:11434')"
    echo "Model: $(echo $HEALTH_RESPONSE | jq -r '.model' 2>/dev/null || echo 'llama3.2:3b')"
else
    print_error "AI service cannot connect to Ollama"
    echo "Verify Ollama is running at 10.17.10.255:11434"
    exit 1
fi
echo ""

# Test 4: Test AI service analysis endpoint
echo "Test 4: Testing AI analysis endpoint..."
TEST_TEXT="This is a test document about renewable energy. Solar panels and wind turbines are important for sustainable development. They help reduce carbon emissions and combat climate change."

ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:5000/api/analyze \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$TEST_TEXT\", \"language\": \"en\"}")

if echo "$ANALYSIS_RESPONSE" | grep -q "summary"; then
    print_success "AI service analysis endpoint is working"
    echo ""
    echo "Analysis Result:"
    echo "==============="
    echo "$ANALYSIS_RESPONSE" | jq '.' 2>/dev/null || echo "$ANALYSIS_RESPONSE"
else
    print_error "AI service analysis endpoint failed"
    echo "Response: $ANALYSIS_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Check if backend is running
echo "Test 5: Checking backend container status..."
if docker-compose ps backend | grep -q "Up"; then
    print_success "Backend container is running"
else
    print_error "Backend container is not running"
    echo "Run: docker-compose up -d backend"
    exit 1
fi
echo ""

# Test 6: Check backend environment variable
echo "Test 6: Verifying backend AI_SERVICE_URL configuration..."
AI_SERVICE_URL=$(docker-compose exec -T backend sh -c 'echo $AI_SERVICE_URL' 2>/dev/null | tr -d '\r')
if [ "$AI_SERVICE_URL" = "http://ai-service:8000" ]; then
    print_success "Backend is configured to use AI service"
    echo "AI_SERVICE_URL: $AI_SERVICE_URL"
else
    print_error "Backend AI_SERVICE_URL is not correctly configured"
    echo "Expected: http://ai-service:8000"
    echo "Got: $AI_SERVICE_URL"
    exit 1
fi
echo ""

# Test 7: Check Docker network connectivity
echo "Test 7: Testing network connectivity between services..."
# Use Node.js http module since curl might not be installed in backend container
CONNECTIVITY_TEST=$(docker-compose exec -T backend node -e "const http = require('http'); http.get('http://ai-service:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });" 2>&1; echo $?)
if [ "$CONNECTIVITY_TEST" = "0" ]; then
    print_success "Backend can reach AI service"
else
    print_error "Backend cannot reach AI service"
    echo "Check Docker network configuration"
    exit 1
fi
echo ""

# Final summary
echo "======================================"
echo "Summary"
echo "======================================"
print_success "All tests passed!"
echo ""
echo "Service URLs:"
echo "  - AI Service: http://localhost:5000"
echo "  - AI Service Docs: http://localhost:5000/docs"
echo "  - Backend API: http://localhost:8001"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Upload a document through the frontend"
echo "  2. Check backend logs: docker-compose logs -f backend"
echo "  3. Check AI service logs: docker-compose logs -f ai-service"
echo ""
print_info "Integration is ready for use!"

