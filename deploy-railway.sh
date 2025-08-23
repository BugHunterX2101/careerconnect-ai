#!/bin/bash

# 🚀 CareerConnect AI - Railway Deployment Script
# This script deploys the application to Railway

set -e  # Exit on any error

echo "🚀 Starting CareerConnect AI deployment to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first."
    echo "Installation: npm install -g @railway/cli"
    exit 1
fi

print_status "Checking Railway CLI version..."
railway --version

print_status "Checking if logged in to Railway..."
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads/temp
mkdir -p uploads/avatars
mkdir -p uploads/resumes

print_success "Directories created successfully"

print_status "Installing dependencies..."
npm install

print_success "Dependencies installed successfully"

print_status "Building client..."
cd src/client
npm install
npm run build
cd ../..

print_success "Client built successfully"

print_status "Deploying to Railway..."
railway up

print_success "Deployment initiated successfully!"

echo ""
echo "🎉 Railway deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check deployment status: railway status"
echo "2. View logs: railway logs"
echo "3. Open application: railway open"
echo ""
echo "🌐 Your application will be available at:"
echo "   https://careerconnect-ai-production.up.railway.app"
echo ""
print_success "Railway deployment script completed successfully!"
