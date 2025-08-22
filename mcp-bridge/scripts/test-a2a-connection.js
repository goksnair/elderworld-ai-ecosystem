#!/usr/bin/env node
/**
 * A2A CONNECTION TEST SCRIPT
 * Tests Supabase connectivity and basic A2A functionality
 */

const A2ASupabaseClient = require('../services/a2a-supabase-client');
require('dotenv').config();

async function testA2AConnection() {
    console.log('🔍 Testing A2A Communication System...');
    
    try {
        // Test 1: Client initialization
        console.log('📡 Test 1: Client initialization...');
        const client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'test-agent' }
        );
        console.log('✅ Client initialized successfully');
        
        // Test 2: Basic connectivity
        console.log('🌐 Test 2: Basic Supabase connectivity...');
        const { data: tables, error: tablesError } = await client.supabase
            .from('agent_messages')
            .select('count', { count: 'exact', head: true });
        
        if (tablesError) {
            console.log(`❌ Supabase connectivity failed: ${tablesError.message}`);
            return false;
        }
        console.log('✅ Supabase connectivity verified');
        
        // Test 3: Message sending capability
        console.log('📤 Test 3: Message sending capability...');
        const testMessage = await client.sendMessage(
            'Claude Code',
            'senior-care-boss', 
            'STRATEGIC_QUERY',
            { test: true, query: 'Connection test', timestamp: new Date().toISOString() }
        );
        console.log('✅ Message sending successful');
        console.log(`📝 Message ID: ${testMessage.messageId}`);
        
        // Test 4: Message retrieval
        console.log('📥 Test 4: Message retrieval...');
        const messages = await client.getMessages('senior-care-boss');
        console.log(`✅ Message retrieval successful: ${messages.length} messages found`);
        
        // Test 5: Cleanup test message
        console.log('🧹 Test 5: Cleanup test message...');
        const { error: deleteError } = await client.supabase
            .from('agent_messages')
            .delete()
            .eq('message_id', testMessage.messageId);
            
        if (deleteError) {
            console.log(`⚠️ Cleanup warning: ${deleteError.message}`);
        } else {
            console.log('✅ Test message cleaned up');
        }
        
        console.log('');
        console.log('🎉 ALL A2A CONNECTION TESTS PASSED');
        console.log('✅ A2A Communication System is OPERATIONAL');
        return true;
        
    } catch (error) {
        console.log('');
        console.log('❌ A2A CONNECTION TEST FAILED');
        console.log(`💥 Error: ${error.message}`);
        console.log(`🔍 Stack: ${error.stack}`);
        return false;
    }
}

// CLI execution
if (require.main === module) {
    testA2AConnection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testA2AConnection };