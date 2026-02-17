# 🚀 部署指南

## 方式 1: Cloudflare Pages (推荐 - 永久免费)

### 步骤 1: 创建 GitHub 仓库

```bash
# 在 GitHub 创建新仓库 flight-monitor
# 然后:
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/flight-monitor.git
git push -u origin main
```

### 步骤 2: 连接 Cloudflare Pages

1. 访问: https://dash.cloudflare.com
2. Workers & Pages → Pages → Connect to Git
3. 选择你的 GitHub 仓库
4. 配置:
   - Framework preset: None
   - Build command: (留空)
   - Build output directory: (留空)
5. 点击 "Save and Deploy"

### 步骤 3: 获取 URL

部署完成后，你会看到类似:
```
🌐 https://flight-monitor.pages.dev
```

---

## 方式 2: Cloudflare Tunnel (临时访问)

不需要任何配置，立即可用:

```bash
# 安装 cloudflared
curl -L --output /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /tmp/cloudflared

# 启动隧道
/tmp/cloudflared tunnel --url http://localhost:3000
```

你会看到类似输出:
```
2024-01-01T00:00:00Z INF Starting tunnel tunnelID=xxx
2024-01-01T00:00:00Z INF Connection established connIndex=0 tlsIndex=0 url=https://random-name.trycloudflare.com
```

访问显示的 `https://random-name.trycloudflare.com` 即可！

---

## 方式 3: Vercel (一键部署)

```bash
npm i -g vercel
vercel
```

按提示操作即可获得公网 URL。

---

## 方式 4: Railway / Render

类似 Vercel，连接 GitHub 仓库即可自动部署。

---

## API 服务部署

注意: `server.js` 需要单独部署，因为它有后端 API。

### 选项 A: Railway/Render (推荐)

1. 连接 GitHub 仓库
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. 设置环境变量端口: `PORT=10000`

### 选项 B: Cloudflare Workers

需要将 Node.js API 转换为 Cloudflare Worker 格式。

---

## 快速对比

| 方式 | 免费 | 永久 | 后端支持 |
|------|------|------|----------|
| Cloudflare Pages | ✅ | ✅ | ❌ (静态) |
| Cloudflare Tunnel | ✅ | ❌ (临时) | ✅ |
| Vercel | ✅ | ✅ | ✅ (Serverless) |
| Railway | ❌ | ✅ | ✅ |
| Render | ✅ | ✅ | ✅ |

---

## 推荐方案

**纯静态网站** → Cloudflare Pages
**完整功能** → Vercel 或 Railway
**临时测试** → Cloudflare Tunnel
