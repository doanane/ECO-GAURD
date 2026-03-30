#!/bin/bash
cd "$(dirname "$0")/backend"

echo "========================================"
echo " EcoGuard Technologies — Backend Server"
echo "========================================"

if [ ! -d "venv" ]; then
  echo "[INFO] Creating Python virtual environment..."
  python -m venv venv
fi

echo "[INFO] Activating virtual environment..."
source venv/Scripts/activate 2>/dev/null || source venv/bin/activate 2>/dev/null

echo "[INFO] Installing dependencies..."
pip install -r requirements.txt -q

echo "[INFO] Starting FastAPI server on http://0.0.0.0:8000"
echo "[INFO] API docs: http://localhost:8000/docs"
echo "[INFO] WebSocket: ws://localhost:8000/ws/pipeline"
echo ""

python main.py
