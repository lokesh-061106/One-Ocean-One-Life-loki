@echo off
title O3L API - localhost:8000
echo ===================================================
echo Starting O3L Django API Backend
echo URL: http://localhost:8000/api/v1/
echo Note: Requires PostgreSQL 17 + PostGIS 3.6 running
echo ===================================================
cd /d "%~dp0apps\api"
call venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
pause
