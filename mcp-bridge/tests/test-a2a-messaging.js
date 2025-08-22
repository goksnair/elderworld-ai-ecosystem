// Test script for A2A Messaging System  
// Validates message passing between Prime Agents
// Aligned with Core Entrepreneurial Framework

const A2ASupabaseClient = require('../services/a2a-supabase-client');
const crypto = require('crypto');
require('dotenv').config({ path: '../.env' });

// Configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration. Please check .env file.');
    process.exit(1);
}

class A2ATestSuite {
    constructor() {
        this.client = new A2ASupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            agentId: 'TestAgent',
            tableName: 'agent_messages'
        });
        this.testResults = [];
        this.contextId = `test_ctx_${Date.now()}`;
    }

    async runAllTests() {
        console.log('🚀 Starting A2A Communication Test Suite...\n');

        try {
            // Basic functionality tests
            await this.testHealthCheck();
            await this.testSendMessage();
            await this.testRetrieveMessages();
            await this.testMessageAcknowledgment();
            await this.testContextThreading();
            await this.testUnreadCount();

            // Business logic tests
            await this.testTaskDelegationWorkflow();
            await this.testProgressUpdateWorkflow();
            await this.testBlockerReportWorkflow();

            // Performance and cleanup tests  
            await this.testBulkMessaging();
            await this.testMessageCleanup();

            this.printTestSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        }
    }

    async testHealthCheck() {
        console.log('🔍 Testing: Health Check');
        
        try {
            const health = await this.client.healthCheck();
            
            if (health.status === 'HEALTHY') {
                this.recordTest('Health Check', true, 'Connection successful');
                console.log('✅ Health check passed');
            } else {
                this.recordTest('Health Check', false, health.error);
                console.log('❌ Health check failed:', health.error);
            }
        } catch (error) {
            this.recordTest('Health Check', false, error.message);
            console.log('❌ Health check error:', error.message);
        }
        console.log('');
    }

    async testSendMessage() {
        console.log('📤 Testing: Send Message');
        
        try {
            const messageData = await this.client.sendMessage(
                'Claude Code',
                'Gemini Prime',
                'TASK_DELEGATION',
                {
                    task_id: 'test_task_001',
                    objective: 'Test A2A message sending functionality',
                    description: 'Validate that messages can be sent between agents',
                    business_impact: 'Ensures autonomous coordination capabilities',
                    expected_output_format: 'Confirmation message'
                },
                this.contextId
            );

            if (messageData && messageData.id) {
                this.recordTest('Send Message', true, `Message sent with ID: ${messageData.id}`);
                console.log('✅ Message sent successfully:', messageData.id);
                this.testMessageId = messageData.id; // Save for later tests
            } else {
                this.recordTest('Send Message', false, 'No message data returned');
                console.log('❌ Message send failed - no data returned');
            }

        } catch (error) {
            this.recordTest('Send Message', false, error.message);
            console.log('❌ Message send error:', error.message);
        }
        console.log('');
    }

    async testRetrieveMessages() {
        console.log('📥 Testing: Retrieve Messages');
        
        try {
            const messages = await this.client.getMessages('Gemini Prime', null, 10);

            if (Array.isArray(messages) && messages.length > 0) {
                this.recordTest('Retrieve Messages', true, `Retrieved ${messages.length} messages`);
                console.log('✅ Messages retrieved successfully:', messages.length);
                
                // Verify the test message exists
                const testMessage = messages.find(msg => msg.id === this.testMessageId);
                if (testMessage) {
                    console.log('  ✓ Test message found in results');
                } else {
                    console.log('  ⚠️  Test message not found in results');
                }
            } else {
                this.recordTest('Retrieve Messages', false, 'No messages retrieved');
                console.log('❌ No messages retrieved');
            }

        } catch (error) {
            this.recordTest('Retrieve Messages', false, error.message);
            console.log('❌ Message retrieval error:', error.message);
        }
        console.log('');
    }

    async testMessageAcknowledgment() {
        console.log('✅ Testing: Message Acknowledgment');
        
        try {
            if (!this.testMessageId) {
                console.log('⚠️  Skipping acknowledgment test - no test message ID');
                return;
            }

            const ackData = await this.client.acknowledgeMessage(this.testMessageId, 'Gemini Prime');

            if (ackData && ackData.status === 'ACKNOWLEDGED') {
                this.recordTest('Message Acknowledgment', true, `Message ${this.testMessageId} acknowledged`);
                console.log('✅ Message acknowledged successfully');
            } else {
                this.recordTest('Message Acknowledgment', false, 'Acknowledgment failed');
                console.log('❌ Message acknowledgment failed');
            }

        } catch (error) {
            this.recordTest('Message Acknowledgment', false, error.message);
            console.log('❌ Acknowledgment error:', error.message);
        }
        console.log('');
    }

    async testContextThreading() {
        console.log('🧵 Testing: Context Threading');
        
        try {
            // Send another message with same context
            await this.client.sendMessage(
                'Gemini Prime',
                'Claude Code', 
                'PROGRESS_UPDATE',
                {
                    task_id: 'test_task_001',
                    status: 'In Progress',
                    progress_percentage: 50,
                    description: 'A2A system testing in progress',
                    key_metrics: { tests_passed: 4, tests_total: 10 }
                },
                this.contextId
            );

            // Retrieve messages by context
            const contextMessages = await this.client.getMessagesByContext(this.contextId);

            if (contextMessages.length >= 2) {
                this.recordTest('Context Threading', true, `${contextMessages.length} messages in context`);
                console.log('✅ Context threading works:', contextMessages.length, 'messages');
            } else {
                this.recordTest('Context Threading', false, 'Context messages not found');
                console.log('❌ Context threading failed');
            }

        } catch (error) {
            this.recordTest('Context Threading', false, error.message);
            console.log('❌ Context threading error:', error.message);
        }
        console.log('');
    }

    async testUnreadCount() {
        console.log('📊 Testing: Unread Count');
        
        try {
            const unreadCount = await this.client.getUnreadCount('Claude Code');

            if (typeof unreadCount === 'number') {
                this.recordTest('Unread Count', true, `Unread count: ${unreadCount}`);
                console.log('✅ Unread count retrieved:', unreadCount);
            } else {
                this.recordTest('Unread Count', false, 'Invalid unread count');
                console.log('❌ Invalid unread count returned');
            }

        } catch (error) {
            this.recordTest('Unread Count', false, error.message);
            console.log('❌ Unread count error:', error.message);
        }
        console.log('');
    }

    async testTaskDelegationWorkflow() {
        console.log('🎯 Testing: Task Delegation Workflow');
        
        try {
            const workflowContextId = `workflow_${Date.now()}`;
            
            // 1. Claude Code delegates task to Gemini Prime
            const delegation = await this.client.sendMessage(
                'Claude Code',
                'Gemini Prime',
                'TASK_DELEGATION',
                {
                    task_id: 'strategic_analysis_001',
                    objective: 'Market research for NRI eldercare segment',
                    description: 'Analyze competitor pricing and feature gaps',
                    business_impact: 'Critical for ₹500Cr revenue strategy development',
                    expected_output_format: 'Markdown report with recommendations'
                },
                workflowContextId
            );

            // 2. Gemini Prime accepts task  
            const acceptance = await this.client.sendMessage(
                'Gemini Prime',
                'Claude Code',
                'TASK_ACCEPTED',
                {
                    task_id: 'strategic_analysis_001',
                    estimated_completion: '2 hours',
                    status: 'Accepted and started'
                },
                workflowContextId
            );

            // 3. Progress update
            const progress = await this.client.sendMessage(
                'Gemini Prime', 
                'Claude Code',
                'PROGRESS_UPDATE',
                {
                    task_id: 'strategic_analysis_001',
                    status: 'In Progress',
                    progress_percentage: 75,
                    description: 'Competitor analysis complete, writing recommendations',
                    key_metrics: { competitors_analyzed: 12, insights_generated: 8 }
                },
                workflowContextId
            );

            const workflowMessages = await this.client.getMessagesByContext(workflowContextId);

            if (workflowMessages.length === 3) {
                this.recordTest('Task Delegation Workflow', true, 'Complete workflow executed');
                console.log('✅ Task delegation workflow completed successfully');
            } else {
                this.recordTest('Task Delegation Workflow', false, `Expected 3 messages, got ${workflowMessages.length}`);
                console.log('❌ Workflow incomplete');
            }

        } catch (error) {
            this.recordTest('Task Delegation Workflow', false, error.message);
            console.log('❌ Workflow error:', error.message);
        }
        console.log('');
    }

    async testProgressUpdateWorkflow() {
        console.log('📈 Testing: Progress Update Workflow');
        
        try {
            const progressContextId = `progress_${Date.now()}`;

            // Send multiple progress updates
            const updates = [25, 50, 75, 100];
            
            for (const progress of updates) {
                await this.client.sendMessage(
                    'GitHub Copilot',
                    'Claude Code',
                    'PROGRESS_UPDATE',
                    {
                        task_id: 'ui_development_001',
                        status: progress === 100 ? 'Completed' : 'In Progress',
                        progress_percentage: progress,
                        description: `Frontend development ${progress}% complete`,
                        key_metrics: { 
                            components_built: Math.floor(progress / 25 * 4),
                            tests_passed: Math.floor(progress / 25 * 8)
                        }
                    },
                    progressContextId
                );
            }

            const progressMessages = await this.client.getMessagesByContext(progressContextId);

            if (progressMessages.length === 4) {
                this.recordTest('Progress Update Workflow', true, 'All progress updates sent');
                console.log('✅ Progress workflow completed');
            } else {
                this.recordTest('Progress Update Workflow', false, `Expected 4 updates, got ${progressMessages.length}`);
                console.log('❌ Progress workflow incomplete');
            }

        } catch (error) {
            this.recordTest('Progress Update Workflow', false, error.message);
            console.log('❌ Progress workflow error:', error.message);
        }
        console.log('');
    }

    async testBlockerReportWorkflow() {
        console.log('🚧 Testing: Blocker Report Workflow');
        
        try {
            const blockerMessage = await this.client.sendMessage(
                'GitHub Copilot',
                'Claude Code',
                'BLOCKER_REPORT',
                {
                    task_id: 'payment_integration_001',
                    error_details: 'Payment gateway API authentication failing',
                    business_impact: 'Blocks customer onboarding and revenue generation',
                    proposed_solution: 'Update API credentials and retry connection',
                    urgency: 'HIGH'
                }
            );

            if (blockerMessage && blockerMessage.type === 'BLOCKER_REPORT') {
                this.recordTest('Blocker Report Workflow', true, 'Blocker report sent successfully');
                console.log('✅ Blocker report workflow completed');
            } else {
                this.recordTest('Blocker Report Workflow', false, 'Blocker report failed');
                console.log('❌ Blocker report workflow failed');
            }

        } catch (error) {
            this.recordTest('Blocker Report Workflow', false, error.message);
            console.log('❌ Blocker workflow error:', error.message);
        }
        console.log('');
    }

    async testBulkMessaging() {
        console.log('⚡ Testing: Bulk Messaging Performance');
        
        try {
            const startTime = Date.now();
            const bulkContextId = `bulk_${Date.now()}`;
            const messageCount = 10;

            // Send multiple messages quickly
            const sendPromises = [];
            for (let i = 0; i < messageCount; i++) {
                const promise = this.client.sendMessage(
                    'Claude Code',
                    'Gemini Prime',
                    'STRATEGIC_QUERY',
                    {
                        query_id: `bulk_query_${i}`,
                        question: `Performance test message ${i + 1}`,
                        priority: 'LOW',
                        batch_id: bulkContextId
                    },
                    bulkContextId
                );
                sendPromises.push(promise);
            }

            await Promise.all(sendPromises);
            const endTime = Date.now();
            const duration = endTime - startTime;

            this.recordTest('Bulk Messaging', true, `${messageCount} messages in ${duration}ms`);
            console.log(`✅ Bulk messaging completed: ${messageCount} messages in ${duration}ms`);

        } catch (error) {
            this.recordTest('Bulk Messaging', false, error.message);
            console.log('❌ Bulk messaging error:', error.message);
        }
        console.log('');
    }

    async testMessageCleanup() {
        console.log('🧹 Testing: Message Cleanup');
        
        try {
            // Note: This won't delete anything as we only have recent messages
            const deletedCount = await this.client.cleanupOldMessages(30);

            this.recordTest('Message Cleanup', true, `Cleanup executed, ${deletedCount} messages deleted`);
            console.log(`✅ Message cleanup completed: ${deletedCount} old messages removed`);

        } catch (error) {
            this.recordTest('Message Cleanup', false, error.message);
            console.log('❌ Message cleanup error:', error.message);
        }
        console.log('');
    }

    recordTest(testName, passed, details) {
        this.testResults.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    printTestSummary() {
        console.log('📊 TEST SUMMARY');
        console.log('================');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        console.log('');

        // Details
        console.log('TEST DETAILS:');
        this.testResults.forEach((test, index) => {
            const status = test.passed ? '✅' : '❌';
            console.log(`${index + 1}. ${status} ${test.test}: ${test.details}`);
        });

        console.log('');
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! A2A Communication System is operational.');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
        }
    }
}

// Run tests
if (require.main === module) {
    const testSuite = new A2ATestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = A2ATestSuite;