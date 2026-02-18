# ✈️ Flight Monitor - 机票价格监控

实时监控机票价格，每日邮件提醒

## 🌐 在线访问

**网站**: https://flight-monitor-af3.pages.dev

**GitHub**: https://github.com/johnsongitmatch/flight-monitor

## ✨ 功能

- ✅ 全球 150+ 机场选择
- ✅ 每日价格监控
- ✅ 邮件提醒 (开发中)
- ✅ Google Flights 跳转查询

## 🚀 部署

### 方式 1: Cloudflare Pages (自动)

推送代码到 GitHub 后自动部署

```bash
git add .
git commit -m "feat: your changes"
git push
```

### 方式 2: 本地预览

```bash
# 安装 wrangler
npm install -g wrangler

# 本地预览
npx wrangler pages dev dist

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=flight-monitor
```

## 📁 项目结构

```
flight-monitor-site/
├── index.html              # 前端页面
├── functions/
│   └── api/
│       └── monitor.js      # Pages Function API
├── wrangler.toml           # Cloudflare 配置
└── README.md
```

## 🔧 配置

API 使用 Upstash Redis 存储监控数据：
- Endpoint: happy-bonefish-61286.upstash.io
- Token: 已配置在 wrangler.toml

## 📧 邮件功能

邮件通知功能开发中...

## 🔗 相关项目

- **Backend Workers**: https://github.com/johnsongitmatch/flight-monitor-worker
