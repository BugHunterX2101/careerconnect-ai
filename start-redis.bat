@echo off
echo Starting Redis with Docker...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Check if redis container already exists
docker ps -a --filter "name=redis" --format "{{.Names}}" | findstr /x "redis" >nul 2>&1
if %errorlevel% equ 0 (
    echo Redis container already exists. Starting it...
    docker start redis
    if %errorlevel% equ 0 (
        echo.
        echo ✓ Redis is now running on port 6379
        echo.
    ) else (
        echo Failed to start existing container. Removing and recreating...
        docker rm redis
        docker run -d -p 6379:6379 --name redis redis:alpine
        echo.
        echo ✓ Redis is now running on port 6379
        echo.
    )
) else (
    echo Creating new Redis container...
    docker run -d -p 6379:6379 --name redis redis:alpine
    if %errorlevel% equ 0 (
        echo.
        echo ✓ Redis is now running on port 6379
        echo.
    ) else (
        echo.
        echo ERROR: Failed to start Redis container
        echo.
        pause
        exit /b 1
    )
)

echo You can now start your application with: npm start
echo.
pause
