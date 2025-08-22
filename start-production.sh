#!/bin/bash

# Senior Care AI Ecosystem - Production Startup Script

# Set environment
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048"

# Create PID file
echo $$ > senior-care-ai.pid

# Start with monitoring and auto-restart
exec node dashboards/dashboard-server.js 2>&1 | tee -a logs/production.log
