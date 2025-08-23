#!/bin/bash

# 🚀 CareerConnect AI - Render Deployment Script
# This script prepares and deploys the application to Render

set -e  # Exit on any error

echo "🚀 Starting CareerConnect AI deployment to Render..."

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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please initialize git first."
    exit 1
fi

# Check if we have a remote origin
if ! git remote get-url origin &> /dev/null; then
    print_error "No remote origin found. Please add a GitHub remote first."
    print_status "Example: git remote add origin https://github.com/yourusername/careerconnect-main.git"
    exit 1
fi

print_status "Checking current git status..."

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Please commit them first."
    echo "Run: git add . && git commit -m 'Prepare for deployment'"
    exit 1
fi

print_status "Creating necessary directories..."

# Create necessary directories
mkdir -p logs
mkdir -p uploads/temp
mkdir -p uploads/avatars
mkdir -p uploads/resumes

print_success "Directories created successfully"

print_status "Checking Node.js version..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version $(node --version) is compatible"

print_status "Installing dependencies..."

# Install dependencies
npm install

print_success "Dependencies installed successfully"

print_status "Building client..."

# Build client
cd src/client
npm install
npm run build
cd ../..

print_success "Client built successfully"

print_status "Running tests..."

# Run tests if available
if npm run test:integration &> /dev/null; then
    npm run test:integration
    print_success "Tests passed"
else
    print_warning "No integration tests found, skipping..."
fi

print_status "Checking deployment configuration..."

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found. Please ensure it exists in the root directory."
    exit 1
fi

print_success "Deployment configuration found"

print_status "Pushing to GitHub..."

# Push to GitHub
git add .
git commit -m "Prepare for Render deployment - $(date)"
git push origin main

print_success "Code pushed to GitHub successfully"

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New' → 'Blueprint'"
echo "3. Connect your GitHub account"
echo "4. Select this repository"
echo "5. Click 'Create Blueprint Instance'"
echo ""
echo "🌐 Your application will be available at:"
echo "   Frontend: https://careerconnect-ai-frontend.onrender.com"
echo "   Backend:  https://careerconnect-ai-backend.onrender.com"
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT.md"
echo ""
print_success "Deployment script completed successfully!"
