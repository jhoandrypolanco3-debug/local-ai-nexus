@echo off
title Creando Acceso Directo de Escritorio
chcp 65001 > nul
cls

echo ========================================================
echo   🚀 CREANDO ACCESO DIRECTO DE ESCRITORIO
echo ========================================================
echo.

set SCRIPT_DIR=%~dp0
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Local AI Nexus.lnk

echo Creando acceso directo en tu Escritorio...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'msedge.exe'; $s.Arguments = '--app=http://localhost:3333'; $s.Description = 'Local AI Nexus - Tu Ecosistema de IA'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [OK] ¡Acceso directo creado con exito en tu Escritorio!
    echo Ahora puedes abrir Local AI Nexus como una aplicacion nativa.
) else (
    echo [INFO] No se pudo crear el acceso directo automaticamente.
)

echo.
timeout /t 3 > nul
exit
