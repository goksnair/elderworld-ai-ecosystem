// Knowledge Base Auto-Sync System
// Integrates Supabase, Obsidian, and agent communications for seamless knowledge management

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class KnowledgeSyncSystem {
  constructor(supabaseUrl, supabaseKey, obsidianVaultPath) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.vaultPath = obsidianVaultPath;
    this.syncQueue = new Map();
    this.watchedFiles = new Set();
    this.lastSyncTime = new Date();
    this.initializeSync();
  }

  async initializeSync() {
    // Set up real-time listeners for Supabase changes
    await this.setupRealtimeListeners();
    
    // Initialize file watching for Obsidian vault
    await this.initializeFileWatching();
    
    // Perform initial sync
    await this.performInitialSync();
  }

  // Real-time Supabase to Obsidian sync
  async setupRealtimeListeners() {
    // Listen for new knowledge entries
    this.supabase
      .channel('knowledge-sync')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'knowledge_entries' 
        }, 
        (payload) => {
          this.handleKnowledgeEntryInsert(payload.new);
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'knowledge_entries'
        },
        (payload) => {
          this.handleKnowledgeEntryUpdate(payload.new);
        }
      )
      .subscribe();

    // Listen for agent communications that need documentation
    this.supabase
      .channel('communication-sync')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_communications'
        },
        (payload) => {
          this.handleAgentCommunication(payload.new);
        }
      )
      .subscribe();

    // Listen for strategic decisions
    this.supabase
      .channel('decision-sync')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'strategic_decisions'
        },
        (payload) => {
          this.handleStrategicDecision(payload.new);
        }
      )
      .subscribe();
  }

  // Handle new knowledge entry from agents
  async handleKnowledgeEntryInsert(knowledgeEntry) {
    try {
      const { agent_id, category, title, content, tags, obsidian_path } = knowledgeEntry;
      
      // Get agent information
      const { data: agent } = await this.supabase
        .from('agents')
        .select('agent_type, role')
        .eq('id', agent_id)
        .single();

      // Create Obsidian file
      const filePath = path.join(this.vaultPath, obsidian_path || this.generateFilePath(category, title));
      
      const markdownContent = this.generateMarkdownContent({
        title,
        content,
        agent: agent,
        category,
        tags,
        metadata: knowledgeEntry
      });

      await this.ensureDirectoryExists(path.dirname(filePath));
      await fs.writeFile(filePath, markdownContent, 'utf8');
      
      // Update links and references
      await this.updateObsidianLinks(filePath, knowledgeEntry);
      
      console.log(`Synced knowledge entry to Obsidian: ${filePath}`);
    } catch (error) {
      console.error('Error syncing knowledge entry:', error);
    }
  }

  // Handle knowledge entry updates
  async handleKnowledgeEntryUpdate(knowledgeEntry) {
    // Similar to insert but updates existing file
    await this.handleKnowledgeEntryInsert(knowledgeEntry);
  }

  // Handle agent communications for documentation
  async handleAgentCommunication(communication) {
    const { sender_agent, receiver_agent, message_type, content, priority } = communication;
    
    // Only document high-priority strategic communications
    if (priority === 'high' || priority === 'critical') {
      try {
        // Get agent information
        const { data: agents } = await this.supabase
          .from('agents')
          .select('id, agent_type, role')
          .in('id', [sender_agent, receiver_agent]);

        const senderAgent = agents.find(a => a.id === sender_agent);
        const receiverAgent = agents.find(a => a.id === receiver_agent);

        // Create communication log entry
        const commLogPath = path.join(
          this.vaultPath,
          'Daily',
          `Agent-Communications-${new Date().toISOString().split('T')[0]}.md`
        );

        const communicationEntry = `
## ${new Date().toLocaleTimeString()} - ${message_type}
**From**: ${senderAgent?.role} (${senderAgent?.agent_type})
**To**: ${receiverAgent?.role} (${receiverAgent?.agent_type})  
**Priority**: ${priority}

### Content
${typeof content === 'object' ? JSON.stringify(content, null, 2) : content}

---
`;

        await this.appendToFile(commLogPath, communicationEntry);
      } catch (error) {
        console.error('Error logging agent communication:', error);
      }
    }
  }

  // Handle strategic decisions documentation
  async handleStrategicDecision(decision) {
    try {
      const { decision_type, description, rationale, impact_agents, status, created_by } = decision;
      
      const decisionPath = path.join(
        this.vaultPath,
        'Strategy',
        'Strategic-Decisions',
        `${decision_type}-${Date.now()}.md`
      );

      const decisionContent = `# Strategic Decision: ${decision_type}

## Overview
**Status**: ${status}
**Created by**: ${created_by}
**Date**: ${new Date().toISOString().split('T')[0]}
**Impact Agents**: ${impact_agents?.join(', ') || 'None specified'}

## Description
${description}

## Rationale
${rationale || 'No rationale provided'}

## Implementation Tracking
- [ ] Decision approved
- [ ] Resources allocated
- [ ] Implementation started
- [ ] Success metrics defined
- [ ] Completion verified

## Related Notes
${impact_agents?.map(agent => `- [[Agents/${agent}]]`).join('\n') || ''}

## Tags
#strategic-decision #${decision_type.replace(/_/g, '-')} #${status}
`;

      await this.ensureDirectoryExists(path.dirname(decisionPath));
      await fs.writeFile(decisionPath, decisionContent, 'utf8');
      
      console.log(`Documented strategic decision: ${decisionPath}`);
    } catch (error) {
      console.error('Error documenting strategic decision:', error);
    }
  }

  // Initialize file watching for Obsidian changes
  async initializeFileWatching() {
    // In a production system, would use fs.watch or similar
    // For now, implement periodic sync checks
    setInterval(() => {
      this.checkForObsidianChanges();
    }, 30000); // Check every 30 seconds
  }

  // Check for changes in Obsidian vault and sync back to Supabase
  async checkForObsidianChanges() {
    try {
      const vaultFiles = await this.getAllMarkdownFiles(this.vaultPath);
      
      for (const filePath of vaultFiles) {
        const stats = await fs.stat(filePath);
        if (stats.mtime > this.lastSyncTime) {
          await this.syncObsidianToSupabase(filePath);
        }
      }
      
      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Error checking Obsidian changes:', error);
    }
  }

  // Sync Obsidian file changes back to Supabase
  async syncObsidianToSupabase(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const metadata = this.extractMarkdownMetadata(content);
      
      if (metadata.agent_id) {
        // Update existing knowledge entry
        const { error } = await this.supabase
          .from('knowledge_entries')
          .update({
            content: this.extractMarkdownContent(content),
            updated_at: new Date().toISOString()
          })
          .eq('agent_id', metadata.agent_id)
          .eq('obsidian_path', path.relative(this.vaultPath, filePath));

        if (error) {
          console.error('Error updating knowledge entry:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing Obsidian to Supabase:', error);
    }
  }

  // Generate automated dashboard updates
  async generateDashboardUpdates() {
    const dashboardPath = path.join(this.vaultPath, 'Dashboard', 'Executive Summary.md');
    
    try {
      // Get latest metrics from all agents
      const { data: metrics } = await this.supabase
        .from('performance_metrics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false });

      // Get recent strategic decisions
      const { data: decisions } = await this.supabase
        .from('strategic_decisions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Get agent activity status
      const { data: agents } = await this.supabase
        .from('agents') 
        .select('agent_type, role, last_active, status')
        .order('last_active', { ascending: false });

      // Generate dashboard content
      const dashboardContent = this.generateDashboardMarkdown({
        metrics,
        decisions,
        agents,
        lastUpdated: new Date()
      });

      await fs.writeFile(dashboardPath, dashboardContent, 'utf8');
      console.log('Updated executive dashboard');
    } catch (error) {
      console.error('Error generating dashboard updates:', error);
    }
  }

  // Automated weekly intelligence reports
  async generateWeeklyIntelligence() {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    try {
      // Gather intelligence from all agents
      const intelligenceData = await this.gatherWeeklyIntelligence(weekStart);
      
      const reportPath = path.join(
        this.vaultPath,
        'Weekly',
        `Intelligence-Report-${new Date().toISOString().split('T')[0]}.md`
      );

      const reportContent = this.generateIntelligenceReport(intelligenceData);
      
      await this.ensureDirectoryExists(path.dirname(reportPath));
      await fs.writeFile(reportPath, reportContent, 'utf8');
      
      console.log(`Generated weekly intelligence report: ${reportPath}`);
    } catch (error) {
      console.error('Error generating weekly intelligence:', error);
    }
  }

  // Helper methods
  generateFilePath(category, title) {
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    return `${category}/${sanitizedTitle}.md`;
  }

  generateMarkdownContent({ title, content, agent, category, tags, metadata }) {
    return `---
agent: ${agent?.agent_type || 'unknown'}
role: ${agent?.role || 'Unknown Role'}
category: ${category}
tags: [${tags?.join(', ') || ''}]
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
priority: ${metadata.priority || 'medium'}
---

# ${title}

${content}

## Agent Context
**Agent**: ${agent?.role || 'Unknown Role'}
**Category**: ${category}
**Created**: ${new Date().toLocaleDateString()}

## Related Notes
<!-- Auto-generated links will appear here -->

## Action Items
- [ ] Review and validate insights
- [ ] Share with relevant stakeholders  
- [ ] Update related documentation
- [ ] Track implementation progress

---
*Generated by ${agent?.agent_type || 'AI Agent'} - Senior Care Startup Knowledge Management System*
`;
  }

  generateDashboardMarkdown({ metrics, decisions, agents, lastUpdated }) {
    return `# Senior Care Startup - Executive Dashboard

*Last Updated: ${lastUpdated.toLocaleString()}*

## 🎯 Market Opportunity
- **Total Market Size**: ₹19.6 billion eldercare market
- **Supply Gap**: 96% unmet demand  
- **Target Segments**: NRI families, Urban affluent, Corporate employees

## 📊 Agent Performance Status
${agents.map(agent => `
### ${agent.role}
- **Status**: ${agent.status}
- **Last Active**: ${new Date(agent.last_active).toLocaleString()}
- **Agent Type**: ${agent.agent_type}
`).join('')}

## 🎯 Recent Strategic Decisions (Last 7 Days)
${decisions.map(decision => `
- **${decision.decision_type}**: ${decision.description}
  - Status: ${decision.status}
  - Impact: ${decision.impact_agents?.join(', ') || 'Multiple areas'}
`).join('')}

## 📈 Key Performance Metrics (Last 24 Hours)
${this.formatMetricsTable(metrics)}

## 🚀 Current Sprint Progress (90-Day Implementation)
- [ ] Phase 1: Foundation & Emergency Response (Days 1-30)
- [ ] Phase 2: Family Communication Platform (Days 31-60)  
- [ ] Phase 3: AI-Powered Health Predictions (Days 61-90)

## 🔗 Quick Navigation
- [[Strategy/Market Opportunity Analysis]]
- [[Operations/90-Day Implementation Roadmap]]
- [[Financial-Models/Unit Economics]]
- [[Competitor-Analysis/Market Positioning]]
- [[Agents/Agent Coordination Status]]

---
*Auto-generated by Knowledge Management System*
`;
  }

  formatMetricsTable(metrics) {
    if (!metrics || metrics.length === 0) {
      return 'No recent metrics available';
    }

    return `
| Agent | Metric Type | Value | Recorded |
|-------|-------------|-------|----------|
${metrics.slice(0, 10).map(metric => 
  `| ${metric.agent_id} | ${metric.metric_type} | ${metric.metric_value} | ${new Date(metric.recorded_at).toLocaleTimeString()} |`
).join('\n')}
`;
  }

  async gatherWeeklyIntelligence(weekStart) {
    // Gather intelligence from database
    const { data: communications } = await this.supabase
      .from('agent_communications')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false });

    const { data: decisions } = await this.supabase
      .from('strategic_decisions')
      .select('*') 
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false });

    const { data: knowledge } = await this.supabase
      .from('knowledge_entries')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false });

    return { communications, decisions, knowledge };
  }

  generateIntelligenceReport({ communications, decisions, knowledge }) {
    return `# Weekly Intelligence Report - ${new Date().toISOString().split('T')[0]}

## Executive Summary
This report summarizes key intelligence, decisions, and insights from the past week across all AI agents.

## Strategic Decisions (${decisions?.length || 0})
${decisions?.map(d => `
### ${d.decision_type}
- **Description**: ${d.description}
- **Status**: ${d.status}
- **Impact**: ${d.impact_agents?.join(', ') || 'Multiple areas'}
`).join('') || 'No strategic decisions this week'}

## Key Intelligence Updates (${knowledge?.length || 0})
${knowledge?.slice(0, 10).map(k => `
### ${k.title}
- **Category**: ${k.category}
- **Agent**: ${k.agent_id}
- **Created**: ${new Date(k.created_at).toLocaleDateString()}
`).join('') || 'No new intelligence this week'}

## Agent Collaboration Activity (${communications?.length || 0})
High-priority communications: ${communications?.filter(c => c.priority === 'high' || c.priority === 'critical').length || 0}

## Recommendations for Next Week
- Continue monitoring competitive landscape
- Accelerate customer research initiatives  
- Prioritize technical architecture decisions
- Strengthen partnership development

---
*Auto-generated Weekly Intelligence Report*
`;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async appendToFile(filePath, content) {
    try {
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // Check if file exists, create with header if not
      try {
        await fs.access(filePath);
      } catch {
        const header = `# Daily Agent Communications - ${new Date().toISOString().split('T')[0]}\n\n`;
        await fs.writeFile(filePath, header, 'utf8');
      }
      
      await fs.appendFile(filePath, content, 'utf8');
    } catch (error) {
      console.error('Error appending to file:', error);
    }
  }

  async getAllMarkdownFiles(dirPath) {
    const files = [];
    
    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    }
    
    await scan(dirPath);
    return files;
  }

  extractMarkdownMetadata(content) {
    const metadataMatch = content.match(/^---\n(.*?)\n---/s);
    if (!metadataMatch) return {};
    
    const metadata = {};
    const lines = metadataMatch[1].split('\n');
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    }
    
    return metadata;
  }

  extractMarkdownContent(content) {
    return content.replace(/^---\n.*?\n---\n/s, '').trim();
  }

  async updateObsidianLinks(filePath, knowledgeEntry) {
    // Update backlinks and related notes
    // This would implement Obsidian's linking system
    console.log(`Updating links for: ${filePath}`);
  }

  async performInitialSync() {
    console.log('Performing initial knowledge base sync...');
    
    // Sync recent knowledge entries
    const { data: recentKnowledge } = await this.supabase
      .from('knowledge_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    for (const entry of recentKnowledge || []) {
      await this.handleKnowledgeEntryInsert(entry);
    }
    
    console.log('Initial sync completed');
  }
}

module.exports = KnowledgeSyncSystem;