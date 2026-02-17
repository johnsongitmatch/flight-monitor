# ✈️ Flight Price Monitor

机票价格监控网站和API服务

## 功能特点

- 🌍 支持全球主要城市机场
- 📅 灵活设置行程天数 (间隔最大10天)
- 📧 每日邮件提醒
- 🔔 服务器时间 10:00 自动检查
- 💰 实时价格对比
- 📊 历史价格记录

## 快速开始

### 1. 启动服务

```bash
cd /home/ubuntu/clawd/flight-monitor-site

# 启动 API 服务器
node server.js

# 或在后台运行
nohup node server.js > ../logs/flight-api.log 2>&1 &
```

### 2. 访问网站

打开浏览器访问: `http://localhost:3000`

### 3. 设置监控

在网页中填写:
- 出发地 (如: 奥克兰 AKL)
- 目的地 (如: 北京 PEK)
- 最少/最多天数 (如: 28-38天)
- 邮箱地址
- 通知时间

### 4. 设置每日邮件

```bash
# 设置 cron 每日 10:00 检查并发送邮件
./setup-cron.sh setup
```

## API 接口

### 添加监控

```bash
POST /api/monitor
Content-Type: application/json

{
    "from": "AKL",
    "to": "PEK",
    "daysMin": 28,
    "daysMax": 38,
    "email": "your@email.com",
    "notifyTime": "10"
}
```

### 获取监控列表

```bash
GET /api/monitor
```

### 删除监控

```bash
DELETE /api/monitor/{id}
```

## 文件结构

```
flight-monitor-site/
├── index.html          # 前端页面
├── server.js           # API 服务器
├── daily-check.js      # 每日检查脚本
├── setup-cron.sh      # Cron 设置脚本
└── README.md          # 说明文档

/home/ubuntu/clawd/
├── .data/
│   └── flight-monitors.json  # 监控配置存储
└── logs/
    ├── flight-api.log       # API 日志
    └── flight-daily.log     # 每日检查日志
```

## Cron 配置

| 时间 | 任务 |
|------|------|
| 每天 10:00 | 运行 daily-check.js 检查价格并发送邮件 |

查看状态:
```bash
./setup-cron.sh status
```

## 邮件服务配置

当前版本使用模拟邮件记录。生产环境需要配置邮件服务:

### 选项 1: SendGrid

```bash
npm install @sendgrid/mail
```

### 选项 2: Mailgun

```bash
npm install mailgun.js
```

### 选项 3: AWS SES

使用 AWS SDK 配置 SMTP。

## 技术栈

- **前端**: HTML5 + CSS3 (响应式设计)
- **后端**: Node.js 原生 HTTP 服务器
- **数据存储**: JSON 文件
- **定时任务**: Cron
- **邮件**: 需要配置第三方服务

## 部署到 Cloudflare Pages

1. 推送到 GitHub
2. 连接 Cloudflare Pages
3. 构建命令: (空)
4. 输出目录: (空)
5. API 需要单独部署 (如使用 Cloudflare Workers)

## License

MIT
