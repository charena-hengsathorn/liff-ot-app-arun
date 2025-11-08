#!/bin/bash

# Quick Deploy Script for Strapi to Heroku
# This script automatically deploys to: liff-ot-app-strapi-prod

set -e

APP_NAME="liff-ot-app-strapi-prod"

echo "🚀 Deploying Strapi to Heroku: $APP_NAME"
echo ""

# Change to strapi directory
cd "$(dirname "$0")"

# Check buildpack
echo "🔍 Checking buildpack..."
if ! heroku buildpacks --app "$APP_NAME" | grep -q "heroku/nodejs"; then
    echo "⚙️  Setting Node.js buildpack..."
    heroku buildpacks:set heroku/nodejs --app "$APP_NAME"
fi
echo "✅ Buildpack ready"
echo ""

# Build Strapi
echo "📦 Building Strapi..."
npm run build
echo "✅ Build completed"
echo ""

# Prepare Git
if [ ! -d .git ]; then
    echo "📝 Initializing Git repository..."
    git init
fi

# Add Heroku remote if not exists
if ! git remote | grep -q "heroku"; then
    echo "🔗 Adding Heroku remote..."
    heroku git:remote -a "$APP_NAME"
fi

# Commit changes
echo "📝 Committing changes..."
git add .
if ! git diff --staged --quiet; then
    git commit -m "Deploy Strapi to Heroku production - $(date +%Y-%m-%d\ %H:%M:%S)" || true
fi
echo "✅ Git ready"
echo ""

# Deploy
echo "🚀 Deploying to Heroku..."
echo "⏳ This may take a few minutes..."
git push heroku main || git push heroku master

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Create admin user: heroku open --app $APP_NAME"
echo "2. Check logs: heroku logs --tail --app $APP_NAME"
echo ""
echo "🌐 Your Strapi URLs:"
echo "   API: https://$APP_NAME.herokuapp.com/api"
echo "   Admin: https://$APP_NAME.herokuapp.com/admin"
echo ""
echo "💡 Update your main app with:"
echo "   heroku config:set STRAPI_URL=https://$APP_NAME.herokuapp.com --app liff-ot-app-raksaard-2de47d0ac48c"

