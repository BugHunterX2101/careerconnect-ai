@echo off
REM 🚀 CareerConnect AI - Railway Deployment Script (Windows)
REM This script deploys the application to Railway

echo 🚀 Starting CareerConnect AI deployment to Railway...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Railway CLI is not installed. Please install it first.
    echo Installation: npm install -g @railway/cli
    pause
    exit /b 1
)

echo [INFO] Checking Railway CLI version...
railway --version

echo [INFO] Checking if logged in to Railway...
railway whoami >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not logged in to Railway. Please login first:
    echo railway login
    pause
    exit /b 1
)

echo [INFO] Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads\temp" mkdir uploads\temp
if not exist "uploads\avatars" mkdir uploads\avatars
if not exist "uploads\resumes" mkdir uploads\resumes

echo [SUCCESS] Directories created successfully

echo [INFO] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully

echo [INFO] Building client...
cd src\client
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build client
    pause
    exit /b 1
)

cd ..\..

echo [SUCCESS] Client built successfully

echo [INFO] Deploying to Railway...
railway up
if errorlevel 1 (
    echo [ERROR] Failed to deploy to Railway
    pause
    exit /b 1
)

echo [SUCCESS] Deployment initiated successfully!

echo.
echo 🎉 Railway deployment completed!
echo.
echo 📋 Next steps:
echo 1. Check deployment status: railway status
echo 2. View logs: railway logs
echo 3. Open application: railway open
echo.
echo 🌐 Your application will be available at:
echo    https://careerconnect-ai-production.up.railway.app
echo.
echo [SUCCESS] Railway deployment script completed successfully!

pause
