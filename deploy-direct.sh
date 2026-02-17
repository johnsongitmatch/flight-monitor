#!/bin/bash

# Flight Monitor Direct Deploy to Cloudflare Pages
# Uses Cloudflare API without wrangler

# Configuration - REPLACE THESE
CF_ACCOUNT_ID="YOUR_ACCOUNT_ID"
CF_API_TOKEN="YOUR_API_TOKEN"
PROJECT_NAME="flight-monitor"

echo "🚀 Deploying to Cloudflare Pages..."
echo "⚠️  请先配置凭据:"
echo "   1. Account ID: https://dash.cloudflare.com -> 复制URL中的ID"
echo "   2. API Token: https://dash.cloudflare.com/profile/api-tokens -> Create Custom Token"
echo ""
echo "📝 配置凭据后运行:"
echo "   export CF_ACCOUNT_ID='你的Account ID'"
echo "   export CF_API_TOKEN='你的API Token'"
echo "   ./deploy-direct.sh"
echo ""

# Check if credentials are provided
if [ -z "$CF_ACCOUNT_ID" ] || [ "$CF_ACCOUNT_ID" = "YOUR_ACCOUNT_ID" ]; then
    echo "❌ 缺少 Cloudflare 凭据"
    exit 1
fi

# Create a zip of the site
echo "📦 Creating site bundle..."
cd /home/ubuntu/clawd/flight-monitor-site
zip -r /tmp/site.zip . -x "node_modules/*" "deploy-direct.sh" "deploy.sh" "setup-cron.sh" "*.log" ".git/*"

# Get upload URL
echo "🔗 Getting upload URL..."
UPLOAD_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/upload_urls" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json")

echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"

echo ""
echo "✅ 部署脚本已创建，请配置凭据后运行"
