#!/usr/bin/env node

const A2ASupabaseClient = require('./services/a2a-supabase-client.js');
require('dotenv').config();

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
    process.exit(1);
}

async function sendTask() {
    try {
        const [,, sender, recipient, taskName, taskScript] = process.argv;

        if (!sender || !recipient || !taskName || !taskScript) {
            console.error('Usage: node send_task.js <sender> <recipient> <taskName> <taskScript>');
            process.exit(1);
        }

        const a2aClient = new A2ASupabaseClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                agentId: sender,
                tableName: 'agent_messages'
            }
        );

        const payload = {
            task_name: taskName,
            script: taskScript,
        };

        await a2aClient.sendMessage(
            sender,
            recipient,
            'TASK_DELEGATION',
            payload,
            `task_${Date.now()}`  // Context ID, not message ID - this is fine
        );

        console.log(`Task '${taskName}' delegated to ${recipient}`);

    } catch (error) {
        console.error('Failed to send task:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    sendTask();
}
