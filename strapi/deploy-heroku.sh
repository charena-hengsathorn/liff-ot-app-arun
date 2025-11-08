#!/bin/bash

# Deploy Strapi to Heroku - Production Deployment Script
# Usage: ./deploy-heroku.sh [app-name]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get app name from argument or use default
if [ -z "$1" ]; then
    APP_NAME="liff-ot-app-strapi-prod"
    echo -e "${YELLOW}Using default app name: ${APP_NAME}${NC}"
    echo -e "${YELLOW}(You can override with: ./deploy-heroku.sh your-app-name)${NC}"
else
    APP_NAME=$1
fi

echo -e "${GREEN}🚀 Deploying Strapi to Heroku: ${APP_NAME}${NC}\n"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
command -v heroku >/dev/null 2>&1 || { echo -e "${RED}Error: Heroku CLI is not installed.${NC}" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is not installed.${NC}" >&2; exit 1; }
echo -e "${GREEN}✅ Prerequisites OK${NC}\n"

# Step 2: Check if app exists
echo -e "${YELLOW}Step 2: Checking Heroku app...${NC}"
if ! heroku apps:info --app "$APP_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}App does not exist. Creating...${NC}"
    heroku create "$APP_NAME"
    echo -e "${GREEN}✅ App created: ${APP_NAME}${NC}"
else
    echo -e "${GREEN}✅ App exists: ${APP_NAME}${NC}"
fi

# Check buildpack
echo -e "${YELLOW}Checking buildpack...${NC}"
if ! heroku buildpacks --app "$APP_NAME" | grep -q "heroku/nodejs"; then
    echo -e "${YELLOW}Setting Node.js buildpack...${NC}"
    heroku buildpacks:set heroku/nodejs --app "$APP_NAME"
    echo -e "${GREEN}✅ Buildpack set${NC}"
else
    echo -e "${GREEN}✅ Buildpack exists${NC}"
fi
echo ""

# Step 3: Check PostgreSQL add-on
echo -e "${YELLOW}Step 3: Checking PostgreSQL add-on...${NC}"
if ! heroku addons --app "$APP_NAME" | grep -q "heroku-postgresql"; then
    echo -e "${YELLOW}PostgreSQL add-on not found. Adding...${NC}"
    heroku addons:create heroku-postgresql:essential-0 --app "$APP_NAME"
    echo -e "${GREEN}✅ PostgreSQL add-on added${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL add-on exists${NC}"
fi
echo ""

# Step 4: Check environment variables
echo -e "${YELLOW}Step 4: Checking environment variables...${NC}"
REQUIRED_VARS=("ADMIN_JWT_SECRET" "API_TOKEN_SALT" "TRANSFER_TOKEN_SALT" "ENCRYPTION_KEY" "APP_KEYS")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if ! heroku config:get "$var" --app "$APP_NAME" >/dev/null 2>&1; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Missing environment variables. Generating secrets...${NC}"
    
    # Generate secrets
    ADMIN_JWT_SECRET=$(openssl rand -base64 32)
    API_TOKEN_SALT=$(openssl rand -base64 32)
    TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)
    
    # Set on Heroku
    heroku config:set ADMIN_JWT_SECRET="$ADMIN_JWT_SECRET" --app "$APP_NAME"
    heroku config:set API_TOKEN_SALT="$API_TOKEN_SALT" --app "$APP_NAME"
    heroku config:set TRANSFER_TOKEN_SALT="$TRANSFER_TOKEN_SALT" --app "$APP_NAME"
    heroku config:set ENCRYPTION_KEY="$ENCRYPTION_KEY" --app "$APP_NAME"
    heroku config:set APP_KEYS="$APP_KEYS" --app "$APP_NAME"
    heroku config:set NODE_ENV=production --app "$APP_NAME"
    
    echo -e "${GREEN}✅ Environment variables set${NC}"
else
    echo -e "${GREEN}✅ All environment variables exist${NC}"
fi
echo ""

# Step 5: Build Strapi
echo -e "${YELLOW}Step 5: Building Strapi...${NC}"
npm run build
echo -e "${GREEN}✅ Build completed${NC}\n"

# Step 6: Prepare Git
echo -e "${YELLOW}Step 6: Preparing Git repository...${NC}"
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing Git repository...${NC}"
    git init
fi

# Check if Heroku remote exists
if ! git remote | grep -q "heroku"; then
    echo -e "${YELLOW}Adding Heroku remote...${NC}"
    heroku git:remote -a "$APP_NAME"
fi

# Stage and commit changes
git add .
if git diff --staged --quiet; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    git commit -m "Deploy Strapi to Heroku production" || echo -e "${YELLOW}Nothing to commit${NC}"
fi
echo -e "${GREEN}✅ Git ready${NC}\n"

# Step 7: Deploy to Heroku
echo -e "${YELLOW}Step 7: Deploying to Heroku...${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}\n"
git push heroku main || git push heroku master

echo -e "\n${GREEN}✅ Deployment completed!${NC}\n"

# Step 8: Show next steps
echo -e "${GREEN}📋 Next Steps:${NC}"
echo -e "1. Create admin user: ${YELLOW}heroku open --app ${APP_NAME}${NC}"
echo -e "2. Check logs: ${YELLOW}heroku logs --tail --app ${APP_NAME}${NC}"
echo -e "3. Update main app STRAPI_URL to: ${YELLOW}https://${APP_NAME}.herokuapp.com${NC}"
echo -e "\n${GREEN}Your Strapi is available at:${NC}"
echo -e "${GREEN}https://${APP_NAME}.herokuapp.com${NC}"
echo -e "${GREEN}Admin: https://${APP_NAME}.herokuapp.com/admin${NC}"

