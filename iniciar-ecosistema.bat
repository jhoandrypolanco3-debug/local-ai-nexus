@echo off
title Local AI Nexus - Tu Ecosistema de IA
chcp 65001 > nul
cls

echo ========================================================
echo        🚀 BIENVENIDO A LOCAL AI NEXUS 🚀
echo ========================================================
echo.

set OLLAMA_ORIGINS=*

:: 1. Check if Ollama is running
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Ollama esta activo y listo.
) else (
    echo [INFO] Iniciando Ollama...
    start /B "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve > nul 2>&1
    timeout /t 2 > nul
)

:: 2. Start Local AI Nexus Server
echo [INFO] Iniciando servidor web local en el puerto 3333...
start /B "" "%LOCALAPPDATA%\hermes\node\node.exe" "%~dp0server.js" > nul 2>&1
timeout /t 2 > nul

:: 3. Open Browser at http://localhost:3333
echo [OK] Abriendo panel en: http://localhost:3333
start "" "http://localhost:3333"

echo.
echo ========================================================
echo ¡Listo! Tu ecosistema esta activo en: http://localhost:3333
echo ========================================================
timeout /t 3 > nul
exit
