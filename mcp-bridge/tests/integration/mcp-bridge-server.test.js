/**
 * Integration Tests for MCP Bridge Server
 * Tests the complete server functionality including all endpoints and services
 */

const request = require('supertest');
const MCPBridgeServer = require('../../server');

// Mock the API wrappers
jest.mock('../../api-wrappers/github-wrapper');
jest.mock('../../api-wrappers/vercel-wrapper');
jest.mock('../../api-wrappers/railway-wrapper');
jest.mock('../../api-wrappers/supabase-wrapper');
jest.mock('../../utils/credential-manager');
jest.mock('../../communication/a2a-layer');

const MockGitHubWrapper = require('../../api-wrappers/github-wrapper');
const MockVercelWrapper = require('../../api-wrappers/vercel-wrapper');
const MockRailwayWrapper = require('../../api-wrappers/railway-wrapper');
const MockSupabaseWrapper = require('../../api-wrappers/supabase-wrapper');
const MockCredentialManager = require('../../utils/credential-manager');
const MockA2ALayer = require('../../communication/a2a-layer');

describe('MCP Bridge Server Integration Tests', () => {
    let server;
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    beforeAll(async () => {
        // Mock credential manager
        MockCredentialManager.mockImplementation(() => ({
            getCredential: jest.fn().mockResolvedValue('mock-credential'),
            healthCheck: jest.fn().mockResolvedValue({ success: true })
        }));

        // Mock A2A layer
        MockA2ALayer.mockImplementation(() => ({
            getStatus: jest.fn().mockReturnValue({ status: 'active' }),
            sendMessage: jest.fn().mockResolvedValue({ success: true }),
            getMessages: jest.fn().mockResolvedValue([]),
            broadcast: jest.fn().mockResolvedValue({ success: true }),
            healthCheck: jest.fn().mockResolvedValue({ success: true })
        }));

        // Mock API wrappers
        MockGitHubWrapper.mockImplementation(() => ({
            healthCheck: jest.fn().mockResolvedValue({ success: true, data: { user: 'test-user' } }),
            getRepository: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { name: 'test-repo', full_name: 'owner/test-repo' } 
            }),
            createOrUpdateFile: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { content: { sha: 'new-sha' } } 
            }),
            createPullRequest: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { number: 1, title: 'Test PR' } 
            })
        }));

        MockVercelWrapper.mockImplementation(() => ({
            healthCheck: jest.fn().mockResolvedValue({ success: true, data: { user: 'test-user' } }),
            listProjects: jest.fn().mockResolvedValue({ 
                success: true, 
                data: [{ id: 'proj1', name: 'test-project' }] 
            }),
            createDeployment: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { id: 'dep1', url: 'https://test.vercel.app' } 
            }),
            getDeploymentStatus: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { id: 'dep1', state: 'READY' } 
            })
        }));

        MockRailwayWrapper.mockImplementation(() => ({
            healthCheck: jest.fn().mockResolvedValue({ success: true, data: { user: 'test-user' } }),
            listProjects: jest.fn().mockResolvedValue({ 
                success: true, 
                data: [{ id: 'proj1', name: 'test-project' }] 
            }),
            restartService: jest.fn().mockResolvedValue({ 
                success: true, 
                data: { restarted: true } 
            })
        }));

        MockSupabaseWrapper.mockImplementation(() => ({
            healthCheck: jest.fn().mockResolvedValue({ success: true, data: { connected: true } }),
            select: jest.fn().mockResolvedValue({ 
                success: true, 
                data: [{ id: 1, name: 'test-record' }] 
            }),
            insert: jest.fn().mockResolvedValue({ 
                success: true, 
                data: [{ id: 2, name: 'new-record' }] 
            })
        }));

        // Initialize server
        server = new MCPBridgeServer({ port: 0 }); // Use random port for testing
        await server.init();
        app = server.getApp();
    });

    afterAll(async () => {
        if (server && server.destroy) {
            await server.destroy();
        }
    });

    describe('Health Check Endpoint', () => {
        it('should return server health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('ok');
            expect(response.body.message).toBe('MCP Bridge Server is running and all critical services are healthy.');
            expect(response.body.services).toBeDefined();
            expect(response.body.a2a_layer).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
        });

        it('should include service health checks', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.services.github).toBeDefined();
            expect(response.body.services.vercel).toBeDefined();
            expect(response.body.services.railway).toBeDefined();
            expect(response.body.services.supabase).toBeDefined();
        });
    });

    describe('GitHub Endpoints', () => {
        it('should get repository information', async () => {
            const response = await request(app)
                .get('/github/repos/owner/test-repo')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('test-repo');
            expect(response.body.data.full_name).toBe('owner/test-repo');
        });

        it('should create/update file', async () => {
            const response = await request(app)
                .post('/github/repos/owner/test-repo/contents/test.txt')
                .send({
                    content: 'Test content',
                    message: 'Add test file'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.content.sha).toBe('new-sha');
        });

        it('should create pull request', async () => {
            const response = await request(app)
                .post('/github/repos/owner/test-repo/pulls')
                .send({
                    title: 'Test PR',
                    body: 'Test pull request',
                    head: 'feature-branch',
                    base: 'main'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.number).toBe(1);
            expect(response.body.data.title).toBe('Test PR');
        });

        it('should handle missing parameters', async () => {
            const response = await request(app)
                .post('/github/repos/owner/test-repo/pulls')
                .send({
                    title: 'Test PR'
                    // Missing required fields
                })
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Vercel Endpoints', () => {
        it('should list projects', async () => {
            const response = await request(app)
                .get('/vercel/projects')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('test-project');
        });

        it('should create deployment', async () => {
            const response = await request(app)
                .post('/vercel/deployments')
                .send({
                    name: 'test-deployment',
                    files: []
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.url).toBe('https://test.vercel.app');
        });

        it('should get deployment status', async () => {
            const response = await request(app)
                .get('/vercel/deployments/dep1/status')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.state).toBe('READY');
        });
    });

    describe('Railway Endpoints', () => {
        it('should list projects', async () => {
            const response = await request(app)
                .get('/railway/projects')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('test-project');
        });

        it('should restart service', async () => {
            const response = await request(app)
                .post('/railway/services/service1/restart')
                .send({
                    environmentId: 'env1'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.restarted).toBe(true);
        });
    });

    describe('Supabase Endpoints', () => {
        it('should execute select query', async () => {
            const response = await request(app)
                .post('/supabase/query/test_table')
                .send({
                    operation: 'select',
                    options: { limit: 10 }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('test-record');
        });

        it('should execute insert query', async () => {
            const response = await request(app)
                .post('/supabase/query/test_table')
                .send({
                    operation: 'insert',
                    data: { name: 'new-record' }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe('new-record');
        });

        it('should handle unsupported operations', async () => {
            const response = await request(app)
                .post('/supabase/query/test_table')
                .send({
                    operation: 'unsupported'
                })
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Unsupported operation');
        });
    });

    describe('A2A Communication Endpoints', () => {
        it('should send message', async () => {
            const response = await request(app)
                .post('/a2a/message')
                .send({
                    from: 'agent1',
                    to: 'agent2',
                    type: 'STATUS_REQUEST',
                    payload: { requestType: 'health' }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should get messages', async () => {
            const response = await request(app)
                .get('/a2a/messages/agent1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should broadcast message', async () => {
            const response = await request(app)
                .post('/a2a/broadcast')
                .send({
                    from: 'agent1',
                    type: 'ANNOUNCEMENT',
                    payload: { title: 'Test', message: 'Test broadcast' },
                    targets: ['agent2', 'agent3']
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Tool Chain Execution', () => {
        it('should execute tool chain successfully', async () => {
            const response = await request(app)
                .post('/tools/execute')
                .send({
                    tools: [
                        {
                            service: 'github',
                            operation: 'getRepository',
                            params: { owner: 'test', repo: 'test-repo' }
                        },
                        {
                            service: 'vercel',
                            operation: 'deploy',
                            params: { config: { name: 'test-app' } }
                        }
                    ],
                    context: { user: 'test-user' }
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.results).toHaveLength(2);
            expect(response.body.data.context).toBeDefined();
        });

        it('should handle unknown service in tool chain', async () => {
            const response = await request(app)
                .post('/tools/execute')
                .send({
                    tools: [
                        {
                            service: 'unknown',
                            operation: 'test',
                            params: {}
                        }
                    ]
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.results[0].result.success).toBe(false);
            expect(response.body.data.results[0].result.error).toContain('Unknown service');
        });

        it('should stop execution on critical failure', async () => {
            // Mock a failure for the first tool
            server.github.getRepository.mockResolvedValueOnce({ success: false, error: 'API Error' });

            const response = await request(app)
                .post('/tools/execute')
                .send({
                    tools: [
                        {
                            service: 'github',
                            operation: 'getRepository',
                            params: { owner: 'test', repo: 'test-repo' },
                            critical: true
                        },
                        {
                            service: 'vercel',
                            operation: 'deploy',
                            params: { config: { name: 'test-app' } }
                        }
                    ]
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            // Should only have 1 result due to critical failure stopping execution
            expect(response.body.data.results).toHaveLength(1);
            expect(response.body.data.results[0].result.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/a2a/message')
                .type('json')
                .send('{"invalid": json}')
                .expect(400);
        });

        it('should handle missing required fields', async () => {
            const response = await request(app)
                .post('/a2a/message')
                .send({
                    from: 'agent1'
                    // Missing required fields
                })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should handle service unavailable scenarios', async () => {
            // Temporarily disable the github service
            const originalGithub = server.github;
            server.github = null;

            const response = await request(app)
                .get('/github/repos/owner/repo')
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Cannot read properties of null');

            // Restore the service
            server.github = originalGithub;
        });
    });

    describe('CORS and Headers', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .options('/health')
                .expect(200);

            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
            expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
        });

        it('should handle preflight requests', async () => {
            await request(app)
                .options('/a2a/message')
                .expect(200);
        });
    });

    describe('Request Logging', () => {
        it('should log requests with agent ID header', async () => {
            await request(app)
                .get('/health')
                .set('X-Agent-ID', 'test-agent')
                .expect(200);

            // Verify logging occurred (would need to mock logger to test this properly)
        });
    });
});

module.exports = {};