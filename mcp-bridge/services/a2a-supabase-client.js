// Agent-to-Agent Communication Client for Supabase
// Secure, persistent messaging between Prime Agents
// Aligned with Core Entrepreneurial Framework

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

class A2ASupabaseClient {
    constructor(supabaseUrl, supabaseKey, options = {}) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and key are required for A2A communication');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false, // Server-side, no session persistence needed
                autoRefreshToken: false
            },
            global: {
                headers: {
                    'X-A2A-Client': 'true',
                    'X-System': 'Senior-Care-AI-Ecosystem'
                }
            },
            ...options
        });

        this.agentId = options.agentId || 'Unknown';
        this.table = options.tableName || 'agent_messages';
        
        console.log(`A2A Client initialized for agent: ${this.agentId}`);
    }

    /**
     * Send message from one agent to another
     * @param {string} sender - Sending agent name
     * @param {string} recipient - Receiving agent name  
     * @param {string} type - Message type (TASK_DELEGATION, PROGRESS_UPDATE, etc.)
     * @param {Object} payload - Message content
     * @param {string} contextId - Optional context linking
     * @returns {Object} Message data with ID
     */
    async sendMessage(sender, recipient, type, payload, contextId = null) {
        try {
            const messageId = this.generateMessageId();
            const timestamp = new Date().toISOString();

            const message = {
                sender,
                recipient,
                type,
                timestamp,
                context_id: contextId,
                payload,
                status: 'SENT',
                updated_at: timestamp
            };

            // Validate message structure
            this.validateMessage(message);

            const { data, error } = await this.supabase
                .from(this.table)
                .insert(message)
                .select()
                .single();

            if (error) {
                console.error('Failed to send A2A message:', error);
                throw new Error(`Message send failed: ${error.message}`);
            }

            console.log(`A2A Message sent: ${sender} → ${recipient} [${type}]`, {
                messageId,
                businessImpact: payload.business_impact || 'N/A'
            });

            return data;

        } catch (error) {
            console.error('A2A sendMessage error:', error);
            throw error;
        }
    }

    /**
     * Retrieve messages for a specific agent
     * @param {string} recipient - Agent name to get messages for
     * @param {string} lastMessageId - Get messages after this ID (pagination)
     * @param {number} limit - Maximum messages to retrieve
     * @param {string} messageType - Filter by message type
     * @returns {Array} Array of messages
     */
    async getMessages(recipient, lastMessageId = null, limit = 50, messageType = null) {
        try {
            let query = this.supabase
                .from(this.table)
                .select('*')
                .eq('recipient', recipient)
                .order('created_at', { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            if (lastMessageId) {
                // Get messages created after the last message ID's timestamp
                const { data: lastMsg } = await this.supabase
                    .from(this.table)
                    .select('created_at')
                    .eq('id', lastMessageId)
                    .single();

                if (lastMsg) {
                    query = query.gt('created_at', lastMsg.created_at);
                }
            }

            if (messageType) {
                query = query.eq('type', messageType);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to retrieve A2A messages:', error);
                throw new Error(`Message retrieval failed: ${error.message}`);
            }

            console.log(`Retrieved ${data?.length || 0} A2A messages for ${recipient}`);
            return data || [];

        } catch (error) {
            console.error('A2A getMessages error:', error);
            throw error;
        }
    }

    /**
     * Mark message as read/acknowledged
     * @param {string} messageId - Message ID to acknowledge
     * @param {string} acknowledgedBy - Agent acknowledging the message
     * @returns {Object} Updated message data
     */
    async acknowledgeMessage(messageId, acknowledgedBy) {
        try {
            const { data, error } = await this.supabase
                .from(this.table)
                .update({
                    status: 'ACKNOWLEDGED',
                    acknowledged_by: acknowledgedBy,
                    acknowledged_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .select()
                .single();

            if (error) {
                throw new Error(`Message acknowledgment failed: ${error.message}`);
            }

            console.log(`A2A Message acknowledged: ${messageId} by ${acknowledgedBy}`);
            return data;

        } catch (error) {
            console.error('A2A acknowledgeMessage error:', error);
            throw error;
        }
    }

    /**
     * Get unread messages count for an agent
     * @param {string} recipient - Agent name
     * @returns {number} Count of unread messages
     */
    async getUnreadCount(recipient) {
        try {
            const { count, error } = await this.supabase
                .from(this.table)
                .select('*', { count: 'exact', head: true })
                .eq('recipient', recipient)
                .neq('status', 'ACKNOWLEDGED');

            if (error) {
                throw new Error(`Unread count failed: ${error.message}`);
            }

            return count || 0;

        } catch (error) {
            console.error('A2A getUnreadCount error:', error);
            return 0;
        }
    }

    /**
     * Get messages by context ID (conversation threading)
     * @param {string} contextId - Context/conversation ID
     * @returns {Array} Messages in the conversation
     */
    async getMessagesByContext(contextId) {
        try {
            const { data, error } = await this.supabase
                .from(this.table)
                .select('*')
                .eq('context_id', contextId)
                .order('created_at', { ascending: true });

            if (error) {
                throw new Error(`Context messages retrieval failed: ${error.message}`);
            }

            return data || [];

        } catch (error) {
            console.error('A2A getMessagesByContext error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time message updates for an agent
     * @param {string} recipient - Agent to subscribe for
     * @param {Function} callback - Function to call on new messages
     * @returns {Object} Subscription object
     */
    subscribeToMessages(recipient, callback) {
        try {
            const subscription = this.supabase
                .channel(`a2a_messages_${recipient}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: this.table,
                    filter: `recipient=eq.${recipient}`
                }, (payload) => {
                    console.log(`A2A Real-time message received for ${recipient}:`, payload.new);
                    callback(payload.new);
                })
                .subscribe();

            console.log(`A2A Real-time subscription active for ${recipient}`);
            return subscription;

        } catch (error) {
            console.error('A2A subscription error:', error);
            throw error;
        }
    }

    /**
     * Clean up old messages (housekeeping)
     * @param {number} daysOld - Delete messages older than this many days
     * @returns {number} Count of deleted messages
     */
    async cleanupOldMessages(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const { data, error } = await this.supabase
                .from(this.table)
                .delete()
                .lt('created_at', cutoffDate.toISOString())
                .select();

            if (error) {
                throw new Error(`Message cleanup failed: ${error.message}`);
            }

            const deletedCount = data?.length || 0;
            console.log(`A2A Cleanup: Deleted ${deletedCount} messages older than ${daysOld} days`);
            return deletedCount;

        } catch (error) {
            console.error('A2A cleanup error:', error);
            return 0;
        }
    }

    /**
     * Generate unique message ID
     * @returns {string} Unique message identifier
     */
    generateMessageId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `msg_${timestamp}_${random}`;
    }

    /**
     * Validate message structure
     * @param {Object} message - Message to validate
     * @throws {Error} If message is invalid
     */
    validateMessage(message) {
        const requiredFields = ['sender', 'recipient', 'type', 'payload'];
        const validTypes = [
            'TASK_DELEGATION',
            'TASK_ACCEPTED',
            'PROGRESS_UPDATE',
            'TASK_COMPLETED',
            'TASK_DELIVERABLES',
            'BLOCKER_REPORT',
            'REQUEST_FOR_INFO',
            'STRATEGIC_QUERY',
            'BUSINESS_IMPACT_REPORT',
            'ERROR_NOTIFICATION',
            'ERROR_RESPONSE',
            'STATUS_RESPONSE',
            'EMERGENCY_ACKNOWLEDGED',
            'TASK_FAILED',
            'USAGE_LIMIT_WARNING',
            'API_QUOTA_EXCEEDED'
        ];
                const validAgents = [
            'Claude Code', 
            'Gemini Prime', 
            'GitHub Copilot', 
            'User', 
            'All', 
            'Chief Orchestrator (Gemini)', 
            'ai-ml-specialist', 
            'mobile-product-head',
            'senior-care-boss',
            'operations-excellence',
            'market-intelligence', 
            'product-innovation',
            'partnership-development',
            'compliance-quality',
            'finance-strategy'
        ];

        for (const field of requiredFields) {
            if (!message[field]) {
                throw new Error(`Required field missing: ${field}`);
            }
        }

        if (!validTypes.includes(message.type)) {
            throw new Error(`Invalid message type: ${message.type}`);
        }

        if (!validAgents.includes(message.sender) || !validAgents.includes(message.recipient)) {
            throw new Error(`Invalid agent name in sender/recipient`);
        }

        if (!message.payload || typeof message.payload !== 'object') {
            throw new Error('Message payload must be a non-empty object');
        }
    }

    /**
     * Get client health status
     * @returns {Object} Health check information
     */
    async healthCheck() {
        try {
            // Test basic connectivity
            const { data, error } = await this.supabase
                .from(this.table)
                .select('id')
                .limit(1);

            if (error) {
                return {
                    status: 'UNHEALTHY',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }

            return {
                status: 'HEALTHY',
                agentId: this.agentId,
                table: this.table,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                status: 'UNHEALTHY',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = A2ASupabaseClient;