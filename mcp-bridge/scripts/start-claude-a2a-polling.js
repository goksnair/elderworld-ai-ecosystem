#!/usr/bin/env node
// CLAUDE CODE A2A POLLING STARTUP SCRIPT
// Production-ready autonomous agent communication system

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const ClaudeCodeA2APolling = require('../services/claude-code-a2a-polling');

class A2APollingManager {
    constructor() {
        this.polling = null;
        this.isShuttingDown = false;
        
        // Handle graceful shutdown
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            this.gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
        process.on('unhandledRejection', (reason) => {
            console.error('❌ Unhandled Rejection:', reason);
            this.gracefulShutdown('UNHANDLED_REJECTION');
        });
    }

    async start() {
        console.log('🚀 CLAUDE CODE A2A POLLING MANAGER');
        console.log('==================================');
        console.log('🎯 Objective: Autonomous multi-agent coordination');
        console.log('🏥 Context: Senior Care AI Ecosystem - Emergency Response');
        console.log('💰 Business Impact: ₹500Cr revenue pathway optimization');
        console.log('');

        try {
            // Validate environment
            console.log('🔧 Validating environment...');
            await this.validateEnvironment();
            
            // Initialize polling system
            console.log('🤖 Initializing Claude Code A2A Polling...');
            this.polling = new ClaudeCodeA2APolling({
                pollingInterval: parseInt(process.env.A2A_POLLING_INTERVAL) || 5000
            });
            
            // Start polling
            console.log('🔄 Starting autonomous polling...');
            const started = await this.polling.startPolling();
            
            if (started) {
                console.log('✅ Claude Code A2A Polling ACTIVE');
                console.log('📡 Listening for messages from Gemini Prime and other agents');
                console.log('⚡ Ready for autonomous task delegation');
                console.log('');
                console.log('💡 Status Commands:');
                console.log('   - Press Ctrl+C to stop gracefully');
                console.log('   - System will auto-acknowledge and process incoming messages');
                console.log('   - All tasks will be executed autonomously');
                
                // Send startup notification
                await this.sendStartupNotification();
                
                // Keep process alive
                await this.keepAlive();
            } else {
                console.error('❌ Failed to start A2A polling');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('❌ Startup failed:', error.message);
            console.error('Stack trace:', error.stack);
            process.exit(1);
        }
    }

    async validateEnvironment() {
        const requiredEnvVars = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_KEY'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        console.log('   ✅ Environment variables validated');
    }

    async sendStartupNotification() {
        try {
            await this.polling.testCommunication();
            console.log('📨 Startup notification sent to Gemini Prime');
        } catch (error) {
            console.log('⚠️ Could not send startup notification:', error.message);
        }
    }

    async keepAlive() {
        // Display periodic status
        const statusInterval = setInterval(async () => {
            if (!this.isShuttingDown) {
                try {
                    const status = await this.polling.getStatus();
                    console.log(`💙 SYSTEM ACTIVE | Processed: ${status.processedMessageCount} messages | Running: ${status.isRunning ? '✅' : '❌'} | Time: ${new Date().toLocaleTimeString()}`);
                } catch (error) {
                    console.log(`⚠️ Status check failed: ${error.message}`);
                }
            }
        }, 30000); // Every 30 seconds

        // Keep process running
        return new Promise((resolve) => {
            process.on('SIGINT', () => {
                clearInterval(statusInterval);
                resolve();
            });
        });
    }

    async gracefulShutdown(signal) {
        if (this.isShuttingDown) {
            console.log('🔄 Shutdown already in progress...');
            return;
        }

        this.isShuttingDown = true;
        console.log('');
        console.log(`🛑 Received ${signal} - Starting graceful shutdown...`);
        
        try {
            if (this.polling) {
                console.log('⏳ Stopping A2A polling...');
                this.polling.stopPolling();
                
                // Give time for current operations to complete
                console.log('⏳ Waiting for current operations to complete...');
                await this.sleep(2000);
            }
            
            console.log('✅ Claude Code A2A Polling shutdown complete');
            console.log('👋 System stopped gracefully');
            
        } catch (error) {
            console.error('❌ Error during shutdown:', error.message);
        } finally {
            process.exit(0);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the system
if (require.main === module) {
    const manager = new A2APollingManager();
    manager.start().catch(console.error);
}

module.exports = A2APollingManager;