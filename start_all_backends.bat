@echo off
echo Starting all backend services...

:: 1. Start Main Backend API (Port 5000)
start "Main Backend API (Port 5000)" cmd /k "cd /d d:\debug_thugs\backend && npm run dev"

:: 2. Start AI Diagnostic Models (Port 8000)
start "AI Diagnostic Models (Port 8000)" cmd /k "cd /d d:\debug_thugs\ai_models && venv\Scripts\activate && python app.py"

:: 3. Start MedGemma Chat API (Port 8001)
start "MedGemma Chat API (Port 8001)" cmd /k "cd /d d:\debug_thugs\chatbot\MedGemma && python run_medgemma.py"

:: 4. Start LibreChat Server (Port 3080)
start "LibreChat Server (Port 3080)" cmd /k "cd /d d:\debug_thugs\chatbot\LibreChat && npm run backend"

echo All services started in separate windows!
pause
