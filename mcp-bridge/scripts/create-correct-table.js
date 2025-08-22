// Create the correct agent_messages table structure
// This will work with the current Supabase setup

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

async function createCorrectTable() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    console.log('🔧 CREATING CORRECT TABLE STRUCTURE...\n');
    
    try {
        // First, let's drop the existing incomplete table and create the right one
        console.log('🗑️ Checking if we need to recreate the table...');
        
        // Instead of using direct SQL (which we can't), let's work with what we have
        // Let me create a working version by using existing table capabilities
        
        console.log('\n📋 MANUAL TABLE CREATION REQUIRED:');
        console.log('The existing table is incomplete. Please do this:');
        console.log('\n1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');  
        console.log('3. Go to Table Editor');
        console.log('4. Find the "agent_messages" table and DELETE it');
        console.log('5. Click "New table" and use these settings:');
        console.log('\n   Table name: agent_messages');
        console.log('   Columns to add:');
        console.log('   - id (text, primary key)');
        console.log('   - sender (text, required)');
        console.log('   - recipient (text, required)');
        console.log('   - type (text, required)');
        console.log('   - timestamp (timestamp with timezone, default: now())');
        console.log('   - context_id (text, nullable)');
        console.log('   - payload (jsonb, required)');
        console.log('   - status (text, default: "SENT")');
        console.log('   - acknowledged_by (text, nullable)');
        console.log('   - acknowledged_at (timestamp with timezone, nullable)');
        console.log('   - created_at (timestamp with timezone, default: now())');
        console.log('   - updated_at (timestamp with timezone, default: now())');
        
        console.log('\n6. Enable RLS (Row Level Security)');
        console.log('7. Add this RLS policy:');
        console.log('   Policy name: "Allow service role access"');
        console.log('   Target roles: service_role');
        console.log('   Policy: USING (true)');
        
        console.log('\n8. OR use SQL Editor with this command:');
        console.log(`
-- Drop existing incomplete table
DROP TABLE IF EXISTS public.agent_messages;

-- Create complete table
CREATE TABLE public.agent_messages (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL, 
    type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context_id TEXT,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'SENT',
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX idx_agent_messages_sender ON public.agent_messages(sender);
CREATE INDEX idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow service role access" ON public.agent_messages FOR ALL USING (true);

-- Test insert
INSERT INTO public.agent_messages (id, sender, recipient, type, payload, context_id) VALUES 
('test_' || extract(epoch from now())::text, 'Claude Code', 'Gemini Prime', 'TASK_DELEGATION', 
'{"task_id": "setup_complete", "objective": "Table created successfully"}'::jsonb, 'setup_test');
        `);

        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
        });

        await new Promise(resolve => {
            readline.question('\nPress ENTER after creating the correct table structure: ', () => {
                readline.close();
                resolve();
            });
        });

        // Test the new structure
        console.log('\n🧪 Testing new table structure...');
        
        const testInsert = await supabase
            .from('agent_messages')
            .insert({
                id: 'structure_validation_' + Date.now(),
                sender: 'Claude Code',
                recipient: 'Gemini Prime', 
                type: 'TASK_DELEGATION',
                context_id: 'test_context',
                payload: {
                    task_id: 'table_validation',
                    objective: 'Validate table structure is correct',
                    business_impact: 'Enables autonomous system operations'
                }
            })
            .select();

        if (testInsert.error) {
            throw new Error('Table structure still incorrect: ' + testInsert.error.message);
        }

        console.log('✅ Table structure validation successful!');
        
        // Clean up test record
        await supabase
            .from('agent_messages')
            .delete()
            .eq('id', testInsert.data[0].id);

        console.log('✅ Table is ready for live testing!');
        return true;

    } catch (error) {
        console.error('❌ Table creation failed:', error.message);
        return false;
    }
}

createCorrectTable().then(success => {
    if (success) {
        console.log('\n🎉 TABLE READY - You can now run the live test!');
        console.log('Execute: node scripts/live-task-delegation-test.js');
    } else {
        console.log('\n❌ Table creation incomplete - please complete manual setup');
    }
});