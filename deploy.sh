#!/bin/bash

# Deploy static site to Cloudflare Pages

PROJECT_NAME="flight-monitor"
DIST_DIR="."

echo "🚀 Deploying to Cloudflare Pages..."

# Deploy using wrangler
npx wrangler pages deploy $DIST_DIR --project-name=$PROJECT_NAME

echo "✅ Deployed successfully!"
echo "🌐 URL: https://$PROJECT_NAME.pages.dev"
