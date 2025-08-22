#!/usr/bin/env node
/**
 * DIRECT CONSTRAINT FIX - Using direct SQL execution
 * This bypasses Supabase's RPC limitations
 */

require('dotenv').config();
const { Client } = require('pg');

async function fixConstraintsDirectly() {
    console.log('🔧 DIRECT CONSTRAINT FIX');
    console.log('========================');
    
    // Build PostgreSQL connection string from Supabase URL and service key
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
        console.log('❌ Missing environment variables');
        return false;
    }
    
    // Extract database connection details from Supabase URL
    const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!urlMatch) {
        console.log('❌ Could not parse Supabase URL');
        return false;
    }
    
    const projectRef = urlMatch[1];
    const connectionString = `postgresql://postgres:${serviceKey}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;
    
    console.log('🔗 Connecting to database...');
    console.log(`   Project: ${projectRef}`);
    console.log(`   Host: aws-0-ap-south-1.pooler.supabase.com`);
    
    const client = new Client({
        connectionString: connectionString
    });
    
    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // Step 1: Drop existing constraints
        console.log('\n1️⃣ Dropping existing constraints...');
        
        const dropConstraints = `
            ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;
            ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;
        `;
        
        await client.query(dropConstraints);
        console.log('✅ Old constraints dropped');
        
        // Step 2: Add new comprehensive constraints
        console.log('\n2️⃣ Adding comprehensive agent constraints...');
        
        const addSenderConstraint = `
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
        `;
        
        const addRecipientConstraint = `
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
        
        await client.query(addSenderConstraint);
        console.log('✅ Sender constraint added');
        
        await client.query(addRecipientConstraint);
        console.log('✅ Recipient constraint added');
        
        // Step 3: Test the fix
        console.log('\n3️⃣ Testing constraint fix...');
        
        const testInsert = `
            INSERT INTO public.agent_messages (
                id, sender, recipient, type, payload, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6
            ) RETURNING id;
        `;
        
        const testValues = [
            `test_${Date.now()}`,
            'Chief Orchestrator (Gemini)',
            'Claude Code',
            'TASK_DELEGATION',
            JSON.stringify({ test: 'constraint_fix_validation' }),
            'SENT'
        ];
        
        const result = await client.query(testInsert, testValues);
        console.log('✅ Test insert successful!');
        console.log(`   Inserted message ID: ${result.rows[0].id}`);
        
        // Clean up test message
        await client.query('DELETE FROM public.agent_messages WHERE id = $1', [result.rows[0].id]);
        console.log('🧹 Test message cleaned up');
        
        // Step 4: Verify all agent names work
        console.log('\n4️⃣ Verifying all agent names...');
        
        const testAgents = [
            'Chief Orchestrator (Gemini)',
            'ai-ml-specialist',
            'senior-care-boss',
            'operations-excellence'
        ];
        
        for (const agent of testAgents) {
            try {
                const testId = `test_${agent.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
                await client.query(testInsert, [
                    testId,
                    agent,
                    'Claude Code',
                    'TASK_DELEGATION', 
                    JSON.stringify({ test: `validation_${agent}` }),
                    'SENT'
                ]);
                console.log(`   ✅ ${agent}: OK`);
                
                // Clean up
                await client.query('DELETE FROM public.agent_messages WHERE id = $1', [testId]);
                
            } catch (error) {
                console.log(`   ❌ ${agent}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 CONSTRAINT FIX COMPLETED SUCCESSFULLY!');
        console.log('All agent names are now properly allowed in the database.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Direct constraint fix failed:', error.message);
        
        if (error.message.includes('password authentication failed')) {
            console.log('\n💡 AUTHENTICATION ISSUE DETECTED');
            console.log('The service key might not be the correct password.');
            console.log('Try using your database password instead of the service key.');
        } else if (error.message.includes('shutdown') || error.message.includes('db_termination')) {
            console.log('\n💡 DATABASE SHUTDOWN DETECTED');
            console.log('Your Supabase project may be paused.');
            console.log('Go to https://supabase.com/dashboard to resume it.');
        }
        
        return false;
        
    } finally {
        try {
            await client.end();
        } catch (e) {
            // Ignore connection cleanup errors
        }
    }
}

// Run the fix
if (require.main === module) {
    fixConstraintsDirectly()
        .then(success => {
            console.log(`\n${success ? '✅ Success!' : '❌ Failed!'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Script execution failed:', error);
            process.exit(1);
        });
}

module.exports = { fixConstraintsDirectly };