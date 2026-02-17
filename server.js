#!/usr/bin/env node

/**
 * Flight Monitor API Server
 * 
 * API Endpoints:
 * POST /api/monitor - Add a new monitoring task
 * GET /api/monitor - List all monitoring tasks
 * DELETE /api/monitor/:id - Remove a monitoring task
 * 
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = '/home/ubuntu/clawd/.data/flight-monitors.json';
const STATIC_DIR = '/home/ubuntu/clawd/flight-monitor-site';

// Ensure data file exists
function ensureDataFile() {
    if (!fs.existsSync(path.dirname(DATA_FILE))) {
        fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]');
    }
}

// Load monitors
function loadMonitors() {
    ensureDataFile();
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

// Save monitors
function saveMonitors(monitors) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(monitors, null, 2));
}

// Generate ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Parse request body
async function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// Send JSON response
function sendJson(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Handle request
async function handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // API routes
    if (pathname === '/api/monitor') {
        if (req.method === 'POST') {
            try {
                const data = await parseBody(req);
                
                // Validation
                if (!data.from || !data.to || !data.email) {
                    return sendJson(res, { success: false, message: '缺少必填字段' }, 400);
                }
                
                if (data.from === data.to) {
                    return sendJson(res, { success: false, message: '出发地和目的地不能相同' }, 400);
                }
                
                const daysMin = parseInt(data.daysMin) || 28;
                const daysMax = parseInt(data.daysMax) || 38;
                
                if (daysMax - daysMin > 10) {
                    return sendJson(res, { success: false, message: '天数间隔不能超过10天' }, 400);
                }
                
                // Save monitor
                const monitors = loadMonitors();
                const monitor = {
                    id: generateId(),
                    from: data.from.toUpperCase(),
                    to: data.to.toUpperCase(),
                    daysMin: daysMin,
                    daysMax: daysMax,
                    email: data.email,
                    notifyTime: data.notifyTime || '10',
                    createdAt: new Date().toISOString(),
                    active: true,
                };
                
                monitors.push(monitor);
                saveMonitors(monitors);
                
                console.log('✅ 新监控已添加:', monitor.from, '→', monitor.to);
                
                sendJson(res, { success: true, message: '监控已设置', id: monitor.id });
            } catch (error) {
                sendJson(res, { success: false, message: error.message }, 400);
            }
        } else if (req.method === 'GET') {
            const monitors = loadMonitors().filter(m => m.active);
            sendJson(res, { success: true, monitors });
        } else {
            sendJson(res, { success: false, message: 'Method not allowed' }, 405);
        }
        return;
    }
    
    // Delete monitor
    if (pathname.startsWith('/api/monitor/') && req.method === 'DELETE') {
        const id = pathname.split('/').pop();
        let monitors = loadMonitors();
        const index = monitors.findIndex(m => m.id === id);
        
        if (index === -1) {
            return sendJson(res, { success: false, message: '监控不存在' }, 404);
        }
        
        monitors.splice(index, 1);
        saveMonitors(monitors);
        
        sendJson(res, { success: true, message: '监控已删除' });
        return;
    }
    
    // Serve static files
    if (req.method === 'GET') {
        let filePath = pathname === '/' ? '/index.html' : pathname;
        filePath = path.join(STATIC_DIR, filePath);
        
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.ico': 'image/x-icon',
        };
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(data);
        });
        return;
    }
    
    sendJson(res, { success: false, message: 'Not Found' }, 404);
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     ✈️ Flight Monitor API Server Started            ║
╚═══════════════════════════════════════════════════════╝

🌐 Server: http://localhost:${PORT}
📁 Static: ${STATIC_DIR}
💾 Data: ${DATA_FILE}

API Endpoints:
  POST   /api/monitor   - Add monitoring task
  GET    /api/monitor   - List all tasks
  DELETE /api/monitor/:id - Remove task

To run in background:
  nohup node server.js > /home/ubuntu/clawd/logs/flight-api.log 2>&1 &
`);
});

process.on('SIGINT', () => {
    console.log('\n👋 Server stopped');
    process.exit(0);
});
