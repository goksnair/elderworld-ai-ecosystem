/**
 * Agent-to-Agent Communication Layer
 * Implements standardized messaging protocols for inter-agent communication
 * Supports multiple message types and delivery patterns
 */

const EventEmitter = require('events');
const crypto = require('crypto');
// Using built-in Node.js fetch (v18+)

class A2ACommunicationLayer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.logger = options.logger || console;
        this.storage = options.storage || new Map(); // In-memory storage by default
        this.maxMessageAge = options.maxMessageAge || 24 * 60 * 60 * 1000; // 24 hours
        this.maxMessagesPerAgent = options.maxMessagesPerAgent || 1000;
        
        // Message delivery confirmation tracking
        this.deliveryConfirmations = new Map();
        this.confirmationTimeout = options.confirmationTimeout || 30000; // 30 seconds
        
        // Agent registry
        this.registeredAgents = new Map();
        
        // Message queue cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanupOldMessages(), 5 * 60 * 1000); // 5 minutes
        
        this.logger.info('A2A Communication Layer initialized');
    }

    /**
     * Define message types and their schemas
     */
    getMessageTypes() {
        return {
            // Task management messages
            TASK_DELEGATION: {
                description: 'Delegate a task to another agent',
                required: ['taskId', 'description', 'priority', 'deadline'],
                optional: ['context', 'dependencies', 'expectedOutput']
            },
            TASK_ACCEPTED: {
                description: 'Confirm acceptance of a delegated task',
                required: ['taskId', 'estimatedCompletion'],
                optional: ['requirements', 'questions']
            },
            TASK_REJECTED: {
                description: 'Reject a delegated task with reason',
                required: ['taskId', 'reason'],
                optional: ['suggestions', 'alternatives']
            },
            TASK_COMPLETED: {
                description: 'Report task completion',
                required: ['taskId', 'result', 'completedAt'],
                optional: ['outputFiles', 'metrics', 'notes']
            },
            
            // Progress and status messages
            PROGRESS_UPDATE: {
                description: 'Update on task progress',
                required: ['taskId', 'progress', 'status'],
                optional: ['details', 'blockers', 'nextSteps']
            },
            STATUS_REQUEST: {
                description: 'Request status from another agent',
                required: ['requestType'],
                optional: ['context', 'urgency']
            },
            STATUS_RESPONSE: {
                description: 'Respond to status request',
                required: ['status', 'currentTasks'],
                optional: ['availability', 'capacity', 'metrics']
            },
            
            // Blocking and error messages
            BLOCKER_REPORT: {
                description: 'Report a blocking issue',
                required: ['blockerId', 'description', 'severity'],
                optional: ['taskId', 'suggestedAction', 'impact']
            },
            BLOCKER_RESOLVED: {
                description: 'Report resolution of a blocker',
                required: ['blockerId', 'resolution'],
                optional: ['taskId', 'resolutionTime']
            },
            ERROR_REPORT: {
                description: 'Report an error or failure',
                required: ['errorId', 'message', 'severity'],
                optional: ['stack', 'context', 'suggestedFix']
            },
            
            // Information and collaboration messages
            REQUEST_FOR_INFO: {
                description: 'Request specific information from another agent',
                required: ['infoType', 'details'],
                optional: ['urgency', 'context', 'format']
            },
            INFO_RESPONSE: {
                description: 'Provide requested information',
                required: ['requestId', 'data'],
                optional: ['format', 'confidence', 'sources']
            },
            COLLABORATION_INVITE: {
                description: 'Invite another agent to collaborate on a task',
                required: ['taskId', 'role', 'description'],
                optional: ['requirements', 'timeline', 'benefits']
            },
            
            // Resource and coordination messages
            RESOURCE_REQUEST: {
                description: 'Request access to shared resources',
                required: ['resourceId', 'requestType', 'duration'],
                optional: ['priority', 'justification']
            },
            RESOURCE_GRANTED: {
                description: 'Grant access to requested resource',
                required: ['resourceId', 'grantedUntil'],
                optional: ['conditions', 'limitations']
            },
            RESOURCE_DENIED: {
                description: 'Deny access to requested resource',
                required: ['resourceId', 'reason'],
                optional: ['alternatives', 'whenAvailable']
            },
            
            // Broadcast messages
            ANNOUNCEMENT: {
                description: 'General announcement to multiple agents',
                required: ['title', 'message'],
                optional: ['priority', 'category', 'actionRequired']
            },
            ALERT: {
                description: 'High-priority alert requiring immediate attention',
                required: ['alertId', 'message', 'severity'],
                optional: ['category', 'actionRequired', 'deadline']
            }
        };
    }

    /**
     * Register an agent in the communication layer
     */
    registerAgent(agentId, endpoint) {
        const registration = {
            agentId,
            endpoint,
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            status: 'active',
        };

        this.registeredAgents.set(agentId, registration);
        this.logger.info(`Agent registered: ${agentId}`, { endpoint });
        
        // Initialize message queue for the agent
        if (!this.storage.has(agentId)) {
            this.storage.set(agentId, []);
        }

        this.emit('agentRegistered', registration);
        return { success: true, ...registration };
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId) {
        const agent = this.registeredAgents.get(agentId);
        if (agent) {
            this.registeredAgents.delete(agentId);
            this.logger.info(`Agent unregistered: ${agentId}`);
            this.emit('agentUnregistered', { agentId, ...agent });
        }
    }

    /**
     * Update agent status
     */
    updateAgentStatus(agentId, status, metadata = {}) {
        const agent = this.registeredAgents.get(agentId);
        if (agent) {
            agent.status = status;
            agent.lastSeen = new Date().toISOString();
            Object.assign(agent, metadata);
            
            this.registeredAgents.set(agentId, agent);
            this.emit('agentStatusUpdated', agent);
        }
    }

    /**
     * Validate message against schema
     */
    validateMessage(type, payload) {
        const messageTypes = this.getMessageTypes();
        const schema = messageTypes[type];
        
        if (!schema) {
            return { valid: false, error: `Unknown message type: ${type}` };
        }

        // Check required fields
        for (const field of schema.required) {
            if (!(field in payload)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }

        // Check for unknown fields
        const allowedFields = [...schema.required, ...(schema.optional || [])];
        for (const field of Object.keys(payload)) {
            if (!allowedFields.includes(field)) {
                return { valid: false, error: `Unknown field: ${field}` };
            }
        }

        return { valid: true };
    }

    /**
     * Create a standardized message
     */
    createMessage(from, to, type, payload, options = {}) {
        const messageId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        // Validate payload
        const validation = this.validateMessage(type, payload);
        if (!validation.valid) {
            throw new Error(`Message validation failed: ${validation.error}`);
        }

        const message = {
            id: messageId,
            from,
            to,
            type,
            payload,
            timestamp,
            priority: options.priority || 'normal',
            requiresConfirmation: options.requiresConfirmation || false,
            expiresAt: options.expiresAt || new Date(Date.now() + this.maxMessageAge).toISOString(),
            retryCount: 0,
            metadata: options.metadata || {}
        };

        return message;
    }

    /**
     * Send a message to another agent
     */
    async sendMessage(from, to, type, payload, options = {}) {
        try {
            const recipient = this.registeredAgents.get(to);
            if (!recipient || !recipient.endpoint) {
                throw new Error(`Recipient agent not registered or has no endpoint: ${to}`);
            }

            const message = this.createMessage(from, to, type, payload, options);
            
            const response = await fetch(recipient.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error(`Agent ${to} responded with status ${response.status}`);
            }

            this.logger.info(`Message sent: ${type}`, {
                messageId: message.id,
                from,
                to,
                priority: message.priority
            });

            this.emit('messageSent', message);
            return { success: true, messageId: message.id };
        } catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`, {
                from,
                to,
                type,
                error: error.message
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Store message in agent's queue
     */
    storeMessage(agentId, message) {
        if (!this.storage.has(agentId)) {
            this.storage.set(agentId, []);
        }

        const messages = this.storage.get(agentId);
        messages.push(message);

        // Enforce message limit per agent
        if (messages.length > this.maxMessagesPerAgent) {
            messages.shift(); // Remove oldest message
        }

        this.storage.set(agentId, messages);
    }

    /**
     * Get messages for an agent
     */
    async getMessages(agentId, options = {}) {
        try {
            // Update agent last seen
            this.updateAgentStatus(agentId, 'active');

            if (!this.storage.has(agentId)) {
                return [];
            }

            let messages = this.storage.get(agentId) || [];

            // Filter by options
            if (options.type) {
                messages = messages.filter(msg => msg.type === options.type);
            }

            if (options.from) {
                messages = messages.filter(msg => msg.from === options.from);
            }

            if (options.priority) {
                messages = messages.filter(msg => msg.priority === options.priority);
            }

            if (options.since) {
                const sinceDate = new Date(options.since);
                messages = messages.filter(msg => new Date(msg.timestamp) > sinceDate);
            }

            // Sort by timestamp (newest first)
            messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Apply limit
            if (options.limit) {
                messages = messages.slice(0, options.limit);
            }

            // Mark messages as read if requested
            if (options.markAsRead) {
                messages.forEach(msg => msg.readAt = new Date().toISOString());
            }

            return messages;
        } catch (error) {
            this.logger.error(`Failed to get messages for ${agentId}:`, error);
            return [];
        }
    }

    /**
     * Acknowledge message receipt
     */
    async acknowledgeMessage(agentId, messageId) {
        try {
            const messages = this.storage.get(agentId) || [];
            const message = messages.find(msg => msg.id === messageId);
            
            if (message) {
                message.acknowledgedAt = new Date().toISOString();
                
                // Send delivery confirmation if required
                if (message.requiresConfirmation) {
                    await this.sendDeliveryConfirmation(message.id, message.from, agentId);
                }
                
                this.emit('messageAcknowledged', { agentId, messageId });
                return { success: true };
            }
            
            return { success: false, error: 'Message not found' };
        } catch (error) {
            this.logger.error(`Failed to acknowledge message:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove message from queue
     */
    async removeMessage(agentId, messageId) {
        try {
            if (!this.storage.has(agentId)) {
                return { success: false, error: 'Agent not found' };
            }

            const messages = this.storage.get(agentId);
            const messageIndex = messages.findIndex(msg => msg.id === messageId);
            
            if (messageIndex >= 0) {
                messages.splice(messageIndex, 1);
                this.storage.set(agentId, messages);
                
                this.emit('messageRemoved', { agentId, messageId });
                return { success: true };
            }
            
            return { success: false, error: 'Message not found' };
        } catch (error) {
            this.logger.error(`Failed to remove message:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Broadcast message to multiple agents
     */
    async broadcast(from, type, payload, targets = [], options = {}) {
        try {
            const results = [];

            // If no targets specified, broadcast to all registered agents
            if (targets.length === 0) {
                targets = Array.from(this.registeredAgents.keys()).filter(id => id !== from);
            }

            // Filter targets based on criteria if provided
            if (options.capabilities) {
                targets = targets.filter(agentId => {
                    const agent = this.registeredAgents.get(agentId);
                    return agent && options.capabilities.some(cap => 
                        agent.capabilities.includes(cap)
                    );
                });
            }

            if (options.status) {
                targets = targets.filter(agentId => {
                    const agent = this.registeredAgents.get(agentId);
                    return agent && agent.status === options.status;
                });
            }

            // Send message to each target
            for (const target of targets) {
                const result = await this.sendMessage(from, target, type, payload, {
                    ...options,
                    metadata: { ...options.metadata, broadcast: true }
                });
                results.push({ target, ...result });
            }

            this.logger.info(`Broadcast sent: ${type}`, {
                from,
                targets: targets.length,
                successful: results.filter(r => r.success).length
            });

            return {
                success: true,
                results,
                totalTargets: targets.length,
                successful: results.filter(r => r.success).length
            };
        } catch (error) {
            this.logger.error(`Broadcast failed:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Setup delivery confirmation tracking
     */
    setupDeliveryConfirmation(messageId, from, to) {
        const timeout = setTimeout(() => {
            this.deliveryConfirmations.delete(messageId);
            this.emit('deliveryTimeout', { messageId, from, to });
            
            this.logger.warn(`Message delivery confirmation timeout`, {
                messageId,
                from,
                to
            });
        }, this.confirmationTimeout);

        this.deliveryConfirmations.set(messageId, {
            messageId,
            from,
            to,
            timeout,
            createdAt: new Date().toISOString()
        });
    }

    /**
     * Send delivery confirmation
     */
    async sendDeliveryConfirmation(messageId, to, from) {
        const confirmation = this.deliveryConfirmations.get(messageId);
        if (confirmation) {
            clearTimeout(confirmation.timeout);
            this.deliveryConfirmations.delete(messageId);
            
            this.emit('deliveryConfirmed', { messageId, from, to });
            this.logger.debug(`Message delivery confirmed`, { messageId, from, to });
        }
    }

    /**
     * Clean up old messages and confirmations
     */
    cleanupOldMessages() {
        const now = Date.now();
        let totalCleaned = 0;

        // Clean up expired messages
        for (const [agentId, messages] of this.storage.entries()) {
            const validMessages = messages.filter(msg => {
                const expiresAt = new Date(msg.expiresAt).getTime();
                return expiresAt > now;
            });

            if (validMessages.length !== messages.length) {
                this.storage.set(agentId, validMessages);
                totalCleaned += messages.length - validMessages.length;
            }
        }

        // Clean up expired delivery confirmations
        for (const [messageId, confirmation] of this.deliveryConfirmations.entries()) {
            const createdAt = new Date(confirmation.createdAt).getTime();
            if (now - createdAt > this.confirmationTimeout) {
                clearTimeout(confirmation.timeout);
                this.deliveryConfirmations.delete(messageId);
            }
        }

        if (totalCleaned > 0) {
            this.logger.debug(`Cleaned up ${totalCleaned} expired messages`);
        }
    }

    /**
     * Get communication layer statistics
     */
    getStats() {
        const stats = {
            registeredAgents: this.registeredAgents.size,
            totalMessages: 0,
            messagesByType: {},
            messagesByPriority: {},
            pendingConfirmations: this.deliveryConfirmations.size
        };

        // Count messages by type and priority
        for (const [agentId, messages] of this.storage.entries()) {
            stats.totalMessages += messages.length;
            
            for (const message of messages) {
                stats.messagesByType[message.type] = (stats.messagesByType[message.type] || 0) + 1;
                stats.messagesByPriority[message.priority] = (stats.messagesByPriority[message.priority] || 0) + 1;
            }
        }

        return stats;
    }

    /**
     * Get communication layer status
     */
    getStatus() {
        return {
            status: 'active',
            agents: Array.from(this.registeredAgents.values()),
            stats: this.getStats(),
            messageTypes: Object.keys(this.getMessageTypes()),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const stats = this.getStats();
            const testAgentId = 'health-check-agent';
            
            // Register test agent
            this.registerAgent(testAgentId, { test: true });
            
            // Send test message
            const testResult = await this.sendMessage(
                testAgentId,
                testAgentId,
                'STATUS_REQUEST',
                { requestType: 'health-check' }
            );

            // Get test messages
            const messages = await this.getMessages(testAgentId);
            
            // Clean up test agent
            this.unregisterAgent(testAgentId);
            this.storage.delete(testAgentId);

            return {
                success: true,
                data: {
                    ...stats,
                    testResult,
                    testMessagesReceived: messages.length,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Clear all timeouts
        for (const [messageId, confirmation] of this.deliveryConfirmations.entries()) {
            clearTimeout(confirmation.timeout);
        }

        this.deliveryConfirmations.clear();
        this.storage.clear();
        this.registeredAgents.clear();
        this.removeAllListeners();

        this.logger.info('A2A Communication Layer destroyed');
    }
}

module.exports = A2ACommunicationLayer;