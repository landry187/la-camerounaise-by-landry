@echo off
title La Camerounaise by Landry
color 0A
echo.
echo  ==========================================
echo   La Camerounaise by Landry
echo   Demarrage du serveur...
echo  ==========================================
echo.
cd /d "%~dp0backend"
if not exist "node_modules" (
  echo  Installation des dependances...
  npm install
  echo.
)
echo  Lancement du tunnel public...
start "Tunnel Public" cmd /k "lt --port 3000 --subdomain lacamerounaise"
timeout /t 3 /nobreak >nul
start https://lacamerounaise.loca.lt
echo  Serveur demarre !
echo  Site : https://lacamerounaise.loca.lt
echo  Ne ferme pas cette fenetre !
echo.
node server.js
pause