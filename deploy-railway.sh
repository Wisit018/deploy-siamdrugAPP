#!/bin/bash

# Railway Deployment Script for Siamdrug App
# Usage: ./deploy-railway.sh

echo "🚀 Starting Railway Deployment Process..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    railway login
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please update .env file with your configuration before deploying!"
    read -p "Press Enter to continue after updating .env file..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🌐 Your app should be available at the Railway URL shown above."
echo "💡 Don't forget to:"
echo "   1. Set up MySQL database in Railway dashboard"
echo "   2. Configure environment variables in Railway dashboard"
echo "   3. Check the deployment logs for any issues"
