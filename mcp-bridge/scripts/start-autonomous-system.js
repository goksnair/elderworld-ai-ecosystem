// Autonomous System Startup Script
// Production-ready initialization of Prime Agent coordination
// Optimized for ₹500Cr revenue-generating operations

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ClaudeCodeA2AIntegration = require('../services/claude-code-a2a-integration');
const A2ASupabaseClient = require('../services/a2a-supabase-client');

class AutonomousSystemStarter {
    constructor() {
        this.claudeCodeA2A = null;
        this.systemHealth = {
            status: 'INITIALIZING',
            startTime: new Date().toISOString(),
            components: {}
        };
        
        console.log('🚀 Senior Care AI Autonomous System');
        console.log('====================================');
        console.log(`🎯 Target: ₹500Cr revenue through autonomous coordination`);
        console.log(`🤖 Prime Agents: Claude Code ↔ Gemini Prime ↔ GitHub Copilot`);
        console.log(`📅 Started: ${this.systemHealth.startTime}\n`);
    }

    async startSystem() {
        try {
            console.log('Phase 1: Environment Validation');
            await this.validateEnvironment();

            console.log('\nPhase 2: Component Initialization');
            await this.initializeComponents();

            console.log('\nPhase 3: Health Verification');
            await this.verifySystemHealth();

            console.log('\nPhase 4: Autonomous Coordination Start');
            await this.startAutonomousCoordination();

            console.log('\nPhase 5: Business Metrics Setup');
            await this.setupBusinessMetrics();

            this.systemHealth.status = 'OPERATIONAL';
            this.printOperationalStatus();

            // Keep the system running
            this.startSystemMonitoring();

        } catch (error) {
            this.systemHealth.status = 'FAILED';
            console.error('❌ System startup failed:', error.message);
            console.error('🔧 Please resolve issues and restart the system');
            process.exit(1);
        }
    }

    async validateEnvironment() {
        try {
            const requiredVars = [
                'SUPABASE_URL',
                'SUPABASE_SERVICE_KEY',
                'GITHUB_TOKEN'
            ];

            console.log('🔍 Checking environment configuration...');
            
            const missingVars = requiredVars.filter(varName => !process.env[varName]);
            
            if (missingVars.length > 0) {
                throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
            }

            console.log('✅ All required environment variables found');
            this.systemHealth.components.environment = 'READY';

        } catch (error) {
            this.systemHealth.components.environment = 'FAILED';
            throw error;
        }
    }

    async initializeComponents() {
        try {
            console.log('🤖 Initializing Claude Code A2A Integration...');
            
            this.claudeCodeA2A = new ClaudeCodeA2AIntegration({
                pollingInterval: 30000, // 30 seconds in production
                enableAutoReconnect: true,
                maxRetries: 3
            });

            console.log('✅ Claude Code A2A Integration ready');
            this.systemHealth.components.claudeCodeA2A = 'READY';

            // Initialize direct A2A client for system operations
            console.log('📡 Initializing system A2A client...');
            this.systemA2AClient = new A2ASupabaseClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                { agentId: 'AutonomousSystemManager' }
            );

            console.log('✅ System A2A client ready');
            this.systemHealth.components.systemA2A = 'READY';

        } catch (error) {
            console.error('❌ Component initialization failed:', error.message);
            throw error;
        }
    }

    async verifySystemHealth() {
        try {
            console.log('🔍 Running system health checks...');

            // Test A2A communication
            const a2aHealth = await this.systemA2AClient.healthCheck();
            if (a2aHealth.status !== 'HEALTHY') {
                throw new Error('A2A communication system unhealthy');
            }
            console.log('✅ A2A communication system healthy');

            // Test Claude Code integration status
            const claudeStatus = await this.claudeCodeA2A.getSystemStatus();
            if (claudeStatus.health_status !== 'HEALTHY') {
                throw new Error('Claude Code integration unhealthy');
            }
            console.log('✅ Claude Code integration healthy');

            this.systemHealth.components.healthCheck = 'PASSED';

        } catch (error) {
            this.systemHealth.components.healthCheck = 'FAILED';
            throw error;
        }
    }

    async startAutonomousCoordination() {
        try {
            console.log('🔄 Starting autonomous agent coordination...');

            // Set up custom message handlers for business context
            const messageHandlers = {
                onProgressUpdate: this.handleBusinessProgressUpdate.bind(this),
                onTaskCompleted: this.handleBusinessTaskCompletion.bind(this),
                onBlockerReport: this.handleBusinessBlocker.bind(this)
            };

            // Start message polling with business-focused handlers
            await this.claudeCodeA2A.startMessagePolling(messageHandlers);

            console.log('✅ Autonomous coordination active');
            this.systemHealth.components.coordination = 'ACTIVE';

            // Send system startup notification to Gemini Prime
            await this.sendSystemStartupNotification();

        } catch (error) {
            this.systemHealth.components.coordination = 'FAILED';
            throw error;
        }
    }

    async setupBusinessMetrics() {
        try {
            console.log('📊 Setting up business metrics tracking...');

            // Initialize business metrics
            this.businessMetrics = {
                systemStartTime: new Date().toISOString(),
                messagesProcessed: 0,
                tasksCompleted: 0,
                revenueImpactEvents: 0,
                customerImpactEvents: 0,
                systemUptime: 0
            };

            // Start metrics tracking interval
            this.metricsTimer = setInterval(() => {
                this.updateBusinessMetrics();
            }, 60000); // Update every minute

            console.log('✅ Business metrics tracking active');
            this.systemHealth.components.businessMetrics = 'ACTIVE';

        } catch (error) {
            this.systemHealth.components.businessMetrics = 'FAILED';
            throw error;
        }
    }

    async sendSystemStartupNotification() {
        try {
            await this.claudeCodeA2A.sendBusinessImpactReport({
                recipient: 'Gemini Prime',
                reportId: `startup_${Date.now()}`,
                achievement: 'Autonomous System Operational',
                metrics: {
                    system_status: 'Fully Operational',
                    startup_time: this.systemHealth.startTime,
                    components_ready: Object.keys(this.systemHealth.components).length,
                    business_readiness: '100%',
                    revenue_system_status: 'Ready for ₹500Cr target',
                    customer_service_capability: '24/7 autonomous coordination'
                },
                nextSteps: [
                    'Begin autonomous task execution',
                    'Monitor system performance metrics',
                    'Scale customer operations as needed',
                    'Maintain 99.9% uptime SLA'
                ]
            });

            console.log('📢 Startup notification sent to Gemini Prime');

        } catch (error) {
            console.warn('⚠️ Startup notification failed (non-critical):', error.message);
        }
    }

    handleBusinessProgressUpdate(message) {
        const { sender, payload } = message;
        const { task_id, progress_percentage, business_impact } = payload;

        console.log(`📈 Business Progress [${sender}]: ${task_id} - ${progress_percentage}%`);
        
        if (business_impact) {
            this.businessMetrics.revenueImpactEvents++;
            console.log(`   💰 Revenue Impact: ${business_impact}`);
        }

        this.businessMetrics.messagesProcessed++;
    }

    handleBusinessTaskCompletion(message) {
        const { sender, payload } = message;
        const { task_id, business_metrics, deliverables } = payload;

        console.log(`🎉 Task Completed [${sender}]: ${task_id}`);
        console.log(`   📦 Deliverables: ${deliverables?.length || 0} items`);
        
        if (business_metrics) {
            console.log(`   📊 Business Metrics:`, business_metrics);
            this.businessMetrics.revenueImpactEvents++;
        }

        this.businessMetrics.tasksCompleted++;
        this.businessMetrics.messagesProcessed++;
    }

    handleBusinessBlocker(message) {
        const { sender, payload } = message;
        const { task_id, business_impact, urgency } = payload;

        console.log(`🚧 Business Blocker [${sender}]: ${task_id}`);
        console.log(`   🚨 Urgency: ${urgency || 'NORMAL'}`);
        console.log(`   💸 Business Impact: ${business_impact}`);

        // High urgency blockers get special attention
        if (urgency === 'HIGH' || urgency === 'CRITICAL') {
            console.log(`   🚨 HIGH PRIORITY BLOCKER - Escalating...`);
            this.escalateBusinessBlocker(message);
        }

        this.businessMetrics.messagesProcessed++;
    }

    async escalateBusinessBlocker(message) {
        try {
            // Send escalation to Gemini Prime
            await this.claudeCodeA2A.sendStrategicQuery({
                recipient: 'Gemini Prime',
                queryId: `blocker_escalation_${Date.now()}`,
                question: `High priority blocker requiring immediate attention: ${message.payload.error_details}`,
                context: `Task: ${message.payload.task_id}, Business Impact: ${message.payload.business_impact}`,
                urgency: 'HIGH',
                expectedResponse: 'Immediate resolution strategy and action plan'
            });

            console.log('📢 High priority blocker escalated to Gemini Prime');

        } catch (error) {
            console.error('❌ Blocker escalation failed:', error.message);
        }
    }

    updateBusinessMetrics() {
        // Calculate uptime in minutes
        const now = new Date();
        const startTime = new Date(this.businessMetrics.systemStartTime);
        this.businessMetrics.systemUptime = Math.floor((now - startTime) / 60000);

        // Log metrics periodically (every 10 minutes)
        if (this.businessMetrics.systemUptime % 10 === 0) {
            console.log('\n📊 Business Metrics Update:');
            console.log(`   ⏱️  System Uptime: ${this.businessMetrics.systemUptime} minutes`);
            console.log(`   📨 Messages Processed: ${this.businessMetrics.messagesProcessed}`);
            console.log(`   ✅ Tasks Completed: ${this.businessMetrics.tasksCompleted}`);
            console.log(`   💰 Revenue Impact Events: ${this.businessMetrics.revenueImpactEvents}`);
            console.log(`   🎯 System Status: ${this.systemHealth.status}`);
        }
    }

    startSystemMonitoring() {
        console.log('👀 Starting continuous system monitoring...');

        // Monitor system health every 5 minutes
        this.healthTimer = setInterval(async () => {
            try {
                const health = await this.systemA2AClient.healthCheck();
                if (health.status !== 'HEALTHY') {
                    console.warn('⚠️ System health issue detected');
                }
            } catch (error) {
                console.error('❌ Health monitoring error:', error.message);
            }
        }, 300000); // 5 minutes

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Graceful shutdown initiated...');
            this.shutdownSystem();
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 System termination requested...');
            this.shutdownSystem();
        });
    }

    async shutdownSystem() {
        try {
            console.log('🔄 Shutting down autonomous system...');

            // Stop polling
            if (this.claudeCodeA2A) {
                await this.claudeCodeA2A.shutdown();
            }

            // Clear timers
            if (this.metricsTimer) clearInterval(this.metricsTimer);
            if (this.healthTimer) clearInterval(this.healthTimer);

            // Send shutdown notification
            try {
                await this.claudeCodeA2A.sendBusinessImpactReport({
                    recipient: 'Gemini Prime',
                    reportId: `shutdown_${Date.now()}`,
                    achievement: 'System graceful shutdown completed',
                    metrics: this.businessMetrics,
                    nextSteps: ['System offline', 'Manual restart required']
                });
            } catch (error) {
                console.warn('⚠️ Shutdown notification failed (non-critical)');
            }

            console.log('✅ Autonomous system shutdown complete');
            process.exit(0);

        } catch (error) {
            console.error('❌ Shutdown error:', error.message);
            process.exit(1);
        }
    }

    printOperationalStatus() {
        console.log('\n🎉 AUTONOMOUS SYSTEM OPERATIONAL!');
        console.log('=================================');
        console.log(`🤖 Claude Code: Ready for task delegation and coordination`);
        console.log(`🧠 Gemini Prime: Awaiting strategic analysis requests`);
        console.log(`⚡ GitHub Copilot: Prepared for development tasks`);
        console.log(`📡 A2A Communication: Active message passing`);
        console.log(`🗄️  Database Operations: HIPAA-compliant data handling`);
        console.log(`📊 Business Metrics: Real-time performance tracking`);
        console.log('\n🎯 Business Objectives:');
        console.log(`   💰 Revenue Target: ₹500Cr over 5 years`);
        console.log(`   👥 Customer Target: 100 families in Bangalore pilot`);
        console.log(`   ⏱️  Emergency Response: <5 minute SLA`);
        console.log(`   🎯 AI Accuracy: 97.3% health prediction target`);
        console.log('\n⚡ System Performance:');
        console.log(`   🔄 Message Polling: Every 30 seconds`);
        console.log(`   📊 Metrics Update: Every minute`);
        console.log(`   🔍 Health Check: Every 5 minutes`);
        console.log(`   💾 Database: Real-time synchronization`);
        console.log('\n🚀 Ready for autonomous revenue generation!');
        console.log('   Press Ctrl+C for graceful shutdown');
        console.log('=================================\n');
    }
}

// Start the autonomous system
if (require.main === module) {
    const system = new AutonomousSystemStarter();
    system.startSystem().catch(console.error);
}

module.exports = AutonomousSystemStarter;