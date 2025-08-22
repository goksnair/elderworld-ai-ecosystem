// Claude Code A2A Integration
// Enables Claude Code to send TASK_DELEGATION and receive PROGRESS_UPDATE messages
// Aligned with Core Entrepreneurial Framework

const A2ASupabaseClient = require('./a2a-supabase-client');
const path = require('path');

class ClaudeCodeA2AIntegration {
    constructor(options = {}) {
        // Load environment configuration
        const envPath = path.join(__dirname, '../../.env');
        require('dotenv').config({ path: envPath });

        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        this.agentId = 'Claude Code';
        
        if (!this.supabaseUrl || !this.supabaseKey) {
            throw new Error('Supabase configuration required for A2A integration');
        }

        // Initialize A2A client
        this.a2aClient = new A2ASupabaseClient(this.supabaseUrl, this.supabaseKey, {
            agentId: this.agentId,
            tableName: 'agent_messages'
        });

        // Configuration
        this.pollingInterval = options.pollingInterval || 30000; // 30 seconds
        this.isPolling = false;
        this.pollingTimer = null;
        this.messageHandlers = new Map();

        // Bind context
        this.sendTaskDelegation = this.sendTaskDelegation.bind(this);
        this.startMessagePolling = this.startMessagePolling.bind(this);
        this.stopMessagePolling = this.stopMessagePolling.bind(this);

        console.log(`🤖 Claude Code A2A Integration initialized`);
    }

    /**
     * Send task delegation message to another agent
     * @param {Object} taskData - Task delegation information
     * @returns {Object} Message data
     */
    async sendTaskDelegation(taskData) {
        try {
            const {
                recipient = 'Gemini Prime', // Default to Gemini Prime
                taskId,
                objective,
                description,
                businessImpact,
                expectedOutputFormat = 'Structured response',
                priority = 'NORMAL',
                deadline = null,
                contextId = null
            } = taskData;

            // Validate required fields
            if (!taskId || !objective || !description) {
                throw new Error('Task delegation requires: taskId, objective, description');
            }

            // Generate context ID if not provided
            const delegationContextId = contextId || `task_${taskId}_${Date.now()}`;

            const payload = {
                task_id: taskId,
                objective,
                description,
                business_impact: businessImpact || 'Contributes to ₹500Cr revenue strategy',
                expected_output_format: expectedOutputFormat,
                priority,
                deadline,
                delegated_by: this.agentId,
                delegated_at: new Date().toISOString(),
                entrepreneurial_context: 'Customer acquisition and revenue generation focus'
            };

            const message = await this.a2aClient.sendMessage(
                this.agentId,
                recipient,
                'TASK_DELEGATION',
                payload,
                delegationContextId
            );

            console.log(`📤 Task delegated to ${recipient}:`, {
                taskId,
                objective: objective.substring(0, 50) + '...',
                businessImpact: businessImpact?.substring(0, 30) + '...'
            });

            return {
                success: true,
                message,
                contextId: delegationContextId,
                recipient
            };

        } catch (error) {
            console.error('❌ Task delegation failed:', error.message);
            throw error;
        }
    }

    /**
     * Send strategic query to another agent
     * @param {Object} queryData - Query information
     * @returns {Object} Message data
     */
    async sendStrategicQuery(queryData) {
        try {
            const {
                recipient = 'Gemini Prime',
                queryId,
                question,
                context,
                urgency = 'NORMAL',
                expectedResponse = 'Analysis and recommendations'
            } = queryData;

            if (!queryId || !question) {
                throw new Error('Strategic query requires: queryId, question');
            }

            const payload = {
                query_id: queryId,
                question,
                context: context || 'Senior care AI ecosystem development',
                urgency,
                expected_response: expectedResponse,
                business_relevance: 'Strategic decision support for market leadership'
            };

            const message = await this.a2aClient.sendMessage(
                this.agentId,
                recipient,
                'STRATEGIC_QUERY',
                payload
            );

            console.log(`🤔 Strategic query sent to ${recipient}: ${question.substring(0, 50)}...`);
            return { success: true, message };

        } catch (error) {
            console.error('❌ Strategic query failed:', error.message);
            throw error;
        }
    }

    /**
     * Send business impact report
     * @param {Object} reportData - Report information
     * @returns {Object} Message data  
     */
    async sendBusinessImpactReport(reportData) {
        try {
            const {
                recipient = 'Gemini Prime',
                reportId,
                achievement,
                metrics,
                nextSteps,
                blockers = []
            } = reportData;

            const payload = {
                report_id: reportId || `report_${Date.now()}`,
                achievement,
                key_metrics: metrics || {},
                next_steps: nextSteps || [],
                current_blockers: blockers,
                revenue_impact: metrics?.revenue_impact || 'TBD',
                customer_impact: metrics?.customer_impact || 'TBD'
            };

            const message = await this.a2aClient.sendMessage(
                this.agentId,
                recipient,
                'BUSINESS_IMPACT_REPORT',
                payload
            );

            console.log(`📊 Business impact report sent to ${recipient}`);
            return { success: true, message };

        } catch (error) {
            console.error('❌ Business impact report failed:', error.message);
            throw error;
        }
    }

    /**
     * Start polling for incoming messages
     * @param {Object} handlers - Message type handlers
     */
    async startMessagePolling(handlers = {}) {
        if (this.isPolling) {
            console.log('⚠️  Message polling already active');
            return;
        }

        // Set up message handlers
        this.messageHandlers.set('PROGRESS_UPDATE', handlers.onProgressUpdate || this.handleProgressUpdate);
        this.messageHandlers.set('TASK_ACCEPTED', handlers.onTaskAccepted || this.handleTaskAccepted);
        this.messageHandlers.set('TASK_COMPLETED', handlers.onTaskCompleted || this.handleTaskCompleted);
        this.messageHandlers.set('BLOCKER_REPORT', handlers.onBlockerReport || this.handleBlockerReport);
        this.messageHandlers.set('REQUEST_FOR_INFO', handlers.onInfoRequest || this.handleInfoRequest);

        this.isPolling = true;
        this.lastMessageId = null;

        console.log(`📥 Starting message polling (${this.pollingInterval / 1000}s intervals)...`);
        
        // Start polling loop
        this.pollingTimer = setInterval(async () => {
            await this.pollForMessages();
        }, this.pollingInterval);

        // Do initial poll
        await this.pollForMessages();
    }

    /**
     * Stop message polling
     */
    stopMessagePolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
        
        this.isPolling = false;
        console.log('📥 Message polling stopped');
    }

    /**
     * Poll for new messages and process them
     */
    async pollForMessages() {
        try {
            // Get new messages for Claude Code
            const messages = await this.a2aClient.getMessages(
                this.agentId,
                this.lastMessageId,
                50 // Limit to 50 messages per poll
            );

            if (messages.length > 0) {
                console.log(`📬 Received ${messages.length} new messages`);
                
                // Process each message
                for (const message of messages) {
                    await this.processMessage(message);
                    this.lastMessageId = message.id; // Update last processed
                }
            }

        } catch (error) {
            console.error('❌ Message polling error:', error.message);
        }
    }

    /**
     * Process individual message based on type
     * @param {Object} message - Message to process
     */
    async processMessage(message) {
        try {
            const handler = this.messageHandlers.get(message.type);
            
            if (handler) {
                await handler.call(this, message);
                
                // Acknowledge the message
                await this.a2aClient.acknowledgeMessage(message.id, this.agentId);
                
            } else {
                console.log(`⚠️  No handler for message type: ${message.type}`);
            }

        } catch (error) {
            console.error(`❌ Error processing message ${message.id}:`, error.message);
        }
    }

    /**
     * Default handler for progress updates
     * @param {Object} message - Progress update message
     */
    async handleProgressUpdate(message) {
        const { sender, payload } = message;
        const { task_id, status, progress_percentage, description } = payload;

        console.log(`📈 Progress Update from ${sender}:`, {
            taskId: task_id,
            status,
            progress: `${progress_percentage}%`,
            description: description?.substring(0, 50) + '...'
        });

        // Log for business tracking
        this.logBusinessMetric('task_progress', {
            task_id,
            agent: sender,
            progress_percentage,
            status
        });
    }

    /**
     * Default handler for task acceptance
     * @param {Object} message - Task acceptance message
     */
    async handleTaskAccepted(message) {
        const { sender, payload } = message;
        const { task_id, estimated_completion, status } = payload;

        console.log(`✅ Task Accepted by ${sender}:`, {
            taskId: task_id,
            status,
            estimatedCompletion: estimated_completion
        });

        this.logBusinessMetric('task_accepted', {
            task_id,
            agent: sender,
            estimated_completion
        });
    }

    /**
     * Default handler for task completion
     * @param {Object} message - Task completion message
     */
    async handleTaskCompleted(message) {
        const { sender, payload } = message;
        const { task_id, deliverables, business_metrics } = payload;

        console.log(`🎉 Task Completed by ${sender}:`, {
            taskId: task_id,
            deliverables: deliverables?.length || 0,
            businessMetrics: business_metrics
        });

        this.logBusinessMetric('task_completed', {
            task_id,
            agent: sender,
            deliverables_count: deliverables?.length || 0,
            business_metrics
        });
    }

    /**
     * Default handler for blocker reports
     * @param {Object} message - Blocker report message
     */
    async handleBlockerReport(message) {
        const { sender, payload } = message;
        const { task_id, error_details, business_impact, urgency } = payload;

        console.log(`🚧 Blocker Reported by ${sender}:`, {
            taskId: task_id,
            urgency: urgency || 'NORMAL',
            businessImpact: business_impact?.substring(0, 50) + '...'
        });

        // Escalate high-urgency blockers
        if (urgency === 'HIGH' || urgency === 'CRITICAL') {
            console.log('🚨 HIGH PRIORITY BLOCKER - Consider escalation');
        }

        this.logBusinessMetric('task_blocked', {
            task_id,
            agent: sender,
            urgency: urgency || 'NORMAL',
            business_impact
        });
    }

    /**
     * Default handler for information requests
     * @param {Object} message - Information request message
     */
    async handleInfoRequest(message) {
        const { sender, payload } = message;
        const { request_id, question, urgency } = payload;

        console.log(`❓ Info Request from ${sender}:`, {
            requestId: request_id,
            question: question?.substring(0, 50) + '...',
            urgency: urgency || 'NORMAL'
        });

        // Auto-respond to common questions (can be extended)
        if (question?.toLowerCase().includes('status') || question?.toLowerCase().includes('progress')) {
            await this.sendBusinessImpactReport({
                recipient: sender,
                reportId: `auto_response_${request_id}`,
                achievement: 'Automated status response',
                metrics: {
                    system_status: 'Operational',
                    response_type: 'Automated'
                }
            });
        }
    }

    /**
     * Log business metrics for tracking
     * @param {string} eventType - Type of business event
     * @param {Object} data - Event data
     */
    logBusinessMetric(eventType, data) {
        // In production, this would send to analytics/monitoring system
        console.log(`📊 Business Metric [${eventType}]:`, {
            timestamp: new Date().toISOString(),
            ...data
        });
    }

    /**
     * Get system status including message counts
     * @returns {Object} System status information
     */
    async getSystemStatus() {
        try {
            const unreadCount = await this.a2aClient.getUnreadCount(this.agentId);
            const health = await this.a2aClient.healthCheck();

            return {
                agent_id: this.agentId,
                health_status: health.status,
                unread_messages: unreadCount,
                polling_active: this.isPolling,
                polling_interval: this.pollingInterval,
                last_message_id: this.lastMessageId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                agent_id: this.agentId,
                health_status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🔄 Shutting down Claude Code A2A Integration...');
        this.stopMessagePolling();
        console.log('✅ A2A Integration shutdown complete');
    }
}

module.exports = ClaudeCodeA2AIntegration;