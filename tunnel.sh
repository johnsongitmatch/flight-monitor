#!/bin/bash

# LocalTunnel - 免费内网穿透
# 安装: npm install -g localtunnel

echo "🌐 启动临时公网访问..."
echo ""
echo "方式 1: 使用 localtunnel (推荐)"
echo "   npm install -g localtunnel"
echo "   lt --port 3000 --subdomain flight-monitor-$USER"
echo ""
echo "方式 2: 使用 ngrok"
echo "   ngrok http 3000"
echo ""
echo "方式 3: 使用 Cloudflare Tunnel"
echo "   cloudflared tunnel --url http://localhost:3000"
echo ""

# Try localtunnel if available
if command -v lt &> /dev/null; then
    echo "🚀 启动 localtunnel..."
    lt --port 3000 --subdomain flight-monitor-$(date +%s)
else
    echo "💡 先安装 localtunnel:"
    echo "   npm install -g localtunnel"
fi
