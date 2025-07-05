@echo off
echo 🎯 Starting StudySync - Frontend + Summarization Backend
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install npm dependencies
        pause
        exit /b 1
    )
)

echo 🚀 Starting all services...
node start-dev.js

pause 