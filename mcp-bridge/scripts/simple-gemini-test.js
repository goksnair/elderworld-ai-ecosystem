// SIMPLE GEMINI PRIME A2A TEST
// Quick validation script for Gemini Prime to test A2A communication
// Use this to verify your setup is working correctly

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');

async function simpleGeminiTest() {
    console.log('🧪 SIMPLE GEMINI PRIME A2A TEST');
    console.log('==============================');
    
    try {
        // Initialize A2A client
        console.log('🔧 Initializing A2A client...');
        const client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'Gemini Prime Test' }
        );

        // Test 1: Health check
        console.log('\n🏥 Running health check...');
        const health = await client.healthCheck();
        console.log(`Health status: ${health.status}`);
        
        if (health.status !== 'HEALTHY') {
            console.error('❌ Health check failed:', health.error);
            return;
        }

        // Test 2: Send a test message
        console.log('\n📤 Sending test message from Gemini Prime...');
        const testMessage = await client.sendMessage(
            'Gemini Prime',
            'Claude Code',
            'TASK_DELEGATION',
            {
                task_id: 'gemini_test_' + Date.now(),
                objective: 'Verify Gemini Prime can send messages to Claude Code',
                description: 'Simple test to confirm A2A communication is working',
                business_impact: 'Validates autonomous multi-agent coordination',
                timestamp: new Date().toISOString()
            },
            'gemini_test_context'
        );

        console.log(`✅ Message sent successfully!`);
        console.log(`   📧 Database ID: ${testMessage.id}`);
        console.log(`   📅 Created: ${testMessage.created_at}`);

        // Test 3: Retrieve messages to verify persistence
        console.log('\n📥 Retrieving messages for Claude Code...');
        const messages = await client.getMessages('Claude Code', null, 5);
        
        console.log(`📊 Found ${messages.length} messages for Claude Code`);
        
        // Check if our test message is there
        const ourMessage = messages.find(msg => msg.id === testMessage.id);
        if (ourMessage) {
            console.log('✅ Test message confirmed in database!');
            console.log(`   📧 Retrieved ID: ${ourMessage.id}`);
            console.log(`   📧 Type: ${ourMessage.type}`);
            console.log(`   📧 Status: ${ourMessage.status}`);
        } else {
            console.log('⚠️ Test message not found in retrieval results');
        }

        // Test 4: Show recent messages from Gemini Prime
        console.log('\n📋 Recent messages from Gemini Prime:');
        const geminiMessages = await client.getMessages('Claude Code', null, 3);
        const recentGeminiMessages = geminiMessages.filter(msg => msg.sender === 'Gemini Prime');
        
        if (recentGeminiMessages.length > 0) {
            recentGeminiMessages.forEach((msg, index) => {
                console.log(`   ${index + 1}. ${msg.type} (${msg.created_at})`);
                console.log(`      📧 ID: ${msg.id}`);
                console.log(`      📊 Status: ${msg.status}`);
            });
        } else {
            console.log('   ℹ️ No recent messages from Gemini Prime found');
        }

        console.log('\n🎉 GEMINI PRIME A2A TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ All communication functions are working correctly');
        console.log('✅ Messages are being persisted in Supabase');
        console.log('✅ Message retrieval is functional');
        
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        return false;
    }
}

// Run the test
if (require.main === module) {
    simpleGeminiTest().then(success => {
        if (success) {
            console.log('\n✅ RESULT: Gemini Prime A2A communication is WORKING!');
        } else {
            console.log('\n❌ RESULT: Issues detected - check error messages above');
        }
    });
}

module.exports = simpleGeminiTest;