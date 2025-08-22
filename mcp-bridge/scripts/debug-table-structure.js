// Debug current table structure to see what exists
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

async function debugTableStructure() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    try {
        console.log('🔍 Checking current agent_messages table structure...\n');
        
        // Try to get existing data to see current structure
        const { data, error } = await supabase
            .from('agent_messages')
            .select('*')
            .limit(5);
        
        if (error) {
            console.error('Table access error:', error);
            return;
        }
        
        console.log(`Found ${data.length} records in agent_messages table`);
        
        if (data.length > 0) {
            console.log('\nCurrent table columns:');
            Object.keys(data[0]).forEach(column => {
                console.log(`  - ${column}`);
            });
        } else {
            console.log('Table exists but has no records');
            
            // Try a test insert to see what columns are expected
            console.log('\n🧪 Testing table structure with minimal insert...');
            const testResult = await supabase
                .from('agent_messages')
                .insert({
                    id: 'structure_test',
                    sender: 'Claude Code',
                    recipient: 'Gemini Prime',
                    type: 'TASK_DELEGATION',
                    payload: { test: true }
                })
                .select();
                
            if (testResult.error) {
                console.error('Insert test failed:', testResult.error);
                console.log('\nThis tells us what columns are missing or wrong.');
            } else {
                console.log('✅ Basic structure works, context_id might be the issue');
                
                // Clean up test record
                await supabase
                    .from('agent_messages')
                    .delete()
                    .eq('id', 'structure_test');
            }
        }
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugTableStructure();