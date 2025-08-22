#!/usr/bin/env node
// GEMINI CHIEF ORCHESTRATOR A2A QUERY TOOL - FIXED VERSION
// This version correctly handles both "Gemini Prime" and "Chief Orchestrator (Gemini)" identities

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');

class GeminiA2AQueryToolFixed {
    constructor() {
        this.validateEnvironment();
        
        // CRITICAL FIX: Use the correct agent identity
        this.primaryIdentity = 'Chief Orchestrator (Gemini)';
        this.fallbackIdentity = 'Gemini Prime';
        
        this.client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: this.primaryIdentity }
        );
        
        console.log(`🤖 Initialized for: ${this.primaryIdentity}`);
    }

    validateEnvironment() {
        const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
        const missing = requiredVars.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing.join(', '));
            console.error('💡 Ensure .env file exists with proper Supabase credentials');
            process.exit(1);
        }

        if (!process.env.SUPABASE_URL.startsWith('https://')) {
            console.error('❌ Invalid SUPABASE_URL format (must start with https://)');
            process.exit(1);
        }

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
     * FIXED: Get messages addressed to BOTH identities
     */
    async getMyMessages(options = {}) {
        const {
            messageType = null,
            fromSender = null,
            contextId = null,
            limit = 10,
            unreadOnly = false
        } = options;

        try {
            console.log('📥 Retrieving messages for Chief Orchestrator (Gemini)...');
            
            // CRITICAL FIX: Check BOTH identities
            const [primaryMessages, fallbackMessages] = await Promise.all([
                this.client.getMessages(this.primaryIdentity, null, limit, messageType),
                this.client.getMessages(this.fallbackIdentity, null, limit, messageType)
            ]);
            
            // Combine and deduplicate messages
            const allMessages = [...primaryMessages, ...fallbackMessages];
            const uniqueMessages = allMessages.filter((msg, index, self) =>
                index === self.findIndex(m => m.id === msg.id)
            );
            
            // Sort by timestamp (most recent first)
            uniqueMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            let messages = uniqueMessages.slice(0, limit);
            
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

            console.log(`📊 Found ${messages.length} matching messages (Primary: ${primaryMessages.length}, Fallback: ${fallbackMessages.length})`);
            return messages;

        } catch (error) {
            console.error('❌ Failed to retrieve messages:', error.message);
            throw error;
        }
    }

    /**
     * ENHANCED: Check for Phase 3 roadmap responses specifically
     */
    async checkRoadmapResponses() {
        try {
            console.log('🗺️ CHECKING FOR PHASE 3 ROADMAP RESPONSES');
            console.log('==========================================');
            
            // Look for TASK_COMPLETED messages from Claude Code
            const claudeResponses = await this.getMyMessages({
                fromSender: 'Claude Code',
                messageType: 'TASK_COMPLETED',
                limit: 20
            });
            
            // Filter for roadmap-related responses
            const roadmapResponses = claudeResponses.filter(msg => {
                if (!msg.payload) return false;
                const payloadStr = JSON.stringify(msg.payload).toLowerCase();
                return payloadStr.includes('roadmap') || 
                       payloadStr.includes('phase 3') || 
                       payloadStr.includes('ai-driven');
            });
            
            console.log(`🎯 Found ${roadmapResponses.length} roadmap-related TASK_COMPLETED responses`);
            
            if (roadmapResponses.length > 0) {
                console.log('\\n📋 ROADMAP RESPONSES FOUND:');
                roadmapResponses.forEach((msg, index) => {
                    console.log(`\\n${index + 1}. MESSAGE ID: ${msg.id}`);
                    console.log(`   📅 Timestamp: ${msg.created_at}`);
                    console.log(`   🎯 Recipient: ${msg.recipient}`);
                    console.log(`   🔗 Context: ${msg.context_id || 'N/A'}`);
                    
                    if (msg.payload) {
                        console.log(`   📊 Title: ${msg.payload.title || 'N/A'}`);
                        console.log(`   ⭐ Rating: ${msg.payload.overall_rating || 'N/A'}`);
                        console.log(`   💰 Impact: ${msg.payload.business_impact || 'N/A'}`);
                        console.log(`   📈 Feasibility: ${msg.payload.technical_feasibility || 'N/A'}`);
                    }
                });
                
                return {
                    found: true,
                    count: roadmapResponses.length,
                    responses: roadmapResponses,
                    latest: roadmapResponses[0]
                };
            } else {
                console.log('❌ No roadmap responses found from Claude Code');
                
                // Debug: Show what messages we did find
                console.log('\\n🔍 DEBUG: Recent messages from Claude Code:');
                claudeResponses.slice(0, 5).forEach((msg, index) => {
                    console.log(`   ${index + 1}. ${msg.type} - ${msg.created_at}`);
                    if (msg.payload && msg.payload.title) {
                        console.log(`      Title: ${msg.payload.title}`);
                    }
                });
                
                return {
                    found: false,
                    count: 0,
                    responses: [],
                    debug: claudeResponses.slice(0, 5)
                };
            }
            
        } catch (error) {
            console.error('❌ Failed to check roadmap responses:', error.message);
            throw error;
        }
    }

    /**
     * Original methods with fixed message retrieval
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

    async checkTaskStatus(taskId) {
        try {
            console.log(`🔍 Checking status for task: ${taskId}`);
            
            // FIXED: Use updated message retrieval
            const claudeMessages = await this.getMyMessages({
                fromSender: 'Claude Code',
                limit: 20
            });
            
            const taskMessages = claudeMessages.filter(msg => 
                (msg.payload && msg.payload.task_id === taskId) || msg.context_id === taskId
            );
            
            if (taskMessages.length === 0) {
                console.log(`⚠️ No messages found for task: ${taskId}`);
                return { found: false, messages: [] };
            }
            
            console.log(`📊 Found ${taskMessages.length} messages for task ${taskId}:`);
            taskMessages.forEach(msg => {
                console.log(`   • ${msg.type}: ${msg.payload?.status || 'N/A'} (${msg.created_at})`);
            });
            
            return {
                found: true,
                messages: taskMessages,
                latest: taskMessages[0],
                hasAcceptance: taskMessages.some(msg => msg.type === 'TASK_ACCEPTED'),
                hasProgress: taskMessages.some(msg => msg.type === 'PROGRESS_UPDATE'),
                hasCompletion: taskMessages.some(msg => msg.type === 'TASK_COMPLETED')
            };
            
        } catch (error) {
            console.error(`❌ Failed to check task status: ${error.message}`);
            throw error;
        }
    }

    async sendMessage(type, payload, contextId = null) {
        try {
            console.log(`📤 Sending ${type} message to Claude Code...`);
            
            const message = await this.client.sendMessage(
                this.primaryIdentity,
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

    // CLI Interface methods (simplified for this fix)
    async runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];
        
        console.log('🤖 GEMINI CHIEF ORCHESTRATOR A2A QUERY TOOL (FIXED)');
        console.log('===================================================');
        
        const healthy = await this.healthCheck();
        if (!healthy) {
            process.exit(1);
        }
        
        switch (command) {
            case 'roadmap':
                await this.checkRoadmapResponses();
                break;
                
            case 'messages':
            case 'list':
                await this.cmdListMessages(args.slice(1));
                break;
                
            case 'task':
                await this.cmdCheckTask(args.slice(1));
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
        
        console.log('\\n📋 RECENT MESSAGES:');
        messages.forEach((msg, index) => {
            console.log(`\\n${index + 1}. FROM: ${msg.sender} | TYPE: ${msg.type}`);
            console.log(`   📅 ${msg.created_at}`);
            console.log(`   📧 ID: ${msg.id}`);
            console.log(`   🎯 To: ${msg.recipient}`);
            if (msg.context_id) console.log(`   🔗 Context: ${msg.context_id}`);
            if (msg.payload) {
                try {
                    const payloadStr = JSON.stringify(msg.payload, null, 2);
                    console.log(`   📦 Payload: ${payloadStr.replace(/\\n/g, '\\n              ')}`);
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
            console.error('❌ Task ID required');
            return;
        }
        
        const result = await this.checkTaskStatus(taskId);
        
        if (result.found) {
            console.log(`\\n✅ TASK STATUS: ${taskId}`);
            console.log(`   📧 Messages: ${result.messages.length}`);
            console.log(`   ✅ Accepted: ${result.hasAcceptance ? 'YES' : 'NO'}`);
            console.log(`   🔄 Progress: ${result.hasProgress ? 'YES' : 'NO'}`);
            console.log(`   🎯 Completed: ${result.hasCompletion ? 'YES' : 'NO'}`);
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
                    i--;
                    break;
            }
        }
        
        return options;
    }

    showUsage() {
        console.log('\\n📖 USAGE:');
        console.log('node gemini-a2a-query-tool-FIXED.js <command> [options]');
        console.log('\\n📋 COMMANDS:');
        console.log('  roadmap      Check for Phase 3 roadmap responses (RECOMMENDED)');
        console.log('  messages     List recent messages');
        console.log('  task <id>    Check specific task status');
        console.log('\\n💡 EXAMPLES:');
        console.log('  node gemini-a2a-query-tool-FIXED.js roadmap');
        console.log('  node gemini-a2a-query-tool-FIXED.js messages --from "Claude Code"');
    }
}

// Run CLI if called directly
if (require.main === module) {
    const tool = new GeminiA2AQueryToolFixed();
    tool.runCLI().catch(error => {
        console.error('❌ CLI Error:', error.message);
        process.exit(1);
    });
}

module.exports = GeminiA2AQueryToolFixed;