// ENHANCED A2A CLIENT WITH COMPREHENSIVE DEBUG LOGGING
// Specifically designed to help debug Gemini Prime communication issues
// Includes extensive logging, error handling, and validation

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

class EnhancedA2AClientDebug {
    constructor(supabaseUrl, supabaseKey, options = {}) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and key are required for A2A communication');
        }

        this.debug = options.debug || false;
        this.agentId = options.agentId || 'Unknown';
        this.table = options.tableName || 'agent_messages';

        this.debugLog('🔧 Initializing Enhanced A2A Client with debug logging');
        this.debugLog(`   Agent ID: ${this.agentId}`);
        this.debugLog(`   Table: ${this.table}`);
        this.debugLog(`   Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
        this.debugLog(`   Service Key Length: ${supabaseKey.length} characters`);

        try {
            this.supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                },
                global: {
                    headers: {
                        'X-A2A-Client': 'enhanced-debug',
                        'X-System': 'Senior-Care-AI-Ecosystem',
                        'X-Agent-ID': this.agentId
                    }
                },
                ...options
            });

            this.debugLog('✅ Supabase client created successfully');
            console.log(`🤖 Enhanced A2A Client initialized for agent: ${this.agentId}`);

        } catch (error) {
            this.debugLog(`❌ Supabase client creation failed: ${error.message}`);
            throw new Error(`Enhanced A2A Client initialization failed: ${error.message}`);
        }
    }

    debugLog(message) {
        if (this.debug) {
            console.log(`[A2A-DEBUG] ${message}`);
        }
    }

    async sendMessage(sender, recipient, type, payload, contextId = null) {
        this.debugLog(`📤 sendMessage called:`);
        this.debugLog(`   Sender: ${sender}`);
        this.debugLog(`   Recipient: ${recipient}`);
        this.debugLog(`   Type: ${type}`);
        this.debugLog(`   Context ID: ${contextId}`);
        this.debugLog(`   Payload keys: ${Object.keys(payload).join(', ')}`);

        try {
            // Generate message ID for logging (not used in DB)
            const messageId = this.generateMessageId();
            const timestamp = new Date().toISOString();

            this.debugLog(`   Generated message ID: ${messageId}`);
            this.debugLog(`   Timestamp: ${timestamp}`);

            // Prepare message object
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

            this.debugLog('📋 Message object prepared:');
            this.debugLog(JSON.stringify(message, null, 2));

            // Validate message structure
            this.debugLog('🔍 Validating message structure...');
            this.validateMessage(message);
            this.debugLog('✅ Message validation passed');

            // Attempt database insertion
            this.debugLog(`🗄️ Attempting insertion into table: ${this.table}`);
            
            const insertStart = Date.now();
            const { data, error } = await this.supabase
                .from(this.table)
                .insert(message)
                .select()
                .single();

            const insertDuration = Date.now() - insertStart;
            this.debugLog(`⏱️ Insert operation took ${insertDuration}ms`);

            if (error) {
                this.debugLog(`❌ Database insertion failed:`);
                this.debugLog(`   Error message: ${error.message}`);
                this.debugLog(`   Error code: ${error.code || 'N/A'}`);
                this.debugLog(`   Error details: ${error.details || 'N/A'}`);
                this.debugLog(`   Error hint: ${error.hint || 'N/A'}`);
                
                console.error('🚨 Failed to send A2A message:', error);
                throw new Error(`Message send failed: ${error.message} (Code: ${error.code || 'Unknown'})`);
            }

            this.debugLog(`✅ Database insertion successful:`);
            this.debugLog(`   Database ID: ${data.id}`);
            this.debugLog(`   Database created_at: ${data.created_at}`);
            this.debugLog(`   Database status: ${data.status}`);

            console.log(`📨 A2A Message sent: ${sender} → ${recipient} [${type}]`, {
                messageId: messageId,
                databaseId: data.id,
                businessImpact: payload.business_impact || 'N/A',
                insertDuration: `${insertDuration}ms`
            });

            return data;

        } catch (error) {
            this.debugLog(`❌ sendMessage error: ${error.message}`);
            this.debugLog(`   Error stack: ${error.stack}`);
            
            console.error('🚨 A2A sendMessage error:', error);
            throw error;
        }
    }

    async getMessages(recipient, lastMessageId = null, limit = 50, messageType = null) {
        this.debugLog(`📥 getMessages called:`);
        this.debugLog(`   Recipient: ${recipient}`);
        this.debugLog(`   Last Message ID: ${lastMessageId}`);
        this.debugLog(`   Limit: ${limit}`);
        this.debugLog(`   Message Type: ${messageType}`);

        try {
            let query = this.supabase
                .from(this.table)
                .select('*')
                .eq('recipient', recipient)
                .order('created_at', { ascending: false });

            if (limit) {
                query = query.limit(limit);
                this.debugLog(`   Applied limit: ${limit}`);
            }

            if (lastMessageId) {
                this.debugLog(`   Looking up timestamp for last message ID: ${lastMessageId}`);
                const { data: lastMsg } = await this.supabase
                    .from(this.table)
                    .select('created_at')
                    .eq('id', lastMessageId)
                    .single();

                if (lastMsg) {
                    query = query.gt('created_at', lastMsg.created_at);
                    this.debugLog(`   Applied timestamp filter: > ${lastMsg.created_at}`);
                } else {
                    this.debugLog(`   ⚠️ Last message ID not found: ${lastMessageId}`);
                }
            }

            if (messageType) {
                query = query.eq('type', messageType);
                this.debugLog(`   Applied message type filter: ${messageType}`);
            }

            const queryStart = Date.now();
            const { data, error } = await query;
            const queryDuration = Date.now() - queryStart;

            this.debugLog(`⏱️ Query operation took ${queryDuration}ms`);

            if (error) {
                this.debugLog(`❌ Message retrieval failed: ${error.message}`);
                console.error('🚨 Failed to retrieve A2A messages:', error);
                throw new Error(`Message retrieval failed: ${error.message}`);
            }

            const messageCount = data?.length || 0;
            this.debugLog(`✅ Retrieved ${messageCount} messages`);

            console.log(`📬 Retrieved ${messageCount} A2A messages for ${recipient}`);
            
            if (this.debug && messageCount > 0) {
                this.debugLog('📋 First few messages:');
                data.slice(0, 3).forEach((msg, index) => {
                    this.debugLog(`   ${index + 1}. ${msg.id} (${msg.sender} → ${msg.recipient}) [${msg.type}]`);
                });
            }

            return data || [];

        } catch (error) {
            this.debugLog(`❌ getMessages error: ${error.message}`);
            console.error('🚨 A2A getMessages error:', error);
            throw error;
        }
    }

    async acknowledgeMessage(messageId, acknowledgedBy) {
        this.debugLog(`✅ acknowledgeMessage called:`);
        this.debugLog(`   Message ID: ${messageId}`);
        this.debugLog(`   Acknowledged By: ${acknowledgedBy}`);

        try {
            const updateStart = Date.now();
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

            const updateDuration = Date.now() - updateStart;
            this.debugLog(`⏱️ Update operation took ${updateDuration}ms`);

            if (error) {
                this.debugLog(`❌ Message acknowledgment failed: ${error.message}`);
                throw new Error(`Message acknowledgment failed: ${error.message}`);
            }

            this.debugLog(`✅ Message acknowledged successfully`);
            console.log(`✅ A2A Message acknowledged: ${messageId} by ${acknowledgedBy}`);
            
            return data;

        } catch (error) {
            this.debugLog(`❌ acknowledgeMessage error: ${error.message}`);
            console.error('🚨 A2A acknowledgeMessage error:', error);
            throw error;
        }
    }

    generateMessageId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `msg_${timestamp}_${random}`;
    }

    validateMessage(message) {
        this.debugLog('🔍 Starting message validation...');

        const requiredFields = ['sender', 'recipient', 'type', 'payload'];
        const validTypes = [
            'TASK_DELEGATION',
            'TASK_ACCEPTED', 
            'PROGRESS_UPDATE',
            'TASK_COMPLETED',
            'BLOCKER_REPORT',
            'REQUEST_FOR_INFO',
            'STRATEGIC_QUERY',
            'BUSINESS_IMPACT_REPORT',
            'ERROR_NOTIFICATION'
        ];
        const validAgents = ['Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All'];

        // Check required fields
        for (const field of requiredFields) {
            if (!message[field]) {
                this.debugLog(`❌ Validation failed: Missing field ${field}`);
                throw new Error(`Required field missing: ${field}`);
            }
            this.debugLog(`✅ Field present: ${field}`);
        }

        // Check message type
        if (!validTypes.includes(message.type)) {
            this.debugLog(`❌ Validation failed: Invalid message type ${message.type}`);
            this.debugLog(`   Valid types: ${validTypes.join(', ')}`);
            throw new Error(`Invalid message type: ${message.type}`);
        }
        this.debugLog(`✅ Message type valid: ${message.type}`);

        // Check agent names
        if (!validAgents.includes(message.sender)) {
            this.debugLog(`❌ Validation failed: Invalid sender ${message.sender}`);
            this.debugLog(`   Valid agents: ${validAgents.join(', ')}`);
            throw new Error(`Invalid sender: ${message.sender}`);
        }
        this.debugLog(`✅ Sender valid: ${message.sender}`);

        if (!validAgents.includes(message.recipient)) {
            this.debugLog(`❌ Validation failed: Invalid recipient ${message.recipient}`);
            this.debugLog(`   Valid agents: ${validAgents.join(', ')}`);
            throw new Error(`Invalid recipient: ${message.recipient}`);
        }
        this.debugLog(`✅ Recipient valid: ${message.recipient}`);

        // Check payload
        if (!message.payload || typeof message.payload !== 'object') {
            this.debugLog(`❌ Validation failed: Invalid payload`);
            this.debugLog(`   Payload type: ${typeof message.payload}`);
            this.debugLog(`   Payload value: ${JSON.stringify(message.payload)}`);
            throw new Error('Message payload must be a non-empty object');
        }
        this.debugLog(`✅ Payload valid: object with ${Object.keys(message.payload).length} keys`);

        this.debugLog('✅ Message validation completed successfully');
    }

    async healthCheck() {
        this.debugLog('🏥 Starting health check...');

        try {
            const healthStart = Date.now();
            
            // Test basic connectivity with a simple query
            const { data, error } = await this.supabase
                .from(this.table)
                .select('id')
                .limit(1);

            const healthDuration = Date.now() - healthStart;
            this.debugLog(`⏱️ Health check took ${healthDuration}ms`);

            if (error) {
                this.debugLog(`❌ Health check failed: ${error.message}`);
                return {
                    status: 'UNHEALTHY',
                    error: error.message,
                    agentId: this.agentId,
                    table: this.table,
                    duration: `${healthDuration}ms`,
                    timestamp: new Date().toISOString()
                };
            }

            this.debugLog(`✅ Health check passed (${data?.length || 0} records accessible)`);
            return {
                status: 'HEALTHY',
                agentId: this.agentId,
                table: this.table,
                recordsAccessible: data?.length || 0,
                duration: `${healthDuration}ms`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.debugLog(`❌ Health check exception: ${error.message}`);
            return {
                status: 'UNHEALTHY',
                error: error.message,
                agentId: this.agentId,
                table: this.table,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Additional method for Gemini Prime to test message persistence
    async testMessagePersistence() {
        console.log('🧪 Testing message persistence for Gemini Prime...');
        
        try {
            const testPayload = {
                test_id: `persistence_test_${Date.now()}`,
                description: 'Testing if Gemini Prime messages persist in Supabase',
                timestamp: new Date().toISOString()
            };

            // Send test message
            const sentMessage = await this.sendMessage(
                'Gemini Prime',
                'Claude Code',
                'REQUEST_FOR_INFO',
                testPayload,
                `persistence_test_${Date.now()}`
            );

            console.log(`📤 Test message sent with ID: ${sentMessage.id}`);

            // Wait briefly for replication
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to retrieve the message
            const messages = await this.getMessages('Claude Code', null, 10);
            const foundMessage = messages.find(msg => msg.id === sentMessage.id);

            if (foundMessage) {
                console.log('✅ Message persistence test PASSED');
                console.log(`   📧 Message found in database: ${foundMessage.id}`);
                console.log(`   📅 Created at: ${foundMessage.created_at}`);
                return true;
            } else {
                console.log('❌ Message persistence test FAILED');
                console.log('   📧 Message not found in database after insertion');
                return false;
            }

        } catch (error) {
            console.error('❌ Message persistence test ERROR:', error.message);
            return false;
        }
    }
}

module.exports = EnhancedA2AClientDebug;