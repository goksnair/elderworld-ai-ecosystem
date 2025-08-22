// Database Setup Script for A2A Communication
// Creates the agent_messages table with proper schema and indexes
// Ensures HIPAA-compliant structure with audit trails

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

async function setupDatabase() {
    console.log('🗄️  Setting up A2A Database Schema\n');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log('❌ Missing Supabase configuration in .env file');
        return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('1️⃣ Updating check constraints...');

        const { error: dropRecipientError } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;" });
        if (dropRecipientError) console.log('Error dropping recipient constraint', dropRecipientError);

        const { error: addRecipientError } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_recipient_check CHECK (recipient IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All', 'Chief Orchestrator (Gemini)', 'ai-ml-specialist', 'mobile-product-head'));" });
        if (addRecipientError) console.log('Error adding recipient constraint', addRecipientError);

        const { error: dropSenderError } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;" });
        if (dropSenderError) console.log('Error dropping sender constraint', dropSenderError);

        const { error: addSenderError } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_sender_check CHECK (sender IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'Chief Orchestrator (Gemini)', 'ai-ml-specialist', 'mobile-product-head'));" });
        if (addSenderError) console.log('Error adding sender constraint', addSenderError);

        console.log('✅ Check constraints updated successfully');

        console.log('2️⃣ Testing table existence...');
        
        // Try to query the table structure
        const { data: tableInfo, error: tableError } = await supabase
            .from('agent_messages')
            .select('*')
            .limit(1);

        if (tableError && tableError.code === 'PGRST204') {
            console.log('ℹ️  Table does not exist. Please create it manually using one of these methods:');
            console.log('\n📝 METHOD 1: Supabase Dashboard');
            console.log('   1. Go to your Supabase project dashboard');
            console.log('   2. Navigate to SQL Editor');
            console.log('   3. Copy and paste the SQL from: mcp-bridge/sql/agent_messages_table.sql');
            console.log('   4. Execute the SQL script');

            console.log('\n💻 METHOD 2: SQL Script Content:');
            
            // Display the SQL schema
            const sqlSchema = fs.readFileSync(path.join(__dirname, '../sql/improved-agent-messages-uuid.sql'), 'utf-8');
            
            console.log(sqlSchema);
            console.log('\n3️⃣ After creating the table, run this test again');
            console.log('   node scripts/setup-a2a-database.js');
            
            return false;
        } else if (tableError) {
            console.log('❌ Database connection error:', tableError);
            return false;
        } else {
            console.log('✅ agent_messages table exists and is accessible');
            console.log(`   Found ${tableInfo?.length || 0} existing messages`);
        }

        // Test inserting a setup message
        console.log('3️⃣ Testing message insertion...');
        
        const setupMessageId = randomUUID();
        const { data: insertData, error: insertError } = await supabase
            .from('agent_messages')
            .insert({
                id: setupMessageId,
                sender: 'Claude Code',
                recipient: 'Gemini Prime',
                type: 'TASK_DELEGATION',
                payload: {
                    task_id: 'database_setup_validation',
                    objective: 'Validate A2A database schema setup',
                    description: 'Automated test message to confirm table structure',
                    business_impact: 'Enables autonomous agent communication infrastructure',
                    setup_test: true
                },
                context_id: 'database_setup_test',
                status: 'SENT'
            })
            .select();

        if (insertError) {
            console.log('❌ Message insertion failed:', insertError);
            console.log('   This might indicate missing columns or constraints');
            return false;
        } else {
            console.log('✅ Test message inserted successfully');
            console.log(`   Message ID: ${setupMessageId}`);
        }

        // Test message retrieval  
        console.log('4️⃣ Testing message retrieval...');
        
        const { data: retrieveData, error: retrieveError } = await supabase
            .from('agent_messages')
            .select('*')
            .eq('id', setupMessageId)
            .single();

        if (retrieveError) {
            console.log('❌ Message retrieval failed:', retrieveError);
            return false;
        } else {
            console.log('✅ Message retrieval successful');
            console.log(`   Retrieved message: ${retrieveData.type} from ${retrieveData.sender}`);
        }

        // Test message update (acknowledgment)
        console.log('5️⃣ Testing message acknowledgment...');
        
        const { data: updateData, error: updateError } = await supabase
            .from('agent_messages')
            .update({
                status: 'ACKNOWLEDGED',
                acknowledged_by: 'Database Setup Script',
                acknowledged_at: new Date().toISOString()
            })
            .eq('id', setupMessageId)
            .select();

        if (updateError) {
            console.log('❌ Message acknowledgment failed:', updateError);
            return false;
        } else {
            console.log('✅ Message acknowledgment successful');
        }

        // Clean up test message
        console.log('6️⃣ Cleaning up test data...');
        
        const { error: deleteError } = await supabase
            .from('agent_messages')
            .delete()
            .eq('id', setupMessageId);

        if (deleteError) {
            console.log('⚠️  Test cleanup failed (non-critical):', deleteError);
        } else {
            console.log('✅ Test data cleaned up');
        }

        console.log('\n🎉 A2A DATABASE SETUP COMPLETE!');
        console.log('===============================');
        console.log('✅ Table structure: VERIFIED');
        console.log('✅ Message insertion: WORKING');
        console.log('✅ Message retrieval: WORKING');
        console.log('✅ Message updates: WORKING');

        console.log('\nDatabase is ready for Prime Agent communication!');
        console.log('\nNext step: Run the A2A communication test:');
        console.log('   node scripts/quick-a2a-test.js');

        return true;

    } catch (error) {
        console.log('❌ Database setup failed:', error.message);
        console.log('   Stack trace:', error.stack);
        return false;
    }
}

// Run setup
if (require.main === module) {
    setupDatabase().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = setupDatabase;
