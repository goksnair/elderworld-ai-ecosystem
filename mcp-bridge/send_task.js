require('dotenv').config();

const MCP_BRIDGE_URL = 'http://localhost:3050';

async function sendTask() {
    try {
        const [,, from, to, taskId, taskFile] = process.argv;

        if (!from || !to || !taskId || !taskFile) {
            console.error('Usage: node send_task.js <from> <to> <taskId> <taskFile>');
            process.exit(1);
        }

        const payload = {
            taskId,
            description: `Task delegation for ${taskId}. Please process the instructions in the task file.`,
            priority: 'high',
            deadline: new Date(Date.now() + 3600 * 1000).toISOString(),
            context: {
                taskFile: taskFile
            }
        };

        const response = await fetch(`${MCP_BRIDGE_URL}/a2a/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from,
                to,
                type: 'TASK_DELEGATION',
                payload
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Failed to send task with status ${response.status}`);
        }

        console.log(`Task '${taskId}' delegated to ${to} via MCP Bridge. Message ID: ${data.messageId}`);

    } catch (error) {
        console.error('Failed to send task:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    sendTask();
}