#!/usr/bin/env node
/**
 * CONSTRAINT ISSUE DIAGNOSTIC SCRIPT
 * Helps identify exactly what's causing the constraint violation
 */

require('dotenv').config();
const A2ASupabaseClient = require('../services/a2a-supabase-client');

async function diagnoseIssue() {
    console.log('🔍 DIAGNOSING A2A CONSTRAINT VIOLATION ISSUE');
    console.log('=============================================');
    
    // Step 1: Environment check
    console.log('\n1️⃣ ENVIRONMENT CHECK:');
    console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.log('\n❌ Environment variables missing. Please check your .env file.');
        return false;
    }
    
    // Step 2: Test A2A Client initialization
    console.log('\n2️⃣ A2A CLIENT INITIALIZATION:');
    try {
        const client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'diagnostic-tool' }
        );
        console.log('✅ A2A Client initialized successfully');
        
        // Step 3: Health check
        console.log('\n3️⃣ DATABASE CONNECTIVITY:');
        const health = await client.healthCheck();
        console.log(`Status: ${health.status}`);
        if (health.error) {
            console.log(`Error: ${health.error}`);
        }
        
        // Step 4: Test the exact message from your workflow
        console.log('\n4️⃣ TESTING YOUR EXACT MESSAGE:');
        
        const testCases = [
            {
                name: 'Your Current Setup',
                sender: 'Chief Orchestrator (Gemini)',
                recipient: 'Claude Code',
                type: 'TASK_DELEGATION',
                payload: {
                    task_name: 'test_task',
                    script: 'test_script'
                }
            },
            {
                name: 'Alternative Agent Name',
                sender: 'Gemini Prime',
                recipient: 'Claude Code', 
                type: 'TASK_DELEGATION',
                payload: {
                    task_name: 'test_task',
                    script: 'test_script'
                }
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`\n   Testing: ${testCase.name}`);
            console.log(`   Sender: "${testCase.sender}"`);
            console.log(`   Recipient: "${testCase.recipient}"`);
            
            try {
                // First test validation only
                const message = {
                    sender: testCase.sender,
                    recipient: testCase.recipient,
                    type: testCase.type,
                    payload: testCase.payload
                };
                
                client.validateMessage(message);
                console.log('   ✅ Client validation passed');
                
                // Try actual send (this is where constraint violation occurs)
                await client.sendMessage(
                    testCase.sender,
                    testCase.recipient,
                    testCase.type,
                    testCase.payload,
                    `diagnostic_${Date.now()}`
                );
                
                console.log('   ✅ Message sent successfully!');
                
            } catch (error) {
                console.log('   ❌ Failed:', error.message);
                
                if (error.message.includes('check constraint')) {
                    console.log('   🔍 This is a database constraint violation');
                    console.log('   💡 The database does not allow this agent name');
                } else if (error.message.includes('Invalid agent name')) {
                    console.log('   🔍 This is a client validation error');
                    console.log('   💡 The A2A client does not recognize this agent');
                } else {
                    console.log('   🔍 Unexpected error type');
                }
            }
        }
        
        // Step 5: Show valid agent names
        console.log('\n5️⃣ VALID AGENT NAMES (from A2A client):');
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
        
        validAgents.forEach(agent => {
            console.log(`   • "${agent}"`);
        });
        
        // Step 6: Recommendations
        console.log('\n6️⃣ RECOMMENDATIONS:');
        console.log('   1. Run the database constraint fix:');
        console.log('      node scripts/fix-database-constraints.js');
        console.log('');
        console.log('   2. Or manually update your database with:');
        console.log('      psql -f sql/fix-agent-constraints.sql');
        console.log('');
        console.log('   3. Alternatively, change your Python script to use:');
        console.log('      sender = "Gemini Prime"  # instead of "Chief Orchestrator (Gemini)"');
        
        return true;
        
    } catch (error) {
        console.log(`❌ Client initialization failed: ${error.message}`);
        return false;
    }
}

// Run diagnostics
if (require.main === module) {
    diagnoseIssue()
        .then(success => {
            console.log(`\n${success ? '✅ Diagnostics complete' : '❌ Diagnostics failed'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Diagnostic script failed:', error);
            process.exit(1);
        });
}

module.exports = { diagnoseIssue };