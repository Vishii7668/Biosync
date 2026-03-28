#!/bin/bash

echo ""
echo "🧬  BioSync — Starting servers"
echo "======================================"

# Trap Ctrl+C to kill both
trap "echo ''; echo '👋  Shutting down...'; kill 0" INT

# Backend
echo "🔧  Starting backend on http://localhost:8000"
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 2

# Frontend
echo "🎨  Starting frontend on http://localhost:5173"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================"
echo "✅  Both servers running!"
echo ""
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "   Press Ctrl+C to stop"
echo "======================================"
echo ""

wait
