#!/usr/bin/env node
// GEMINI PRIME A2A QUERY TOOL
// Secure, reliable method for Gemini Prime to query A2A messages
// Handles authentication, environment validation, and message filtering

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');

class GeminiA2AQueryTool {
    constructor() {
        this.validateEnvironment();
        this.client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'Gemini Prime' }
        );
    }

    validateEnvironment() {
        const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
        const missing = requiredVars.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing.join(', '));
            console.error('💡 Ensure .env file exists with proper Supabase credentials');
            process.exit(1);
        }

        // Validate URL format
        if (!process.env.SUPABASE_URL.startsWith('https://')) {
            console.error('❌ Invalid SUPABASE_URL format (must start with https://)');
            process.exit(1);
        }

        // Validate Service Key format (JWT-like)
        if (!process.env.SUPABASE_SERVICE_KEY.includes('.') || process.env.SUPABASE_SERVICE_KEY.length < 100) {
            console.error('❌ Invalid SUPABASE_SERVICE_KEY format (must be a valid JWT)');
            process.exit(1);
        }

        console.log('✅ Environment validation passed');
    }

    async healthCheck() {
        try {
            const health = await this.client.healthCheck();
            if (health.status !== 'HEALTHY') {
                throw new Error(`A2A client unhealthy: ${health.error}`);
            }
            console.log('✅ A2A client connection verified');
            return true;
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            return false;
        }
    }

    /**
     * Get messages addressed to Gemini Prime
     */
    async getMyMessages(options = {}) {
        const {
            messageType = null,          // Filter by type (TASK_ACCEPTED, PROGRESS_UPDATE, etc.)
            fromSender = null,           // Filter by sender (Claude Code, etc.)
            contextId = null,            // Filter by context_id
            limit = 10,                  // Number of messages to retrieve
            unreadOnly = false           // Only unacknowledged messages
        } = options;

        try {
            console.log('📥 Retrieving messages for Gemini Prime...');
            
            let messages = await this.client.getMessages('Gemini Prime', null, limit, messageType);
            
            // Apply additional filters
            if (fromSender) {
                messages = messages.filter(msg => msg.sender === fromSender);
            }
            
            if (contextId) {
                messages = messages.filter(msg => msg.context_id === contextId);
            }
            
            if (unreadOnly) {
                messages = messages.filter(msg => msg.status !== 'ACKNOWLEDGED');
            }

            console.log(`📊 Found ${messages.length} matching messages`);
            return messages;

        } catch (error) {
            console.error('❌ Failed to retrieve messages:', error.message);
            throw error;
        }
    }

    /**
     * Get messages by context (conversation threading)
     */
    async getMessagesByContext(contextId) {
        try {
            console.log(`📋 Retrieving conversation: ${contextId}`);
            const messages = await this.client.getMessagesByContext(contextId);
            console.log(`📊 Found ${messages.length} messages in conversation`);
            return messages;
        } catch (error) {
            console.error('❌ Failed to retrieve conversation:', error.message);
            throw error;
        }
    }

    /**
     * Check for specific task status updates
     */
    async checkTaskStatus(taskId) {
        try {
            console.log(`🔍 Checking status for task: ${taskId}`);
            
            // Get all messages from Claude Code
            const claudeMessages = await this.getMyMessages({
                fromSender: 'Claude Code',
                limit: 20
            });
            
            // Filter by task_id in payload
            const taskMessages = claudeMessages.filter(msg => 
                (msg.payload && msg.payload.task_id === taskId) || msg.context_id === taskId
            );
            
            if (taskMessages.length === 0) {
                console.log(`⚠️ No messages found for task: ${taskId}`);
                return { found: false, messages: [] };
            }
            
            console.log(`📊 Found ${taskMessages.length} messages for task ${taskId}:`);
            taskMessages.forEach(msg => {
                console.log(`   • ${msg.type}: ${msg.payload.status || 'N/A'} (${msg.created_at})`);
            });
            
            return {
                found: true,
                messages: taskMessages,
                latest: taskMessages[0], // Most recent message
                hasAcceptance: taskMessages.some(msg => msg.type === 'TASK_ACCEPTED' || (msg.type === 'PROGRESS_UPDATE' && msg.payload && msg.payload.message_type === 'TASK_DELIVERABLES' && msg.payload.status === 'ACCEPTED')),
                hasProgress: taskMessages.some(msg => msg.type === 'PROGRESS_UPDATE'),
                hasCompletion: taskMessages.some(msg => msg.type === 'TASK_COMPLETED' || (msg.type === 'PROGRESS_UPDATE' && msg.payload && msg.payload.message_type === 'TASK_DELIVERABLES' && msg.payload.status === 'COMPLETED'))
            };
            
        } catch (error) {
            console.error(`❌ Failed to check task status: ${error.message}`);
            throw error;
        }
    }

    /**
     * Send message to Claude Code
     */
    async sendMessage(type, payload, contextId = null) {
        try {
            console.log(`📤 Sending ${type} message to Claude Code...`);
            
            const message = await this.client.sendMessage(
                'Gemini Prime',
                'Claude Code',
                type,
                payload,
                contextId
            );
            
            console.log(`✅ Message sent successfully: ${message.id}`);
            return message;
            
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
            throw error;
        }
    }

    /**
     * Interactive command line interface
     */
    async runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];
        
        console.log('🤖 GEMINI PRIME A2A QUERY TOOL');
        console.log('==============================');
        
        // Health check first
        const healthy = await this.healthCheck();
        if (!healthy) {
            process.exit(1);
        }
        
        switch (command) {
            case 'messages':
            case 'list':
                await this.cmdListMessages(args.slice(1));
                break;
                
            case 'task':
                await this.cmdCheckTask(args.slice(1));
                break;
                
            case 'conversation':
            case 'context':
                await this.cmdGetConversation(args.slice(1));
                break;
                
            case 'send':
                await this.cmdSendMessage(args.slice(1));
                break;
                
            case 'unread':
                await this.cmdUnreadMessages();
                break;
                
            default:
                this.showUsage();
        }
    }

    async cmdListMessages(args) {
        const options = this.parseOptions(args);
        const messages = await this.getMyMessages(options);
        
        if (messages.length === 0) {
            console.log('📪 No messages found');
            return;
        }
        
        console.log('\n📋 RECENT MESSAGES:');
        messages.forEach((msg, index) => {
            console.log(`\n${index + 1}. FROM: ${msg.sender} | TYPE: ${msg.type}`);
            console.log(`   📅 ${msg.created_at}`);
            console.log(`   📧 ID: ${msg.id}`);
            if (msg.context_id) console.log(`   🔗 Context: ${msg.context_id}`);
            if (msg.payload && msg.payload.task_id) console.log(`   🎯 Task: ${msg.payload.task_id}`);
            if (msg.payload) {
                try {
                    const payloadStr = JSON.stringify(msg.payload, null, 2);
                    console.log(`   📦 Payload: ${payloadStr.replace(/\n/g, '\n              ')}`);
                } catch (e) {
                    console.log(`   📦 Payload: ${msg.payload}`);
                }
            }
            console.log(`   📊 Status: ${msg.status}`);
        });
    }

    async cmdCheckTask(args) {
        const taskId = args[0];
        if (!taskId) {
            console.error('❌ Task ID required: node gemini-a2a-query-tool.js task <task_id>');
            return;
        }
        
        const result = await this.checkTaskStatus(taskId);
        
        if (result.found) {
            console.log(`\n✅ TASK STATUS: ${taskId}`);
            console.log(`   📧 Messages: ${result.messages.length}`);
            console.log(`   ✅ Accepted: ${result.hasAcceptance ? 'YES' : 'NO'}`);
            console.log(`   🔄 Progress: ${result.hasProgress ? 'YES' : 'NO'}`);
            console.log(`   🎯 Completed: ${result.hasCompletion ? 'YES' : 'NO'}`);
        }
    }

    async cmdGetConversation(args) {
        const contextId = args[0];
        if (!contextId) {
            console.error('❌ Context ID required: node gemini-a2a-query-tool.js conversation <context_id>');
            return;
        }
        
        const messages = await this.getMessagesByContext(contextId);
        
        console.log(`\n💬 CONVERSATION: ${contextId}`);
        messages.forEach((msg, index) => {
            console.log(`\n${index + 1}. ${msg.sender} → ${msg.recipient}: ${msg.type}`);
            console.log(`   📅 ${msg.created_at}`);
            if (msg.payload && typeof msg.payload === 'object') {
                Object.entries(msg.payload).forEach(([key, value]) => {
                    if (key !== 'timestamp' && value) {
                        if (typeof value === 'object' && value !== null) {
                            console.log(`   ${key}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n              ')}`);
                        } else {
                            console.log(`   ${key}: ${value}`);
                        }
                    }
                });
            }
        });
    }

    async cmdUnreadMessages() {
        const messages = await this.getMyMessages({ unreadOnly: true });
        
        console.log(`\n📬 UNREAD MESSAGES: ${messages.length}`);
        if (messages.length > 0) {
            messages.forEach((msg, index) => {
                console.log(`\n${index + 1}. ${msg.sender}: ${msg.type}`);
                console.log(`   📅 ${msg.created_at}`);
                if (msg.payload && msg.payload.objective) {
                    console.log(`   📝 ${msg.payload.objective}`);
                }
            });
        }
    }

    async cmdSendMessage(args) {
        const messageType = args[0];
        let payload;
        try {
            payload = JSON.parse(args[1]);
        } catch (e) {
            console.error('❌ Invalid payload format. Must be a valid JSON string.');
            this.showUsage();
            return;
        }
        const contextId = args[2] || null;

        if (!messageType || !payload) {
            console.error('❌ Usage: node gemini-a2a-query-tool.js send <message_type> <json_payload> [context_id]');
            return;
        }

        try {
            const message = await this.sendMessage(messageType, payload, contextId);
            console.log(`✅ Message sent successfully with ID: ${message.id}`);
        } catch (error) {
            console.error('❌ Failed to send message:', error.message);
        }
    }

    parseOptions(args) {
        const options = {};
        
        for (let i = 0; i < args.length; i += 2) {
            const key = args[i];
            const value = args[i + 1];
            
            switch (key) {
                case '--type':
                    options.messageType = value;
                    break;
                case '--from':
                    options.fromSender = value;
                    break;
                case '--context':
                    options.contextId = value;
                    break;
                case '--limit':
                    options.limit = parseInt(value) || 10;
                    break;
                case '--unread':
                    options.unreadOnly = true;
                    i--; // No value for this flag
                    break;
            }
        }
        
        return options;
    }

    showUsage() {
        console.log('\n📖 USAGE:');
        console.log('node gemini-a2a-query-tool.js <command> [options]');
        console.log('\n📋 COMMANDS:');
        console.log('  messages     List recent messages');
        console.log('  task <id>    Check specific task status');
        console.log('  conversation <context_id>  View conversation thread');
        console.log('  unread       Show unread messages only');
        console.log('\n🔧 OPTIONS:');
        console.log('  --type <TYPE>     Filter by message type');
        console.log('  --from <SENDER>   Filter by sender');
        console.log('  --context <ID>    Filter by context ID');
        console.log('  --limit <N>       Number of messages (default: 10)');
        console.log('  --unread          Only unread messages');
        console.log('\n💡 EXAMPLES:');
        console.log('  node gemini-a2a-query-tool.js messages --from "Claude Code" --limit 5');
        console.log('  node gemini-a2a-query-tool.js task "my_task_123"');
        console.log('  node gemini-a2a-query-tool.js unread');
    }
}

// Run CLI if called directly
if (require.main === module) {
    const tool = new GeminiA2AQueryTool();
    tool.runCLI().catch(error => {
        console.error('❌ CLI Error:', error.message);
        process.exit(1);
    });
}

module.exports = GeminiA2AQueryTool;