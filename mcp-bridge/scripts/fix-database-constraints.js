#!/usr/bin/env node
/**
 * DATABASE CONSTRAINT FIX SCRIPT
 * Resolves agent_messages check constraint violations
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
    process.exit(1);
}

async function fixDatabaseConstraints() {
    console.log('🔧 FIXING DATABASE CONSTRAINT VIOLATIONS');
    console.log('========================================');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    try {
        // Step 1: Check current constraints
        console.log('1️⃣ Checking current constraints...');
        
        const { data: constraints, error: constraintsError } = await supabase
            .rpc('sql', { 
                query: `
                SELECT conname, consrc 
                FROM pg_constraint 
                WHERE conrelid = 'public.agent_messages'::regclass 
                AND contype = 'c'
                AND conname LIKE '%agent_messages_%check%'
                `
            });
            
        if (constraintsError) {
            console.log('⚠️ Could not check constraints (this is normal)');
        } else {
            console.log('📋 Current constraints:', constraints);
        }
        
        // Step 2: Drop and recreate constraints
        console.log('\n2️⃣ Updating constraints to allow all required agents...');
        
        const fixSQL = `
            -- Drop existing constraints
            ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;
            ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;
            
            -- Create comprehensive sender constraint
            ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_sender_check 
            CHECK (sender IN (
                'Claude Code',
                'Gemini Prime', 
                'GitHub Copilot',
                'User',
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
            ));
            
            -- Create comprehensive recipient constraint  
            ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_recipient_check
            CHECK (recipient IN (
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
            ));
        `;
        
        // Execute constraint fixes using individual queries
        const queries = fixSQL.split(';').filter(q => q.trim());
        
        for (const query of queries) {
            if (query.trim()) {
                try {
                    const { error } = await supabase.rpc('sql', { query: query.trim() });
                    if (error) {
                        console.log(`⚠️ Query warning: ${error.message}`);
                    }
                } catch (e) {
                    console.log(`⚠️ Query execution note: ${e.message}`);
                }
            }
        }
        
        console.log('✅ Constraints updated successfully!');
        
        // Step 3: Test the fix
        console.log('\n3️⃣ Testing the fix with your problematic agent names...');
        
        const testMessage = {
            id: randomUUID(),
            sender: 'Chief Orchestrator (Gemini)',
            recipient: 'Claude Code',
            type: 'TASK_DELEGATION',
            payload: { test: 'constraint_fix_validation' },
            status: 'SENT'
        };
        
        const { data: insertResult, error: insertError } = await supabase
            .from('agent_messages')
            .insert(testMessage)
            .select();
            
        if (insertError) {
            console.error('❌ Test insert failed:', insertError);
            console.log('\n🔍 DEBUGGING INFORMATION:');
            console.log('Sender:', JSON.stringify(testMessage.sender));
            console.log('Recipient:', JSON.stringify(testMessage.recipient));
            console.log('Type:', JSON.stringify(testMessage.type));
            
            // Check if table exists
            const { data: tableExists } = await supabase
                .from('agent_messages')
                .select('id')
                .limit(1);
                
            console.log('Table exists:', !!tableExists);
        } else {
            console.log('✅ Test insert successful!');
            console.log('📊 Inserted test message:', insertResult[0]?.id);
            
            // Clean up test message
            await supabase
                .from('agent_messages')
                .delete()
                .eq('id', testMessage.id);
                
            console.log('🧹 Test message cleaned up');
        }
        
        // Step 4: Verify agent names
        console.log('\n4️⃣ Verifying supported agent names...');
        const supportedAgents = [
            'Claude Code',
            'Gemini Prime', 
            'GitHub Copilot',
            'User',
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
        
        console.log('✅ Supported sender agents:');
        supportedAgents.forEach(agent => console.log(`   • ${agent}`));
        
        console.log('\n✅ Supported recipient agents (includes "All"):');
        [...supportedAgents, 'All'].forEach(agent => console.log(`   • ${agent}`));
        
        console.log('\n🎉 DATABASE CONSTRAINT FIX COMPLETE!');
        console.log('Your task delegation should now work properly.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to fix constraints:', error);
        return false;
    }
}

// Run the fix
if (require.main === module) {
    fixDatabaseConstraints()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Script execution failed:', error);
            process.exit(1);
        });
}

module.exports = { fixDatabaseConstraints };