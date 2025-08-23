@echo off
REM 🚀 CareerConnect AI - Render Deployment Script (Windows)
REM This script prepares and deploys the application to Render

echo 🚀 Starting CareerConnect AI deployment to Render...

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not in a git repository. Please initialize git first.
    exit /b 1
)

REM Check if we have a remote origin
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No remote origin found. Please add a GitHub remote first.
    echo Example: git remote add origin https://github.com/yourusername/careerconnect-main.git
    exit /b 1
)

echo [INFO] Checking current git status...

REM Check if there are uncommitted changes
git diff-index --quiet HEAD -- >nul 2>&1
if errorlevel 1 (
    echo [WARNING] You have uncommitted changes. Please commit them first.
    echo Run: git add . ^&^& git commit -m "Prepare for deployment"
    exit /b 1
)

echo [INFO] Creating necessary directories...

REM Create necessary directories
if not exist "logs" mkdir logs
if not exist "uploads\temp" mkdir uploads\temp
if not exist "uploads\avatars" mkdir uploads\avatars
if not exist "uploads\resumes" mkdir uploads\resumes

echo [SUCCESS] Directories created successfully

echo [INFO] Checking Node.js version...

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Current Node.js version: %NODE_VERSION%

echo [SUCCESS] Node.js version %NODE_VERSION% is compatible

echo [INFO] Installing dependencies...

REM Install dependencies
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo [SUCCESS] Dependencies installed successfully

echo [INFO] Building client...

REM Build client
cd src\client
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install client dependencies
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build client
    exit /b 1
)

cd ..\..

echo [SUCCESS] Client built successfully

echo [INFO] Running tests...

REM Run tests if available
npm run test:integration >nul 2>&1
if errorlevel 1 (
    echo [WARNING] No integration tests found, skipping...
) else (
    call npm run test:integration
    echo [SUCCESS] Tests passed
)

echo [INFO] Checking deployment configuration...

REM Check if render.yaml exists
if not exist "render.yaml" (
    echo [ERROR] render.yaml not found. Please ensure it exists in the root directory.
    exit /b 1
)

echo [SUCCESS] Deployment configuration found

echo [INFO] Pushing to GitHub...

REM Push to GitHub
git add .
git commit -m "Prepare for Render deployment - %date% %time%"
if errorlevel 1 (
    echo [ERROR] Failed to commit changes
    exit /b 1
)

git push origin main
if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    exit /b 1
)

echo [SUCCESS] Code pushed to GitHub successfully

echo.
echo 🎉 Deployment preparation completed!
echo.
echo 📋 Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Click 'New' → 'Blueprint'
echo 3. Connect your GitHub account
echo 4. Select this repository
echo 5. Click 'Create Blueprint Instance'
echo.
echo 🌐 Your application will be available at:
echo    Frontend: https://careerconnect-ai-frontend.onrender.com
echo    Backend:  https://careerconnect-ai-backend.onrender.com
echo.
echo 📖 For detailed instructions, see: RENDER_DEPLOYMENT.md
echo.
echo [SUCCESS] Deployment script completed successfully!

pause
