/**
 * Unit Tests for A2A Communication Layer
 * Tests message handling, agent registration, and communication protocols
 */

const A2ACommunicationLayer = require('../../communication/a2a-layer');

describe('A2ACommunicationLayer', () => {
    let a2aLayer;
    let mockLogger;

    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };

        a2aLayer = new A2ACommunicationLayer({
            logger: mockLogger,
            maxMessageAge: 60000, // 1 minute for testing
            confirmationTimeout: 5000 // 5 seconds for testing
        });
    });

    afterEach(() => {
        if (a2aLayer) {
            a2aLayer.destroy();
        }
        jest.clearAllMocks();
    });

    describe('Agent Registration', () => {
        it('should register agent successfully', () => {
            const registration = a2aLayer.registerAgent('test-agent', {
                capabilities: ['test-capability'],
                status: 'active'
            });

            expect(registration.agentId).toBe('test-agent');
            expect(registration.capabilities).toContain('test-capability');
            expect(registration.status).toBe('active');
            expect(registration.registeredAt).toBeDefined();
            expect(a2aLayer.registeredAgents.has('test-agent')).toBe(true);
        });

        it('should unregister agent successfully', () => {
            a2aLayer.registerAgent('test-agent');
            a2aLayer.unregisterAgent('test-agent');

            expect(a2aLayer.registeredAgents.has('test-agent')).toBe(false);
        });

        it('should update agent status', () => {
            a2aLayer.registerAgent('test-agent', { status: 'active' });
            a2aLayer.updateAgentStatus('test-agent', 'busy', { currentTask: 'processing' });

            const agent = a2aLayer.registeredAgents.get('test-agent');
            expect(agent.status).toBe('busy');
            expect(agent.currentTask).toBe('processing');
            expect(agent.lastSeen).toBeDefined();
        });

        it('should emit events on agent registration', (done) => {
            a2aLayer.on('agentRegistered', (registration) => {
                expect(registration.agentId).toBe('test-agent');
                done();
            });

            a2aLayer.registerAgent('test-agent');
        });
    });

    describe('Message Types and Validation', () => {
        it('should provide message types with schemas', () => {
            const messageTypes = a2aLayer.getMessageTypes();
            
            expect(messageTypes).toHaveProperty('TASK_DELEGATION');
            expect(messageTypes).toHaveProperty('PROGRESS_UPDATE');
            expect(messageTypes).toHaveProperty('BLOCKER_REPORT');
            expect(messageTypes.TASK_DELEGATION.required).toContain('taskId');
        });

        it('should validate message correctly', () => {
            const validPayload = {
                taskId: 'task-1',
                description: 'Test task',
                priority: 'high',
                deadline: '2024-01-01T00:00:00Z'
            };

            const validation = a2aLayer.validateMessage('TASK_DELEGATION', validPayload);
            expect(validation.valid).toBe(true);
        });

        it('should reject message with missing required fields', () => {
            const invalidPayload = {
                taskId: 'task-1'
                // Missing required fields
            };

            const validation = a2aLayer.validateMessage('TASK_DELEGATION', invalidPayload);
            expect(validation.valid).toBe(false);
            expect(validation.error).toContain('Missing required field');
        });

        it('should reject message with unknown fields', () => {
            const payloadWithUnknownField = {
                taskId: 'task-1',
                description: 'Test task',
                priority: 'high',
                deadline: '2024-01-01T00:00:00Z',
                unknownField: 'should not be here'
            };

            const validation = a2aLayer.validateMessage('TASK_DELEGATION', payloadWithUnknownField);
            expect(validation.valid).toBe(false);
            expect(validation.error).toContain('Unknown field');
        });

        it('should reject unknown message type', () => {
            const validation = a2aLayer.validateMessage('UNKNOWN_TYPE', {});
            expect(validation.valid).toBe(false);
            expect(validation.error).toContain('Unknown message type');
        });
    });

    describe('Message Creation and Sending', () => {
        beforeEach(() => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');
        });

        it('should create message with correct structure', () => {
            const message = a2aLayer.createMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );

            expect(message.id).toBeDefined();
            expect(message.from).toBe('agent1');
            expect(message.to).toBe('agent2');
            expect(message.type).toBe('STATUS_REQUEST');
            expect(message.payload.requestType).toBe('health');
            expect(message.timestamp).toBeDefined();
            expect(message.priority).toBe('normal');
        });

        it('should send message successfully', async () => {
            const result = await a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
        });

        it('should reject message from unregistered agent', async () => {
            const result = await a2aLayer.sendMessage(
                'unregistered-agent',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('not registered');
        });

        it('should reject message to unregistered agent', async () => {
            const result = await a2aLayer.sendMessage(
                'agent1',
                'unregistered-agent',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('not registered');
        });

        it('should reject message with invalid payload', async () => {
            const result = await a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'TASK_DELEGATION',
                { taskId: 'task-1' } // Missing required fields
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('validation failed');
        });

        it('should emit messageSent event', (done) => {
            a2aLayer.on('messageSent', (message) => {
                expect(message.from).toBe('agent1');
                expect(message.to).toBe('agent2');
                done();
            });

            a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );
        });
    });

    describe('Message Retrieval', () => {
        beforeEach(async () => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');

            // Send some test messages
            await a2aLayer.sendMessage('agent1', 'agent2', 'STATUS_REQUEST', { requestType: 'health' });
            await a2aLayer.sendMessage('agent1', 'agent2', 'TASK_DELEGATION', {
                taskId: 'task-1',
                description: 'Test task',
                priority: 'high',
                deadline: '2024-01-01T00:00:00Z'
            });
        });

        it('should get messages for agent', async () => {
            const messages = await a2aLayer.getMessages('agent2');

            expect(messages).toHaveLength(2);
            expect(messages[0].to).toBe('agent2');
        });

        it('should filter messages by type', async () => {
            const messages = await a2aLayer.getMessages('agent2', { type: 'STATUS_REQUEST' });

            expect(messages).toHaveLength(1);
            expect(messages[0].type).toBe('STATUS_REQUEST');
        });

        it('should filter messages by sender', async () => {
            const messages = await a2aLayer.getMessages('agent2', { from: 'agent1' });

            expect(messages).toHaveLength(2);
            expect(messages[0].from).toBe('agent1');
        });

        it('should limit number of messages returned', async () => {
            const messages = await a2aLayer.getMessages('agent2', { limit: 1 });

            expect(messages).toHaveLength(1);
        });

        it('should sort messages by timestamp (newest first)', async () => {
            const messages = await a2aLayer.getMessages('agent2');

            expect(messages).toHaveLength(2);
            expect(new Date(messages[0].timestamp).getTime())
                .toBeGreaterThanOrEqual(new Date(messages[1].timestamp).getTime());
        });

        it('should mark messages as read when requested', async () => {
            const messages = await a2aLayer.getMessages('agent2', { markAsRead: true });

            expect(messages[0].readAt).toBeDefined();
        });

        it('should update agent last seen when getting messages', async () => {
            const initialAgent = a2aLayer.registeredAgents.get('agent2');
            const initialLastSeen = initialAgent.lastSeen;

            // Wait a bit to ensure timestamp changes
            await new Promise(resolve => setTimeout(resolve, 10));

            await a2aLayer.getMessages('agent2');

            const updatedAgent = a2aLayer.registeredAgents.get('agent2');
            expect(new Date(updatedAgent.lastSeen).getTime())
                .toBeGreaterThan(new Date(initialLastSeen).getTime());
        });
    });

    describe('Message Acknowledgment', () => {
        let messageId;

        beforeEach(async () => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');

            const result = await a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );
            messageId = result.messageId;
        });

        it('should acknowledge message successfully', async () => {
            const result = await a2aLayer.acknowledgeMessage('agent2', messageId);

            expect(result.success).toBe(true);
        });

        it('should emit messageAcknowledged event', (done) => {
            a2aLayer.on('messageAcknowledged', ({ agentId, messageId: msgId }) => {
                expect(agentId).toBe('agent2');
                expect(msgId).toBe(messageId);
                done();
            });

            a2aLayer.acknowledgeMessage('agent2', messageId);
        });

        it('should handle acknowledgment of non-existent message', async () => {
            const result = await a2aLayer.acknowledgeMessage('agent2', 'non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('Message Removal', () => {
        let messageId;

        beforeEach(async () => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');

            const result = await a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' }
            );
            messageId = result.messageId;
        });

        it('should remove message successfully', async () => {
            const result = await a2aLayer.removeMessage('agent2', messageId);

            expect(result.success).toBe(true);

            const messages = await a2aLayer.getMessages('agent2');
            expect(messages).toHaveLength(0);
        });

        it('should emit messageRemoved event', (done) => {
            a2aLayer.on('messageRemoved', ({ agentId, messageId: msgId }) => {
                expect(agentId).toBe('agent2');
                expect(msgId).toBe(messageId);
                done();
            });

            a2aLayer.removeMessage('agent2', messageId);
        });

        it('should handle removal of non-existent message', async () => {
            const result = await a2aLayer.removeMessage('agent2', 'non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('Broadcasting', () => {
        beforeEach(() => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2', { capabilities: ['capability1'] });
            a2aLayer.registerAgent('agent3', { capabilities: ['capability2'], status: 'busy' });
            a2aLayer.registerAgent('agent4', { capabilities: ['capability1'], status: 'active' });
        });

        it('should broadcast to all agents', async () => {
            const result = await a2aLayer.broadcast(
                'agent1',
                'ANNOUNCEMENT',
                { title: 'Test', message: 'Test broadcast' }
            );

            expect(result.success).toBe(true);
            expect(result.totalTargets).toBe(3); // All agents except sender
            expect(result.successful).toBe(3);
        });

        it('should broadcast to specific targets', async () => {
            const result = await a2aLayer.broadcast(
                'agent1',
                'ANNOUNCEMENT',
                { title: 'Test', message: 'Test broadcast' },
                ['agent2', 'agent3']
            );

            expect(result.success).toBe(true);
            expect(result.totalTargets).toBe(2);
        });

        it('should filter by capabilities', async () => {
            const result = await a2aLayer.broadcast(
                'agent1',
                'ANNOUNCEMENT',
                { title: 'Test', message: 'Test broadcast' },
                [],
                { capabilities: ['capability1'] }
            );

            expect(result.success).toBe(true);
            expect(result.totalTargets).toBe(2); // agent2 and agent4 have capability1
        });

        it('should filter by status', async () => {
            const result = await a2aLayer.broadcast(
                'agent1',
                'ANNOUNCEMENT',
                { title: 'Test', message: 'Test broadcast' },
                [],
                { status: 'busy' }
            );

            expect(result.success).toBe(true);
            expect(result.totalTargets).toBe(1); // Only agent3 is busy
        });
    });

    describe('Delivery Confirmations', () => {
        beforeEach(() => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');
        });

        it('should handle delivery confirmation timeout', (done) => {
            a2aLayer.on('deliveryTimeout', ({ messageId, from, to }) => {
                expect(from).toBe('agent1');
                expect(to).toBe('agent2');
                expect(messageId).toBeDefined();
                done();
            });

            a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' },
                { requiresConfirmation: true }
            );
        });

        it('should handle delivery confirmation', (done) => {
            a2aLayer.on('deliveryConfirmed', ({ messageId, from, to }) => {
                expect(from).toBe('agent2');
                expect(to).toBe('agent1');
                done();
            });

            // Send message with confirmation
            a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' },
                { requiresConfirmation: true }
            ).then(result => {
                // Acknowledge the message (which triggers confirmation)
                a2aLayer.acknowledgeMessage('agent2', result.messageId);
            });
        });
    });

    describe('Message Cleanup', () => {
        beforeEach(async () => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');

            // Send message with short expiry
            await a2aLayer.sendMessage(
                'agent1',
                'agent2',
                'STATUS_REQUEST',
                { requestType: 'health' },
                { expiresAt: new Date(Date.now() + 100).toISOString() } // Expire in 100ms
            );
        });

        it('should clean up expired messages', async () => {
            // Wait for message to expire
            await new Promise(resolve => setTimeout(resolve, 200));

            // Trigger cleanup
            a2aLayer.cleanupOldMessages();

            const messages = await a2aLayer.getMessages('agent2');
            expect(messages).toHaveLength(0);
        });
    });

    describe('Statistics and Status', () => {
        beforeEach(async () => {
            a2aLayer.registerAgent('agent1');
            a2aLayer.registerAgent('agent2');

            await a2aLayer.sendMessage('agent1', 'agent2', 'STATUS_REQUEST', { requestType: 'health' });
            await a2aLayer.sendMessage('agent1', 'agent2', 'TASK_DELEGATION', {
                taskId: 'task-1',
                description: 'Test task',
                priority: 'high',
                deadline: '2024-01-01T00:00:00Z'
            });
        });

        it('should provide statistics', () => {
            const stats = a2aLayer.getStats();

            expect(stats.registeredAgents).toBe(2);
            expect(stats.totalMessages).toBe(2);
            expect(stats.messagesByType['STATUS_REQUEST']).toBe(1);
            expect(stats.messagesByType['TASK_DELEGATION']).toBe(1);
            expect(stats.messagesByPriority['normal']).toBe(2);
        });

        it('should provide status information', () => {
            const status = a2aLayer.getStatus();

            expect(status.status).toBe('active');
            expect(status.agents).toHaveLength(2);
            expect(status.stats).toBeDefined();
            expect(status.messageTypes).toContain('STATUS_REQUEST');
            expect(status.timestamp).toBeDefined();
        });
    });

    describe('Health Check', () => {
        it('should perform health check successfully', async () => {
            const health = await a2aLayer.healthCheck();

            expect(health.success).toBe(true);
            expect(health.data.testResult.success).toBe(true);
            expect(health.data.testMessagesReceived).toBe(1);
        });

        it('should handle health check errors', async () => {
            // Mock an error condition
            const originalSendMessage = a2aLayer.sendMessage;
            a2aLayer.sendMessage = jest.fn().mockRejectedValue(new Error('Test error'));

            const health = await a2aLayer.healthCheck();

            expect(health.success).toBe(false);
            expect(health.error).toBe('Test error');

            // Restore original method
            a2aLayer.sendMessage = originalSendMessage;
        });
    });

    describe('Resource Cleanup', () => {
        it('should cleanup resources on destroy', () => {
            const initialAgents = a2aLayer.registeredAgents.size;
            const initialStorage = a2aLayer.storage.size;

            a2aLayer.destroy();

            expect(a2aLayer.registeredAgents.size).toBe(0);
            expect(a2aLayer.storage.size).toBe(0);
            expect(a2aLayer.deliveryConfirmations.size).toBe(0);
        });
    });
});

module.exports = {};