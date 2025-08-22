const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY is not set in .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSimpleQuery() {
    console.log('🔗 Attempting to connect to Supabase...');
    try {
        const { data, error } = await supabase.from('agent_messages').select('*').order('timestamp', { ascending: false }).limit(5);

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return;
        }

        console.log('✅ Connection successful!');
        console.log('\nRecent messages for Gemini Prime:');
        if (data && data.length > 0) {
            data.forEach(msg => {
                console.log(`  ID: ${msg.id}`);
                console.log(`  Sender: ${msg.sender}`);
                console.log(`  Type: ${msg.type}`);
                console.log(`  Timestamp: ${msg.timestamp}`);
                console.log(`  Context: ${msg.context_id || 'N/A'}`);
                console.log('  ---');
            });
        } else {
            console.log('  No recent messages found.');
        }

    } catch (err) {
        console.error('❌ An unexpected error occurred:', err.message);
    }
}

runSimpleQuery();
