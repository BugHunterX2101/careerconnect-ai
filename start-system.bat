@echo off
echo ========================================
echo   CareerConnect AI - System Startup
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo .env file created. Please configure it with your API keys.
    echo.
)

REM Install backend dependencies if needed
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    echo.
)

REM Install frontend dependencies if needed
if not exist "src\client\node_modules" (
    echo Installing frontend dependencies...
    cd src\client
    call npm install
    cd ..\..
    echo.
)

REM Start Redis if script is available
if exist "start-redis.bat" (
    echo Starting Redis cache...
    start "CareerConnect Redis" cmd /k "start-redis.bat"
    timeout /t 2 /nobreak >nul
    echo.
)

echo Starting backend server...
start "CareerConnect Backend" cmd /k "npm start"

timeout /t 3 /nobreak >nul

echo Starting frontend client...
start "CareerConnect Frontend" cmd /k "cd src\client && npm run dev"

echo.
echo ========================================
echo   System Started Successfully!
echo ========================================
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo Health:   http://localhost:3000/health
echo ========================================
