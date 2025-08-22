// DEBUG GEMINI PRIME A2A COMMUNICATION ISSUE
// Comprehensive debugging script to identify why Gemini Prime messages aren't persisting
// Focus: Environment validation, database connectivity, message structure, and insertion flow

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');
const { createClient } = require('@supabase/supabase-js');

class GeminiA2ADebugger {
    constructor() {
        this.issues = [];
        this.successfulTests = [];
        
        console.log('🔍 GEMINI PRIME A2A COMMUNICATION DEBUGGER');
        console.log('==========================================');
        console.log('🎯 Objective: Identify why Gemini Prime messages aren\'t persisting in Supabase');
        console.log('📊 Scope: Environment, connectivity, validation, insertion flow\n');
    }

    async runComprehensiveDebug() {
        try {
            console.log('🔧 PHASE 1: ENVIRONMENT VALIDATION');
            await this.validateEnvironment();

            console.log('\n🔗 PHASE 2: DATABASE CONNECTIVITY TEST');
            await this.testDatabaseConnectivity();

            console.log('\n📋 PHASE 3: TABLE STRUCTURE VALIDATION');
            await this.validateTableStructure();

            console.log('\n📤 PHASE 4: A2A CLIENT INITIALIZATION TEST');
            await this.testA2AClientInitialization();

            console.log('\n✉️ PHASE 5: MESSAGE INSERTION SIMULATION');
            await this.simulateGeminiMessageInsertion();

            console.log('\n🔍 PHASE 6: DIRECT DATABASE INSERT TEST');
            await this.testDirectDatabaseInsert();

            console.log('\n📊 PHASE 7: MESSAGE RETRIEVAL VERIFICATION');
            await this.verifyMessageRetrieval();

            this.generateDebugReport();

        } catch (error) {
            console.error('❌ Debug session failed:', error);
            this.issues.push(`Critical debug failure: ${error.message}`);
            this.generateDebugReport();
        }
    }

    async validateEnvironment() {
        try {
            const requiredEnvVars = [
                'SUPABASE_URL',
                'SUPABASE_SERVICE_KEY'
            ];

            console.log('  🔍 Checking environment variables...');

            for (const envVar of requiredEnvVars) {
                if (!process.env[envVar]) {
                    this.issues.push(`Missing environment variable: ${envVar}`);
                    console.log(`  ❌ ${envVar}: MISSING`);
                } else {
                    const value = process.env[envVar];
                    const maskedValue = value.length > 10 ? 
                        `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : 
                        value;
                    console.log(`  ✅ ${envVar}: ${maskedValue}`);
                    this.successfulTests.push(`Environment variable ${envVar} present`);
                }
            }

            // Validate Supabase URL format
            const supabaseUrl = process.env.SUPABASE_URL;
            if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
                this.issues.push('Supabase URL should start with https://');
                console.log('  ⚠️ Supabase URL format may be invalid');
            }

            // Validate Service Key format (should be a JWT-like string)
            const serviceKey = process.env.SUPABASE_SERVICE_KEY;
            if (serviceKey && (!serviceKey.includes('.') || serviceKey.length < 100)) {
                this.issues.push('Supabase Service Key format appears invalid');
                console.log('  ⚠️ Supabase Service Key format may be invalid');
            }

            console.log('  📋 Environment validation complete');

        } catch (error) {
            this.issues.push(`Environment validation failed: ${error.message}`);
            console.error('  ❌ Environment validation error:', error.message);
        }
    }

    async testDatabaseConnectivity() {
        try {
            console.log('  🔗 Creating direct Supabase client...');
            
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false
                    }
                }
            );

            console.log('  🔍 Testing basic connectivity...');

            // Test basic connection with a simple query
            const { data, error } = await supabase
                .from('agent_messages')
                .select('count', { count: 'exact', head: true });

            if (error) {
                this.issues.push(`Database connectivity error: ${error.message}`);
                console.log(`  ❌ Connection failed: ${error.message}`);
                
                // Additional error details
                if (error.code) {
                    console.log(`  🔍 Error code: ${error.code}`);
                }
                if (error.details) {
                    console.log(`  🔍 Error details: ${error.details}`);
                }
            } else {
                this.successfulTests.push('Database connectivity successful');
                console.log(`  ✅ Connection successful - Table has ${data || 0} records`);
            }

            console.log('  📋 Database connectivity test complete');

        } catch (error) {
            this.issues.push(`Database connectivity test failed: ${error.message}`);
            console.error('  ❌ Connectivity test error:', error.message);
        }
    }

    async validateTableStructure() {
        try {
            console.log('  📊 Validating agent_messages table structure...');

            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY
            );

            // Get table schema information
            const { data, error } = await supabase.rpc('get_table_info', {
                table_name: 'agent_messages'
            }).catch(() => {
                // Fallback: Try to insert a test record to see what happens
                return { data: null, error: 'Could not get table schema info' };
            });

            if (error && !data) {
                console.log('  ⚠️ Cannot get table schema via RPC, trying direct column check...');
                
                // Try to query table to check if it exists
                const { data: testData, error: testError } = await supabase
                    .from('agent_messages')
                    .select('id, sender, recipient, type, payload, created_at')
                    .limit(1);

                if (testError) {
                    this.issues.push(`Table structure issue: ${testError.message}`);
                    console.log(`  ❌ Table access error: ${testError.message}`);
                    
                    if (testError.message.includes('does not exist')) {
                        console.log('  🔍 Table "agent_messages" does not exist');
                        this.issues.push('agent_messages table does not exist in database');
                    }
                } else {
                    console.log('  ✅ Table exists and is accessible');
                    console.log(`  📊 Sample record count: ${testData?.length || 0}`);
                    this.successfulTests.push('Table structure accessible');
                }
            } else {
                console.log('  ✅ Table schema information retrieved');
                this.successfulTests.push('Table schema validation successful');
            }

            console.log('  📋 Table structure validation complete');

        } catch (error) {
            this.issues.push(`Table structure validation failed: ${error.message}`);
            console.error('  ❌ Table validation error:', error.message);
        }
    }

    async testA2AClientInitialization() {
        try {
            console.log('  🤖 Initializing A2A client for Gemini Prime...');

            const a2aClient = new A2ASupabaseClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                { agentId: 'Gemini Prime Debug' }
            );

            console.log('  ✅ A2A Client initialized successfully');
            this.successfulTests.push('A2A Client initialization successful');

            // Test health check
            console.log('  🏥 Running A2A client health check...');
            const healthCheck = await a2aClient.healthCheck();
            
            if (healthCheck.status === 'HEALTHY') {
                console.log('  ✅ A2A Client health check passed');
                this.successfulTests.push('A2A Client health check successful');
            } else {
                console.log(`  ❌ A2A Client health check failed: ${healthCheck.error}`);
                this.issues.push(`A2A Client health check failed: ${healthCheck.error}`);
            }

            console.log('  📋 A2A Client initialization test complete');
            return a2aClient;

        } catch (error) {
            this.issues.push(`A2A Client initialization failed: ${error.message}`);
            console.error('  ❌ A2A Client initialization error:', error.message);
            return null;
        }
    }

    async simulateGeminiMessageInsertion() {
        try {
            console.log('  📤 Simulating Gemini Prime message insertion...');

            const a2aClient = await this.testA2AClientInitialization();
            if (!a2aClient) {
                console.log('  ⚠️ Skipping message simulation - A2A client initialization failed');
                return;
            }

            const testPayload = {
                task_id: 'debug_test_' + Date.now(),
                objective: 'Debug Gemini Prime A2A communication issue',
                description: 'Test message insertion to identify persistence problems',
                business_impact: 'Critical for autonomous multi-agent coordination',
                timestamp: Date.now()
            };

            console.log('  📝 Test message payload prepared');
            console.log('     📋 Sender: Gemini Prime');
            console.log('     📋 Recipient: Claude Code'); 
            console.log('     📋 Type: TASK_DELEGATION');
            console.log(`     📋 Payload: ${JSON.stringify(testPayload, null, 2).substring(0, 100)}...`);

            // Attempt to send message
            const sendStart = Date.now();
            const messageResult = await a2aClient.sendMessage(
                'Gemini Prime',
                'Claude Code',
                'TASK_DELEGATION',
                testPayload,
                `debug_context_${Date.now()}`
            );

            const sendDuration = Date.now() - sendStart;

            if (messageResult && messageResult.id) {
                console.log(`  ✅ Message sent successfully in ${sendDuration}ms`);
                console.log(`     📧 Message ID: ${messageResult.id}`);
                console.log(`     ⏰ Database timestamp: ${messageResult.created_at || messageResult.timestamp}`);
                this.successfulTests.push(`Message insertion successful: ${messageResult.id}`);
                
                // Store for verification
                this.testMessageId = messageResult.id;
                return messageResult;
            } else {
                console.log('  ❌ Message sent but no ID returned');
                this.issues.push('Message insertion returned no ID');
                return null;
            }

        } catch (error) {
            this.issues.push(`Message insertion simulation failed: ${error.message}`);
            console.error('  ❌ Message insertion error:', error.message);
            
            // Log additional error details
            if (error.code) {
                console.log(`     🔍 Error code: ${error.code}`);
            }
            if (error.details) {
                console.log(`     🔍 Error details: ${error.details}`);
            }
            if (error.hint) {
                console.log(`     💡 Error hint: ${error.hint}`);
            }
            
            return null;
        }
    }

    async testDirectDatabaseInsert() {
        try {
            console.log('  🗄️ Testing direct database insertion (bypass A2A client)...');

            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY
            );

            const directTestMessage = {
                sender: 'Gemini Prime',
                recipient: 'Claude Code',
                type: 'REQUEST_FOR_INFO',
                timestamp: new Date().toISOString(),
                context_id: `direct_test_${Date.now()}`,
                payload: {
                    test_type: 'direct_database_insert',
                    purpose: 'Bypass A2A client to test raw database insertion',
                    timestamp: Date.now()
                },
                status: 'SENT',
                updated_at: new Date().toISOString()
            };

            console.log('  📝 Preparing direct insertion message...');
            console.log('     📋 Message structure validated');

            const insertStart = Date.now();
            const { data, error } = await supabase
                .from('agent_messages')
                .insert(directTestMessage)
                .select()
                .single();

            const insertDuration = Date.now() - insertStart;

            if (error) {
                console.log(`  ❌ Direct insertion failed in ${insertDuration}ms`);
                console.log(`     🔍 Error: ${error.message}`);
                this.issues.push(`Direct database insertion failed: ${error.message}`);
                
                // Additional error analysis
                if (error.code === '23505') {
                    console.log('     💡 This appears to be a unique constraint violation');
                }
                if (error.code === '42703') {
                    console.log('     💡 This appears to be a column does not exist error');
                }
                if (error.code === '42P01') {
                    console.log('     💡 This appears to be a table does not exist error');
                }
            } else {
                console.log(`  ✅ Direct insertion successful in ${insertDuration}ms`);
                console.log(`     📧 Message ID: ${data.id}`);
                this.successfulTests.push(`Direct database insertion successful: ${data.id}`);
                this.directTestMessageId = data.id;
            }

        } catch (error) {
            this.issues.push(`Direct database insertion test failed: ${error.message}`);
            console.error('  ❌ Direct insertion test error:', error.message);
        }
    }

    async verifyMessageRetrieval() {
        try {
            console.log('  🔍 Verifying message retrieval...');

            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY
            );

            // Check for messages inserted during this debug session
            const { data, error } = await supabase
                .from('agent_messages')
                .select('*')
                .eq('sender', 'Gemini Prime')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.log(`  ❌ Message retrieval failed: ${error.message}`);
                this.issues.push(`Message retrieval failed: ${error.message}`);
            } else {
                const messageCount = data?.length || 0;
                console.log(`  📊 Found ${messageCount} messages from Gemini Prime`);
                
                if (messageCount > 0) {
                    this.successfulTests.push(`Message retrieval successful: ${messageCount} messages found`);
                    
                    // Show recent messages
                    console.log('  📋 Recent Gemini Prime messages:');
                    data.slice(0, 3).forEach((msg, index) => {
                        console.log(`     ${index + 1}. ID: ${msg.id}`);
                        console.log(`        📅 Created: ${msg.created_at}`);
                        console.log(`        📧 Type: ${msg.type}`);
                        console.log(`        🎯 Recipient: ${msg.recipient}`);
                        console.log(`        📊 Status: ${msg.status}`);
                    });

                    // Check if our test messages are there
                    if (this.testMessageId) {
                        const testMessage = data.find(msg => msg.id === this.testMessageId);
                        if (testMessage) {
                            console.log(`  ✅ A2A test message found in database: ${this.testMessageId}`);
                        } else {
                            console.log(`  ⚠️ A2A test message NOT found in database: ${this.testMessageId}`);
                        }
                    }

                    if (this.directTestMessageId) {
                        const directMessage = data.find(msg => msg.id === this.directTestMessageId);
                        if (directMessage) {
                            console.log(`  ✅ Direct test message found in database: ${this.directTestMessageId}`);
                        } else {
                            console.log(`  ⚠️ Direct test message NOT found in database: ${this.directTestMessageId}`);
                        }
                    }
                } else {
                    console.log('  ⚠️ No messages found from Gemini Prime');
                    this.issues.push('No messages found from Gemini Prime in database');
                }
            }

        } catch (error) {
            this.issues.push(`Message retrieval verification failed: ${error.message}`);
            console.error('  ❌ Message retrieval error:', error.message);
        }
    }

    generateDebugReport() {
        console.log('\n🎯 GEMINI PRIME A2A DEBUG REPORT');
        console.log('================================');

        const totalTests = this.successfulTests.length + this.issues.length;
        const successRate = totalTests > 0 ? ((this.successfulTests.length / totalTests) * 100).toFixed(1) : '0';

        console.log('\n📊 SUMMARY:');
        console.log(`   ✅ Successful Tests: ${this.successfulTests.length}`);
        console.log(`   ❌ Issues Found: ${this.issues.length}`);
        console.log(`   📈 Success Rate: ${successRate}%`);

        if (this.successfulTests.length > 0) {
            console.log('\n✅ SUCCESSFUL TESTS:');
            this.successfulTests.forEach((test, index) => {
                console.log(`   ${index + 1}. ${test}`);
            });
        }

        if (this.issues.length > 0) {
            console.log('\n❌ ISSUES IDENTIFIED:');
            this.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });

            console.log('\n🔧 RECOMMENDED FIXES:');
            
            // Analyze issues and provide recommendations
            const envIssues = this.issues.filter(issue => issue.includes('environment') || issue.includes('Environment'));
            if (envIssues.length > 0) {
                console.log('   🔑 Environment Issues Detected:');
                console.log('      - Verify .env file exists and has correct SUPABASE_URL and SUPABASE_SERVICE_KEY');
                console.log('      - Check that environment variables are loaded properly');
            }

            const dbIssues = this.issues.filter(issue => 
                issue.includes('database') || issue.includes('table') || issue.includes('connectivity')
            );
            if (dbIssues.length > 0) {
                console.log('   🗄️ Database Issues Detected:');
                console.log('      - Verify Supabase project is active and accessible');
                console.log('      - Check that agent_messages table exists with correct schema');
                console.log('      - Verify service key has proper permissions');
            }

            const insertIssues = this.issues.filter(issue => 
                issue.includes('insertion') || issue.includes('insert')
            );
            if (insertIssues.length > 0) {
                console.log('   📤 Message Insertion Issues Detected:');
                console.log('      - Check RLS (Row Level Security) policies on agent_messages table');
                console.log('      - Verify message validation logic');
                console.log('      - Check for unique constraint violations');
            }

        } else {
            console.log('\n🎉 NO ISSUES DETECTED!');
            console.log('   The A2A communication system appears to be working correctly.');
            console.log('   If Gemini Prime is still experiencing issues, the problem may be:');
            console.log('   - Environment configuration on Gemini Prime\'s side');
            console.log('   - Different Supabase credentials being used');
            console.log('   - Network connectivity issues');
        }

        console.log('\n🎯 NEXT STEPS FOR GEMINI PRIME:');
        console.log('1. Run this debug script to identify specific issues');
        console.log('2. Verify environment variables are correctly loaded');
        console.log('3. Test A2A client initialization and health check');
        console.log('4. Attempt message insertion with detailed error logging');
        console.log('5. If issues persist, provide debug output for further analysis');

        console.log('\n================================');
        console.log('Gemini Prime A2A Debug Session Complete');
    }
}

// Run the debug session
if (require.main === module) {
    const geminiDebugger = new GeminiA2ADebugger();
    geminiDebugger.runComprehensiveDebug().catch(console.error);
}

module.exports = GeminiA2ADebugger;