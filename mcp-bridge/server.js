
/**
 * MCP Bridge Server
 * Enhanced inter-agent communication and secure programmatic tool interaction
 * Integrates GitHub, Vercel, Railway, and Supabase via standardized API wrappers
 */

const express = require('express');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Import API wrappers
const GitHubWrapper = require('./api-wrappers/github-wrapper');
const VercelWrapper = require('./api-wrappers/vercel-wrapper');
const RailwayWrapper = require('./api-wrappers/railway-wrapper');
const SupabaseWrapper = require('./api-wrappers/supabase-wrapper');

// Import secure credential management
const SecureCredentialManager = require('./utils/credential-manager');

// Import A2A communication
const A2ACommunicationLayer = require('./communication/a2a-layer');

// Import comprehensive logger
const Logger = require('./utils/enhanced-logger');

class MCPBridgeServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 3050;
        this.logger = new Logger('MCP-Bridge', { level: 'info' });
        
        // Initialize credential manager
        this.credentialManager = new SecureCredentialManager({
            logger: this.logger
        });
        
        // Initialize A2A communication layer
        this.a2aLayer = new A2ACommunicationLayer({
            logger: this.logger
        });
        
        // API wrappers
        this.github = null;
        this.vercel = null;
        this.railway = null;
        this.supabase = null;
    }

    async init() {
        this.setupMiddleware();
        await this.initializeServices();
        this.setupRoutes();
        this.setupA2AEndpoints();
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Add request ID and logging
        this.app.use((req, res, next) => {
            req.id = crypto.randomUUID();
            this.logger.info(`${req.method} ${req.path}`, {
                requestId: req.id,
                ip: req.ip,
                userAgent: req.get('User-Agent')?.substring(0, 100)
            });
            next();
        });

        // Add CORS for agent communication
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent-ID');
            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }
            next();
        });
    }

    async initializeServices() {
        try {
            this.logger.info('Initializing external service wrappers...');

            // Initialize GitHub wrapper
            const githubToken = await this.credentialManager.getCredential('GITHUB_TOKEN');
            if (githubToken) {
                this.github = new GitHubWrapper(githubToken, {
                    logger: this.logger,
                    permissions: this.getServicePermissions('github')
                });
                this.logger.info('GitHub wrapper initialized');
            }

            // Initialize Vercel wrapper
            const vercelToken = await this.credentialManager.getCredential('DEPLOYMENT_PLATFORM_TOKEN');
            if (vercelToken) {
                this.vercel = new VercelWrapper(vercelToken, {
                    logger: this.logger,
                    permissions: this.getServicePermissions('vercel')
                });
                this.logger.info('Vercel wrapper initialized');
            }

            // Initialize Railway wrapper
            const railwayToken = await this.credentialManager.getCredential('DEPLOYMENT_PLATFORM_TOKEN');
            if (railwayToken) {
                this.railway = new RailwayWrapper(railwayToken, {
                    logger: this.logger,
                    permissions: this.getServicePermissions('railway')
                });
                this.logger.info('Railway wrapper initialized');
            }

            // Initialize Supabase wrapper
            const supabaseUrl = await this.credentialManager.getCredential('SUPABASE_URL');
            const supabaseKey = await this.credentialManager.getCredential('SUPABASE_SERVICE_KEY');
            if (supabaseUrl && supabaseKey) {
                this.supabase = new SupabaseWrapper(supabaseUrl, supabaseKey, {
                    logger: this.logger,
                    permissions: this.getServicePermissions('supabase')
                });
                this.logger.info('Supabase wrapper initialized');
            }

        } catch (error) {
            this.logger.error('Failed to initialize services:', error);
        }
    }

    getServicePermissions(service) {
        // Define granular permissions based on principle of least privilege
        const permissions = {
            github: {
                'repo:read': ['contents', 'metadata', 'issues', 'pulls'],
                'repo:write': ['contents', 'issues', 'pulls'],
                'workflow': ['read', 'write']
            },
            vercel: {
                'deployment:read': ['list', 'get', 'logs'],
                'deployment:write': ['create', 'cancel'],
                'project:read': ['list', 'get', 'env'],
                'project:write': ['create', 'update', 'env:set']
            },
            railway: {
                'project:read': ['list', 'get', 'services'],
                'service:write': ['create', 'restart'],
                'deployment:read': ['list', 'get', 'logs']
            },
            supabase: {
                'database:read': ['select', 'count'],
                'database:write': ['insert', 'update', 'delete'],
                'auth:read': ['getUser'],
                'storage:read': ['list', 'download']
            }
        };
        
        return permissions[service] || {};
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', async (req, res) => {
            const healthChecks = await this.performHealthChecks();
            const criticalServices = ['github', 'supabase'];
            const isHealthy = criticalServices.every(service => healthChecks[service]?.success);

            const status = isHealthy ? 200 : 503;
            const responseMessage = isHealthy ? 'MCP Bridge Server is running and all critical services are healthy.' : 'One or more critical services are unavailable.';

            res.status(status).json({
                status: isHealthy ? 'ok' : 'error',
                message: responseMessage,
                services: healthChecks,
                a2a_layer: this.a2aLayer.getStatus(),
                timestamp: new Date().toISOString()
            });
        });

        // GitHub endpoints
        this.setupGitHubEndpoints();
        
        // Vercel endpoints
        this.setupVercelEndpoints();
        
        // Railway endpoints
        this.setupRailwayEndpoints();
        
        // Supabase endpoints
        this.setupSupabaseEndpoints();
        
        // Tool orchestration endpoint
        this.app.post('/tools/execute', this.executeToolChain.bind(this));
    }

    setupGitHubEndpoints() {
        if (!this.github) return;

        this.app.get('/github/repos/:owner/:repo', async (req, res) => {
            try {
                const { owner, repo } = req.params;
                const result = await this.github.getRepository(owner, repo);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'GitHub repository fetch', req.id);
            }
        });

        this.app.post('/github/repos/:owner/:repo/contents/*', async (req, res) => {
            try {
                const { owner, repo } = req.params;
                const path = req.params[0];
                const { content, message, ...options } = req.body;
                
                const result = await this.github.createOrUpdateFile(owner, repo, path, content, message, options);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'GitHub file update', req.id);
            }
        });

        this.app.post('/github/repos/:owner/:repo/pulls', async (req, res) => {
            try {
                const { owner, repo } = req.params;
                const { title, body, head, base } = req.body;

                if (!title || !body || !head || !base) {
                    throw new Error('Missing required parameters for creating a pull request.');
                }
                
                const result = await this.github.createPullRequest(owner, repo, title, body, head, base);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'GitHub PR creation', req.id);
            }
        });
    }

    setupVercelEndpoints() {
        if (!this.vercel) return;

        this.app.get('/vercel/projects', async (req, res) => {
            try {
                const result = await this.vercel.listProjects(req.query);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Vercel projects list', req.id);
            }
        });

        this.app.post('/vercel/deployments', async (req, res) => {
            try {
                const result = await this.vercel.createDeployment(req.body);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Vercel deployment creation', req.id);
            }
        });

        this.app.get('/vercel/deployments/:id/status', async (req, res) => {
            try {
                const result = await this.vercel.getDeploymentStatus(req.params.id);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Vercel deployment status', req.id);
            }
        });
    }

    setupRailwayEndpoints() {
        if (!this.railway) return;

        this.app.get('/railway/projects', async (req, res) => {
            try {
                const result = await this.railway.listProjects();
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Railway projects list', req.id);
            }
        });

        this.app.post('/railway/services/:serviceId/restart', async (req, res) => {
            try {
                const { serviceId } = req.params;
                const { environmentId } = req.body;
                
                const result = await this.railway.restartService(environmentId, serviceId);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Railway service restart', req.id);
            }
        });
    }

    setupSupabaseEndpoints() {
        if (!this.supabase) return;

        this.app.post('/supabase/query/:table', async (req, res) => {
            try {
                const { table } = req.params;
                const { operation, data, filters, options } = req.body;
                
                let result;
                switch (operation) {
                    case 'select':
                        result = await this.supabase.select(table, options);
                        break;
                    case 'insert':
                        result = await this.supabase.insert(table, data, options);
                        break;
                    case 'update':
                        result = await this.supabase.update(table, data, filters, options);
                        break;
                    case 'delete':
                        result = await this.supabase.delete(table, filters, options);
                        break;
                    default:
                        throw new Error(`Unsupported operation: ${operation}`);
                }
                
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'Supabase operation', req.id);
            }
        });
    }

    setupA2AEndpoints() {
        // Agent-to-Agent communication endpoints
        this.app.post('/a2a/message', async (req, res) => {
            try {
                const { from, to, type, payload } = req.body;
                if (!from || !to || !type || !payload) {
                    throw new Error('Missing required fields for A2A message.');
                }
                const result = await this.a2aLayer.sendMessage(from, to, type, payload);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'A2A message sending', req.id);
            }
        });

        this.app.get('/a2a/messages/:agentId', async (req, res) => {
            try {
                const { agentId } = req.params;
                const messages = await this.a2aLayer.getMessages(agentId);
                res.json({ success: true, data: messages });
            } catch (error) {
                this.handleError(res, error, 'A2A message retrieval', req.id);
            }
        });

        this.app.post('/a2a/broadcast', async (req, res) => {
            try {
                const { from, type, payload, targets } = req.body;
                const result = await this.a2aLayer.broadcast(from, type, payload, targets);
                res.json(result);
            } catch (error) {
                this.handleError(res, error, 'A2A broadcast', req.id);
            }
        });

        this.app.post('/a2a/register', async (req, res) => {
            try {
                const { agentId, metadata } = req.body;
                const result = this.a2aLayer.registerAgent(agentId, metadata);
                res.json({ success: true, data: result });
            } catch (error) {
                this.handleError(res, error, 'A2A agent registration', req.id);
            }
        });
    }

    async executeToolChain(req, res) {
        try {
            const { tools, context } = req.body;
            const results = [];
            
            this.logger.info('Executing tool chain', { toolCount: tools.length });
            
            for (const tool of tools) {
                const { service, operation, params } = tool;
                let result;
                
                switch (service) {
                    case 'github':
                        result = await this.executeGitHubOperation(operation, params);
                        break;
                    case 'vercel':
                        result = await this.executeVercelOperation(operation, params);
                        break;
                    case 'railway':
                        result = await this.executeRailwayOperation(operation, params);
                        break;
                    case 'supabase':
                        result = await this.executeSupabaseOperation(operation, params);
                        break;
                    default:
                        result = { success: false, error: `Unknown service: ${service}` };
                }
                
                results.push({ tool, result });
                
                // Stop execution if a critical step fails
                if (!result.success && tool.critical) {
                    break;
                }
            }
            
            res.json({ success: true, data: { results, context } });
        } catch (error) {
            this.handleError(res, error, 'Tool chain execution', req.id);
        }
    }

    async executeGitHubOperation(operation, params) {
        if (!this.github) return { success: false, error: 'GitHub not configured' };
        
        switch (operation) {
            case 'getRepository':
                return await this.github.getRepository(params.owner, params.repo);
            case 'createPR':
                return await this.github.createPullRequest(params.owner, params.repo, params.title, params.body, params.head, params.base);
            default:
                return { success: false, error: `Unknown GitHub operation: ${operation}` };
        }
    }

    async executeVercelOperation(operation, params) {
        if (!this.vercel) return { success: false, error: 'Vercel not configured' };
        
        switch (operation) {
            case 'deploy':
                return await this.vercel.createDeployment(params.config);
            case 'getStatus':
                return await this.vercel.getDeploymentStatus(params.deploymentId);
            default:
                return { success: false, error: `Unknown Vercel operation: ${operation}` };
        }
    }

    async executeRailwayOperation(operation, params) {
        if (!this.railway) return { success: false, error: 'Railway not configured' };
        
        switch (operation) {
            case 'restart':
                return await this.railway.restartService(params.environmentId, params.serviceId);
            default:
                return { success: false, error: `Unknown Railway operation: ${operation}` };
        }
    }

    async executeSupabaseOperation(operation, params) {
        if (!this.supabase) return { success: false, error: 'Supabase not configured' };
        
        switch (operation) {
            case 'select':
                return await this.supabase.select(params.table, params.options);
            case 'insert':
                return await this.supabase.insert(params.table, params.data, params.options);
            default:
                return { success: false, error: `Unknown Supabase operation: ${operation}` };
        }
    }

    async performHealthChecks() {
        const checks = {};
        
        if (this.github) {
            checks.github = await this.github.healthCheck();
        }
        
        if (this.vercel) {
            checks.vercel = await this.vercel.healthCheck();
        }
        
        if (this.railway) {
            checks.railway = await this.railway.healthCheck();
        }
        
        if (this.supabase) {
            checks.supabase = await this.supabase.healthCheck();
        }
        
        return checks;
    }

    handleError(res, error, context, reqId) {
        const timestamp = new Date().toISOString();
        const logData = {
            requestId: reqId,
            context,
            timestamp,
            error: error.message,
            stack: error.stack
        };
        this.logger.error(`${context} failed:`, logData);

        res.status(500).json({
            success: false,
            error: error.message,
            context,
            requestId: reqId,
            timestamp
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.app.listen(this.port, (error) => {
                if (error) {
                    this.logger.error('Failed to start MCP Bridge Server:', error);
                    reject(error);
                } else {
                    this.logger.info(`MCP Bridge Server listening on http://localhost:${this.port}`);
                    this.logger.info('Health check available at http://localhost:3050/health');
                    resolve();
                }
            });
        });
    }

    getApp() {
        return this.app;
    }
}

// Initialize and start server if run directly
if (require.main === module) {
    const server = new MCPBridgeServer();
    server.init().then(() => {
        server.start().catch(error => {
            console.error('Failed to start server:', error);
            process.exit(1);
        });
    }).catch(error => {
        console.error('Failed to initialize server:', error);
        process.exit(1);
    });
}

module.exports = MCPBridgeServer;
