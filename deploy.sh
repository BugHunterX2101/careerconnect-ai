#!/bin/bash

echo "🚀 CareerConnect AI - Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Project structure verified"

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "📦 Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    echo "🔐 Logging into Railway..."
    railway login
    
    # Initialize project if not already done
    if [ ! -f ".railway" ]; then
        echo "🔧 Initializing Railway project..."
        railway init
    fi
    
    # Deploy
    echo "🚀 Deploying to Railway..."
    railway up
    
    echo "✅ Railway deployment completed!"
    echo "🌐 Your app is available at: https://your-app.railway.app"
}

# Function to deploy to Render
deploy_render() {
    echo "🎨 Deploying to Render..."
    echo "📋 Please follow these steps:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Click 'New +' and select 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the service:"
    echo "   - Name: careerconnect-ai-backend"
    echo "   - Environment: Node"
    echo "   - Build Command: npm install && npm run build:client"
    echo "   - Start Command: npm start"
    echo "5. Add environment variables from env.example"
    echo "6. Deploy!"
}

# Function to deploy to Heroku
deploy_heroku() {
    echo "🐳 Deploying to Heroku..."
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        echo "📦 Installing Heroku CLI..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew tap heroku/brew && brew install heroku
        else
            echo "Please install Heroku CLI manually: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
    fi
    
    # Login to Heroku
    echo "🔐 Logging into Heroku..."
    heroku login
    
    # Create app if not exists
    if [ -z "$HEROKU_APP_NAME" ]; then
        echo "🔧 Creating Heroku app..."
        heroku create careerconnect-ai-$(date +%s)
    fi
    
    # Add buildpacks
    echo "📦 Adding buildpacks..."
    heroku buildpacks:add heroku/nodejs
    
    # Set environment variables
    echo "🔧 Setting environment variables..."
    heroku config:set NODE_ENV=production
    
    # Deploy
    echo "🚀 Deploying to Heroku..."
    git push heroku main
    
    echo "✅ Heroku deployment completed!"
    echo "🌐 Your app is available at: https://your-app.herokuapp.com"
}

# Function to deploy to DigitalOcean
deploy_digitalocean() {
    echo "☁️ Deploying to DigitalOcean..."
    echo "📋 Please follow these steps:"
    echo "1. Go to https://cloud.digitalocean.com/apps"
    echo "2. Click 'Create App'"
    echo "3. Connect your GitHub repository"
    echo "4. Configure the app using the app.yaml file"
    echo "5. Deploy!"
}

# Main menu
echo ""
echo "Choose your deployment platform:"
echo "1) Railway (Recommended - No memory limits)"
echo "2) Render (Free tier, easy setup)"
echo "3) Heroku (Mature platform)"
echo "4) DigitalOcean (Full control)"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_railway
        ;;
    2)
        deploy_render
        ;;
    3)
        deploy_heroku
        ;;
    4)
        deploy_digitalocean
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo "📚 Check DEPLOYMENT_ALTERNATIVES.md for detailed instructions"
echo "🔧 Don't forget to set up your environment variables!"
