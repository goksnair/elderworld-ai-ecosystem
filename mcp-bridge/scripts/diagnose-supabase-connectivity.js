#!/usr/bin/env node
/**
 * SUPABASE CONNECTIVITY DIAGNOSTIC TOOL
 * Comprehensive diagnosis of database connection issues
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function diagnoseSupabaseConnectivity() {
    console.log('🔍 SUPABASE CONNECTIVITY DIAGNOSIS');
    console.log('=================================');
    
    // Step 1: Environment Check
    console.log('\n1️⃣ ENVIRONMENT CONFIGURATION:');
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log(`SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
    if (supabaseUrl) {
        console.log(`   URL: ${supabaseUrl}`);
        // Extract project reference from URL
        const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (urlMatch) {
            console.log(`   Project Reference: ${urlMatch[1]}`);
        }
    }
    
    console.log(`SUPABASE_SERVICE_KEY: ${serviceKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`SUPABASE_ANON_KEY: ${anonKey ? '✅ Set' : '❌ Missing'}`);
    
    if (!supabaseUrl || !serviceKey) {
        console.log('\n❌ CRITICAL: Missing required environment variables');
        console.log('💡 Please check your .env file contains:');
        console.log('   SUPABASE_URL=https://your-project.supabase.co');
        console.log('   SUPABASE_SERVICE_KEY=your-service-key');
        return false;
    }
    
    // Step 2: Test Different Connection Methods
    console.log('\n2️⃣ CONNECTION METHOD TESTING:');
    
    const connectionTests = [
        {
            name: 'Service Key Connection',
            key: serviceKey,
            description: 'Full admin access with service role'
        }
    ];
    
    if (anonKey) {
        connectionTests.push({
            name: 'Anonymous Key Connection',
            key: anonKey,
            description: 'Public access with anon role'
        });
    }
    
    let workingConnection = null;
    
    for (const test of connectionTests) {
        console.log(`\n   Testing: ${test.name}`);
        console.log(`   Description: ${test.description}`);
        
        try {
            const supabase = createClient(supabaseUrl, test.key, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            
            // Test 1: Basic REST API connectivity
            console.log('   🔍 Testing REST API connectivity...');
            const { data: restTest, error: restError } = await supabase
                .from('_supabase_migrations')
                .select('version')
                .limit(1);
                
            if (!restError) {
                console.log('   ✅ REST API connection successful');
                workingConnection = { client: supabase, type: test.name };
            } else if (restError.message.includes('relation "_supabase_migrations" does not exist')) {
                console.log('   ✅ REST API connected (migrations table not found, but connection works)');
                workingConnection = { client: supabase, type: test.name };
            } else {
                console.log(`   ❌ REST API failed: ${restError.message}`);
            }
            
            // Test 2: Try accessing agent_messages table
            if (!restError || restError.message.includes('does not exist')) {
                console.log('   🔍 Testing agent_messages table access...');
                const { data: tableTest, error: tableError } = await supabase
                    .from('agent_messages')
                    .select('id')
                    .limit(1);
                    
                if (!tableError) {
                    console.log('   ✅ agent_messages table accessible');
                } else {
                    console.log(`   ⚠️ agent_messages table issue: ${tableError.message}`);
                    if (tableError.message.includes('does not exist')) {
                        console.log('   💡 Table needs to be created');
                    }
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Connection failed: ${error.message}`);
            
            // Analyze specific error types
            if (error.message.includes('shutdown') || error.message.includes('db_termination')) {
                console.log('   🚨 DATABASE TERMINATION DETECTED');
                console.log('   💡 Your Supabase project may be paused or terminated');
                console.log('   🔗 Go to https://supabase.com/dashboard to check project status');
            } else if (error.message.includes('Invalid API key')) {
                console.log('   🔑 API key is invalid or expired');
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                console.log('   🌐 Network connectivity issue or incorrect URL');
            }
        }
    }
    
    // Step 3: Project Status Analysis
    console.log('\n3️⃣ PROJECT STATUS ANALYSIS:');
    
    if (!workingConnection) {
        console.log('❌ NO WORKING CONNECTIONS FOUND');
        console.log('\n🔍 LIKELY CAUSES:');
        console.log('   1. Supabase project is PAUSED (most common)');
        console.log('   2. Project has been DELETED or SUSPENDED');
        console.log('   3. Network connectivity issues');
        console.log('   4. Invalid API keys');
        
        console.log('\n🛠️ IMMEDIATE ACTIONS REQUIRED:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Check if your project shows as "Paused"');
        console.log('   3. If paused, click "Resume project" or "Restore"');
        console.log('   4. Wait for project to resume (can take 1-2 minutes)');
        console.log('   5. Re-run this diagnostic');
        
        return false;
    } else {
        console.log(`✅ WORKING CONNECTION FOUND: ${workingConnection.type}`);
        
        // Step 4: Database Schema Check
        console.log('\n4️⃣ DATABASE SCHEMA VERIFICATION:');
        await checkDatabaseSchema(workingConnection.client);
        
        return true;
    }
}

async function checkDatabaseSchema(supabase) {
    try {
        // Check if agent_messages table exists and its structure
        console.log('🔍 Checking agent_messages table...');
        
        const { data: tableInfo, error: tableError } = await supabase
            .from('agent_messages')
            .select('*')
            .limit(1);
            
        if (tableError) {
            if (tableError.message.includes('does not exist')) {
                console.log('❌ agent_messages table does not exist');
                console.log('💡 You need to run the table creation script');
                console.log('   Command: node scripts/create-agent-messages-table.js');
            } else {
                console.log(`⚠️ Table access issue: ${tableError.message}`);
            }
            return false;
        }
        
        console.log('✅ agent_messages table exists');
        
        // Test constraint by trying to insert with known agent names
        console.log('🔍 Testing agent name constraints...');
        
        const testAgents = [
            'Claude Code',
            'Gemini Prime',
            'Chief Orchestrator (Gemini)',
            'ai-ml-specialist'
        ];
        
        for (const agent of testAgents) {
            try {
                const testMessage = {
                    id: `test_${Date.now()}_${Math.random()}`,
                    sender: agent,
                    recipient: 'Claude Code',
                    type: 'TASK_DELEGATION',
                    payload: { test: true },
                    status: 'SENT'
                };
                
                const { error: insertError } = await supabase
                    .from('agent_messages')
                    .insert(testMessage);
                    
                if (insertError) {
                    if (insertError.message.includes('check constraint')) {
                        console.log(`❌ Agent "${agent}" not allowed by constraints`);
                    } else {
                        console.log(`⚠️ Insert failed for "${agent}": ${insertError.message}`);
                    }
                } else {
                    console.log(`✅ Agent "${agent}" constraint test passed`);
                    // Clean up test message
                    await supabase
                        .from('agent_messages')
                        .delete()
                        .eq('id', testMessage.id);
                }
            } catch (error) {
                console.log(`⚠️ Test failed for "${agent}": ${error.message}`);
            }
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Schema check failed: ${error.message}`);
        return false;
    }
}

// Run diagnostics
if (require.main === module) {
    diagnoseSupabaseConnectivity()
        .then(success => {
            if (success) {
                console.log('\n🎉 DIAGNOSIS COMPLETE - Database is accessible!');
                console.log('You can now proceed with your task delegation.');
            } else {
                console.log('\n🚨 DIAGNOSIS COMPLETE - Action required to restore database access.');
                console.log('Please follow the recommended actions above.');
            }
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Diagnostic script failed:', error);
            process.exit(1);
        });
}

module.exports = { diagnoseSupabaseConnectivity };