// GEMINI PRIME FILE-BASED STATUS SYSTEM  
// Alternative communication method using file system
// Creates status files that Gemini can read without database access

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');

class GeminiFileStatus {
    constructor() {
        this.statusDir = '/tmp/gemini-a2a-status';
        this.latestFile = path.join(this.statusDir, 'latest-messages.json');
        this.taskStatusFile = path.join(this.statusDir, 'task-status.json');
        this.healthFile = path.join(this.statusDir, 'system-health.json');
        
        this.client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'File Status Writer' }
        );
    }

    async ensureStatusDirectory() {
        try {
            await fs.mkdir(this.statusDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async updateLatestMessages() {
        try {
            const messages = await this.client.getMessages('Gemini Prime', null, 10);
            const claudeMessages = messages.filter(msg => msg.sender === 'Claude Code');
            
            const statusData = {
                timestamp: new Date().toISOString(),
                total_messages: messages.length,
                claude_messages: claudeMessages.length,
                latest_messages: messages.slice(0, 5).map(msg => ({
                    id: msg.id,
                    sender: msg.sender,
                    type: msg.type,
                    created_at: msg.created_at,
                    status: msg.status,
                    task_id: msg.payload?.task_id || null,
                    context_id: msg.context_id || null,
                    objective: msg.payload?.objective || null
                })),
                unread_count: messages.filter(msg => msg.status !== 'ACKNOWLEDGED').length
            };
            
            await fs.writeFile(this.latestFile, JSON.stringify(statusData, null, 2));
            console.log(`✅ Updated latest messages: ${messages.length} total, ${claudeMessages.length} from Claude`);
            
        } catch (error) {
            console.error('❌ Failed to update latest messages:', error.message);
        }
    }

    async updateTaskStatus(taskIds = []) {
        try {
            const allMessages = await this.client.getMessages('Gemini Prime', null, 50);
            const taskStatuses = {};
            
            // Auto-detect task IDs if not provided
            const autoTaskIds = [...new Set(
                allMessages
                    .filter(msg => msg.payload?.task_id)
                    .map(msg => msg.payload.task_id)
            )];
            
            const targetTaskIds = taskIds.length > 0 ? taskIds : autoTaskIds.slice(0, 10);
            
            for (const taskId of targetTaskIds) {
                const taskMessages = allMessages.filter(msg => 
                    msg.payload?.task_id === taskId
                );
                
                if (taskMessages.length > 0) {
                    taskStatuses[taskId] = {
                        task_id: taskId,
                        message_count: taskMessages.length,
                        has_acceptance: taskMessages.some(msg => msg.type === 'TASK_ACCEPTED'),
                        has_progress: taskMessages.some(msg => msg.type === 'PROGRESS_UPDATE'),
                        has_completion: taskMessages.some(msg => msg.type === 'TASK_COMPLETED'),
                        latest_message: taskMessages[0],
                        all_types: [...new Set(taskMessages.map(msg => msg.type))],
                        last_updated: taskMessages[0].created_at
                    };
                }
            }
            
            const taskStatusData = {
                timestamp: new Date().toISOString(),
                task_count: Object.keys(taskStatuses).length,
                tasks: taskStatuses
            };
            
            await fs.writeFile(this.taskStatusFile, JSON.stringify(taskStatusData, null, 2));
            console.log(`✅ Updated task status: ${Object.keys(taskStatuses).length} tasks tracked`);
            
        } catch (error) {
            console.error('❌ Failed to update task status:', error.message);
        }
    }

    async updateSystemHealth() {
        try {
            const health = await this.client.healthCheck();
            const healthData = {
                timestamp: new Date().toISOString(),
                status: health.status,
                connection: health.status === 'HEALTHY' ? 'CONNECTED' : 'FAILED',
                error: health.error || null,
                agent_id: this.client.agentId,
                supabase_url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
                service_key: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING'
            };
            
            await fs.writeFile(this.healthFile, JSON.stringify(healthData, null, 2));
            console.log(`✅ Updated system health: ${health.status}`);
            
        } catch (error) {
            console.error('❌ Failed to update system health:', error.message);
        }
    }

    async updateAllStatus() {
        await this.ensureStatusDirectory();
        
        console.log('📊 Updating Gemini Prime status files...');
        await Promise.all([
            this.updateLatestMessages(),
            this.updateTaskStatus(),
            this.updateSystemHealth()
        ]);
        
        console.log(`📂 Status files updated in: ${this.statusDir}`);
        console.log('');
        console.log('📋 GEMINI PRIME FILE ACCESS:');
        console.log(`   Latest Messages: cat ${this.latestFile}`);
        console.log(`   Task Status:     cat ${this.taskStatusFile}`);
        console.log(`   System Health:   cat ${this.healthFile}`);
    }

    // Create monitoring script for continuous updates
    async createMonitoringScript() {
        const scriptContent = `#!/bin/bash
# Gemini Prime A2A Status Monitor
# Updates status files every 30 seconds

echo "🔄 Starting Gemini Prime A2A Status Monitor..."
echo "📂 Status files location: ${this.statusDir}"
echo "⏱️  Update interval: 30 seconds"
echo "🛑 Press Ctrl+C to stop"
echo ""

while true; do
    echo "$(date): Updating status files..."
    node "${path.join(__dirname, 'gemini-file-status.js')}" update 2>/dev/null
    
    if [ -f "${this.latestFile}" ]; then
        echo "✅ Status updated successfully"
    else
        echo "❌ Status update failed"
    fi
    
    sleep 30
done
`;

        const scriptPath = path.join(__dirname, 'start-gemini-file-monitor.sh');
        await fs.writeFile(scriptPath, scriptContent);
        await fs.chmod(scriptPath, 0o755);
        
        console.log(`📊 Created monitoring script: ${scriptPath}`);
        console.log('🚀 To start monitoring: ./start-gemini-file-monitor.sh');
    }
}

// CLI interface
async function main() {
    const fileStatus = new GeminiFileStatus();
    const command = process.argv[2];
    
    switch (command) {
        case 'update':
            await fileStatus.updateAllStatus();
            break;
            
        case 'monitor':
            await fileStatus.createMonitoringScript();
            break;
            
        case 'messages':
            await fileStatus.updateLatestMessages();
            break;
            
        case 'tasks':
            await fileStatus.updateTaskStatus();
            break;
            
        case 'health':
            await fileStatus.updateSystemHealth();
            break;
            
        default:
            console.log('📖 Gemini Prime File Status System');
            console.log('Usage: node gemini-file-status.js <command>');
            console.log('');
            console.log('Commands:');
            console.log('  update     Update all status files');
            console.log('  messages   Update latest messages only');
            console.log('  tasks      Update task status only'); 
            console.log('  health     Update system health only');
            console.log('  monitor    Create monitoring script');
            console.log('');
            console.log('File locations:');
            console.log(`  Messages: ${fileStatus.latestFile}`);
            console.log(`  Tasks:    ${fileStatus.taskStatusFile}`);
            console.log(`  Health:   ${fileStatus.healthFile}`);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ File status error:', error.message);
        process.exit(1);
    });
}

module.exports = GeminiFileStatus;