@echo off
chcp 65001 >nul
echo 🚀 CareerConnect AI - Deployment Script
echo ========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo ✅ Project structure verified

echo.
echo Choose your deployment platform:
echo 1) Railway (Recommended - No memory limits)
echo 2) Render (Free tier, easy setup)
echo 3) Heroku (Mature platform)
echo 4) DigitalOcean (Full control)
echo 5) Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto railway
if "%choice%"=="2" goto render
if "%choice%"=="3" goto heroku
if "%choice%"=="4" goto digitalocean
if "%choice%"=="5" goto exit
echo ❌ Invalid choice. Please run the script again.
pause
exit /b 1

:railway
echo 🚂 Deploying to Railway...
echo 📦 Installing Railway CLI...
call npm install -g @railway/cli
echo 🔐 Logging into Railway...
call railway login
echo 🔧 Initializing Railway project...
call railway init
echo 🚀 Deploying to Railway...
call railway up
echo ✅ Railway deployment completed!
echo 🌐 Your app is available at: https://your-app.railway.app
goto end

:render
echo 🎨 Deploying to Render...
echo 📋 Please follow these steps:
echo 1. Go to https://dashboard.render.com
echo 2. Click 'New +' and select 'Web Service'
echo 3. Connect your GitHub repository
echo 4. Configure the service:
echo    - Name: careerconnect-ai-backend
echo    - Environment: Node
echo    - Build Command: npm install ^&^& npm run build:client
echo    - Start Command: npm start
echo 5. Add environment variables from env.example
echo 6. Deploy!
goto end

:heroku
echo 🐳 Deploying to Heroku...
echo 📦 Installing Heroku CLI...
winget install --id=Heroku.HerokuCLI
echo 🔐 Logging into Heroku...
call heroku login
echo 🔧 Creating Heroku app...
call heroku create careerconnect-ai-%random%
echo 📦 Adding buildpacks...
call heroku buildpacks:add heroku/nodejs
echo 🔧 Setting environment variables...
call heroku config:set NODE_ENV=production
echo 🚀 Deploying to Heroku...
call git push heroku main
echo ✅ Heroku deployment completed!
echo 🌐 Your app is available at: https://your-app.herokuapp.com
goto end

:digitalocean
echo ☁️ Deploying to DigitalOcean...
echo 📋 Please follow these steps:
echo 1. Go to https://cloud.digitalocean.com/apps
echo 2. Click 'Create App'
echo 3. Connect your GitHub repository
echo 4. Configure the app using the app.yaml file
echo 5. Deploy!
goto end

:end
echo.
echo 🎉 Deployment completed!
echo 📚 Check DEPLOYMENT_ALTERNATIVES.md for detailed instructions
echo 🔧 Don't forget to set up your environment variables!
pause

:exit
echo 👋 Goodbye!
pause
