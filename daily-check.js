#!/usr/bin/env node

/**
 * Flight Price Daily Checker
 * 
 * Loads all monitors, checks prices, sends emails
 * 
 * Usage: node daily-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = '/home/ubuntu/clawd/.data/flight-monitors.json';
const LOG_FILE = '/home/ubuntu/clawd/logs/flight-daily-check.log';

// Airport city names
const AIRPORTS = {
    'AKL': '奥克兰', 'SYD': '悉尼', 'MEL': '墨尔本', 'BNE': '布里斯班',
    'PER': '珀斯', 'LAX': '洛杉矶', 'SFO': '旧金山', 'LHR': '伦敦',
    'SIN': '新加坡', 'HKG': '香港', 'PEK': '北京', 'PVG': '上海浦东',
    'SHA': '上海虹桥', 'CAN': '广州', 'TSN': '天津', 'SZX': '深圳',
    'CTU': '成都', 'XMN': '厦门',
};

// Exchange rate
const USD_TO_CNY = 7.2;

// Load monitors
function loadMonitors() {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

// Get mock prices for a route
function getPrices(from, to, daysMin, daysMax) {
    // Simulated price data - in production, this would call real APIs
    const basePrice = Math.floor(Math.random() * 300) + 400; // 400-700 USD
    
    return {
        from,
        to,
        daysRange: `${daysMin}-${daysMax}天`,
        cheapest: {
            price: basePrice,
            priceCNY: Math.round(basePrice * USD_TO_CNY),
            airline: ['China Eastern', 'China Southern', 'Air China', 'Hainan Airlines'][Math.floor(Math.random() * 4)],
            depart: '2026-03-15',
            return: '2026-04-20',
            stay: Math.floor(Math.random() * 10) + daysMin,
        },
        alternatives: [
            { price: basePrice + 50, airline: 'Cathay Pacific' },
            { price: basePrice + 80, airline: 'Air New Zealand' },
        ]
    };
}

// Generate email content
function generateEmail(monitor, priceData) {
    const fromCity = AIRPORTS[monitor.from] || monitor.from;
    const toCity = AIRPORTS[monitor.to] || monitor.to;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">✈️ 机票价格日报</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <div style="padding: 30px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 20px;">📊 监控信息</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <p style="margin: 8px 0; color: #666;">
                    <strong>出发地:</strong> ${fromCity} (${monitor.from})
                </p>
                <p style="margin: 8px 0; color: #666;">
                    <strong>目的地:</strong> ${toCity} (${monitor.to})
                </p>
                <p style="margin: 8px 0; color: #666;">
                    <strong>行程天数:</strong> ${priceData.daysRange}
                </p>
            </div>
            
            <h2 style="color: #333; font-size: 18px; margin-bottom: 20px;">💰 当前最低价格</h2>
            
            <div style="border: 2px solid #667eea; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 25px;">
                <p style="font-size: 14px; color: #666; margin-bottom: 10px;">最低价</p>
                <p style="font-size: 36px; font-weight: bold; color: #667eea; margin: 0;">
                    ¥${priceData.cheapest.priceCNY}
                </p>
                <p style="font-size: 14px; color: #999; margin: 5px 0 0;">约 $${priceData.cheapest.price} USD</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <p style="margin: 8px 0; color: #333;">
                    <strong>✈️ 航空公司:</strong> ${priceData.cheapest.airline}
                </p>
                <p style="margin: 8px 0; color: #333;">
                    <strong>📅 出发日期:</strong> ${priceData.cheapest.depart}
                </p>
                <p style="margin: 8px 0; color: #333;">
                    <strong>🏠 返回日期:</strong> ${priceData.cheapest.return}
                </p>
                <p style="margin: 8px 0; color: #333;">
                    <strong>⏱️ 停留天数:</strong> ${priceData.cheapest.stay} 天
                </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <h3 style="color: #333; font-size: 16px; margin-bottom: 15px;">🔗 查询更多</h3>
                <p style="color: #666; font-size: 14px;">
                    <a href="https://www.expedia.com/flights" style="color: #667eea;">Expedia</a> | 
                    <a href="https://www.kayak.com/flights" style="color: #667eea;">KAYAK</a> | 
                    <a href="https://www.google.com/travel/flights" style="color: #667eea;">Google Flights</a>
                </p>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>💡 此邮件由机票监控系统自动发送</p>
            <p>🔧 如需取消监控，请回复此邮件</p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

// Send email (simplified - uses webhook or API)
function sendEmail(to, subject, html) {
    console.log(`📧 发送邮件到: ${to}`);
    console.log(`   主题: ${subject}`);
    
    // In production, integrate with email service
    // Options:
    // 1. SendGrid API
    // 2. Mailgun API  
    // 3. AWS SES
    // 4. Nodemailer with SMTP
    
    // For now, just log
    const logEntry = `
----------------------------------------
时间: ${new Date().toISOString()}
收件人: ${to}
主题: ${subject}
状态: 已记录 (需配置邮件服务)
----------------------------------------`;
    
    fs.appendFileSync(LOG_FILE, logEntry);
    
    return true;
}

// Process a single monitor
function processMonitor(monitor) {
    if (!monitor.active) {
        console.log(`⏭️ 跳过非活跃监控: ${monitor.from} → ${monitor.to}`);
        return;
    }
    
    console.log(`\n🔍 检查: ${monitor.from} → ${monitor.to} (${monitor.email})`);
    
    const priceData = getPrices(monitor.from, monitor.to, monitor.daysMin, monitor.daysMax);
    const html = generateEmail(monitor, priceData);
    
    const subject = `✈️ 机票价格日报 | ${AIRPORTS[monitor.from]}→${AIRPORTS[monitor.to]} | ¥${priceData.cheapest.priceCNY}`;
    
    sendEmail(monitor.email, subject, html);
}

// Main
function main() {
    console.log('\n' + '='.repeat(60));
    console.log('✈️ Flight Price Daily Checker');
    console.log('='.repeat(60));
    console.log(`\n🕐 ${new Date().toLocaleString('zh-CN')}\n`);
    
    const monitors = loadMonitors();
    
    if (monitors.length === 0) {
        console.log('📭 没有活跃的监控任务');
        return;
    }
    
    console.log(`📊 共 ${monitors.length} 个监控任务`);
    
    let success = 0;
    for (const monitor of monitors) {
        if (monitor.active) {
            try {
                processMonitor(monitor);
                success++;
            } catch (error) {
                console.log(`❌ 处理失败: ${error.message}`);
            }
        }
    }
    
    console.log(`\n✅ 完成: ${success}/${monitors.length} 个任务处理完成`);
    console.log(`📁 日志: ${LOG_FILE}`);
}

main();
