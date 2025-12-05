#!/bin/bash
echo "🔍 Monitoring backend logs for document processing..."
echo "Upload a document now from http://localhost:3000"
echo ""
echo "Watching for:"
echo "  [PROCESSOR] - Document processing steps"
echo "  [OCR-X] - OCR extraction steps"  
echo "  [AI-X] - AI summarization steps"
echo ""
echo "Press Ctrl+C to stop"
echo "========================================"
docker-compose logs -f backend
