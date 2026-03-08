@echo off
setlocal enabledelayedexpansion

echo 🚀 CareerConnect Enhanced Dashboard Quick Start
echo ==============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start Redis if available
echo 🔄 Starting Redis...
if exist "start-redis.bat" (
    call start-redis.bat
    echo ✅ Redis started
) else (
    echo ⚠️  Redis script not found, using fallback storage
)

REM Run environment validation
echo 🔍 Validating environment...
npm test -- --testPathPattern=validateEnv.test.js
if errorlevel 1 (
    echo ❌ Environment validation failed
    pause
    exit /b 1
)
echo ✅ Environment validation passed

REM Start the server in background
echo 🌐 Starting CareerConnect server...
start /b npm start

REM Wait for server to start
echo ⏳ Waiting for server to start...
timeout /t 10 /nobreak >nul

REM Test if server is running
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Server failed to start
    pause
    exit /b 1
)
echo ✅ Server is running on http://localhost:3000

REM Run enhanced dashboard tests
echo 🧪 Testing enhanced dashboards...
node test-enhanced-dashboards.js
if errorlevel 1 (
    echo ❌ Dashboard tests failed
    pause
    exit /b 1
)

echo.
echo 🎉 Enhanced Dashboard Quick Start Complete!
echo.
echo 📊 Access Your Dashboards:
echo    Employee Dashboard: http://localhost:3000/employee/dashboard
echo    Employer Dashboard:  http://localhost:3000/employer/dashboard
echo.
echo 🔑 Test Credentials:
echo    Employee: testemployee@example.com / Test123!
echo    Employer: testemployer@example.com / Test123!
echo.
echo 📚 Features to Explore:
echo    ✅ AI-Powered Job Matching
echo    ✅ Advanced Analytics ^& Insights
echo    ✅ Skill Development Recommendations
echo    ✅ Smart Job Alerts
echo    ✅ Resume Analysis ^& Optimization
echo    ✅ Hiring Pipeline Management
echo    ✅ Team Collaboration Tools
echo    ✅ Comprehensive Reports
echo.
echo 🌐 Server is running at: http://localhost:3000
echo 📖 Documentation: ENHANCED_DASHBOARD_DOCUMENTATION.md
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:3000

echo.
echo 🚀 Application opened in browser!
echo Press any key to exit (server will continue running)...
pause >nul