#!/usr/bin/env node
/**
 * DEBUG AI-ML-SPECIALIST COMMUNICATION ISSUE
 * Comprehensive testing and diagnosis
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

// Simple UUID generator
function generateUuid() {
    return crypto.randomUUID();
}

async function debugAiMlSpecialist() {
    console.log('🔧 DEBUGGING ai-ml-specialist COMMUNICATION');
    console.log('==========================================');
    
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        
        // Step 1: Verify delegation message exists
        console.log('1️⃣ Verifying delegation message...');
        
        const { data: delegationMsgs, error: delError } = await supabase
            .from('agent_messages')
            .select('*')
            .eq('sender', 'Chief Orchestrator (Gemini)')
            .eq('recipient', 'ai-ml-specialist')
            .eq('type', 'TASK_DELEGATION')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (delError) throw delError;
        
        if (delegationMsgs.length > 0) {
            const delMsg = delegationMsgs[0];
            console.log(`✅ Latest delegation found: ${delMsg.id}`);
            console.log(`   Timestamp: ${delMsg.created_at}`);
            console.log(`   Status: ${delMsg.status}`);
            console.log(`   Task: ${delMsg.payload.task_name}`);
        } else {
            console.log('❌ No delegation messages found');
            return;
        }
        
        // Step 2: Check if ai-ml-specialist can send messages
        console.log('\n2️⃣ Testing ai-ml-specialist constraint...');
        
        const testId = generateUuid();
        const testPayload = { 
            test: 'constraint_check',
            timestamp: new Date().toISOString(),
            task_id: 'aura-holistic-well-being-integration'
        };
        
        const { data: testInsert, error: constraintError } = await supabase
            .from('agent_messages')
            .insert({
                id: testId,
                sender: 'ai-ml-specialist',
                recipient: 'Chief Orchestrator (Gemini)',
                type: 'TASK_ACCEPTED',
                payload: testPayload,
                status: 'SENT'
            })
            .select();
            
        if (constraintError) {
            console.log(`❌ CONSTRAINT ERROR: ${constraintError.message}`);
            
            if (constraintError.message.includes('check constraint')) {
                console.log('\n🎯 ROOT CAUSE IDENTIFIED:');
                console.log('   ai-ml-specialist is NOT allowed in sender constraints');
                console.log('   This prevents TASK_ACCEPTED/PROGRESS_UPDATE responses');
                
                console.log('\n🛠️ MANUAL FIX REQUIRED:');
                console.log('Go to https://supabase.com/dashboard');
                console.log('SQL Editor → Run this query:');
                console.log('');
                console.log('ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;');
                console.log('ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_sender_check');
                console.log('CHECK (sender IN (');
                console.log("    'Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User',");
                console.log("    'Chief Orchestrator (Gemini)', 'ai-ml-specialist', 'mobile-product-head',");
                console.log("    'senior-care-boss', 'operations-excellence', 'market-intelligence',");
                console.log("    'product-innovation', 'partnership-development', 'compliance-quality',");
                console.log("    'finance-strategy'");
                console.log('));');
                
                return { success: false, issue: 'constraint', error: constraintError.message };
            }
        } else {
            console.log('✅ ai-ml-specialist constraint test passed');
            console.log(`✅ Test TASK_ACCEPTED sent: ${testInsert[0].id}`);
            
            // Step 3: Send test PROGRESS_UPDATE  
            console.log('\n3️⃣ Testing PROGRESS_UPDATE...');
            
            const progressId = generateUuid();
            const progressPayload = {
                task_id: 'aura-holistic-well-being-integration',
                status: 'IN_PROGRESS',
                progress: '25%',
                message: 'Started API development for wearable device integration',
                timestamp: new Date().toISOString()
            };
            
            const { data: progressInsert, error: progressError } = await supabase
                .from('agent_messages')
                .insert({
                    id: progressId,
                    sender: 'ai-ml-specialist',
                    recipient: 'Chief Orchestrator (Gemini)',
                    type: 'PROGRESS_UPDATE',
                    payload: progressPayload,
                    status: 'SENT'
                })
                .select();
                
            if (progressError) {
                console.log(`❌ PROGRESS_UPDATE failed: ${progressError.message}`);
            } else {
                console.log('✅ PROGRESS_UPDATE test passed');
                console.log(`✅ Test message sent: ${progressInsert[0].id}`);
            }
            
            // Step 4: Clean up test messages
            console.log('\n4️⃣ Cleaning up test messages...');
            await supabase.from('agent_messages').delete().eq('id', testId);
            if (progressInsert) {
                await supabase.from('agent_messages').delete().eq('id', progressId);
            }
            console.log('🧹 Test messages cleaned up');
            
            return { success: true, issue: null };
        }
        
    } catch (error) {
        console.error('❌ Debug error:', error.message);
        return { success: false, issue: 'error', error: error.message };
    }
}

// Run the debug
if (require.main === module) {
    debugAiMlSpecialist()
        .then(result => {
            console.log('\n📊 DEBUG SUMMARY:');
            console.log('==================');
            
            if (result.success) {
                console.log('✅ ai-ml-specialist can send A2A messages');
                console.log('💡 Issue may be that ai-ml-specialist agent is not monitoring for tasks');
                console.log('🔧 Next step: Implement ai-ml-specialist agent logic');
            } else {
                console.log(`❌ Communication blocked: ${result.issue}`);
                console.log('🛠️ Fix database constraints first, then test again');
            }
            
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Debug script failed:', error);
            process.exit(1);
        });
}

module.exports = { debugAiMlSpecialist };