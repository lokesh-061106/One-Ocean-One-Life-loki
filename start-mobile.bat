@echo off
title O3L Mobile App (Expo)
echo ===================================================
echo Starting O3L Mobile Application (Expo)
echo Scan the QR code using Expo Go on your phone!
echo ===================================================
cd /d "%~dp0apps\mobile"
if not exist "node_modules\" (
    echo Installing mobile dependencies...
    npm install
)
npx expo start
pause
