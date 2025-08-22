#!/usr/bin/env node
/**
 * AGENT SPECIALIZATION ENFORCER - PRODUCTION STARTUP
 * Senior Care AI Ecosystem - Automated Agent Optimization
 * 
 * Deploys intelligent task routing and specialization enforcement
 * Expected Impact: 30-40% efficiency improvement
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const AgentSpecializationEnforcer = require('../services/agent-specialization-enforcer');

class SpecializationEnforcerController {
    constructor() {
        this.enforcer = new AgentSpecializationEnforcer(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        this.monitoringInterval = null;
        this.isRunning = false;
    }

    async start() {
        try {
            console.log('🎯 AGENT SPECIALIZATION ENFORCER');
            console.log('==================================');
            console.log('Target: 30-40% efficiency gain through optimal task routing');
            console.log('Business Impact: Critical for ₹500Cr revenue system\n');

            // Validate system health
            console.log('🔍 Validating system health...');
            const health = await this.enforcer.client.healthCheck();
            if (health.status !== 'HEALTHY') {
                throw new Error(`System unhealthy: ${health.error}`);
            }
            console.log('✅ A2A communication system healthy\n');

            // Run initial compliance check
            console.log('📊 Running initial specialization compliance audit...');
            const violations = await this.enforcer.monitorSpecializationCompliance();
            console.log(`📋 Found ${violations.length} current violations\n`);

            // Get analytics baseline
            console.log('📈 Generating current efficiency analytics...');
            const analytics = await this.enforcer.getSpecializationAnalytics(24);
            if (analytics) {
                console.log('📊 CURRENT SYSTEM EFFICIENCY:');
                console.log(`   Total Tasks (24h): ${analytics.totalTasks}`);
                console.log(`   Properly Routed: ${analytics.properlyRouted}`);
                console.log(`   Violations: ${violations.length}`);
                console.log(`   Recommendations: ${analytics.recommendations.length}\n`);

                // Show top agent efficiency
                const sortedAgents = Object.entries(analytics.agentEfficiency)
                    .sort(([,a], [,b]) => b.completionRate - a.completionRate)
                    .slice(0, 5);

                console.log('🏆 TOP PERFORMING AGENTS:');
                sortedAgents.forEach(([agent, stats], index) => {
                    console.log(`   ${index + 1}. ${agent}: ${stats.completionRate.toFixed(1)}% completion (${stats.completedTasks}/${stats.assignedTasks})`);
                });
                console.log('');
            }

            // Demo intelligent routing
            await this.demonstrateIntelligentRouting();

            // Start continuous monitoring
            this.startContinuousMonitoring();

            // Setup graceful shutdown
            process.on('SIGINT', () => this.shutdown());
            process.on('SIGTERM', () => this.shutdown());

            console.log('🚀 SPECIALIZATION ENFORCER OPERATIONAL');
            console.log('=====================================');
            console.log('🎯 Intelligent task routing: ACTIVE');
            console.log('🔍 Compliance monitoring: ACTIVE');
            console.log('📊 Efficiency tracking: ACTIVE');
            console.log('⚡ Expected efficiency gain: 30-40%\n');
            console.log('💡 Use Ctrl+C to stop monitoring');

            this.isRunning = true;

            // Keep process running
            await this.keepAlive();

        } catch (error) {
            console.error('❌ Failed to start Specialization Enforcer:', error.message);
            process.exit(1);
        }
    }

    async demonstrateIntelligentRouting() {
        console.log('🧪 DEMONSTRATING INTELLIGENT ROUTING:');
        console.log('======================================');

        const testTasks = [
            {
                description: "Optimize emergency response AI model to achieve <3 minute response time for Bangalore pilot",
                requester: "senior-care-boss"
            },
            {
                description: "Design family dashboard with NRI-optimized features for US-based children monitoring parents",
                requester: "senior-care-boss" 
            },
            {
                description: "Negotiate partnership agreements with Apollo Hospital for emergency care integration",
                requester: "operations-excellence"
            },
            {
                description: "Analyze competitive positioning against Emoha's new family coordination features",
                requester: "product-innovation"
            },
            {
                description: "Model unit economics for ₹15K-25K ARPU NRI family segment with 12:1 LTV:CAC target",
                requester: "market-intelligence"
            }
        ];

        for (const [index, task] of testTasks.entries()) {
            console.log(`\n${index + 1}. Task: "${task.description.substring(0, 80)}..."`);
            
            const routing = await this.enforcer.analyzeAndRoute(
                task.description, 
                task.requester, 
                'normal'
            );
            
            console.log(`   👉 Optimal Agent: ${routing.recommendedAgent}`);
            console.log(`   🎯 Task Type: ${routing.taskType}`);
            console.log(`   💼 Business Impact: ${routing.businessImpact}`);
            console.log(`   ⏱️  Estimated Duration: ${routing.estimatedDuration} minutes`);
            console.log(`   💡 Reasoning: ${routing.reasoning.substring(0, 120)}...`);
        }

        console.log('\n✅ Intelligent routing demonstration complete\n');
    }

    startContinuousMonitoring() {
        console.log('🔄 Starting continuous monitoring (every 10 minutes)...');
        
        this.monitoringInterval = setInterval(async () => {
            try {
                console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Running compliance check...`);
                
                const violations = await this.enforcer.monitorSpecializationCompliance();
                
                if (violations.length > 0) {
                    console.log(`⚠️  Found ${violations.length} new violations - corrective actions sent`);
                } else {
                    console.log('✅ No violations detected');
                }

                // Get efficiency metrics every hour (6 cycles)
                if (Date.now() % (6 * 10 * 60 * 1000) < 10 * 60 * 1000) {
                    const analytics = await this.enforcer.getSpecializationAnalytics(1);
                    if (analytics && analytics.totalTasks > 0) {
                        const efficiency = ((analytics.totalTasks - violations.length) / analytics.totalTasks * 100).toFixed(1);
                        console.log(`📊 Current efficiency: ${efficiency}% (${analytics.totalTasks} tasks processed)`);
                    }
                }

            } catch (error) {
                console.error('⚠️ Monitoring cycle failed:', error.message);
            }
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    async keepAlive() {
        return new Promise((resolve) => {
            // This will keep the process running until manually stopped
        });
    }

    async shutdown() {
        if (!this.isRunning) return;
        
        console.log('\n🛑 Shutting down Specialization Enforcer...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('✅ Continuous monitoring stopped');
        }

        // Generate final analytics report
        try {
            console.log('📊 Generating final efficiency report...');
            const analytics = await this.enforcer.getSpecializationAnalytics(24);
            
            if (analytics) {
                console.log('\n📋 FINAL EFFICIENCY REPORT:');
                console.log('===========================');
                console.log(`Total Tasks Processed: ${analytics.totalTasks}`);
                console.log(`Violations Detected: ${analytics.violations}`);
                console.log(`System Efficiency: ${((analytics.totalTasks - analytics.violations) / analytics.totalTasks * 100).toFixed(1)}%`);
                
                if (analytics.recommendations.length > 0) {
                    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
                    analytics.recommendations.forEach((rec, index) => {
                        console.log(`${index + 1}. ${rec.suggestion}`);
                    });
                }
            }
        } catch (error) {
            console.error('⚠️ Failed to generate final report:', error.message);
        }

        this.isRunning = false;
        console.log('\n✅ Specialization Enforcer shutdown complete');
        process.exit(0);
    }

    // Static method for one-off routing analysis
    static async analyzeTask(taskDescription, requestingAgent = 'User') {
        const enforcer = new AgentSpecializationEnforcer(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        console.log('🎯 TASK ROUTING ANALYSIS');
        console.log('=========================');
        console.log(`Task: "${taskDescription}"`);
        console.log(`Requester: ${requestingAgent}\n`);

        const routing = await enforcer.analyzeAndRoute(taskDescription, requestingAgent);
        
        console.log('📋 ROUTING RECOMMENDATION:');
        console.log(`Optimal Agent: ${routing.recommendedAgent}`);
        console.log(`Task Type: ${routing.taskType}`);
        console.log(`Business Impact: ${routing.businessImpact}`);
        console.log(`Estimated Duration: ${routing.estimatedDuration} minutes`);
        console.log(`Reasoning: ${routing.reasoning}`);

        // Check agent availability
        const enforceInstance = new AgentSpecializationEnforcer(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        const agentLoad = await enforceInstance.checkAgentLoad(routing.recommendedAgent);
        
        console.log('\n📊 AGENT AVAILABILITY:');
        console.log(`Current Load: ${agentLoad.activeTasks}/${agentLoad.maxTasks} tasks (${agentLoad.loadPercentage.toFixed(1)}%)`);
        console.log(`Status: ${agentLoad.estimatedAvailability}`);
        console.log(`Available: ${agentLoad.isAvailable ? '✅ YES' : '❌ NO'}`);

        return routing;
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'analyze' && args[1]) {
        // One-off analysis mode
        const taskDescription = args[1];
        const requestingAgent = args[2] || 'User';
        await SpecializationEnforcerController.analyzeTask(taskDescription, requestingAgent);
    } else if (command === 'start' || !command) {
        // Continuous monitoring mode
        const controller = new SpecializationEnforcerController();
        await controller.start();
    } else {
        console.log('📖 USAGE:');
        console.log('node start-specialization-enforcer.js [command]');
        console.log('\nCOMMANDS:');
        console.log('  start                    Start continuous monitoring (default)');
        console.log('  analyze "<task>"         Analyze single task routing');
        console.log('\nEXAMPLES:');
        console.log('  node start-specialization-enforcer.js');
        console.log('  node start-specialization-enforcer.js analyze "Optimize emergency response AI model"');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = { SpecializationEnforcerController, AgentSpecializationEnforcer };