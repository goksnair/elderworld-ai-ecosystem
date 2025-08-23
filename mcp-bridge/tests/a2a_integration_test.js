const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

describe('A2A Integration Test', () => {
    let serverProcess;
    let serverLogs = '';

    beforeAll((done) => {
        const serverPath = path.join(__dirname, '..', 'server.js');
        serverProcess = spawn('node', [serverPath], {
            env: { ...process.env, PORT: 3051 } // Use a different port for testing
        });

        serverProcess.stdout.on('data', (data) => {
            serverLogs += data.toString();
            if (serverLogs.includes('MCP Bridge Server listening on')) {
                done();
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`Server stderr: ${data}`);
        });

        serverProcess.on('close', (code) => {
            console.log(`Server process exited with code ${code}`);
        });
    });

    afterAll(() => {
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    it('should send a message between agents and return a 200 OK status', async () => {
        const sourceAgent = 'test-source-agent';
        const targetAgent = 'test-target-agent';

        // Mock agents in the A2A layer
        await axios.post('http://localhost:3051/a2a/register', { agentId: sourceAgent });
        await axios.post('http://localhost:3051/a2a/register', { agentId: targetAgent });

        const message = {
            from: sourceAgent,
            to: targetAgent,
            type: 'TASK_DELEGATION',
            payload: {
                taskId: 'test-task-123',
                description: 'This is a test task.',
                priority: 'high',
                deadline: new Date(Date.now() + 3600000).toISOString()
            }
        };

        const response = await axios.post('http://localhost:3051/a2a/message', message);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.messageId).toBeDefined();

        // Check server logs for successful message receipt and forwarding
        expect(serverLogs).toContain(`Message sent: ${message.type}`);
        expect(serverLogs).toContain(`"from":"${sourceAgent}"`);
        expect(serverLogs).toContain(`"to":"${targetAgent}"`);
    });
});
