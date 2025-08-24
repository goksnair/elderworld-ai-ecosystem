require('dotenv').config();
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
// Using built-in Node.js fetch (v18+)

const MCP_BRIDGE_URL = 'http://localhost:3050';

class ClaudeAgentRunner {
    constructor(agentName, port) {
        this.agentName = agentName;
        this.port = port;
        this.endpoint = `http://localhost:${port}`;
        this.agentDefinition = null;
        this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        this.app = express();
        this.app.use(express.json());
    }

    async initialize() {
        const agentPath = path.join(__dirname, '.claude', 'agents', `${this.agentName}.md`);
        try {
            const fileContent = await fs.readFile(agentPath, 'utf8');
            this.agentDefinition = this.parseAgentDefinition(fileContent);
            console.log(`[${this.agentName}] Agent initialized. Role: ${this.agentDefinition.description}`);
        } catch (error) {
            console.error(`[${this.agentName}] Error initializing agent: ${error.message}`);
            process.exit(1);
        }

        this.app.post('/message', this.handleIncomingMessage.bind(this));
    }

    parseAgentDefinition(content) {
        const parts = content.split('---');
        if (parts.length < 3) {
            throw new Error('Invalid agent definition format.');
        }
        const yamlPart = parts[1];
        const promptPart = parts[2];
        
        const descriptionMatch = yamlPart.match(/description:([\s\S]*?)tools:/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : 'No description found.';
        
        return {
            description,
            prompt: promptPart.trim()
        };
    }

    async registerWithBridge() {
        try {
            const response = await fetch(`${MCP_BRIDGE_URL}/a2a/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId: this.agentName, endpoint: `${this.endpoint}/message` }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Registration failed');
            }
            console.log(`[${this.agentName}] Successfully registered with MCP Bridge at ${this.endpoint}`);
        } catch (error) {
            console.error(`[${this.agentName}] Could not register with MCP Bridge: ${error.message}`);
            // Retry registration after a delay
            setTimeout(() => this.registerWithBridge(), 5000);
        }
    }

    async handleIncomingMessage(req, res) {
        const message = req.body;
        console.log(`[${this.agentName}] Received message:`, message);

        // Immediately acknowledge receipt
        res.status(200).json({ status: 'acknowledged' });

        // Process the task asynchronously
        this.processTask(message);
    }

    async processTask(message) {
        const { from, type, payload } = message;
        if (type !== 'TASK_DELEGATION') return;

        const { taskId, context } = payload;
        const taskFile = context?.taskFile;
        console.log(`[${this.agentName}] Task ${taskId} received.`);
        
        if (!taskFile) {
            throw new Error(`No task file specified in context: ${JSON.stringify(context)}`);
        }
        
        await this.sendAcknowledgement(taskId, 'TASK_ACCEPTED', from);

        try {
            const taskContent = await fs.readFile(path.join(__dirname, taskFile), 'utf8');
            const fullPrompt = `${this.agentDefinition.prompt}\n\nCURRENT TASK:\n${taskContent}`;

            const response = await this.anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2048,
                messages: [{ role: 'user', content: fullPrompt }]
            });

            const result = response.content[0].text;
            console.log(`[${this.agentName}] Task ${taskId} processed. Result: ${result.substring(0, 100)}...`);
            
            await this.sendAcknowledgement(taskId, 'TASK_COMPLETED', from, result);
            console.log(`[${this.agentName}] Task ${taskId} completed.`);

        } catch (error) {
            console.error(`[${this.agentName}] Error handling task ${taskId}: ${error.message}`);
            await this.sendAcknowledgement(taskId, 'TASK_ERROR', from);
        }
    }

    async sendAcknowledgement(taskId, status, recipient, result = null) {
        let payload = { taskId };
        
        // Add required fields based on message type
        switch (status) {
            case 'TASK_ACCEPTED':
                payload.estimatedCompletion = new Date(Date.now() + 3600 * 1000).toISOString();
                break;
            case 'TASK_COMPLETED':
                payload.result = result || 'Task completed successfully';
                payload.completedAt = new Date().toISOString();
                break;
            case 'TASK_ERROR':
                payload.reason = result || 'Task processing error';
                break;
        }
        
        try {
            await fetch(`${MCP_BRIDGE_URL}/a2a/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: this.agentName,
                    to: recipient,
                    type: status,
                    payload: payload
                }),
            });
            console.log(`[${this.agentName}] Sent ${status} for task ${taskId}`);
        } catch (error) {
            console.error(`[${this.agentName}] Failed to send ${status}: ${error.message}`);
        }
    }

    async start() {
        await this.initialize();
        this.app.listen(this.port, async () => {
            console.log(`[${this.agentName}] Agent server listening on port ${this.port}`);
            await this.registerWithBridge();
        });
    }
}

if (require.main === module) {
    const agentName = process.argv[2];
    const port = parseInt(process.argv[3], 10);

    if (!agentName || !port) {
        console.error("Usage: node run_claude_agent.js <agent-name> <port>");
        process.exit(1);
    }

    const agentRunner = new ClaudeAgentRunner(agentName, port);
    agentRunner.start();
}
