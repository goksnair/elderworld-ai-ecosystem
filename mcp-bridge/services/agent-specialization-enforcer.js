#!/usr/bin/env node
/**
 * AGENT SPECIALIZATION ENFORCEMENT SYSTEM
 * Senior Care AI Ecosystem - Production Agent Coordination
 * 
 * Enforces role boundaries and optimal task routing between agents
 * Target: 30-40% efficiency gain through proper specialization
 * 
 * Business Impact: Critical for ₹500Cr revenue system efficiency
 */

const A2ASupabaseClient = require('./a2a-supabase-client');

class AgentSpecializationEnforcer {
    constructor(supabaseUrl, serviceKey) {
        this.client = new A2ASupabaseClient(supabaseUrl, serviceKey, {
            agentId: 'SpecializationEnforcer'
        });
        
        this.agentCapabilities = this.defineAgentSpecializations();
        this.routingRules = this.defineRoutingRules();
        this.violationThresholds = {
            maxViolationsPerAgent: 3,
            violationWindowHours: 24,
            autoEscalationEnabled: true
        };
    }

    /**
     * Define specialized capabilities for each agent
     */
    defineAgentSpecializations() {
        return {
            'senior-care-boss': {
                primary: ['strategic_coordination', 'executive_decisions', 'cross_functional_leadership'],
                secondary: ['escalation_handling', 'resource_allocation'],
                forbidden: ['direct_coding', 'detailed_implementation'],
                maxConcurrentTasks: 5,
                businessImpact: 'high'
            },
            
            'ai-ml-specialist': {
                primary: ['health_prediction_models', 'ml_development', 'ai_accuracy_optimization'],
                secondary: ['data_analysis', 'algorithm_design'],
                forbidden: ['ui_design', 'business_strategy'],
                maxConcurrentTasks: 3,
                businessImpact: 'critical'
            },
            
            'operations-excellence': {
                primary: ['service_delivery', 'pilot_execution', 'quality_assurance'],
                secondary: ['process_optimization', 'sla_management'],
                forbidden: ['ai_model_development', 'financial_modeling'],
                maxConcurrentTasks: 4,
                businessImpact: 'high'
            },
            
            'product-innovation': {
                primary: ['family_dashboard_design', 'nri_optimization', 'senior_accessibility'],
                secondary: ['user_experience', 'feature_design'],
                forbidden: ['database_operations', 'compliance_review'],
                maxConcurrentTasks: 3,
                businessImpact: 'high'
            },
            
            'partnership-development': {
                primary: ['hospital_alliances', 'strategic_partnerships', 'b2b_development'],
                secondary: ['relationship_management', 'negotiation'],
                forbidden: ['technical_implementation', 'ai_development'],
                maxConcurrentTasks: 3,
                businessImpact: 'medium'
            },
            
            'market-intelligence': {
                primary: ['competitive_analysis', 'customer_insights', 'market_research'],
                secondary: ['business_intelligence', 'trend_analysis'],
                forbidden: ['code_implementation', 'system_architecture'],
                maxConcurrentTasks: 4,
                businessImpact: 'medium'
            },
            
            'finance-strategy': {
                primary: ['unit_economics', 'revenue_planning', 'fundraising'],
                secondary: ['financial_modeling', 'investor_relations'],
                forbidden: ['technical_development', 'operational_tasks'],
                maxConcurrentTasks: 3,
                businessImpact: 'critical'
            },
            
            'compliance-quality': {
                primary: ['hipaa_compliance', 'healthcare_regulations', 'quality_standards'],
                secondary: ['audit_preparation', 'risk_assessment'],
                forbidden: ['marketing_tasks', 'product_design'],
                maxConcurrentTasks: 2,
                businessImpact: 'critical'
            },

            'Claude Code': {
                primary: ['technical_implementation', 'code_development', 'system_integration'],
                secondary: ['debugging', 'testing', 'deployment'],
                forbidden: ['strategic_planning', 'business_development'],
                maxConcurrentTasks: 10,
                businessImpact: 'critical'
            },

            'Gemini Prime': {
                primary: ['strategic_orchestration', 'high_level_planning', 'agent_coordination'],
                secondary: ['roadmap_development', 'cross_agent_communication'],
                forbidden: ['direct_implementation', 'detailed_coding'],
                maxConcurrentTasks: 8,
                businessImpact: 'critical'
            }
        };
    }

    /**
     * Define intelligent task routing rules
     */
    defineRoutingRules() {
        return {
            'emergency_response_optimization': 'ai-ml-specialist',
            'family_dashboard_development': 'product-innovation', 
            'hospital_integration': 'partnership-development',
            'hipaa_compliance_review': 'compliance-quality',
            'bangalore_pilot_execution': 'operations-excellence',
            'competitive_analysis': 'market-intelligence',
            'revenue_modeling': 'finance-strategy',
            'code_implementation': 'Claude Code',
            'strategic_planning': 'Gemini Prime',
            'cross_agent_coordination': 'senior-care-boss',
            'health_prediction_models': 'ai-ml-specialist',
            'nri_optimization': 'product-innovation',
            'quality_assurance': 'operations-excellence',
            'partnership_negotiations': 'partnership-development',
            'customer_insights': 'market-intelligence',
            'fundraising_strategy': 'finance-strategy',
            'regulatory_compliance': 'compliance-quality'
        };
    }

    /**
     * Analyze task and recommend optimal agent
     */
    async analyzeAndRoute(taskDescription, requestingAgent, urgency = 'normal') {
        try {
            console.log(`🎯 Analyzing task routing: "${taskDescription.substring(0, 100)}..."`);
            
            // Extract key task characteristics
            const taskType = this.identifyTaskType(taskDescription);
            const requiredCapabilities = this.extractRequiredCapabilities(taskDescription);
            const businessImpact = this.assessBusinessImpact(taskDescription, urgency);
            
            // Find optimal agent
            const recommendedAgent = this.findOptimalAgent(taskType, requiredCapabilities, businessImpact);
            
            // Check agent availability and load
            const agentLoad = await this.checkAgentLoad(recommendedAgent);
            const finalRecommendation = await this.validateRecommendation(
                recommendedAgent, 
                agentLoad, 
                requiredCapabilities
            );
            
            const routingDecision = {
                taskType,
                requiredCapabilities,
                businessImpact,
                recommendedAgent: finalRecommendation,
                reasoning: this.generateRoutingReasoning(taskType, finalRecommendation),
                urgency,
                estimatedDuration: this.estimateTaskDuration(taskType, businessImpact),
                timestamp: new Date().toISOString()
            };
            
            // Log routing decision for analytics
            await this.logRoutingDecision(taskDescription, requestingAgent, routingDecision);
            
            return routingDecision;
            
        } catch (error) {
            console.error('❌ Task routing analysis failed:', error.message);
            return this.getFailsafeRouting(taskDescription, requestingAgent);
        }
    }

    /**
     * Identify primary task type from description
     */
    identifyTaskType(description) {
        const taskKeywords = {
            'emergency_response_optimization': ['emergency', 'response', 'ai', 'model', 'accuracy', '97.3%', 'health', 'prediction'],
            'family_dashboard_development': ['dashboard', 'family', 'nri', 'ui', 'ux', 'monitor', 'design'],
            'hospital_integration': ['hospital', 'apollo', 'manipal', 'partnership', 'alliance', 'integration'],
            'ai_development': ['ai', 'ml', 'model', 'prediction', 'accuracy', 'algorithm', 'optimization'],
            'strategic_planning': ['strategy', 'roadmap', 'vision', 'planning', 'objectives'],
            'implementation': ['implement', 'code', 'develop', 'build', 'create'],
            'operations': ['pilot', 'deployment', 'service', 'quality', 'sla', 'bangalore'],
            'compliance': ['hipaa', 'compliance', 'regulation', 'audit', 'security'],
            'partnerships': ['negotiate', 'partnership', 'agreement', 'alliance'],
            'finance': ['revenue', 'economics', 'funding', 'financial', 'cost'],
            'market_research': ['market', 'competitive', 'analysis', 'customer', 'insights'],
            'product_design': ['dashboard', 'ui', 'ux', 'family', 'nri', 'design']
        };
        
        const lowerDesc = description.toLowerCase();
        let maxScore = 0;
        let bestType = 'general';
        
        for (const [type, keywords] of Object.entries(taskKeywords)) {
            const score = keywords.reduce((sum, keyword) => {
                return sum + (lowerDesc.includes(keyword) ? 1 : 0);
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                bestType = type;
            }
        }
        
        return bestType;
    }

    /**
     * Extract required capabilities from task description
     */
    extractRequiredCapabilities(description) {
        const capabilities = [];
        const lowerDesc = description.toLowerCase();
        
        // Healthcare-specific capabilities
        if (lowerDesc.includes('emergency') || lowerDesc.includes('health')) {
            capabilities.push('health_prediction_models');
        }
        if (lowerDesc.includes('family') || lowerDesc.includes('nri')) {
            capabilities.push('family_dashboard_design');
        }
        if (lowerDesc.includes('hospital') || lowerDesc.includes('alliance')) {
            capabilities.push('hospital_alliances');
        }
        if (lowerDesc.includes('compliance') || lowerDesc.includes('hipaa')) {
            capabilities.push('hipaa_compliance');
        }
        
        return capabilities;
    }

    /**
     * Assess business impact level
     */
    assessBusinessImpact(description, urgency) {
        const lowerDesc = description.toLowerCase();
        const highImpactKeywords = ['emergency', 'critical', 'revenue', 'customer', 'pilot'];
        const mediumImpactKeywords = ['optimization', 'improvement', 'enhancement'];
        
        if (urgency === 'critical' || highImpactKeywords.some(k => lowerDesc.includes(k))) {
            return 'critical';
        }
        if (urgency === 'high' || mediumImpactKeywords.some(k => lowerDesc.includes(k))) {
            return 'high';
        }
        return 'medium';
    }

    /**
     * Find optimal agent based on task analysis
     */
    findOptimalAgent(taskType, requiredCapabilities, businessImpact) {
        // Direct routing for clear task types
        if (this.routingRules[taskType]) {
            return this.routingRules[taskType];
        }
        
        // Capability-based matching
        let bestMatch = 'senior-care-boss'; // Default to boss for coordination
        let bestScore = 0;
        
        for (const [agent, capabilities] of Object.entries(this.agentCapabilities)) {
            let score = 0;
            
            // Primary capability match (high weight)
            requiredCapabilities.forEach(reqCap => {
                if (capabilities.primary.includes(reqCap)) {
                    score += 3;
                } else if (capabilities.secondary.includes(reqCap)) {
                    score += 1;
                } else if (capabilities.forbidden.includes(reqCap)) {
                    score -= 5; // Heavy penalty for forbidden capabilities
                }
            });
            
            // Business impact alignment
            if (capabilities.businessImpact === businessImpact) {
                score += 1;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = agent;
            }
        }
        
        return bestMatch;
    }

    /**
     * Check current agent workload
     */
    async checkAgentLoad(agentName) {
        try {
            // Get recent messages to assess workload
            const recentMessages = await this.client.getMessages(
                null, // Any sender
                agentName, // To this recipient
                20, // Last 20 messages
                null, // Any type
                24 // Within 24 hours
            );
            
            const activeTasks = recentMessages.filter(msg => 
                ['TASK_DELEGATION', 'TASK_ACCEPTED'].includes(msg.type) &&
                msg.status !== 'COMPLETED'
            ).length;
            
            const agentCaps = this.agentCapabilities[agentName];
            const maxTasks = agentCaps ? agentCaps.maxConcurrentTasks : 3;
            
            return {
                activeTasks,
                maxTasks,
                loadPercentage: (activeTasks / maxTasks) * 100,
                isAvailable: activeTasks < maxTasks,
                estimatedAvailability: this.estimateAvailability(activeTasks, maxTasks)
            };
            
        } catch (error) {
            console.error(`❌ Failed to check agent load for ${agentName}:`, error.message);
            return { isAvailable: true, loadPercentage: 0, activeTasks: 0 };
        }
    }

    /**
     * Validate and potentially adjust recommendation
     */
    async validateRecommendation(recommendedAgent, agentLoad, requiredCapabilities) {
        // If agent is overloaded, find alternative
        if (!agentLoad.isAvailable) {
            console.log(`⚠️ ${recommendedAgent} overloaded (${agentLoad.activeTasks}/${agentLoad.maxTasks}), finding alternative...`);
            
            // Find alternative agent with similar capabilities
            for (const [agent, capabilities] of Object.entries(this.agentCapabilities)) {
                if (agent === recommendedAgent) continue;
                
                const alternativeLoad = await this.checkAgentLoad(agent);
                if (alternativeLoad.isAvailable) {
                    // Check capability overlap
                    const hasRequiredCaps = requiredCapabilities.some(cap => 
                        capabilities.primary.includes(cap) || capabilities.secondary.includes(cap)
                    );
                    
                    if (hasRequiredCaps) {
                        console.log(`✅ Alternative found: ${agent} (${alternativeLoad.activeTasks}/${alternativeLoad.maxTasks})`);
                        return agent;
                    }
                }
            }
            
            // If no alternative, escalate to boss
            console.log(`⚠️ No available alternatives, escalating to senior-care-boss`);
            return 'senior-care-boss';
        }
        
        return recommendedAgent;
    }

    /**
     * Generate human-readable routing reasoning
     */
    generateRoutingReasoning(taskType, recommendedAgent) {
        const agentCaps = this.agentCapabilities[recommendedAgent];
        
        return `Task type '${taskType}' optimally matches ${recommendedAgent}'s primary capabilities: ${
            agentCaps.primary.join(', ')
        }. Expected business impact: ${agentCaps.businessImpact}.`;
    }

    /**
     * Estimate task duration based on type and impact
     */
    estimateTaskDuration(taskType, businessImpact) {
        const baseDurations = {
            'ai_development': 120, // 2 hours
            'strategic_planning': 60, // 1 hour  
            'implementation': 180, // 3 hours
            'operations': 90, // 1.5 hours
            'compliance': 120, // 2 hours
            'partnerships': 150, // 2.5 hours
            'finance': 90, // 1.5 hours
            'market_research': 120, // 2 hours
            'product_design': 150, // 2.5 hours
            'general': 60 // 1 hour
        };
        
        const base = baseDurations[taskType] || 60;
        const multiplier = businessImpact === 'critical' ? 1.5 : businessImpact === 'high' ? 1.2 : 1.0;
        
        return Math.round(base * multiplier);
    }

    /**
     * Log routing decision for analytics
     */
    async logRoutingDecision(taskDescription, requestingAgent, decision) {
        try {
            await this.client.sendMessage(
                'Claude Code',
                'Gemini Prime', 
                'BUSINESS_IMPACT_REPORT',
                {
                    reportType: 'ROUTING_DECISION',
                    taskDescription: taskDescription.substring(0, 200),
                    requestingAgent,
                    recommendedAgent: decision.recommendedAgent,
                    taskType: decision.taskType,
                    businessImpact: decision.businessImpact,
                    reasoning: decision.reasoning,
                    efficiencyGain: '30-40% expected improvement',
                    timestamp: decision.timestamp
                },
                `routing_${Date.now()}`
            );
        } catch (error) {
            console.error('⚠️ Failed to log routing decision:', error.message);
        }
    }

    /**
     * Get failsafe routing when analysis fails
     */
    getFailsafeRouting(taskDescription, requestingAgent) {
        return {
            taskType: 'general',
            requiredCapabilities: [],
            businessImpact: 'medium',
            recommendedAgent: 'senior-care-boss', // Always escalate to boss on failure
            reasoning: 'Failsafe routing due to analysis error - escalated to senior-care-boss for coordination',
            urgency: 'normal',
            estimatedDuration: 60,
            timestamp: new Date().toISOString(),
            isFailsafe: true
        };
    }

    /**
     * Estimate agent availability
     */
    estimateAvailability(activeTasks, maxTasks) {
        const loadRatio = activeTasks / maxTasks;
        
        if (loadRatio >= 1) return 'Overloaded';
        if (loadRatio >= 0.8) return 'High Load';
        if (loadRatio >= 0.5) return 'Moderate Load';
        return 'Available';
    }

    /**
     * Monitor and enforce specialization violations
     */
    async monitorSpecializationCompliance() {
        try {
            console.log('🔍 Monitoring agent specialization compliance...');
            
            // Get recent task delegations and completions
            const recentMessages = await this.client.getMessages(null, null, 100, null, 24);
            
            const violations = [];
            
            for (const message of recentMessages) {
                if (message.type === 'TASK_ACCEPTED' && message.payload) {
                    const agent = message.recipient;
                    const taskDescription = message.payload.objective || '';
                    
                    const violation = await this.checkSpecializationViolation(agent, taskDescription);
                    if (violation) {
                        violations.push({
                            agent,
                            taskDescription: taskDescription.substring(0, 100),
                            violation,
                            messageId: message.id,
                            timestamp: message.created_at
                        });
                    }
                }
            }
            
            if (violations.length > 0) {
                console.log(`⚠️ Found ${violations.length} specialization violations`);
                await this.handleViolations(violations);
            } else {
                console.log('✅ No specialization violations detected');
            }
            
            return violations;
            
        } catch (error) {
            console.error('❌ Compliance monitoring failed:', error.message);
            return [];
        }
    }

    /**
     * Check if a task violates agent specialization
     */
    async checkSpecializationViolation(agent, taskDescription) {
        const agentCaps = this.agentCapabilities[agent];
        if (!agentCaps) return null;
        
        const taskType = this.identifyTaskType(taskDescription);
        const requiredCaps = this.extractRequiredCapabilities(taskDescription);
        
        // Check forbidden capabilities
        const forbiddenViolation = requiredCaps.some(cap => agentCaps.forbidden.includes(cap));
        if (forbiddenViolation) {
            return {
                type: 'FORBIDDEN_CAPABILITY',
                severity: 'HIGH',
                details: `Agent assigned task requiring forbidden capabilities`
            };
        }
        
        // Check if task is outside primary/secondary capabilities
        const hasRelevantCaps = requiredCaps.some(cap => 
            agentCaps.primary.includes(cap) || agentCaps.secondary.includes(cap)
        );
        
        if (requiredCaps.length > 0 && !hasRelevantCaps) {
            return {
                type: 'CAPABILITY_MISMATCH',
                severity: 'MEDIUM',
                details: `Task requires capabilities outside agent's specialization`
            };
        }
        
        return null;
    }

    /**
     * Handle specialization violations
     */
    async handleViolations(violations) {
        for (const violation of violations) {
            console.log(`🚨 Violation: ${violation.agent} - ${violation.violation.type}`);
            
            // Send corrective message using valid message type
            await this.client.sendMessage(
                'Claude Code',
                violation.agent,
                'STRATEGIC_QUERY',
                {
                    query: 'SPECIALIZATION_VIOLATION_NOTIFICATION',
                    violationType: violation.violation.type,
                    severity: violation.violation.severity,
                    taskDescription: violation.taskDescription,
                    correctiveAction: this.generateCorrectiveAction(violation),
                    message: 'Task assignment outside your specialization detected. Please review and delegate appropriately.',
                    timestamp: new Date().toISOString()
                },
                `violation_${Date.now()}`
            );
            
            // Escalate high severity violations
            if (violation.violation.severity === 'HIGH') {
                await this.escalateViolation(violation);
            }
        }
    }

    /**
     * Generate corrective action recommendations
     */
    generateCorrectiveAction(violation) {
        const optimalAgent = this.findOptimalAgent(
            this.identifyTaskType(violation.taskDescription),
            this.extractRequiredCapabilities(violation.taskDescription),
            'medium'
        );
        
        return {
            recommendation: `This task should be delegated to ${optimalAgent}`,
            reason: `${optimalAgent} has specialized capabilities for this task type`,
            suggestedAction: 'DELEGATE_TO_SPECIALIST'
        };
    }

    /**
     * Escalate serious violations to senior-care-boss
     */
    async escalateViolation(violation) {
        await this.client.sendMessage(
            'Claude Code',
            'Gemini Prime',
            'BLOCKER_REPORT',
            {
                blockerType: 'SPECIALIZATION_VIOLATION_ESCALATION',
                violatingAgent: violation.agent,
                violationType: violation.violation.type,
                taskDescription: violation.taskDescription,
                businessImpact: 'Potential efficiency loss and quality degradation',
                recommendedAction: 'Review and enforce agent specialization protocols',
                urgency: 'HIGH',
                timestamp: new Date().toISOString()
            },
            `escalation_${Date.now()}`
        );
    }

    /**
     * Get specialization analytics and recommendations
     */
    async getSpecializationAnalytics(timeHours = 24) {
        try {
            const messages = await this.client.getMessages(null, null, 200, null, timeHours);
            
            const analytics = {
                totalTasks: 0,
                properlyRouted: 0,
                violations: 0,
                agentEfficiency: {},
                recommendations: []
            };
            
            // Analyze task distribution and efficiency
            for (const [agent, capabilities] of Object.entries(this.agentCapabilities)) {
                const agentTasks = messages.filter(m => m.recipient === agent).length;
                const completedTasks = messages.filter(m => 
                    m.recipient === agent && m.type === 'TASK_COMPLETED'
                ).length;
                
                analytics.agentEfficiency[agent] = {
                    assignedTasks: agentTasks,
                    completedTasks,
                    completionRate: agentTasks > 0 ? (completedTasks / agentTasks) * 100 : 0,
                    specialization: capabilities.primary[0] // Primary specialization
                };
                
                analytics.totalTasks += agentTasks;
            }
            
            // Generate recommendations
            this.generateEfficiencyRecommendations(analytics);
            
            return analytics;
            
        } catch (error) {
            console.error('❌ Failed to generate analytics:', error.message);
            return null;
        }
    }

    /**
     * Generate efficiency improvement recommendations
     */
    generateEfficiencyRecommendations(analytics) {
        const recommendations = [];
        
        // Find underutilized specialists
        Object.entries(analytics.agentEfficiency).forEach(([agent, stats]) => {
            if (stats.assignedTasks < 2 && this.agentCapabilities[agent].businessImpact === 'critical') {
                recommendations.push({
                    type: 'UNDERUTILIZED_SPECIALIST',
                    agent,
                    suggestion: `Consider more tasks for ${agent} - highly specialized with low current load`
                });
            }
            
            if (stats.completionRate < 70) {
                recommendations.push({
                    type: 'LOW_COMPLETION_RATE',
                    agent,
                    suggestion: `Review ${agent} task assignment - completion rate below optimal`
                });
            }
        });
        
        analytics.recommendations = recommendations;
    }
}

module.exports = AgentSpecializationEnforcer;