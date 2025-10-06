@echo off
REM Railway Deployment Script for Siamdrug App (Windows)
REM Usage: deploy-railway.bat

echo 🚀 Starting Railway Deployment Process...

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI is not installed.
    echo 📦 Installing Railway CLI...
    npm install -g @railway/cli
)

REM Check if user is logged in
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Railway first:
    railway login
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please update .env file with your configuration before deploying!
    pause
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo ✅ Deployment completed!
echo 🌐 Your app should be available at the Railway URL shown above.
echo 💡 Don't forget to:
echo    1. Set up MySQL database in Railway dashboard
echo    2. Configure environment variables in Railway dashboard
echo    3. Check the deployment logs for any issues
pause
