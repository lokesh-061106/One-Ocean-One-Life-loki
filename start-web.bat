@echo off
title O3L Web App - localhost:3000
echo ===================================================
echo Starting O3L Web Application (Next.js)
echo URL: http://localhost:3000
echo ===================================================
cd /d "%~dp0apps\web"
npm run dev
pause
