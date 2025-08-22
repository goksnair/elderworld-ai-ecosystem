// CLAUDE CODE AUTONOMOUS A2A POLLING MECHANISM
// Direct communication system for multi-agent coordination
// Enables autonomous task delegation from Gemini Prime

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('./a2a-supabase-client');

class ClaudeCodeA2APolling {
    constructor(options = {}) {
        this.pollingInterval = options.pollingInterval || 5000; // 5 seconds default
        this.lastPolledMessageId = null;
        this.isRunning = false;
        this.processedMessages = new Set();
        
        console.log('🤖 Initializing Claude Code A2A Polling System...');
        console.log(`   Polling interval: ${this.pollingInterval}ms`);
        
        // Initialize A2A client
        this.a2aClient = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'Claude Code' }
        );
        
        this.messageHandlers = {
            'TASK_DELEGATION': this.handleTaskDelegation.bind(this),
            'REQUEST_FOR_INFO': this.handleRequestForInfo.bind(this),
            'STRATEGIC_QUERY': this.handleStrategicQuery.bind(this),
            'PROGRESS_UPDATE': this.handleProgressUpdate.bind(this),
            'BLOCKER_REPORT': this.handleBlockerReport.bind(this),
            'ERROR_NOTIFICATION': this.handleErrorNotification.bind(this)
        };
        
        console.log('✅ Claude Code A2A Polling System initialized');
    }

    async startPolling() {
        if (this.isRunning) {
            console.log('⚠️ A2A Polling already running');
            return;
        }

        console.log('🚀 Starting Claude Code A2A Polling...');
        this.isRunning = true;
        
        // Initial health check
        const health = await this.a2aClient.healthCheck();
        if (health.status !== 'HEALTHY') {
            console.error('❌ A2A Client unhealthy, cannot start polling:', health.error);
            this.isRunning = false;
            return false;
        }
        
        console.log('✅ A2A Client health check passed');
        console.log('🔄 Entering polling loop...');
        
        this.pollingLoop();
        return true;
    }

    stopPolling() {
        console.log('🛑 Stopping Claude Code A2A Polling...');
        this.isRunning = false;
    }

    async pollingLoop() {
        while (this.isRunning) {
            try {
                await this.pollForMessages();
                await this.sleep(this.pollingInterval);
            } catch (error) {
                console.error('❌ Polling loop error:', error.message);
                // Continue polling despite errors
                await this.sleep(this.pollingInterval);
            }
        }
        
        console.log('✅ A2A Polling loop stopped');
    }

    async pollForMessages() {
        try {
            // Get new messages for Claude Code
            const messages = await this.a2aClient.getMessages(
                'Claude Code',
                this.lastPolledMessageId,
                10 // Limit to 10 messages per poll
            );
            
            if (messages.length > 0) {
                console.log(`📬 Received ${messages.length} new A2A messages`);
                
                // Process each message
                for (const message of messages) {
                    // Skip if already processed (deduplication)
                    if (this.processedMessages.has(message.id)) {
                        continue;
                    }
                    
                    console.log(`📨 Processing message ${message.id} from ${message.sender}`);
                    console.log(`   Type: ${message.type}`);
                    console.log(`   Created: ${message.created_at}`);
                    
                    await this.processMessage(message);
                    this.processedMessages.add(message.id);
                    
                    // Update last polled message for pagination
                    this.lastPolledMessageId = message.id;
                }
                
                // Clean up processed messages set to prevent memory leaks
                if (this.processedMessages.size > 1000) {
                    this.processedMessages.clear();
                    console.log('🧹 Cleaned up processed messages cache');
                }
            }
        } catch (error) {
            console.error('❌ Error polling for messages:', error.message);
        }
    }

    async processMessage(message) {
        try {
            // Acknowledge message receipt
            await this.a2aClient.acknowledgeMessage(message.id, 'Claude Code');
            
            // Route to appropriate handler
            const handler = this.messageHandlers[message.type];
            if (handler) {
                console.log(`🔄 Routing ${message.type} to handler...`);
                await handler(message);
            } else {
                console.log(`⚠️ No handler for message type: ${message.type}`);
                await this.handleUnknownMessageType(message);
            }
        } catch (error) {
            console.error(`❌ Error processing message ${message.id}:`, error.message);
            await this.sendErrorResponse(message, error.message);
        }
    }

    // MESSAGE HANDLERS

    async handleTaskDelegation(message) {
        console.log('🎯 Handling TASK_DELEGATION from', message.sender);
        
        const { payload } = message;
        const { task_id, objective, description, business_impact, priority, deadline } = payload;
        
        console.log(`   Task ID: ${task_id}`);
        console.log(`   Objective: ${objective}`);
        console.log(`   Business Impact: ${business_impact}`);
        console.log(`   Priority: ${priority || 'NORMAL'}`);
        
        // Accept the task
        await this.a2aClient.sendMessage(
            'Claude Code',
            message.sender,
            'TASK_ACCEPTED',
            {
                task_id,
                response: 'Task accepted and being processed',
                estimated_completion: this.estimateCompletion(payload),
                capabilities: this.getRelevantCapabilities(payload),
                timestamp: new Date().toISOString()
            },
            message.context_id
        );
        
        console.log('✅ Task delegation accepted, starting execution...');
        
        // Start autonomous task execution
        await this.executeAutonomousTask(payload, message);
    }

    async handleRequestForInfo(message) {
        console.log('ℹ️ Handling REQUEST_FOR_INFO from', message.sender);
        
        const { payload } = message;
        const { query, information_type, context } = payload;
        
        console.log(`   Query: ${query}`);
        console.log(`   Type: ${information_type}`);
        
        // Process information request
        const response = await this.processInformationRequest(payload);
        
        await this.a2aClient.sendMessage(
            'Claude Code',
            message.sender,
            'BUSINESS_IMPACT_REPORT',
            {
                query,
                response,
                confidence: response.confidence || 0.95,
                sources: response.sources || ['Internal Analysis'],
                timestamp: new Date().toISOString()
            },
            message.context_id
        );
        
        console.log('✅ Information request processed and response sent');
    }

    async handleStrategicQuery(message) {
        console.log('🎯 Handling STRATEGIC_QUERY from', message.sender);
        
        const { payload } = message;
        const strategicResponse = await this.processStrategicQuery(payload);
        
        await this.a2aClient.sendMessage(
            'Claude Code',
            message.sender,
            'BUSINESS_IMPACT_REPORT',
            {
                query: payload.query,
                strategic_analysis: strategicResponse.analysis,
                recommendations: strategicResponse.recommendations,
                business_impact: strategicResponse.business_impact,
                confidence: strategicResponse.confidence,
                timestamp: new Date().toISOString()
            },
            message.context_id
        );
        
        console.log('✅ Strategic query processed and analysis sent');
    }

    async handleProgressUpdate(message) {
        console.log('📊 Handling PROGRESS_UPDATE from', message.sender);
        
        const { payload } = message;
        console.log(`   Task: ${payload.task_id}`);
        console.log(`   Status: ${payload.status}`);
        console.log(`   Progress: ${payload.progress_percentage}%`);
        
        // Log progress and potentially trigger actions
        await this.processProgressUpdate(payload);
        
        console.log('✅ Progress update processed');
    }

    async handleBlockerReport(message) {
        console.log('🚫 Handling BLOCKER_REPORT from', message.sender);
        
        const { payload } = message;
        console.log(`   Blocker: ${payload.blocker_description}`);
        console.log(`   Impact: ${payload.impact_level}`);
        
        // Analyze blocker and provide resolution
        const resolution = await this.analyzeBlocker(payload);
        
        await this.a2aClient.sendMessage(
            'Claude Code',
            message.sender,
            'BUSINESS_IMPACT_REPORT',
            {
                blocker_id: payload.blocker_id,
                resolution_strategy: resolution.strategy,
                recommended_actions: resolution.actions,
                escalation_required: resolution.escalation_required,
                business_impact: resolution.business_impact,
                timestamp: new Date().toISOString()
            },
            message.context_id
        );
        
        console.log('✅ Blocker analysis sent');
    }

    async handleErrorNotification(message) {
        console.log('❌ Handling ERROR_NOTIFICATION from', message.sender);
        
        const { payload } = message;
        console.log(`   Error: ${payload.error_message}`);
        console.log(`   Severity: ${payload.severity}`);
        
        // Log error and potentially trigger recovery actions
        await this.processErrorNotification(payload);
        
        console.log('✅ Error notification processed');
    }

    async handleUnknownMessageType(message) {
        console.log(`⚠️ Unknown message type: ${message.type}`);
        
        await this.a2aClient.sendMessage(
            'Claude Code',
            message.sender,
            'ERROR_NOTIFICATION',
            {
                error_type: 'UNSUPPORTED_MESSAGE_TYPE',
                error_message: `Message type '${message.type}' is not supported`,
                original_message_id: message.id,
                timestamp: new Date().toISOString()
            },
            message.context_id
        );
    }

    // TASK EXECUTION METHODS

    async executeAutonomousTask(taskPayload, originalMessage) {
        console.log('🚀 Starting autonomous task execution...');
        
        const { task_id, objective, description } = taskPayload;
        
        try {
            // Send progress update
            await this.sendProgressUpdate(originalMessage.sender, task_id, 'IN_PROGRESS', 10, 'Task execution started');
            
            // Simulate task processing (replace with actual task logic)
            const executionResult = await this.processTask(taskPayload);
            
            // Send progress update
            await this.sendProgressUpdate(originalMessage.sender, task_id, 'IN_PROGRESS', 80, 'Task processing complete');
            
            // Send completion
            await this.a2aClient.sendMessage(
                'Claude Code',
                originalMessage.sender,
                'TASK_COMPLETED',
                {
                    task_id,
                    result: executionResult,
                    success: true,
                    business_impact: this.calculateBusinessImpact(executionResult),
                    execution_time: executionResult.execution_time,
                    timestamp: new Date().toISOString()
                },
                originalMessage.context_id
            );
            
            console.log(`✅ Task ${task_id} completed successfully`);
            
        } catch (error) {
            console.error(`❌ Task execution failed: ${error.message}`);
            
            await this.a2aClient.sendMessage(
                'Claude Code',
                originalMessage.sender,
                'ERROR_NOTIFICATION',
                {
                    task_id,
                    error_type: 'TASK_EXECUTION_FAILED',
                    error_message: error.message,
                    business_impact: 'Task execution failure may delay project timeline',
                    timestamp: new Date().toISOString()
                },
                originalMessage.context_id
            );
        }
    }

    async processTask(taskPayload) {
        // Simulate task processing
        const startTime = Date.now();
        
        console.log('⚙️ Processing task:', taskPayload.objective);
        
        // Simulate work
        await this.sleep(2000);
        
        return {
            status: 'COMPLETED',
            output: `Task "${taskPayload.objective}" executed successfully`,
            execution_time: Date.now() - startTime,
            metrics: {
                accuracy: 0.97,
                efficiency: 0.92,
                resource_utilization: 0.85
            }
        };
    }

    async sendProgressUpdate(recipient, taskId, status, percentage, notes) {
        await this.a2aClient.sendMessage(
            'Claude Code',
            recipient,
            'PROGRESS_UPDATE',
            {
                task_id: taskId,
                status,
                progress_percentage: percentage,
                notes,
                timestamp: new Date().toISOString()
            }
        );
    }

    async sendErrorResponse(originalMessage, errorMessage) {
        try {
            await this.a2aClient.sendMessage(
                'Claude Code',
                originalMessage.sender,
                'ERROR_NOTIFICATION',
                {
                    error_type: 'MESSAGE_PROCESSING_ERROR',
                    error_message: errorMessage,
                    original_message_id: originalMessage.id,
                    timestamp: new Date().toISOString()
                },
                originalMessage.context_id
            );
        } catch (error) {
            console.error('❌ Failed to send error response:', error.message);
        }
    }

    // UTILITY METHODS

    estimateCompletion(taskPayload) {
        // Simple estimation based on task complexity
        const baseTime = 300000; // 5 minutes base
        const complexity = taskPayload.complexity || 1;
        return new Date(Date.now() + (baseTime * complexity)).toISOString();
    }

    getRelevantCapabilities(taskPayload) {
        return [
            'File system operations',
            'Code analysis and generation',
            'Database operations',
            'API integrations',
            'Data processing',
            'Business analysis'
        ];
    }

    async processInformationRequest(payload) {
        return {
            answer: `Information request processed: ${payload.query}`,
            confidence: 0.95,
            sources: ['Internal Analysis', 'System State']
        };
    }

    async processStrategicQuery(payload) {
        return {
            analysis: `Strategic analysis for: ${payload.query}`,
            recommendations: ['Optimize current approach', 'Scale system capacity', 'Monitor performance'],
            business_impact: 'Positive impact on operational efficiency',
            confidence: 0.90
        };
    }

    async processProgressUpdate(payload) {
        console.log(`📊 Progress logged: ${payload.task_id} - ${payload.progress_percentage}%`);
    }

    async analyzeBlocker(payload) {
        return {
            strategy: 'Root cause analysis and systematic resolution',
            actions: ['Identify core issue', 'Implement workaround', 'Monitor resolution'],
            escalation_required: payload.impact_level === 'HIGH',
            business_impact: 'Blocker resolution will improve system reliability'
        };
    }

    async processErrorNotification(payload) {
        console.log(`❌ Error logged: ${payload.error_message} (Severity: ${payload.severity})`);
    }

    calculateBusinessImpact(result) {
        return `Task completion contributes to operational efficiency and system reliability (${result.metrics?.accuracy * 100}% accuracy)`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public methods for external control
    async getStatus() {
        return {
            isRunning: this.isRunning,
            pollingInterval: this.pollingInterval,
            processedMessageCount: this.processedMessages.size,
            lastPolledMessageId: this.lastPolledMessageId,
            timestamp: new Date().toISOString()
        };
    }

    async testCommunication() {
        console.log('🧪 Testing A2A communication...');
        
        const testMessage = await this.a2aClient.sendMessage(
            'Claude Code',
            'Gemini Prime',
            'REQUEST_FOR_INFO',
            {
                query: 'A2A communication test from Claude Code',
                test: true,
                timestamp: new Date().toISOString()
            },
            `test_${Date.now()}`
        );
        
        console.log('✅ Test message sent:', testMessage.id);
        return testMessage;
    }
}

module.exports = ClaudeCodeA2APolling;