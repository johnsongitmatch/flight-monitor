#!/bin/bash

# Flight Monitor - Cron 设置脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EMAIL_SCRIPT="$SCRIPT_DIR/daily-email.js"
LOG_FILE="$SCRIPT_DIR/../logs/flight-email.log"

echo "✈️ Flight Monitor - Cron 设置"
echo "================================"

case "$1" in
    setup)
        echo "📅 设置每日 10:00 自动发送邮件..."
        
        # 确保日志目录存在
        mkdir -p "$(dirname "$LOG_FILE")"
        
        # 添加 cron 任务
        (crontab -l 2>/dev/null | grep -v "daily-email.js"; echo "0 10 * * * cd $SCRIPT_DIR && node $EMAIL_SCRIPT >> $LOG_FILE 2>&1") | crontab -
        
        echo "✅ 已设置完成！"
        echo ""
        echo "Cron: 0 10 * * * (每天 10:00)"
        echo "日志: $LOG_FILE"
        ;;
    
    status)
        echo "📋 Cron 任务状态:"
        echo ""
        crontab -l | grep -i "flight" || echo "未找到 Flight Monitor 相关任务"
        ;;
    
    test)
        echo "🧪 测试邮件发送..."
        node "$EMAIL_SCRIPT"
        ;;
    
    log)
        echo "📜 查看日志: $LOG_FILE"
        tail -50 "$LOG_FILE"
        ;;
    
    remove)
        echo "🗑️ 移除 cron 任务..."
        crontab -l | grep -v "daily-email.js" | crontab -
        echo "已移除"
        ;;
    
    help|*)
        echo "用法: $0 {setup|status|test|log|remove}"
        echo ""
        echo "命令:"
        echo "  setup   - 设置每日定时发送"
        echo "  status  - 查看 cron 状态"
        echo "  test    - 测试发送"
        echo "  log     - 查看发送日志"
        echo "  remove  - 移除定时任务"
        ;;
esac
