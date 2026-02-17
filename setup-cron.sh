#!/bin/bash

# Flight Monitor Cron Setup
# 
# Usage:
#   ./setup-cron.sh          - Setup cron jobs
#   ./setup-cron.sh status    - Show cron status
#   ./setup-cron.sh remove    - Remove cron jobs

CRON_MARKER="# Flight Monitor Cron"

setup_cron() {
    echo "🔧 Setting up cron jobs..."
    
    # Remove old entries
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "flight-monitor" | crontab -
    
    # Add new cron for daily check at 10 AM server time (UTC+8)
    # Flight Monitor Daily Check at 10:00
    echo "$CRON_MARKER" >> /tmp/flight-cron-temp
    echo "0 10 * * * cd /home/ubuntu/clawd/flight-monitor-site && node daily-check.js >> /home/ubuntu/clawd/logs/flight-daily.log 2>&1" >> /tmp/flight-cron-temp
    
    crontab /tmp/flight-cron-temp
    rm /tmp/flight-cron-temp
    
    echo "✅ Cron jobs setup complete!"
    echo ""
    echo "📅 Scheduled tasks:"
    crontab -l | grep "$CRON_MARKER" -A 1
}

show_status() {
    echo "📊 Flight Monitor Cron Status"
    echo ""
    
    echo "Active cron jobs:"
    crontab -l 2>/dev/null | grep -i flight || echo "  No cron jobs found"
    echo ""
    
    echo "Recent logs:"
    if [ -f /home/ubuntu/clawd/logs/flight-daily.log ]; then
        tail -20 /home/ubuntu/clawd/logs/flight-daily.log
    else
        echo "  No logs yet"
    fi
}

remove_cron() {
    echo "🗑️ Removing cron jobs..."
    crontab -l 2>/dev/null | grep -v "$CRON_MARKER" | grep -v "flight-monitor" | crontab -
    echo "✅ Cron jobs removed"
}

case "${1:-setup}" in
    setup)
        setup_cron
        ;;
    status)
        show_status
        ;;
    remove)
        remove_cron
        ;;
    *)
        echo "Usage: $0 [setup|status|remove]"
        exit 1
        ;;
esac
