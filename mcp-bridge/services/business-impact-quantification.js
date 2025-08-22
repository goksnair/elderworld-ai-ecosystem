#!/usr/bin/env node
/**
 * REAL-TIME BUSINESS IMPACT QUANTIFICATION SYSTEM
 * Senior Care AI Ecosystem - Revenue and ROI Tracking
 * 
 * Direct correlation of all agent actions to ₹500Cr revenue target
 * Real-time ROI calculation and business value measurement
 * 
 * Business Impact: Critical for ₹500Cr revenue system optimization
 */

const A2ASupabaseClient = require('./a2a-supabase-client');

class BusinessImpactQuantification {
    constructor(supabaseUrl, serviceKey) {
        this.client = new A2ASupabaseClient(supabaseUrl, serviceKey, {
            agentId: 'BusinessImpactSystem'
        });
        
        this.businessMetrics = this.defineBusinessMetrics();
        this.revenueModel = this.initializeRevenueModel();
        this.impactTracking = new Map(); // Real-time impact tracking
        this.isMonitoring = false;
    }

    /**
     * Define business metrics and KPIs
     */
    defineBusinessMetrics() {
        return {
            // Revenue Targets
            'revenue_targets': {
                fiveYearTarget: 50000000000, // ₹500Cr in paise
                annualTarget: 10000000000,   // ₹100Cr annual by year 5
                pilotTarget: 5000000,        // ₹50L pilot target
                nriArpu: 2000000,           // ₹20K average NRI ARPU (in paise)
                urbanArpu: 650000,          // ₹6.5K urban affluent ARPU
                corporateArpu: 300000       // ₹3K corporate ARPU
            },
            
            // Customer Acquisition Metrics
            'customer_metrics': {
                nriFamilies: 32000000,      // 32M NRI families globally
                urbanFamilies: 50000000,    // 50M urban affluent households
                corporateEmployees: 10000000, // 10M corporate employees
                conversionRate: 0.02,       // 2% conversion rate target
                ltvCacRatio: 12,           // 12:1 LTV:CAC target
                churnRate: 0.05            // 5% monthly churn target
            },
            
            // Operational Efficiency Metrics
            'operational_metrics': {
                emergencyResponseSla: 300,  // 5 minutes in seconds
                aiAccuracyTarget: 97.3,     // 97.3% AI accuracy target
                systemUptime: 99.9,         // 99.9% uptime target
                customerSatisfaction: 4.2,  // >4.2/5 rating target
                caregiverUtilization: 85,   // 85% utilization target
                avgResponseTime: 180        // 3 minutes average response
            },
            
            // Agent Efficiency Metrics
            'agent_efficiency': {
                taskCompletionRate: 90,     // 90% task completion target
                averageTaskTime: 1800,      // 30 minutes average task time
                escalationRate: 10,         // 10% escalation rate max
                knowledgeSharingRate: 75,   // 75% knowledge sharing rate
                specializationEfficiency: 85 // 85% specialization match rate
            }
        };
    }

    /**
     * Initialize revenue model and impact calculations
     */
    initializeRevenueModel() {
        return {
            // Revenue Streams
            revenueStreams: {
                'nri_premium': {
                    weight: 0.6,
                    arpu: 2000000, // ₹20K in paise
                    targetFamilies: 25000,
                    revenueContribution: 0.6 * 50000000000 // 60% of ₹500Cr
                },
                'urban_affluent': {
                    weight: 0.25,
                    arpu: 650000, // ₹6.5K in paise
                    targetFamilies: 190000,
                    revenueContribution: 0.25 * 50000000000 // 25% of ₹500Cr
                },
                'corporate_b2b': {
                    weight: 0.15,
                    arpu: 300000, // ₹3K in paise
                    targetEmployees: 250000,
                    revenueContribution: 0.15 * 50000000000 // 15% of ₹500Cr
                }
            },
            
            // Cost Structure
            costStructure: {
                customerAcquisition: 0.30,  // 30% of revenue
                operations: 0.25,           // 25% of revenue
                technology: 0.15,           // 15% of revenue
                humanResources: 0.20,       // 20% of revenue
                compliance: 0.10            // 10% of revenue
            },
            
            // Business Impact Multipliers
            impactMultipliers: {
                'emergency_response_optimization': 1.8,  // High impact on retention
                'nri_family_dashboard': 2.2,             // Direct revenue driver
                'ai_accuracy_improvement': 1.6,          // Service quality impact
                'hospital_partnerships': 2.0,           // Market expansion
                'operational_efficiency': 1.4,          // Cost reduction
                'agent_specialization': 1.5,            // Productivity gain
                'knowledge_sharing': 1.3,               // Decision speed
                'bangalore_pilot_success': 3.0          // Foundation for scaling
            }
        };
    }

    /**
     * Initialize business impact tracking
     */
    async initialize() {
        try {
            console.log('💰 Initializing Business Impact Quantification...');
            
            // Load historical business data
            await this.loadHistoricalImpactData();
            
            // Initialize real-time tracking
            this.setupRealTimeTracking();
            
            // Calculate baseline metrics
            const baseline = await this.calculateBaselineMetrics();
            
            console.log('✅ Business impact quantification ready');
            console.log(`💼 Revenue Target: ₹${(this.businessMetrics.revenue_targets.fiveYearTarget / 100000000).toFixed(0)}Cr`);
            console.log(`📊 Tracking ${Object.keys(this.revenueModel.impactMultipliers).length} impact categories`);
            
            return {
                status: 'initialized',
                revenueTarget: this.businessMetrics.revenue_targets.fiveYearTarget,
                impactCategories: Object.keys(this.revenueModel.impactMultipliers).length,
                baseline: baseline
            };
            
        } catch (error) {
            console.error('❌ Business impact quantification initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Load historical impact data from A2A messages
     */
    async loadHistoricalImpactData() {
        try {
            console.log('📈 Loading historical business impact data...');
            
            const messages = await this.client.getMessages(null, null, 200, null, 168); // Last 7 days
            let impactEvents = 0;
            
            for (const message of messages || []) {
                if (this.isBusinessImpactMessage(message)) {
                    const impact = this.calculateMessageBusinessImpact(message);
                    if (impact) {
                        this.trackImpactEvent(impact);
                        impactEvents++;
                    }
                }
            }
            
            console.log(`✅ Historical data loaded: ${impactEvents} impact events`);
            
        } catch (error) {
            console.error('⚠️ Historical data loading failed:', error.message);
        }
    }

    /**
     * Check if message contains business impact information
     */
    isBusinessImpactMessage(message) {
        const businessTypes = [
            'BUSINESS_IMPACT_REPORT',
            'TASK_COMPLETED',
            'TASK_DELEGATION',
            'PROGRESS_UPDATE'
        ];
        
        if (!businessTypes.includes(message.type)) {
            return false;
        }
        
        const payload = JSON.stringify(message.payload || {}).toLowerCase();
        const businessKeywords = [
            'revenue', 'customer', 'efficiency', 'nri', 'family',
            'emergency', 'pilot', 'hospital', 'ai', 'accuracy'
        ];
        
        return businessKeywords.some(keyword => payload.includes(keyword));
    }

    /**
     * Calculate business impact from A2A message
     */
    calculateMessageBusinessImpact(message) {
        try {
            const impact = {
                id: `impact_${message.id}`,
                timestamp: message.created_at,
                source: message.sender,
                target: message.recipient,
                type: message.type,
                category: this.categorizeBusinessImpact(message),
                quantification: this.quantifyBusinessImpact(message),
                confidence: this.calculateImpactConfidence(message),
                revenueCorrelation: this.calculateRevenueCorrelation(message)
            };
            
            return impact;
            
        } catch (error) {
            console.error('⚠️ Business impact calculation failed:', error.message);
            return null;
        }
    }

    /**
     * Categorize business impact from message
     */
    categorizeBusinessImpact(message) {
        const content = JSON.stringify(message.payload || {}).toLowerCase();
        
        // Revenue-focused categorization
        if (content.includes('nri') || content.includes('family') || content.includes('dashboard')) {
            return 'nri_family_dashboard';
        }
        if (content.includes('emergency') || content.includes('response') || content.includes('97.3%')) {
            return 'emergency_response_optimization';
        }
        if (content.includes('hospital') || content.includes('apollo') || content.includes('partnership')) {
            return 'hospital_partnerships';
        }
        if (content.includes('pilot') || content.includes('bangalore') || content.includes('100 families')) {
            return 'bangalore_pilot_success';
        }
        if (content.includes('ai') || content.includes('accuracy') || content.includes('model')) {
            return 'ai_accuracy_improvement';
        }
        if (content.includes('efficiency') || content.includes('optimization') || content.includes('specialization')) {
            return 'operational_efficiency';
        }
        if (content.includes('knowledge') || content.includes('sharing') || content.includes('research')) {
            return 'knowledge_sharing';
        }
        if (content.includes('agent') || content.includes('routing') || content.includes('task')) {
            return 'agent_specialization';
        }
        
        return 'general_business_impact';
    }

    /**
     * Quantify business impact in monetary terms
     */
    quantifyBusinessImpact(message) {
        const category = this.categorizeBusinessImpact(message);
        const multiplier = this.revenueModel.impactMultipliers[category] || 1.0;
        
        // Base impact calculation
        let baseImpact = 0;
        
        // Task completion impacts
        if (message.type === 'TASK_COMPLETED') {
            baseImpact = 50000; // ₹500 base impact for completed task
        } else if (message.type === 'BUSINESS_IMPACT_REPORT') {
            baseImpact = 25000; // ₹250 for business report
        } else if (message.type === 'TASK_DELEGATION') {
            baseImpact = 10000; // ₹100 for task delegation
        } else if (message.type === 'PROGRESS_UPDATE') {
            baseImpact = 5000;  // ₹50 for progress update
        }
        
        // Apply category multiplier
        const categorizedImpact = baseImpact * multiplier;
        
        // Apply urgency and priority multipliers
        const urgencyMultiplier = this.calculateUrgencyMultiplier(message);
        const finalImpact = categorizedImpact * urgencyMultiplier;
        
        return {
            baseImpact,
            categoryMultiplier: multiplier,
            urgencyMultiplier,
            finalImpact: Math.round(finalImpact),
            category: category,
            impactType: this.getImpactType(category)
        };
    }

    /**
     * Calculate urgency multiplier based on message content
     */
    calculateUrgencyMultiplier(message) {
        const payload = JSON.stringify(message.payload || {}).toLowerCase();
        
        let multiplier = 1.0;
        
        // High urgency indicators
        if (payload.includes('critical') || payload.includes('urgent')) multiplier += 0.5;
        if (payload.includes('emergency') || payload.includes('<5')) multiplier += 0.7;
        if (payload.includes('₹500cr') || payload.includes('revenue')) multiplier += 0.4;
        if (payload.includes('pilot') || payload.includes('customer')) multiplier += 0.3;
        
        // Time sensitivity
        if (payload.includes('immediate') || payload.includes('asap')) multiplier += 0.2;
        if (payload.includes('deadline') || payload.includes('sla')) multiplier += 0.2;
        
        return Math.min(multiplier, 2.5); // Cap at 2.5x
    }

    /**
     * Get impact type (revenue, cost, efficiency)
     */
    getImpactType(category) {
        const revenueCategories = ['nri_family_dashboard', 'hospital_partnerships', 'bangalore_pilot_success'];
        const efficiencyCategories = ['operational_efficiency', 'agent_specialization', 'knowledge_sharing'];
        const qualityCategories = ['emergency_response_optimization', 'ai_accuracy_improvement'];
        
        if (revenueCategories.includes(category)) return 'revenue';
        if (efficiencyCategories.includes(category)) return 'efficiency';
        if (qualityCategories.includes(category)) return 'quality';
        
        return 'general';
    }

    /**
     * Calculate impact confidence score
     */
    calculateImpactConfidence(message) {
        let confidence = 0.5;
        
        // Source credibility
        const highCredibilitySources = ['senior-care-boss', 'finance-strategy', 'ai-ml-specialist'];
        if (highCredibilitySources.includes(message.sender)) {
            confidence += 0.2;
        }
        
        // Message type credibility
        if (message.type === 'TASK_COMPLETED') confidence += 0.2;
        if (message.type === 'BUSINESS_IMPACT_REPORT') confidence += 0.15;
        
        // Content richness
        const payloadSize = JSON.stringify(message.payload || {}).length;
        if (payloadSize > 200) confidence += 0.1;
        if (payloadSize > 400) confidence += 0.05;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Calculate revenue correlation
     */
    calculateRevenueCorrelation(message) {
        const category = this.categorizeBusinessImpact(message);
        const content = JSON.stringify(message.payload || {}).toLowerCase();
        
        let correlation = 0.3; // Base correlation
        
        // Direct revenue correlation
        if (content.includes('revenue') || content.includes('₹')) correlation += 0.4;
        if (content.includes('nri') || content.includes('family')) correlation += 0.3;
        if (content.includes('customer') || content.includes('pilot')) correlation += 0.2;
        if (content.includes('efficiency') || content.includes('optimization')) correlation += 0.1;
        
        // Category-based correlation
        const categoryCorrelations = {
            'nri_family_dashboard': 0.9,
            'bangalore_pilot_success': 0.85,
            'hospital_partnerships': 0.8,
            'emergency_response_optimization': 0.75,
            'ai_accuracy_improvement': 0.7,
            'operational_efficiency': 0.65,
            'agent_specialization': 0.6,
            'knowledge_sharing': 0.5
        };
        
        correlation = Math.max(correlation, categoryCorrelations[category] || 0.3);
        
        return Math.min(correlation, 1.0);
    }

    /**
     * Track impact event in real-time
     */
    trackImpactEvent(impact) {
        this.impactTracking.set(impact.id, {
            ...impact,
            tracked_at: new Date().toISOString()
        });
    }

    /**
     * Calculate real-time business metrics
     */
    async calculateRealTimeMetrics(timeWindow = 24) {
        try {
            const cutoffTime = Date.now() - (timeWindow * 60 * 60 * 1000);
            
            let metrics = {
                timeWindow: `${timeWindow} hours`,
                totalImpactEvents: 0,
                totalMonetaryImpact: 0,
                revenueContribution: 0,
                efficiencyGains: 0,
                qualityImprovements: 0,
                categoryBreakdown: {},
                agentContributions: {},
                revenueProgress: 0,
                roi: 0
            };
            
            // Process tracked impacts
            for (const [id, impact] of this.impactTracking.entries()) {
                const impactTime = new Date(impact.timestamp).getTime();
                if (impactTime < cutoffTime) continue;
                
                metrics.totalImpactEvents++;
                metrics.totalMonetaryImpact += impact.quantification.finalImpact;
                
                // Categorize impacts
                if (impact.quantification.impactType === 'revenue') {
                    metrics.revenueContribution += impact.quantification.finalImpact;
                } else if (impact.quantification.impactType === 'efficiency') {
                    metrics.efficiencyGains += impact.quantification.finalImpact;
                } else if (impact.quantification.impactType === 'quality') {
                    metrics.qualityImprovements += impact.quantification.finalImpact;
                }
                
                // Category breakdown
                if (!metrics.categoryBreakdown[impact.category]) {
                    metrics.categoryBreakdown[impact.category] = {
                        count: 0,
                        totalImpact: 0,
                        averageImpact: 0
                    };
                }
                metrics.categoryBreakdown[impact.category].count++;
                metrics.categoryBreakdown[impact.category].totalImpact += impact.quantification.finalImpact;
                
                // Agent contributions
                if (!metrics.agentContributions[impact.source]) {
                    metrics.agentContributions[impact.source] = {
                        impactEvents: 0,
                        totalContribution: 0,
                        averageContribution: 0
                    };
                }
                metrics.agentContributions[impact.source].impactEvents++;
                metrics.agentContributions[impact.source].totalContribution += impact.quantification.finalImpact;
            }
            
            // Calculate averages
            Object.values(metrics.categoryBreakdown).forEach(category => {
                category.averageImpact = category.count > 0 ? category.totalImpact / category.count : 0;
            });
            
            Object.values(metrics.agentContributions).forEach(agent => {
                agent.averageContribution = agent.impactEvents > 0 ? agent.totalContribution / agent.impactEvents : 0;
            });
            
            // Calculate revenue progress
            const annualTarget = this.businessMetrics.revenue_targets.annualTarget;
            metrics.revenueProgress = (metrics.revenueContribution / annualTarget) * 100;
            
            // Calculate ROI (simplified)
            const estimatedCost = metrics.totalMonetaryImpact * 0.3; // Assume 30% cost
            metrics.roi = estimatedCost > 0 ? ((metrics.totalMonetaryImpact - estimatedCost) / estimatedCost) * 100 : 0;
            
            return metrics;
            
        } catch (error) {
            console.error('❌ Real-time metrics calculation failed:', error.message);
            return null;
        }
    }

    /**
     * Generate business impact report for specific time period
     */
    async generateBusinessReport(timeWindow = 24, includeProjections = true) {
        try {
            const metrics = await this.calculateRealTimeMetrics(timeWindow);
            if (!metrics) {
                throw new Error('Failed to calculate metrics');
            }
            
            let report = `📊 BUSINESS IMPACT REPORT (${timeWindow}h)\n`;
            report += `====================================\n\n`;
            
            // Executive Summary
            report += `💰 EXECUTIVE SUMMARY:\n`;
            report += `   Total Monetary Impact: ₹${(metrics.totalMonetaryImpact / 100).toLocaleString()}\n`;
            report += `   Revenue Contribution: ₹${(metrics.revenueContribution / 100).toLocaleString()}\n`;
            report += `   Efficiency Gains: ₹${(metrics.efficiencyGains / 100).toLocaleString()}\n`;
            report += `   Quality Improvements: ₹${(metrics.qualityImprovements / 100).toLocaleString()}\n`;
            report += `   ROI: ${metrics.roi.toFixed(1)}%\n\n`;
            
            // Revenue Progress
            const fiveYearTarget = this.businessMetrics.revenue_targets.fiveYearTarget / 100;
            const annualTarget = this.businessMetrics.revenue_targets.annualTarget / 100;
            
            report += `🎯 REVENUE PROGRESS:\n`;
            report += `   Target (5 years): ₹${(fiveYearTarget).toLocaleString()}\n`;
            report += `   Target (annual): ₹${(annualTarget).toLocaleString()}\n`;
            report += `   Progress: ${metrics.revenueProgress.toFixed(4)}% of annual target\n\n`;
            
            // Category Performance
            if (Object.keys(metrics.categoryBreakdown).length > 0) {
                report += `📋 IMPACT CATEGORIES:\n`;
                Object.entries(metrics.categoryBreakdown)
                    .sort(([,a], [,b]) => b.totalImpact - a.totalImpact)
                    .slice(0, 5)
                    .forEach(([category, data]) => {
                        report += `   • ${category}: ₹${(data.totalImpact / 100).toLocaleString()} (${data.count} events)\n`;
                    });
                report += `\n`;
            }
            
            // Agent Performance
            if (Object.keys(metrics.agentContributions).length > 0) {
                report += `🤖 AGENT CONTRIBUTIONS:\n`;
                Object.entries(metrics.agentContributions)
                    .sort(([,a], [,b]) => b.totalContribution - a.totalContribution)
                    .slice(0, 5)
                    .forEach(([agent, data]) => {
                        report += `   • ${agent}: ₹${(data.totalContribution / 100).toLocaleString()} (${data.impactEvents} actions)\n`;
                    });
                report += `\n`;
            }
            
            // Projections
            if (includeProjections) {
                const dailyImpact = metrics.totalMonetaryImpact * (24 / timeWindow);
                const monthlyProjection = dailyImpact * 30;
                const annualProjection = dailyImpact * 365;
                
                report += `🔮 PROJECTIONS:\n`;
                report += `   Daily Impact (projected): ₹${(dailyImpact / 100).toLocaleString()}\n`;
                report += `   Monthly Projection: ₹${(monthlyProjection / 100).toLocaleString()}\n`;
                report += `   Annual Projection: ₹${(annualProjection / 100).toLocaleString()}\n`;
                report += `   Revenue Target Achievement: ${((annualProjection / this.businessMetrics.revenue_targets.annualTarget) * 100).toFixed(1)}%\n\n`;
            }
            
            // Recommendations
            report += `💡 RECOMMENDATIONS:\n`;
            const recommendations = this.generateRecommendations(metrics);
            recommendations.forEach(rec => {
                report += `   • ${rec}\n`;
            });
            
            return {
                report,
                metrics,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Business report generation failed:', error.message);
            return null;
        }
    }

    /**
     * Generate business recommendations based on metrics
     */
    generateRecommendations(metrics) {
        const recommendations = [];
        
        // Revenue-based recommendations
        if (metrics.revenueProgress < 0.1) {
            recommendations.push('Focus on high-impact revenue activities (NRI family dashboard, hospital partnerships)');
        }
        
        if (metrics.revenueContribution < metrics.efficiencyGains) {
            recommendations.push('Prioritize direct revenue-generating tasks over efficiency improvements');
        }
        
        // Category-based recommendations
        const topCategory = Object.entries(metrics.categoryBreakdown)
            .sort(([,a], [,b]) => b.totalImpact - a.totalImpact)[0];
            
        if (topCategory && topCategory[1].averageImpact > 20000) {
            recommendations.push(`Continue focusing on ${topCategory[0]} - showing high average impact`);
        }
        
        // Agent-based recommendations
        const topAgent = Object.entries(metrics.agentContributions)
            .sort(([,a], [,b]) => b.averageContribution - a.averageContribution)[0];
            
        if (topAgent && topAgent[1].averageContribution > 15000) {
            recommendations.push(`Leverage ${topAgent[0]}'s high-impact capabilities for similar tasks`);
        }
        
        // ROI recommendations
        if (metrics.roi < 200) {
            recommendations.push('Focus on higher ROI activities to improve business efficiency');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Maintain current performance levels - system operating optimally');
        }
        
        return recommendations;
    }

    /**
     * Calculate baseline metrics for comparison
     */
    async calculateBaselineMetrics() {
        return {
            baselineRevenue: 0,
            baselineEfficiency: 1.0,
            baselineQuality: 0.8,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Setup real-time tracking
     */
    setupRealTimeTracking() {
        console.log('📡 Setting up real-time business impact tracking...');
        this.isMonitoring = true;
    }

    /**
     * Start monitoring business impact
     */
    async startMonitoring(intervalMinutes = 15) {
        try {
            console.log('📊 Starting real-time business impact monitoring...');
            
            // Run initial calculation
            const initialMetrics = await this.calculateRealTimeMetrics();
            console.log(`💰 Initial impact: ₹${(initialMetrics.totalMonetaryImpact / 100).toLocaleString()}`);
            
            // Start monitoring loop
            this.monitoringInterval = setInterval(async () => {
                await this.runMonitoringCycle();
            }, intervalMinutes * 60 * 1000);
            
            this.isMonitoring = true;
            console.log(`✅ Monitoring active (every ${intervalMinutes} minutes)`);
            
            return initialMetrics;
            
        } catch (error) {
            console.error('❌ Failed to start monitoring:', error.message);
            throw error;
        }
    }

    /**
     * Run single monitoring cycle
     */
    async runMonitoringCycle() {
        try {
            const cycleStart = Date.now();
            console.log(`\n💰 [${new Date().toLocaleTimeString()}] Running business impact analysis...`);
            
            // Get new A2A messages
            const messages = await this.client.getMessages(null, null, 50, null, 1); // Last hour
            
            // Process new impact events
            let newImpacts = 0;
            let newMonetaryImpact = 0;
            
            for (const message of messages || []) {
                if (this.isBusinessImpactMessage(message)) {
                    const impact = this.calculateMessageBusinessImpact(message);
                    if (impact && !this.impactTracking.has(impact.id)) {
                        this.trackImpactEvent(impact);
                        newImpacts++;
                        newMonetaryImpact += impact.quantification.finalImpact;
                    }
                }
            }
            
            // Calculate current metrics
            const currentMetrics = await this.calculateRealTimeMetrics(24);
            
            // Log results
            const cycleTime = Date.now() - cycleStart;
            console.log(`✅ Impact analysis complete (${cycleTime}ms)`);
            console.log(`   New impacts: ${newImpacts}`);
            console.log(`   New monetary impact: ₹${(newMonetaryImpact / 100).toLocaleString()}`);
            console.log(`   Total 24h impact: ₹${(currentMetrics.totalMonetaryImpact / 100).toLocaleString()}`);
            console.log(`   Revenue progress: ${currentMetrics.revenueProgress.toFixed(4)}%`);
            
            // Send high-impact alerts
            if (newMonetaryImpact > 100000) { // ₹1000+ impact
                await this.sendHighImpactAlert(newMonetaryImpact, newImpacts);
            }
            
        } catch (error) {
            console.error('⚠️ Monitoring cycle failed:', error.message);
        }
    }

    /**
     * Send alert for high business impact events
     */
    async sendHighImpactAlert(impactAmount, eventCount) {
        try {
            await this.client.sendMessage(
                'BusinessImpactSystem',
                'Gemini Prime',
                'BUSINESS_IMPACT_REPORT',
                {
                    reportType: 'HIGH_IMPACT_ALERT',
                    impactAmount: impactAmount,
                    eventCount: eventCount,
                    message: `High business impact detected: ₹${(impactAmount / 100).toLocaleString()} from ${eventCount} events`,
                    timestamp: new Date().toISOString(),
                    urgency: 'HIGH'
                },
                `high_impact_alert_${Date.now()}`
            );
        } catch (error) {
            console.error('⚠️ Failed to send high impact alert:', error.message);
        }
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.isMonitoring = false;
        console.log('🛑 Business impact monitoring stopped');
    }

    /**
     * Get monitoring status
     */
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            impactEventsTracked: this.impactTracking.size,
            revenueTarget: this.businessMetrics.revenue_targets.fiveYearTarget,
            categoriesTracked: Object.keys(this.revenueModel.impactMultipliers).length
        };
    }
}

module.exports = BusinessImpactQuantification;