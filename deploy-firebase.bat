@echo off
echo ========================================
echo StudySync Firebase Deployment Script
echo ========================================
echo.

echo Checking if Firebase CLI is installed...
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Firebase CLI not found. Installing...
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo Failed to install Firebase CLI
        pause
        exit /b 1
    )
)

echo.
echo Building the project...
npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Deploying to Firebase...
firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Your app is now live at:
echo https://studysync-3435a.web.app
echo.
pause 