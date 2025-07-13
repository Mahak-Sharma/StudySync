@echo off
setlocal enabledelayedexpansion

REM StudySync Backend Deployment Script for Windows
REM This script helps deploy the backend services using Docker

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:MAIN
if "%1"=="" goto HELP
if "%1"=="deploy" goto DEPLOY
if "%1"=="start" goto START
if "%1"=="stop" goto STOP
if "%1"=="restart" goto RESTART
if "%1"=="status" goto STATUS
if "%1"=="health" goto HEALTH
if "%1"=="logs" goto LOGS
if "%1"=="cleanup" goto CLEANUP
if "%1"=="help" goto HELP
goto HELP

:DEPLOY
echo [INFO] Deploying services...
call :CHECK_DOCKER
if errorlevel 1 exit /b 1

if "%2"=="production" (
    echo [INFO] Deploying in production mode...
    docker-compose -f docker-compose.prod.yml up --build -d
) else (
    echo [INFO] Deploying in development mode...
    docker-compose up --build -d
)

if errorlevel 1 (
    echo [ERROR] Failed to deploy services
    exit /b 1
)

echo [SUCCESS] Services deployed successfully
timeout /t 10 /nobreak >nul
call :HEALTH_CHECK
goto END

:START
echo [INFO] Starting services...
call :CHECK_DOCKER
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    exit /b 1
)
echo [SUCCESS] Services started
goto END

:STOP
echo [INFO] Stopping services...
docker-compose down
echo [SUCCESS] Services stopped
goto END

:RESTART
echo [INFO] Restarting services...
docker-compose restart
echo [SUCCESS] Services restarted
goto END

:STATUS
echo [INFO] Service status:
docker-compose ps
goto END

:HEALTH
call :HEALTH_CHECK
goto END

:LOGS
if "%2"=="" (
    echo [INFO] Showing logs for all services...
    docker-compose logs -f
) else (
    echo [INFO] Showing logs for %2...
    docker-compose logs -f %2
)
goto END

:CLEANUP
echo [INFO] Cleaning up Docker resources...
docker-compose down --rmi all -v
docker system prune -f
echo [SUCCESS] Cleanup completed
goto END

:HELP
echo StudySync Backend Deployment Script for Windows
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   deploy [env]     Deploy services (env: development^|production, default: development)
echo   start            Start existing services
echo   stop             Stop services
echo   restart          Restart services
echo   status           Show service status
echo   health           Check service health
echo   logs [service]   Show logs (optional: service name)
echo   cleanup          Clean up Docker resources
echo   help             Show this help message
echo.
echo Examples:
echo   %0 deploy production
echo   %0 logs backend
echo   %0 health
goto END

:CHECK_DOCKER
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)
echo [SUCCESS] Docker is running
exit /b 0

:HEALTH_CHECK
echo [INFO] Checking service health...

set "services=backend speech2text video-call-server"
set "ports=5001 5000 3001"

for %%s in (%services%) do (
    for %%p in (%ports%) do (
        echo [INFO] Checking %%s on port %%p...
        curl -f http://localhost:%%p/health >nul 2>&1
        if errorlevel 1 (
            echo [WARNING] %%s health check failed
        ) else (
            echo [SUCCESS] %%s is healthy
        )
    )
)
exit /b 0

:END
endlocal 