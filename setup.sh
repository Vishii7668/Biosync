#!/bin/bash
set -e

echo ""
echo "🧬  BioSync — Setup Script (macOS)"
echo "======================================"

# ── Check Homebrew ──────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  echo "📦  Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# ── Install Python 3.11 ─────────────────────────────────────────────────────
if ! command -v python3.11 &>/dev/null; then
  echo "🐍  Installing Python 3.11..."
  brew install python@3.11
fi

# ── Install Node.js ─────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "⬡   Installing Node.js..."
  brew install node
fi

echo ""
echo "✅  System dependencies ready"
echo ""

# ── Backend setup ───────────────────────────────────────────────────────────
echo "🔧  Setting up backend..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
deactivate
cd ..

echo "✅  Backend dependencies installed"

# ── Frontend setup ──────────────────────────────────────────────────────────
echo "🎨  Setting up frontend..."
cd frontend
npm install --silent
cd ..

echo "✅  Frontend dependencies installed"
echo ""
echo "======================================"
echo "🚀  Setup complete! Run: ./start.sh"
echo "======================================"
echo ""
