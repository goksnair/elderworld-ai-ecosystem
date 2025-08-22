// Quick script to check for GitHub task with specific context_id
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const A2ASupabaseClient = require('../services/a2a-supabase-client');

async function checkGitHubTask() {
    const client = new A2ASupabaseClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        { agentId: 'GitHub Task Inspector' }
    );
    
    const messages = await client.getMessages('Claude Code', null, 10);
    
    console.log('🔍 SEARCHING FOR GITHUB TASK (context_id: github_test_context)');
    console.log('===============================================================');
    
    let gitHubTask = null;
    let foundContextMatch = false;
    
    messages.forEach((msg, index) => {
        if (msg.context_id === 'github_test_context') {
            foundContextMatch = true;
            gitHubTask = msg;
            console.log(`⭐ FOUND GITHUB TASK!`);
            console.log(`   Message ID: ${msg.id}`);
            console.log(`   From: ${msg.sender}`);
            console.log(`   Status: ${msg.status}`);
            console.log(`   Created: ${msg.created_at}`);
            console.log(`   Context ID: ${msg.context_id}`);
            if (msg.payload) {
                console.log(`   Objective: ${msg.payload.objective || 'N/A'}`);
                console.log(`   Task ID: ${msg.payload.task_id || 'N/A'}`);
                console.log(`   Repository: ${msg.payload.repository || 'N/A'}`);
            }
        }
    });
    
    if (!foundContextMatch) {
        console.log('❌ NO GITHUB TASK WITH context_id "github_test_context" FOUND');
        console.log('');
        console.log('📋 All available messages:');
        messages.slice(0, 5).forEach((msg, index) => {
            console.log(`   ${index + 1}. From: ${msg.sender} | Type: ${msg.type} | Context: ${msg.context_id || 'null'}`);
            console.log(`      Created: ${msg.created_at} | Status: ${msg.status}`);
            if (msg.payload && msg.payload.objective) {
                console.log(`      Objective: ${msg.payload.objective}`);
            }
        });
    }
    
    return { found: foundContextMatch, task: gitHubTask };
}

checkGitHubTask().catch(console.error);