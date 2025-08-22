/**
 * SENIOR CARE AI ECOSYSTEM - FAMILY COMMUNICATION PLATFORM DEPLOYMENT
 * Production deployment configuration and startup script
 * 
 * TEAM BETA DELIVERABLE - Production-ready deployment
 * Target: >95% uptime, auto-scaling, full monitoring
 */

const { FamilyCommunicationPlatform } = require('./family-platform-core');
const { FamilyCommunicationAPI } = require('./api-routes');
const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');
const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Production configuration
const PRODUCTION_CONFIG = {
    // Server configuration
    server: {
        port: process.env.PORT || 3002,
        websocketPort: process.env.WS_PORT || 3003,
        workers: process.env.WORKERS || os.cpus().length,
        environment: process.env.NODE_ENV || 'production',
        cluster: process.env.CLUSTER_MODE === 'true',
        gracefulShutdownTimeout: 30000
    },

    // Database configuration
    database: {
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        connectionPoolSize: parseInt(process.env.DB_POOL_SIZE) || 20,
        queryTimeout: parseInt(process.env.DB_TIMEOUT) || 30000
    },

    // Security configuration
    security: {
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['https://family.seniorcare.ai'],
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        encryptionKey: process.env.ENCRYPTION_KEY
    },

    // External services
    external: {
        twilioSID: process.env.TWILIO_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
        currencyAPIKey: process.env.CURRENCY_API_KEY,
        googleMapsAPIKey: process.env.GOOGLE_MAPS_API_KEY,
        pushNotificationKey: process.env.FCM_SERVER_KEY
    },

    // Monitoring and logging
    monitoring: {
        logLevel: process.env.LOG_LEVEL || 'info',
        healthCheckInterval: 30000, // 30 seconds
        metricsCollection: true,
        errorReporting: true,
        performanceMonitoring: true
    },

    // Feature flags
    features: {
        nriOptimization: true,
        voiceCommands: true,
        predictiveAI: false, // Will be enabled when Team Gamma completes
        advancedAnalytics: true,
        internationalPayments: true
    }
};

class FamilyPlatformDeployment {
    constructor() {
        this.config = PRODUCTION_CONFIG;
        this.logger = this.setupLogging();
        this.platform = null;
        this.isShuttingDown = false;
        
        // Validate configuration
        this.validateConfiguration();
        
        // Setup signal handlers
        this.setupSignalHandlers();
    }

    setupLogging() {
        // Ensure logs directory exists
        const logDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        return winston.createLogger({
            level: this.config.monitoring.logLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { 
                service: 'family-communication-platform',
                version: '1.0.0',
                pid: process.pid
            },
            transports: [
                // Error logs
                new winston.transports.File({ 
                    filename: path.join(logDir, 'error.log'), 
                    level: 'error',
                    maxsize: 50 * 1024 * 1024, // 50MB
                    maxFiles: 5,
                    tailable: true
                }),
                // Combined logs
                new winston.transports.File({ 
                    filename: path.join(logDir, 'combined.log'),
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 10,
                    tailable: true
                }),
                // Console output for development
                ...(this.config.server.environment !== 'production' ? [
                    new winston.transports.Console({
                        format: winston.format.combine(
                            winston.format.colorize(),
                            winston.format.simple()
                        )
                    })
                ] : [])
            ]
        });
    }

    validateConfiguration() {
        const required = [
            'SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];

        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            this.logger.error('Missing required environment variables:', { missing });
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Validate URLs
        try {
            new URL(this.config.database.supabaseUrl);
        } catch (error) {
            throw new Error('Invalid SUPABASE_URL format');
        }

        this.logger.info('Configuration validation completed successfully');
    }

    async initializeDatabase() {
        this.logger.info('Initializing database connection...');
        
        const supabase = createClient(
            this.config.database.supabaseUrl,
            this.config.database.supabaseServiceKey,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: false
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );

        // Test database connection
        try {
            const { data, error } = await supabase
                .from('senior_profiles')
                .select('id')
                .limit(1);

            if (error) throw error;
            
            this.logger.info('Database connection established successfully');
            return supabase;
            
        } catch (error) {
            this.logger.error('Database connection failed:', error);
            throw new Error('Failed to connect to database');
        }
    }

    async startWorker() {
        this.logger.info(`Starting worker process ${process.pid}...`);

        try {
            // Initialize database
            const supabase = await this.initializeDatabase();

            // Create platform instance
            this.platform = new FamilyCommunicationPlatform();
            
            // Setup API routes
            const apiRoutes = new FamilyCommunicationAPI(supabase);
            this.platform.app.use('/api', apiRoutes.getRouter());

            // Setup health monitoring
            this.setupHealthMonitoring();

            // Start the platform
            await this.platform.start();

            this.logger.info(`Worker ${process.pid} started successfully`, {
                port: this.config.server.port,
                websocketPort: this.config.server.websocketPort,
                environment: this.config.server.environment
            });

            // Setup periodic health checks
            this.startHealthChecks();

        } catch (error) {
            this.logger.error('Failed to start worker:', error);
            process.exit(1);
        }
    }

    setupHealthMonitoring() {
        // Custom health check endpoint
        this.platform.app.get('/health/detailed', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                pid: process.pid,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                activeConnections: this.platform.activeConnections.size,
                environment: this.config.server.environment,
                version: '1.0.0',
                features: this.config.features
            };

            res.json(health);
        });

        // Metrics endpoint
        this.platform.app.get('/metrics', (req, res) => {
            const metrics = {
                timestamp: new Date().toISOString(),
                process: {
                    pid: process.pid,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                },
                platform: {
                    activeConnections: this.platform.activeConnections.size,
                    totalRequests: this.platform.requestCount || 0,
                    errorRate: this.platform.errorRate || 0
                }
            };

            res.json(metrics);
        });
    }

    startHealthChecks() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.config.monitoring.healthCheckInterval);
    }

    async performHealthCheck() {
        try {
            // Check memory usage
            const memUsage = process.memoryUsage();
            const memoryThreshold = 1024 * 1024 * 1024; // 1GB

            if (memUsage.rss > memoryThreshold) {
                this.logger.warn('High memory usage detected', { memUsage });
            }

            // Check active connections
            const activeConnections = this.platform.activeConnections.size;
            
            this.logger.debug('Health check completed', {
                memory: memUsage,
                activeConnections,
                uptime: process.uptime()
            });

        } catch (error) {
            this.logger.error('Health check failed:', error);
        }
    }

    setupSignalHandlers() {
        // Graceful shutdown on SIGTERM
        process.on('SIGTERM', () => {
            this.logger.info('SIGTERM received, starting graceful shutdown...');
            this.gracefulShutdown();
        });

        // Graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            this.logger.info('SIGINT received, starting graceful shutdown...');
            this.gracefulShutdown();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught exception:', error);
            this.gracefulShutdown(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled promise rejection:', { reason, promise });
            this.gracefulShutdown(1);
        });
    }

    async gracefulShutdown(exitCode = 0) {
        if (this.isShuttingDown) {
            this.logger.warn('Shutdown already in progress');
            return;
        }

        this.isShuttingDown = true;
        this.logger.info('Starting graceful shutdown...');

        const shutdownTimeout = setTimeout(() => {
            this.logger.error('Graceful shutdown timeout, forcing exit');
            process.exit(1);
        }, this.config.server.gracefulShutdownTimeout);

        try {
            // Close WebSocket connections
            if (this.platform && this.platform.websocketServer) {
                this.logger.info('Closing WebSocket connections...');
                this.platform.websocketServer.close();
                
                // Notify connected clients
                this.platform.activeConnections.forEach((connections, familyMemberId) => {
                    connections.forEach(ws => {
                        ws.send(JSON.stringify({
                            type: 'server_shutdown',
                            message: 'Server is shutting down for maintenance',
                            reconnect: true
                        }));
                        ws.close(1001, 'Server shutdown');
                    });
                });
            }

            // Close HTTP server
            if (this.platform && this.platform.app) {
                this.logger.info('Closing HTTP server...');
                // Implementation would close the HTTP server gracefully
            }

            clearTimeout(shutdownTimeout);
            this.logger.info('Graceful shutdown completed');
            process.exit(exitCode);

        } catch (error) {
            this.logger.error('Error during graceful shutdown:', error);
            clearTimeout(shutdownTimeout);
            process.exit(1);
        }
    }

    async start() {
        if (this.config.server.cluster && cluster.isMaster) {
            this.logger.info(`Starting Family Communication Platform in cluster mode with ${this.config.server.workers} workers`);
            
            // Fork workers
            for (let i = 0; i < this.config.server.workers; i++) {
                const worker = cluster.fork();
                this.logger.info(`Forked worker ${worker.process.pid}`);
            }

            // Handle worker exits
            cluster.on('exit', (worker, code, signal) => {
                this.logger.error(`Worker ${worker.process.pid} died`, { code, signal });
                
                if (!this.isShuttingDown) {
                    this.logger.info('Forking replacement worker...');
                    cluster.fork();
                }
            });

            // Handle master process signals
            this.setupSignalHandlers();

        } else {
            // Single process or worker process
            await this.startWorker();
        }
    }
}

// Auto-start if run directly
if (require.main === module) {
    const deployment = new FamilyPlatformDeployment();
    
    deployment.start().catch(error => {
        console.error('Failed to start Family Communication Platform:', error);
        process.exit(1);
    });
}

module.exports = { 
    FamilyPlatformDeployment,
    PRODUCTION_CONFIG
};