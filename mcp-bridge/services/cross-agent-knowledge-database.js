#!/usr/bin/env node
/**
 * CROSS-AGENT KNOWLEDGE SHARING DATABASE
 * Senior Care AI Ecosystem - Intelligent Knowledge Management
 * 
 * Eliminates redundant research and accelerates decision-making
 * Enables knowledge transfer between agents and sessions
 * 
 * Business Impact: Critical for ₹500Cr revenue system efficiency
 */

const A2ASupabaseClient = require('./a2a-supabase-client');
const crypto = require('crypto');

class CrossAgentKnowledgeDatabase {
    constructor(supabaseUrl, serviceKey) {
        this.client = new A2ASupabaseClient(supabaseUrl, serviceKey, {
            agentId: 'KnowledgeDatabase'
        });
        
        this.knowledgeCategories = this.defineKnowledgeCategories();
        this.accessPatterns = this.defineAccessPatterns();
        this.knowledgeIndex = new Map(); // In-memory index for fast retrieval
        this.isIndexed = false;
    }

    /**
     * Define knowledge categories for organized storage
     */
    defineKnowledgeCategories() {
        return {
            // Business Intelligence
            'market_research': {
                description: 'Market analysis, competitive intelligence, customer insights',
                priority: 'high',
                retention: '6 months',
                shareable: true,
                agents: ['market-intelligence', 'senior-care-boss', 'finance-strategy']
            },
            
            'customer_insights': {
                description: 'NRI family needs, elderly care preferences, user behavior patterns',
                priority: 'critical',
                retention: '1 year',
                shareable: true,
                agents: ['product-innovation', 'market-intelligence', 'operations-excellence']
            },
            
            'competitive_analysis': {
                description: 'Emoha, KITES, Primus analysis, market positioning',
                priority: 'high',
                retention: '3 months',
                shareable: true,
                agents: ['market-intelligence', 'senior-care-boss', 'finance-strategy']
            },
            
            // Technical Knowledge
            'ai_model_research': {
                description: 'Health prediction algorithms, emergency detection models, accuracy improvements',
                priority: 'critical',
                retention: '1 year',
                shareable: true,
                agents: ['ai-ml-specialist', 'operations-excellence']
            },
            
            'system_architecture': {
                description: 'Technical implementations, integration patterns, performance optimizations',
                priority: 'high',
                retention: '6 months',
                shareable: true,
                agents: ['Claude Code', 'ai-ml-specialist', 'operations-excellence']
            },
            
            'emergency_protocols': {
                description: 'Emergency response procedures, hospital integrations, <5 min SLA requirements',
                priority: 'critical',
                retention: '2 years',
                shareable: true,
                agents: ['ai-ml-specialist', 'operations-excellence', 'partnership-development']
            },
            
            // Operational Knowledge
            'hospital_partnerships': {
                description: 'Apollo, Manipal, Fortis integration details, negotiation insights',
                priority: 'high',
                retention: '1 year',
                shareable: true,
                agents: ['partnership-development', 'operations-excellence', 'senior-care-boss']
            },
            
            'bangalore_pilot_insights': {
                description: 'Pilot execution learnings, family onboarding processes, operational challenges',
                priority: 'critical',
                retention: '2 years',
                shareable: true,
                agents: ['operations-excellence', 'senior-care-boss', 'product-innovation']
            },
            
            'caregiver_management': {
                description: 'Recruitment, training, quality standards, performance metrics',
                priority: 'high',
                retention: '1 year',
                shareable: true,
                agents: ['operations-excellence', 'compliance-quality']
            },
            
            // Compliance and Quality
            'hipaa_compliance': {
                description: 'Healthcare data protection, privacy requirements, audit procedures',
                priority: 'critical',
                retention: '3 years',
                shareable: true,
                agents: ['compliance-quality', 'ai-ml-specialist', 'Claude Code']
            },
            
            'quality_standards': {
                description: 'Service quality metrics, SLA definitions, performance benchmarks',
                priority: 'high',
                retention: '1 year',
                shareable: true,
                agents: ['compliance-quality', 'operations-excellence', 'senior-care-boss']
            },
            
            // Financial and Strategic
            'revenue_strategies': {
                description: 'Unit economics, pricing models, ₹500Cr pathway, LTV:CAC optimization',
                priority: 'critical',
                retention: '2 years',
                shareable: true,
                agents: ['finance-strategy', 'senior-care-boss', 'market-intelligence']
            },
            
            'nri_segment_analysis': {
                description: 'NRI family demographics, pain points, ₹15K-25K ARPU strategies',
                priority: 'critical',
                retention: '1 year',
                shareable: true,
                agents: ['market-intelligence', 'product-innovation', 'finance-strategy']
            }
        };
    }

    /**
     * Define access patterns for different types of knowledge requests
     */
    defineAccessPatterns() {
        return {
            'research_request': {
                description: 'Agent needs research on specific topic',
                response_time: '< 5 seconds',
                includes_sources: true,
                confidence_score: true
            },
            
            'knowledge_contribution': {
                description: 'Agent sharing new knowledge or insights',
                validation_required: true,
                categorization_automatic: true,
                indexing_immediate: true
            },
            
            'expertise_lookup': {
                description: 'Finding which agent has expertise in specific area',
                includes_agent_ranking: true,
                availability_check: true,
                specialization_match: true
            },
            
            'trend_analysis': {
                description: 'Historical knowledge patterns and trending topics',
                time_series_data: true,
                frequency_analysis: true,
                business_impact_correlation: true
            }
        };
    }

    /**
     * Initialize knowledge database
     */
    async initialize() {
        try {
            console.log('🧠 Initializing Cross-Agent Knowledge Database...');
            
            // Build knowledge index
            await this.buildKnowledgeIndex();
            
            // Set up real-time knowledge sharing
            this.setupKnowledgeSharing();
            
            // Initialize categorization engine
            this.initializeCategorizationEngine();
            
            console.log('✅ Knowledge database initialized and ready');
            console.log(`📚 Categories: ${Object.keys(this.knowledgeCategories).length}`);
            console.log(`🔍 Index size: ${this.knowledgeIndex.size} entries`);
            
            return {
                status: 'initialized',
                categories: Object.keys(this.knowledgeCategories).length,
                indexSize: this.knowledgeIndex.size
            };
            
        } catch (error) {
            console.error('❌ Knowledge database initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Build searchable index of existing knowledge
     */
    async buildKnowledgeIndex() {
        try {
            console.log('📝 Building knowledge index from existing data...');
            
            // Get existing A2A messages for knowledge mining
            const messages = await this.client.getMessages(null, null, 500, null, 168); // Last 7 days
            
            let knowledgeItems = 0;
            
            for (const message of messages || []) {
                if (this.isKnowledgeMessage(message)) {
                    const knowledgeItem = this.extractKnowledge(message);
                    if (knowledgeItem) {
                        await this.indexKnowledgeItem(knowledgeItem);
                        knowledgeItems++;
                    }
                }
            }
            
            this.isIndexed = true;
            console.log(`✅ Knowledge index built: ${knowledgeItems} items indexed`);
            
        } catch (error) {
            console.error('⚠️ Knowledge index building failed:', error.message);
            // Continue without index - will build incrementally
        }
    }

    /**
     * Check if message contains valuable knowledge
     */
    isKnowledgeMessage(message) {
        const knowledgeTypes = [
            'BUSINESS_IMPACT_REPORT',
            'TASK_COMPLETED',
            'STRATEGIC_QUERY',
            'BLOCKER_REPORT'
        ];
        
        if (!knowledgeTypes.includes(message.type)) {
            return false;
        }
        
        // Check for substantial content
        const payload = message.payload;
        if (!payload) return false;
        
        const contentLength = JSON.stringify(payload).length;
        return contentLength > 100; // Minimum content threshold
    }

    /**
     * Extract knowledge from message
     */
    extractKnowledge(message) {
        try {
            const knowledge = {
                id: this.generateKnowledgeId(message),
                source: message.sender,
                timestamp: message.created_at,
                type: message.type,
                category: this.categorizeKnowledge(message),
                content: this.extractContent(message),
                context: message.context_id || 'general',
                businessRelevance: this.assessBusinessRelevance(message),
                confidence: this.calculateConfidence(message),
                tags: this.generateTags(message)
            };
            
            return knowledge;
            
        } catch (error) {
            console.error('⚠️ Knowledge extraction failed:', error.message);
            return null;
        }
    }

    /**
     * Categorize knowledge automatically
     */
    categorizeKnowledge(message) {
        const payload = JSON.stringify(message.payload || {}).toLowerCase();
        const content = JSON.stringify(message).toLowerCase();
        
        // Business categories
        if (content.includes('revenue') || content.includes('₹500cr') || content.includes('arpu')) {
            return 'revenue_strategies';
        }
        if (content.includes('nri') || content.includes('family') || content.includes('us-based')) {
            return 'nri_segment_analysis';
        }
        if (content.includes('market') || content.includes('competitive') || content.includes('emoha')) {
            return 'competitive_analysis';
        }
        if (content.includes('customer') || content.includes('elderly') || content.includes('parents')) {
            return 'customer_insights';
        }
        
        // Technical categories
        if (content.includes('ai') || content.includes('model') || content.includes('97.3%') || content.includes('accuracy')) {
            return 'ai_model_research';
        }
        if (content.includes('emergency') || content.includes('<5') || content.includes('response')) {
            return 'emergency_protocols';
        }
        if (content.includes('system') || content.includes('architecture') || content.includes('integration')) {
            return 'system_architecture';
        }
        
        // Operational categories  
        if (content.includes('hospital') || content.includes('apollo') || content.includes('manipal')) {
            return 'hospital_partnerships';
        }
        if (content.includes('bangalore') || content.includes('pilot') || content.includes('100 families')) {
            return 'bangalore_pilot_insights';
        }
        if (content.includes('caregiver') || content.includes('training') || content.includes('recruitment')) {
            return 'caregiver_management';
        }
        
        // Compliance categories
        if (content.includes('hipaa') || content.includes('compliance') || content.includes('privacy')) {
            return 'hipaa_compliance';
        }
        if (content.includes('quality') || content.includes('sla') || content.includes('standards')) {
            return 'quality_standards';
        }
        
        return 'general'; // Default category
    }

    /**
     * Extract meaningful content from message
     */
    extractContent(message) {
        const payload = message.payload || {};
        
        // Priority content extraction
        const contentSources = [
            payload.objective,
            payload.description,
            payload.result,
            payload.analysis,
            payload.recommendation,
            payload.insight,
            payload.conclusion,
            JSON.stringify(payload).slice(0, 500) // Fallback to first 500 chars
        ];
        
        for (const content of contentSources) {
            if (content && typeof content === 'string' && content.length > 50) {
                return content;
            }
        }
        
        return 'Knowledge item from ' + message.type;
    }

    /**
     * Assess business relevance of knowledge
     */
    assessBusinessRelevance(message) {
        const content = JSON.stringify(message).toLowerCase();
        let relevanceScore = 0.5; // Base relevance
        
        // High business impact keywords
        const highImpactKeywords = ['revenue', '₹500cr', 'emergency', 'nri', 'pilot', 'hospital'];
        const mediumImpactKeywords = ['family', 'customer', 'quality', 'ai', 'model'];
        
        highImpactKeywords.forEach(keyword => {
            if (content.includes(keyword)) relevanceScore += 0.2;
        });
        
        mediumImpactKeywords.forEach(keyword => {
            if (content.includes(keyword)) relevanceScore += 0.1;
        });
        
        return Math.min(relevanceScore, 1.0);
    }

    /**
     * Calculate confidence score for knowledge
     */
    calculateConfidence(message) {
        let confidence = 0.5;
        
        // Source credibility
        const highCredibilitySources = ['senior-care-boss', 'ai-ml-specialist', 'Claude Code'];
        if (highCredibilitySources.includes(message.sender)) {
            confidence += 0.2;
        }
        
        // Content quality indicators
        if (message.type === 'TASK_COMPLETED') confidence += 0.2;
        if (message.type === 'BUSINESS_IMPACT_REPORT') confidence += 0.1;
        
        // Payload richness
        const payloadSize = JSON.stringify(message.payload || {}).length;
        if (payloadSize > 300) confidence += 0.1;
        if (payloadSize > 500) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }

    /**
     * Generate tags for knowledge item
     */
    generateTags(message) {
        const content = JSON.stringify(message).toLowerCase();
        const tags = [];
        
        // Business tags
        if (content.includes('revenue') || content.includes('₹')) tags.push('revenue');
        if (content.includes('nri')) tags.push('nri');
        if (content.includes('family')) tags.push('family');
        if (content.includes('emergency')) tags.push('emergency');
        if (content.includes('pilot')) tags.push('bangalore-pilot');
        if (content.includes('hospital')) tags.push('hospital');
        
        // Technical tags
        if (content.includes('ai') || content.includes('model')) tags.push('ai');
        if (content.includes('accuracy') || content.includes('97.3%')) tags.push('accuracy');
        if (content.includes('response') || content.includes('<5')) tags.push('response-time');
        
        // Operational tags
        if (content.includes('quality')) tags.push('quality');
        if (content.includes('compliance')) tags.push('compliance');
        if (content.includes('partnership')) tags.push('partnership');
        
        return [...new Set(tags)]; // Remove duplicates
    }

    /**
     * Index knowledge item for fast retrieval
     */
    async indexKnowledgeItem(knowledgeItem) {
        try {
            // Add to in-memory index
            this.knowledgeIndex.set(knowledgeItem.id, knowledgeItem);
            
            // Index by category
            const categoryKey = `category:${knowledgeItem.category}`;
            if (!this.knowledgeIndex.has(categoryKey)) {
                this.knowledgeIndex.set(categoryKey, []);
            }
            this.knowledgeIndex.get(categoryKey).push(knowledgeItem.id);
            
            // Index by tags
            knowledgeItem.tags.forEach(tag => {
                const tagKey = `tag:${tag}`;
                if (!this.knowledgeIndex.has(tagKey)) {
                    this.knowledgeIndex.set(tagKey, []);
                }
                this.knowledgeIndex.get(tagKey).push(knowledgeItem.id);
            });
            
            // Index by source agent
            const sourceKey = `source:${knowledgeItem.source}`;
            if (!this.knowledgeIndex.has(sourceKey)) {
                this.knowledgeIndex.set(sourceKey, []);
            }
            this.knowledgeIndex.get(sourceKey).push(knowledgeItem.id);
            
        } catch (error) {
            console.error('⚠️ Knowledge indexing failed:', error.message);
        }
    }

    /**
     * Search knowledge database
     */
    async searchKnowledge(query, options = {}) {
        try {
            console.log(`🔍 Searching knowledge: "${query}"`);
            
            const {
                category = null,
                tags = [],
                minConfidence = 0.3,
                maxResults = 10,
                includeSource = true,
                requestingAgent = null
            } = options;
            
            let results = [];
            
            // Search by query keywords
            const queryKeywords = this.extractKeywords(query);
            
            // Search in indexed knowledge
            for (const [id, knowledge] of this.knowledgeIndex.entries()) {
                if (typeof knowledge !== 'object' || !knowledge.content) continue;
                
                let relevanceScore = this.calculateRelevanceScore(knowledge, queryKeywords, query);
                
                // Apply filters
                if (category && knowledge.category !== category) continue;
                if (tags.length > 0 && !tags.some(tag => knowledge.tags.includes(tag))) continue;
                if (knowledge.confidence < minConfidence) continue;
                
                // Check if agent has access
                if (requestingAgent && !this.hasKnowledgeAccess(requestingAgent, knowledge)) continue;
                
                if (relevanceScore > 0.3) {
                    results.push({
                        ...knowledge,
                        relevanceScore,
                        source: includeSource ? knowledge.source : undefined
                    });
                }
            }
            
            // Sort by relevance and confidence
            results.sort((a, b) => {
                const scoreA = a.relevanceScore * a.confidence;
                const scoreB = b.relevanceScore * b.confidence;
                return scoreB - scoreA;
            });
            
            // Limit results
            results = results.slice(0, maxResults);
            
            console.log(`✅ Found ${results.length} relevant knowledge items`);
            
            return {
                query,
                results,
                totalFound: results.length,
                categories: [...new Set(results.map(r => r.category))],
                sources: [...new Set(results.map(r => r.source))],
                searchTime: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Knowledge search failed:', error.message);
            return { query, results: [], error: error.message };
        }
    }

    /**
     * Calculate relevance score for knowledge item
     */
    calculateRelevanceScore(knowledge, queryKeywords, originalQuery) {
        let score = 0;
        const content = knowledge.content.toLowerCase();
        const query = originalQuery.toLowerCase();
        
        // Exact phrase match (highest score)
        if (content.includes(query)) {
            score += 0.8;
        }
        
        // Keyword matches
        const keywordMatches = queryKeywords.filter(keyword => 
            content.includes(keyword.toLowerCase())
        );
        score += (keywordMatches.length / queryKeywords.length) * 0.6;
        
        // Tag relevance
        const tagMatches = knowledge.tags.filter(tag => 
            queryKeywords.some(keyword => tag.includes(keyword.toLowerCase()))
        );
        score += (tagMatches.length / Math.max(knowledge.tags.length, 1)) * 0.4;
        
        // Business relevance boost
        score += knowledge.businessRelevance * 0.2;
        
        // Recency boost (newer knowledge is more valuable)
        const ageHours = (Date.now() - new Date(knowledge.timestamp).getTime()) / (1000 * 60 * 60);
        const recencyBoost = Math.max(0, (168 - ageHours) / 168) * 0.1; // Boost for knowledge < 1 week old
        score += recencyBoost;
        
        return Math.min(score, 1.0);
    }

    /**
     * Extract keywords from search query
     */
    extractKeywords(query) {
        return query
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['and', 'or', 'the', 'for', 'with', 'how', 'what', 'when', 'where'].includes(word));
    }

    /**
     * Check if agent has access to knowledge
     */
    hasKnowledgeAccess(agentName, knowledge) {
        const category = this.knowledgeCategories[knowledge.category];
        if (!category) return true; // Default allow
        
        if (!category.shareable) return false;
        if (category.agents && !category.agents.includes(agentName)) return false;
        
        return true;
    }

    /**
     * Share knowledge with specific agent
     */
    async shareKnowledge(knowledgeId, targetAgent, sharingAgent) {
        try {
            const knowledge = this.knowledgeIndex.get(knowledgeId);
            if (!knowledge) {
                throw new Error('Knowledge item not found');
            }
            
            // Check sharing permissions
            if (!this.hasKnowledgeAccess(targetAgent, knowledge)) {
                throw new Error('Target agent does not have access to this knowledge');
            }
            
            console.log(`📤 Sharing knowledge "${knowledge.id}" from ${sharingAgent} to ${targetAgent}`);
            
            await this.client.sendMessage(
                sharingAgent,
                targetAgent,
                'STRATEGIC_QUERY',
                {
                    query: 'KNOWLEDGE_SHARING',
                    knowledgeItem: {
                        id: knowledge.id,
                        category: knowledge.category,
                        content: knowledge.content,
                        source: knowledge.source,
                        confidence: knowledge.confidence,
                        tags: knowledge.tags,
                        businessRelevance: knowledge.businessRelevance
                    },
                    sharingReason: 'Relevant knowledge for current task',
                    timestamp: new Date().toISOString()
                },
                `knowledge_share_${Date.now()}`
            );
            
            console.log('✅ Knowledge shared successfully');
            
            return {
                success: true,
                knowledgeId,
                sharedWith: targetAgent,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Knowledge sharing failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add new knowledge to database
     */
    async addKnowledge(knowledgeData, contributingAgent) {
        try {
            const knowledge = {
                id: this.generateKnowledgeId({ 
                    sender: contributingAgent, 
                    created_at: new Date().toISOString(),
                    payload: knowledgeData
                }),
                source: contributingAgent,
                timestamp: new Date().toISOString(),
                type: 'KNOWLEDGE_CONTRIBUTION',
                category: knowledgeData.category || this.categorizeKnowledge({ payload: knowledgeData }),
                content: knowledgeData.content,
                context: knowledgeData.context || 'general',
                businessRelevance: knowledgeData.businessRelevance || 0.7,
                confidence: knowledgeData.confidence || 0.8,
                tags: knowledgeData.tags || this.generateTags({ payload: knowledgeData })
            };
            
            // Index the new knowledge
            await this.indexKnowledgeItem(knowledge);
            
            console.log(`📚 New knowledge added: ${knowledge.id} (category: ${knowledge.category})`);
            
            // Notify relevant agents about new knowledge
            await this.notifyRelevantAgents(knowledge);
            
            return {
                success: true,
                knowledgeId: knowledge.id,
                category: knowledge.category,
                tags: knowledge.tags
            };
            
        } catch (error) {
            console.error('❌ Failed to add knowledge:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify agents about relevant new knowledge
     */
    async notifyRelevantAgents(knowledge) {
        try {
            const category = this.knowledgeCategories[knowledge.category];
            if (!category || !category.agents) return;
            
            const relevantAgents = category.agents.filter(agent => agent !== knowledge.source);
            
            for (const agent of relevantAgents.slice(0, 3)) { // Limit notifications
                await this.client.sendMessage(
                    'KnowledgeDatabase',
                    agent,
                    'BUSINESS_IMPACT_REPORT',
                    {
                        reportType: 'NEW_KNOWLEDGE_AVAILABLE',
                        category: knowledge.category,
                        knowledgeId: knowledge.id,
                        tags: knowledge.tags.slice(0, 3),
                        businessRelevance: knowledge.businessRelevance,
                        suggestedAction: `Consider reviewing new ${knowledge.category} knowledge`,
                        timestamp: new Date().toISOString()
                    },
                    `knowledge_notification_${Date.now()}`
                );
            }
            
        } catch (error) {
            console.error('⚠️ Failed to notify agents:', error.message);
        }
    }

    /**
     * Get knowledge statistics
     */
    getKnowledgeStatistics() {
        const stats = {
            totalKnowledgeItems: 0,
            categories: {},
            sources: {},
            tags: {},
            averageConfidence: 0,
            averageBusinessRelevance: 0,
            recentItems: 0 // Last 24 hours
        };
        
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        let totalConfidence = 0;
        let totalRelevance = 0;
        
        for (const [id, knowledge] of this.knowledgeIndex.entries()) {
            if (typeof knowledge !== 'object' || !knowledge.content) continue;
            
            stats.totalKnowledgeItems++;
            
            // Category stats
            if (!stats.categories[knowledge.category]) {
                stats.categories[knowledge.category] = 0;
            }
            stats.categories[knowledge.category]++;
            
            // Source stats
            if (!stats.sources[knowledge.source]) {
                stats.sources[knowledge.source] = 0;
            }
            stats.sources[knowledge.source]++;
            
            // Tag stats
            knowledge.tags.forEach(tag => {
                if (!stats.tags[tag]) {
                    stats.tags[tag] = 0;
                }
                stats.tags[tag]++;
            });
            
            // Confidence and relevance
            totalConfidence += knowledge.confidence;
            totalRelevance += knowledge.businessRelevance;
            
            // Recent items
            if (new Date(knowledge.timestamp).getTime() > oneDayAgo) {
                stats.recentItems++;
            }
        }
        
        if (stats.totalKnowledgeItems > 0) {
            stats.averageConfidence = totalConfidence / stats.totalKnowledgeItems;
            stats.averageBusinessRelevance = totalRelevance / stats.totalKnowledgeItems;
        }
        
        return stats;
    }

    /**
     * Setup real-time knowledge sharing
     */
    setupKnowledgeSharing() {
        console.log('🔄 Setting up real-time knowledge sharing...');
        // This would set up webhooks/subscriptions for real-time updates
        // For now, we'll rely on periodic index updates
    }

    /**
     * Initialize categorization engine
     */
    initializeCategorizationEngine() {
        console.log('🏷️  Categorization engine initialized');
        // Advanced categorization logic would go here
        // For now, using keyword-based categorization
    }

    /**
     * Generate unique knowledge ID
     */
    generateKnowledgeId(message) {
        const content = JSON.stringify({
            sender: message.sender,
            timestamp: message.created_at,
            content: JSON.stringify(message.payload || {}).slice(0, 100)
        });
        
        return crypto.createHash('md5').update(content).digest('hex').slice(0, 16);
    }
}

module.exports = CrossAgentKnowledgeDatabase;