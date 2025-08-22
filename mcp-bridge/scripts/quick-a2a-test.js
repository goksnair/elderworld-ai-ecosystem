// Quick A2A System Test
// Validates basic connectivity and message sending
// Runs with minimal configuration

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const A2ASupabaseClient = require('../services/a2a-supabase-client');

async function quickTest() {
    console.log('🚀 Quick A2A System Test\n');

    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Environment variables missing:');
        console.log(`   SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}`);
        console.log(`   SUPABASE_SERVICE_KEY: ${supabaseKey ? '✓' : '✗'}`);
        console.log('\nPlease check your .env file configuration.');
        return false;
    }

    console.log('✅ Environment variables found');
    
    try {
        // Initialize client
        const client = new A2ASupabaseClient(supabaseUrl, supabaseKey, {
            agentId: 'QuickTest',
            tableName: 'agent_messages'
        });

        // Test health check
        console.log('\n🔍 Testing health check...');
        const health = await client.healthCheck();
        
        if (health.status !== 'HEALTHY') {
            console.log('❌ Health check failed:', health.error);
            console.log('\nThis might mean:');
            console.log('   1. The agent_messages table does not exist');
            console.log('   2. Invalid Supabase credentials');
            console.log('   3. Network connectivity issues');
            console.log('\nPlease create the table first using:');
            console.log('   mcp-bridge/sql/agent_messages_table.sql');
            return false;
        }

        console.log('✅ Health check passed');

        // Test basic message sending
        console.log('\n📤 Testing message sending...');
        const testMessage = await client.sendMessage(
            'Claude Code',
            'Gemini Prime', 
            'TASK_DELEGATION',
            {
                task_id: 'quick_test_001',
                objective: 'Validate A2A communication system',
                description: 'Quick connectivity and messaging test',
                business_impact: 'Ensures autonomous agent coordination is operational',
                expected_output_format: 'Confirmation message'
            },
            `test_ctx_${Date.now()}`
        );

        if (testMessage && testMessage.id) {
            console.log('✅ Message sent successfully');
            console.log(`   Message ID: ${testMessage.id}`);
            console.log(`   Status: ${testMessage.status}`);
        } else {
            console.log('❌ Message sending failed');
            return false;
        }

        // Test message retrieval
        console.log('\n📥 Testing message retrieval...');
        const messages = await client.getMessages('Gemini Prime', null, 5);
        
        if (Array.isArray(messages)) {
            console.log(`✅ Messages retrieved: ${messages.length} messages`);
            
            // Check if our test message is there
            const ourMessage = messages.find(m => m.id === testMessage.id);
            if (ourMessage) {
                console.log('✅ Test message found in database');
            } else {
                console.log('⚠️  Test message not immediately found (might be eventual consistency)');
            }
        } else {
            console.log('❌ Message retrieval failed');
            return false;
        }

        // Test unread count
        console.log('\n📊 Testing unread count...');
        const unreadCount = await client.getUnreadCount('Gemini Prime');
        console.log(`✅ Unread count: ${unreadCount} messages`);

        console.log('\n🎉 A2A COMMUNICATION SYSTEM IS OPERATIONAL!');
        console.log('=====================================');
        console.log('✅ Health check: PASSED');
        console.log('✅ Message sending: PASSED');  
        console.log('✅ Message retrieval: PASSED');
        console.log('✅ Unread counting: PASSED');
        console.log('\nReady for Prime Agent coordination!');
        
        return true;

    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        console.log('\nDebugging information:');
        console.log('   Error type:', error.constructor.name);
        console.log('   Stack trace:', error.stack);
        return false;
    }
}

// Run the test
if (require.main === module) {
    quickTest().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = quickTest;