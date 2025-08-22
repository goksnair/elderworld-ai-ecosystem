// Live Database Table Creation Script
// Creates agent_messages table for immediate deployment

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

async function createTableNow() {
    console.log('🗄️ CREATING AGENT_MESSAGES TABLE LIVE...\n');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase configuration');
        return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('1️⃣ Executing table creation SQL...');

        // Execute the table creation using Supabase RPC or direct SQL
        // First, let's try to create via direct INSERT to see if we can execute SQL
        
        // Check if table exists first
        const { data: existingData, error: checkError } = await supabase
            .from('agent_messages')
            .select('id')
            .limit(1);

        if (checkError && checkError.code === 'PGRST204') {
            console.log('❌ Table does not exist. Need to create via Supabase dashboard.');
            console.log('\n🔧 MANUAL SETUP REQUIRED:');
            console.log('1. Go to https://supabase.com/dashboard');
            console.log('2. Select your project');
            console.log('3. Go to SQL Editor');
            console.log('4. Copy and paste this SQL:\n');

            const sql = `-- Agent Messages Table for A2A Communication
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id VARCHAR(50) PRIMARY KEY,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User')),
    recipient VARCHAR(50) NOT NULL CHECK (recipient IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All')),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'TASK_DELEGATION', 'TASK_ACCEPTED', 'PROGRESS_UPDATE', 'TASK_COMPLETED',
        'BLOCKER_REPORT', 'REQUEST_FOR_INFO', 'STRATEGIC_QUERY', 
        'BUSINESS_IMPACT_REPORT', 'ERROR_NOTIFICATION'
    )),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    context_id VARCHAR(100),
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACKNOWLEDGED', 'PROCESSED')),
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON public.agent_messages(sender);
CREATE INDEX IF NOT EXISTS idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at DESC);

-- Enable RLS for security
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role access
CREATE POLICY "Allow service role access" ON public.agent_messages FOR ALL USING (true);

-- Test insert
INSERT INTO public.agent_messages (
    id, sender, recipient, type, payload, context_id
) VALUES (
    'setup_test_' || extract(epoch from now())::bigint,
    'Claude Code',
    'Gemini Prime',
    'TASK_DELEGATION',
    '{"task_id": "table_setup", "objective": "Database ready for autonomous operations", "business_impact": "Enables ₹500Cr revenue system"}'::jsonb,
    'setup_validation'
);`;

            console.log(sql);
            console.log('\n5. Click "Run" to execute');
            console.log('\nAfter creating the table, press ENTER to continue...');
            
            // Wait for user input
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise(resolve => {
                readline.question('Press ENTER after creating the table in Supabase dashboard: ', () => {
                    readline.close();
                    resolve();
                });
            });

            // Test again
            const { data: testData, error: testError } = await supabase
                .from('agent_messages')
                .select('id')
                .limit(1);

            if (testError) {
                throw new Error('Table creation verification failed: ' + testError.message);
            }

            console.log('✅ Table exists and is accessible!');
            return true;

        } else {
            console.log('✅ Table already exists and is accessible');
            console.log(`   Found ${existingData?.length || 0} existing messages`);
            return true;
        }

    } catch (error) {
        console.error('❌ Table setup error:', error.message);
        return false;
    }
}

createTableNow().then(success => {
    if (success) {
        console.log('\n✅ DATABASE READY - Proceeding to live test!');
        process.exit(0);
    } else {
        console.log('\n❌ Database setup incomplete');
        process.exit(1);
    }
});