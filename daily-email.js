#!/usr/bin/env node

/**
 * Flight Monitor - Daily Email Sender
 * 
 * Usage:
 *   node daily-email.js
 * 
 * Cron setup (每天 10:00):
 *   0 10 * * * node /home/ubuntu/clawd/flight-monitor-site/daily-email.js
 */

const https = require('https');

// 配置
const REDIS_URL = 'https://happy-bonefish-61286.upstash.io';
const REDIS_TOKEN = 'Ae9mAAIncDE5YWI5Nzk3NTc4OTE0NmNjOWYxMWVhMGE0MGE5YzQ3OXAxNjEyODY';

// 城市名称映射
const CITY_NAMES = {
    'PEK': '北京', 'PVG': '上海浦东', 'SHA': '上海虹桥', 'CAN': '广州',
    'SZX': '深圳', 'CTU': '成都', 'HGH': '杭州', 'NKG': '南京',
    'XIY': '西安', 'KMG': '昆明', 'TSN': '天津', 'CKG': '重庆',
    'XMN': '厦门', 'DLC': '大连', 'HAK': '海口', 'SYX': '三亚',
    'HKG': '香港', 'MFM': '澳门', 'TPE': '台北',
    'NRT': '东京(成田)', 'HND': '东京(羽田)', 'KIX': '大阪(关西)',
    'NGO': '名古屋', 'FUK': '福冈', 'CTS': '札幌', 'OKA': '冲绳',
    'ICN': '首尔(仁川)', 'GMP': '首尔(金浦)', 'PUS': '釜山', 'CJU': '济州',
    'SIN': '新加坡', 'BKK': '曼谷', 'KUL': '吉隆坡', 'CGK': '雅加达',
    'SGN': '胡志明市', 'HAN': '河内', 'MNL': '马尼拉',
    'SYD': '悉尼', 'MEL': '墨尔本', 'BNE': '布里斯班', 'PER': '珀斯',
    'AKL': '奥克兰', 'WLG': '惠灵顿', 'CHC': '基督城',
    'JFK': '纽约', 'LAX': '洛杉矶', 'SFO': '旧金山', 'ORD': '芝加哥',
    'MIA': '迈阿密', 'SEA': '西雅图', 'LAS': '拉斯维加斯', 'BOS': '波士顿',
    'YYZ': '多伦多', 'YVR': '温哥华', 'YUL': '蒙特利尔', 'YYC': '卡尔加里',
    'LHR': '伦敦', 'CDG': '巴黎', 'AMS': '阿姆斯特丹', 'FRA': '法兰克福',
    'DXB': '迪拜', 'DEL': '新德里', 'JNB': '约翰内斯堡'
};

// 从 Redis 获取监控列表
async function getMonitors() {
    return new Promise((resolve, reject) => {
        https.get(`${REDIS_URL}/get/flight-monitors`, {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.result ? JSON.parse(result.result) : []);
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', reject);
    });
}

// 生成 Google Flights 链接
function generateSearchUrl(from, to) {
    const fromName = CITY_NAMES[from] || from;
    const toName = CITY_NAMES[to] || to;
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const dateStr = date.toISOString().split('T')[0];
    return `https://www.google.com/travel/flights?q=${encodeURIComponent(fromName)}%20to%20${encodeURIComponent(toName)}%20${dateStr}`;
}

// 发送邮件（使用 Resend API - 免费 100 封/天）
async function sendEmail(monitor, searchUrl) {
    const API_KEY = process.env.RESEND_API_KEY;
    
    if (!API_KEY) {
        console.log(`📧 [模拟] 发送到 ${monitor.email}: ${monitor.from} → ${monitor.to}`);
        console.log(`   链接: ${searchUrl}`);
        return { success: true, simulated: true };
    }
    
    const subject = `✈️ 票价提醒: ${CITY_NAMES[monitor.from] || monitor.from} → ${CITY_NAMES[monitor.to] || monitor.to}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .route { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✈️ 票价监控日报</h1>
            <p>${new Date().toLocaleDateString('zh-CN')}</p>
        </div>
        <div class="content">
            <div class="route">${CITY_NAMES[monitor.from] || monitor.from} → ${CITY_NAMES[monitor.to] || monitor.to}</div>
            <p>行程天数: ${monitor.daysMin}-${monitor.daysMax} 天</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${searchUrl}" class="btn">查看实时票价 →</a>
            </p>
            <p style="color: #888; font-size: 12px;">
                提示: 票价随时变动，建议尽早预订
            </p>
        </div>
        <div class="footer">
            <p>✈️ Flight Monitor | <a href="https://flight-monitor-af3.pages.dev">访问网站</a></p>
            <p>不想再收到邮件？点击 <a href="https://flight-monitor-af3.pages.dev/unsubscribe?email=${encodeURIComponent(monitor.email)}">退订</a></p>
        </div>
    </div>
</body>
</html>
    `;
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Flight Monitor <onboarding@resend.dev>',
                to: monitor.email,
                subject,
                html
            })
        });
        
        const result = await response.json();
        console.log(`📧 已发送到 ${monitor.email}: ${result.id || 'ok'}`);
        return { success: true, id: result.id };
    } catch (error) {
        console.error(`❌ 发送失败 ${monitor.email}:`, error.message);
        return { success: false, error: error.message };
    }
}

// 主函数
async function main() {
    console.log('='.repeat(50));
    console.log('✈️ Flight Monitor - 每日邮件推送');
    console.log('时间:', new Date().toLocaleString('zh-CN'));
    console.log('='.repeat(50));
    
    // 获取监控列表
    console.log('\n📊 正在获取监控列表...');
    const monitors = await getMonitors();
    
    if (monitors.length === 0) {
        console.log('没有监控任务');
        return;
    }
    
    console.log(`找到 ${monitors.length} 个监控任务\n`);
    
    // 发送邮件
    let success = 0, failed = 0;
    
    for (const monitor of monitors) {
        if (!monitor.active) continue;
        
        const searchUrl = generateSearchUrl(monitor.from, monitor.to);
        const result = await sendEmail(monitor, searchUrl);
        
        if (result.success) success++;
        else failed++;
        
        // 避免发送太快
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`完成: 成功 ${success}, 失败 ${failed}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
