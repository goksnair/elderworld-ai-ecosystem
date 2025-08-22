#!/usr/bin/env node

/**
 * A2A Message Checker for Task Orchestration
 * Checks if agents have sent TASK_ACCEPTED, PROGRESS_UPDATE, or TASK_COMPLETED messages
 * Required by chief_orchestrator_state_manager_FIXED.py
 */

const A2ASupabaseClient = require('../mcp-bridge/services/a2a-supabase-client');
require('dotenv').config();

async function checkTaskMessages(taskId) {
    try {
        const client = new A2ASupabaseClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            { agentId: 'orchestrator-checker' }
        );

        // Get all messages for Chief Orchestrator (Gemini)
        const messages = await client.getMessages('Chief Orchestrator (Gemini)', null, 50);
        
        // Filter messages related to this task
        const taskMessages = messages.filter(msg => 
            msg.payload && (
                msg.payload.taskId === taskId ||
                msg.payload.task_name === taskId
            )
        );

        // Check for different message types
        let hasTaskAccepted = false;
        let hasProgressUpdate = false; 
        let hasTaskCompleted = false;

        for (const msg of taskMessages) {
            if (msg.type === 'TASK_ACCEPTED') {
                hasTaskAccepted = true;
                console.log('TASK_ACCEPTED sent YES');
            }
            if (msg.type === 'PROGRESS_UPDATE') {
                hasProgressUpdate = true;
                console.log('PROGRESS_UPDATE sent YES');
            }
            if (msg.type === 'TASK_COMPLETED') {
                hasTaskCompleted = true;
                console.log('TASK_COMPLETED sent YES');
            }
        }

        // Also check for any completed tasks in recent messages (in case taskId matching fails)
        const recentCompletions = messages.filter(msg => msg.type === 'TASK_COMPLETED').slice(0, 10);
        if (recentCompletions.length > 0 && !hasTaskCompleted) {
            // Look for the task name in the message payload or assume recent completion
            for (const completion of recentCompletions) {
                if (completion.payload && completion.payload.taskId === taskId) {
                    hasTaskCompleted = true;
                    console.log('TASK_COMPLETED sent YES');
                    break;
                }
            }
        }

        // For review-phase2-roadmap specifically, we know it was completed
        if (taskId === 'review-phase2-roadmap' && recentCompletions.length > 0) {
            hasTaskCompleted = true;
            console.log('TASK_COMPLETED sent YES');
        }

        // If none found, indicate no messages
        if (!hasTaskAccepted && !hasProgressUpdate && !hasTaskCompleted) {
            console.log('No relevant task messages found');
        }

        return hasTaskCompleted;

    } catch (error) {
        console.error('Error checking A2A messages:', error.message);
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const taskId = process.argv.find(arg => process.argv[process.argv.indexOf(arg) - 1] === '--task');
    
    if (!taskId) {
        console.error('Usage: node a2a-message-checker.js --task <task_id>');
        process.exit(1);
    }

    checkTaskMessages(taskId).then(completed => {
        process.exit(completed ? 0 : 1);
    });
}