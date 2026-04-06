@echo off
setlocal

set CONTAINER=openclaw-openclaw-gateway-1

if "%~1"=="" goto :dashboard
if "%~1"=="dashboard" goto :dashboard
if "%~1"=="status" goto :status
if "%~1"=="logs" goto :logs
if "%~1"=="start" goto :start
if "%~1"=="stop" goto :stop
if "%~1"=="restart" goto :restart
if "%~1"=="whatsapp" goto :whatsapp
if "%~1"=="approve" goto :approve
if "%~1"=="backup" goto :backup
if "%~1"=="doctor" goto :doctor
goto :cli

:dashboard
echo Opening OpenClaw Dashboard...
start "" "http://127.0.0.1:18789/#token=39ba805229b426bbc6284c7a5816f1699b47785d019f17b58f2d2a941df89a29"
goto :eof

:status
echo.
echo === OpenClaw Status ===
docker exec %CONTAINER% node dist/index.js channels status
echo.
docker exec %CONTAINER% node dist/index.js models status
goto :eof

:logs
docker exec %CONTAINER% node dist/index.js logs
goto :eof

:start
echo Starting OpenClaw...
docker compose -f "%~dp0docker-compose.yml" up -d
echo OpenClaw started. Dashboard: http://localhost:18789
goto :eof

:stop
echo Stopping OpenClaw...
docker compose -f "%~dp0docker-compose.yml" down
echo OpenClaw stopped.
goto :eof

:restart
echo Restarting OpenClaw...
docker compose -f "%~dp0docker-compose.yml" restart openclaw-gateway
echo OpenClaw restarted.
goto :eof

:whatsapp
echo Linking WhatsApp (scan QR code with your phone)...
docker exec -it %CONTAINER% node dist/index.js channels login --channel whatsapp --verbose
goto :eof

:approve
if "%~2"=="" (
    echo Listing pending pairing requests...
    docker exec %CONTAINER% node dist/index.js pairing list whatsapp
) else (
    echo Approving pairing request: %~2
    docker exec %CONTAINER% node dist/index.js pairing approve whatsapp %~2
)
goto :eof

:backup
echo Creating backup...
docker exec %CONTAINER% node dist/index.js backup create
goto :eof

:doctor
docker exec %CONTAINER% node dist/index.js doctor
goto :eof

:cli
docker exec %CONTAINER% node dist/index.js %*
goto :eof
