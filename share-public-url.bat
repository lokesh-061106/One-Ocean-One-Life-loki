@echo off
title O3L - Direct Public URL Tunnel
echo ===================================================
echo Starting Cloudflare Public Tunnel for O3L
echo Exposing http://localhost:3000 to the world
echo ===================================================
"%~dp0tools\cloudflared.exe" tunnel --url http://localhost:3000
pause
