#!/bin/bash

# AGENT HEALTH MONITORING SCRIPT
# Monitors agent processes and restarts them if needed

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
AGENT_DIR="$SCRIPT_DIR/agents"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/monitor.log"
}

check_agent_health() {
    local agent_name=$1
    local agent_script="$AGENT_DIR/${agent_name}.js"
    
    # Check if agent process is running
    local pid=$(pgrep -f "$agent_name")
    
    if [ -z "$pid" ]; then
        echo -e "${YELLOW}⚠️ Agent $agent_name not running${NC}"
        log_message "WARNING: Agent $agent_name not running"
        
        # Check if script exists
        if [ -f "$agent_script" ]; then
            echo -e "${YELLOW}🔄 Restarting $agent_name...${NC}"
            log_message "INFO: Restarting agent $agent_name"
            
            # Start agent in background
            cd "$SCRIPT_DIR"
            nohup node "$agent_script" > "$LOG_DIR/${agent_name}.log" 2>&1 &
            
            sleep 2
            
            # Verify restart
            local new_pid=$(pgrep -f "$agent_name")
            if [ -n "$new_pid" ]; then
                echo -e "${GREEN}✅ Agent $agent_name restarted successfully (PID: $new_pid)${NC}"
                log_message "SUCCESS: Agent $agent_name restarted (PID: $new_pid)"
            else
                echo -e "${RED}❌ Failed to restart agent $agent_name${NC}"
                log_message "ERROR: Failed to restart agent $agent_name"
            fi
        else
            echo -e "${RED}❌ Agent script not found: $agent_script${NC}"
            log_message "ERROR: Agent script not found: $agent_script"
        fi
    else
        echo -e "${GREEN}✅ Agent $agent_name healthy (PID: $pid)${NC}"
        
        # Check memory usage
        local memory=$(ps -o rss= -p "$pid" 2>/dev/null | awk '{print $1/1024}')
        if [ -n "$memory" ]; then
            printf "${GREEN}   Memory: %.1f MB${NC}\n" "$memory"
        fi
    fi
}

check_claude_code_handler() {
    local handler_script="$SCRIPT_DIR/claude-code-task-handler.js"
    local pid=$(pgrep -f "claude-code-task-handler")
    
    if [ -z "$pid" ]; then
        echo -e "${YELLOW}⚠️ Claude Code Task Handler not running${NC}"
        
        if [ -f "$handler_script" ]; then
            echo -e "${YELLOW}🔄 Starting Claude Code Task Handler...${NC}"
            cd "$SCRIPT_DIR"
            nohup node "$handler_script" > "$LOG_DIR/claude-code-handler.log" 2>&1 &
            sleep 2
            
            local new_pid=$(pgrep -f "claude-code-task-handler")
            if [ -n "$new_pid" ]; then
                echo -e "${GREEN}✅ Claude Code Task Handler started (PID: $new_pid)${NC}"
                log_message "SUCCESS: Claude Code Task Handler started (PID: $new_pid)"
            fi
        fi
    else
        echo -e "${GREEN}✅ Claude Code Task Handler healthy (PID: $pid)${NC}"
    fi
}

check_system_health() {
    echo -e "${GREEN}🔍 System Health Check - $(date)${NC}"
    echo "================================"
    
    # Check database connectivity
    if command -v curl >/dev/null 2>&1; then
        if curl -s -o /dev/null -w "%{http_code}" "https://supabase.co" | grep -q "200"; then
            echo -e "${GREEN}✅ External connectivity OK${NC}"
        else
            echo -e "${YELLOW}⚠️ Network connectivity issue${NC}"
        fi
    fi
    
    # Check disk space
    local disk_usage=$(df "$SCRIPT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        echo -e "${RED}❌ Disk usage high: ${disk_usage}%${NC}"
        log_message "WARNING: High disk usage: ${disk_usage}%"
    else
        echo -e "${GREEN}✅ Disk usage OK: ${disk_usage}%${NC}"
    fi
    
    # Check log file sizes
    if [ -d "$LOG_DIR" ]; then
        local log_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1)
        echo -e "${GREEN}✅ Log directory size: $log_size${NC}"
        
        # Rotate large logs (>10MB)
        find "$LOG_DIR" -name "*.log" -size +10M -exec mv {} {}.old \;
    fi
}

cleanup_old_logs() {
    echo -e "${GREEN}🧹 Cleaning old logs...${NC}"
    
    # Remove logs older than 7 days
    find "$LOG_DIR" -name "*.log.old" -mtime +7 -delete 2>/dev/null
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null
    
    log_message "INFO: Log cleanup completed"
}

main() {
    log_message "INFO: Starting agent health monitoring"
    
    check_system_health
    echo ""
    
    # Check specific agents
    check_agent_health "senior-care-boss-agent"
    check_claude_code_handler
    
    # Add other agents here as they're implemented
    # check_agent_health "ai-ml-specialist-agent"
    # check_agent_health "operations-excellence-agent"
    
    echo ""
    cleanup_old_logs
    
    echo -e "${GREEN}🎉 Health check completed${NC}"
    log_message "INFO: Agent health monitoring completed"
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "start")
        echo -e "${GREEN}🚀 Starting continuous monitoring...${NC}"
        while true; do
            main
            echo -e "${GREEN}⏳ Waiting 300 seconds...${NC}"
            sleep 300  # Check every 5 minutes
        done
        ;;
    "stop")
        echo -e "${YELLOW}🛑 Stopping all monitored agents...${NC}"
        pkill -f "senior-care-boss-agent"
        pkill -f "claude-code-task-handler"
        echo -e "${GREEN}✅ All agents stopped${NC}"
        ;;
    *)
        echo "Usage: $0 {check|start|stop}"
        echo "  check - Run single health check (default)"
        echo "  start - Start continuous monitoring"
        echo "  stop  - Stop all monitored agents"
        exit 1
        ;;
esac