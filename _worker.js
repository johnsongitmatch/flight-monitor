/**
 * Flight Monitor - Cloudflare Pages Function (_worker.js format)
 * 
 * Handles all API routes:
 * POST /api/monitor - Add monitor
 * GET /api/monitor - List monitors
 * DELETE /api/monitor/:id - Remove monitor
 * GET /api/check - Daily check (QStash cron)
 */

const REDIS_URL = 'https://happy-bonefish-61286.upstash.io';
const REDIS_TOKEN = 'Ae9mAAIncDE5YWI5Nzk3NTc4OTE0NmNjOWYxMWVhMGE0MGE5YzQ3OXAxNjEyODY';

export async function onRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    try {
        // Health check
        if (pathname === '/health') {
            return new Response(JSON.stringify({ 
                status: 'ok', 
                time: new Date().toISOString() 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // POST /api/monitor - Add new monitor
        if (pathname === '/api/monitor' && method === 'POST') {
            const data = await request.json();
            
            if (!data.from || !data.to || !data.email) {
                return new Response(JSON.stringify({ success: false, message: '缺少必填字段' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            if (data.from.toUpperCase() === data.to.toUpperCase()) {
                return new Response(JSON.stringify({ success: false, message: '出发地和目的地不能相同' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const daysMin = parseInt(data.daysMin) || 28;
            const daysMax = parseInt(data.daysMax) || 38;
            
            if (daysMax - daysMin > 10) {
                return new Response(JSON.stringify({ success: false, message: '天数间隔不能超过10天' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            const monitor = {
                id,
                from: data.from.toUpperCase(),
                to: data.to.toUpperCase(),
                daysMin,
                daysMax,
                email: data.email,
                notifyTime: data.notifyTime || '10',
                createdAt: new Date().toISOString(),
                active: true,
            };
            
            // Save to Redis
            const monitors = await getMonitors();
            monitors.push(monitor);
            await saveMonitors(monitors);
            
            console.log('✅ 新监控已添加:', monitor.from, '→', monitor.to);
            
            return new Response(JSON.stringify({ success: true, message: '监控已设置', id }), {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /api/monitor - List monitors
        if (pathname === '/api/monitor' && method === 'GET') {
            const monitors = await getMonitors();
            const activeMonitors = monitors.filter(m => m.active);
            return new Response(JSON.stringify({ success: true, monitors: activeMonitors }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // DELETE /api/monitor/:id
        if (pathname.startsWith('/api/monitor/') && method === 'DELETE') {
            const id = pathname.split('/').pop();
            let monitors = await getMonitors();
            const index = monitors.findIndex(m => m.id === id);
            
            if (index === -1) {
                return new Response(JSON.stringify({ success: false, message: '监控不存在' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            monitors.splice(index, 1);
            await saveMonitors(monitors);
            
            return new Response(JSON.stringify({ success: true, message: '监控已删除' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // GET /api/check - Daily price check (QStash cron)
        if (pathname === '/api/check' && method === 'GET') {
            const monitors = await getMonitors();
            const now = new Date();
            
            const results = [];
            
            for (const monitor of monitors.filter(m => m.active)) {
                const searchUrl = generateSearchUrl(monitor.from, monitor.to);
                results.push({
                    id: monitor.id,
                    from: monitor.from,
                    to: monitor.to,
                    email: monitor.email,
                    searchUrl,
                    checkedAt: now.toISOString(),
                    status: 'ok'
                });
            }
            
            return new Response(JSON.stringify({ 
                success: true, 
                checked: results.length,
                time: now.toISOString(),
                results 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        // POST /api/email - Send email (placeholder)
        if (pathname === '/api/email' && method === 'POST') {
            const data = await request.json();
            console.log('📧 邮件日志:', data.subject, '→', data.email);
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: '邮件已发送（模拟）',
                preview: data.subject
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ error: 'Not found', path: pathname }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Helper functions
async function getMonitors() {
    try {
        const response = await fetch(`${REDIS_URL}/get/flight-monitors`, {
            headers: { 'Authorization': `Bearer ${REDIS_TOKEN}` }
        });
        const data = await response.json();
        return data.result ? JSON.parse(data.result) : [];
    } catch (e) {
        console.error('Redis get error:', e);
        return [];
    }
}

async function saveMonitors(monitors) {
    try {
        await fetch(`${REDIS_URL}/set/flight-monitors`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${REDIS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(JSON.stringify(monitors))
        });
    } catch (e) {
        console.error('Redis save error:', e);
    }
}

function generateSearchUrl(from, to) {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const departureDate = date.toISOString().split('T')[0];
    return `https://www.google.com/travel/flights?q=flights+${from}+to++${to}+${departureDate}`;
}
