/**
 * SeniorCare AI - Multi-Agent Communication Monitor Dashboard
 * Real-time monitoring of A2A messages and MCP tool calls
 * Production-ready JavaScript with mock data simulation
 */

class AgentMonitorDashboard {
    constructor() {
        this.messages = [];
        this.toolCalls = [];
        this.agents = new Map();
        this.isMonitoring = true;
        this.filters = {
            agent: '',
            timeframe: '5m'
        };
        this.metrics = {
            totalMessages: 0,
            activeAgents: 0,
            toolCalls: 0,
            avgResponseTime: 125,
            successRate: 97.4,
            messagesPerMin: 42,
            errorRate: 2.1
        };

        this.initializeAgents();
        this.bindEventListeners();
        this.startMonitoring();
        this.updateTimestamp();
    }

    initializeAgents() {
        const agentConfigs = [
            { id: 'claude-code', name: 'Claude Code CLI', icon: '🤖', status: 'active', color: 'claude' },
            { id: 'gemini-prime', name: 'Gemini Prime', icon: '💎', status: 'active', color: 'gemini' },
            { id: 'emergency-ai', name: 'Emergency AI', icon: '🚨', status: 'active', color: 'emergency' },
            { id: 'family-coordinator', name: 'Family Coordinator', icon: '👨‍👩‍👧‍👦', status: 'active', color: 'family' },
            { id: 'health-monitor', name: 'Health Monitor', icon: '💊', status: 'active', color: 'health' }
        ];

        agentConfigs.forEach(agent => {
            this.agents.set(agent.id, {
                ...agent,
                lastSeen: new Date(),
                messageCount: 0,
                toolCallCount: 0,
                avgResponseTime: Math.random() * 200 + 50
            });
        });

        this.renderAgentOverview();
    }

    bindEventListeners() {
        // Control buttons
        document.getElementById('pause-monitoring').addEventListener('click', this.toggleMonitoring.bind(this));
        document.getElementById('clear-logs').addEventListener('click', this.clearLogs.bind(this));
        document.getElementById('filter-agent').addEventListener('change', this.handleAgentFilter.bind(this));
        document.getElementById('metrics-timeframe').addEventListener('change', this.handleTimeframeFilter.bind(this));

        // Refresh buttons
        document.getElementById('refresh-a2a').addEventListener('click', () => this.refreshA2ALog());
        document.getElementById('refresh-mcp').addEventListener('click', () => this.refreshMCPLog());
        document.getElementById('refresh-agents').addEventListener('click', () => this.renderAgentOverview());

        // Export buttons
        document.getElementById('export-a2a').addEventListener('click', () => this.exportData('a2a'));
        document.getElementById('export-mcp').addEventListener('click', () => this.exportData('mcp'));

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('modal-close-btn').addEventListener('click', this.closeModal.bind(this));

        // Click outside modal to close
        document.getElementById('message-modal').addEventListener('click', (e) => {
            if (e.target.id === 'message-modal') {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === ' ' && e.ctrlKey) {
                e.preventDefault();
                this.toggleMonitoring();
            }
        });
    }

    startMonitoring() {
        // Simulate real-time A2A messages
        this.messageInterval = setInterval(() => {
            if (this.isMonitoring) {
                this.generateMockA2AMessage();
            }
        }, 2000 + Math.random() * 3000); // Random interval 2-5 seconds

        // Simulate MCP tool calls
        this.toolCallInterval = setInterval(() => {
            if (this.isMonitoring) {
                this.generateMockToolCall();
            }
        }, 3000 + Math.random() * 7000); // Random interval 3-10 seconds

        // Update metrics
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000);

        // Update timestamps
        this.timestampInterval = setInterval(() => {
            this.updateTimestamp();
        }, 1000);
    }

    generateMockA2AMessage() {
        const agents = Array.from(this.agents.keys());
        const sender = agents[Math.floor(Math.random() * agents.length)];
        let recipient = agents[Math.floor(Math.random() * agents.length)];

        // Ensure sender and recipient are different
        while (recipient === sender) {
            recipient = agents[Math.floor(Math.random() * agents.length)];
        }

        const messageTypes = [
            'health_alert',
            'emergency_response',
            'family_notification',
            'system_status',
            'coordination_request',
            'data_sync',
            'task_assignment',
            'status_update'
        ];

        const payloads = {
            health_alert: 'Vital signs anomaly detected - HR: 45 BPM, requesting immediate assessment',
            emergency_response: 'Emergency protocol activated - dispatching response team to location',
            family_notification: 'Sending critical health update to family members across timezones',
            system_status: 'System health check completed - all components operational',
            coordination_request: 'Requesting coordination for multi-agent emergency response',
            data_sync: 'Synchronizing patient data across all monitoring systems',
            task_assignment: 'Assigning health monitoring task to specialized agent',
            status_update: 'Patient status updated - medication compliance: 98%'
        };

        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        const priority = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];

        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            sender: sender,
            recipient: recipient,
            type: messageType,
            priority: priority,
            payload: payloads[messageType],
            status: Math.random() > 0.05 ? 'delivered' : 'failed', // 95% success rate
            responseTime: Math.floor(Math.random() * 300 + 50) // 50-350ms
        };

        this.messages.unshift(message);

        // Update agent stats
        const senderAgent = this.agents.get(sender);
        const recipientAgent = this.agents.get(recipient);
        if (senderAgent) {
            senderAgent.messageCount++;
            senderAgent.lastSeen = new Date();
        }
        if (recipientAgent) {
            recipientAgent.lastSeen = new Date();
        }

        // Keep only last 100 messages
        if (this.messages.length > 100) {
            this.messages.pop();
        }

        this.renderA2AMessages();
        this.showToast(`New A2A message: ${sender} → ${recipient}`, 'info');
    }

    generateMockToolCall() {
        const agents = Array.from(this.agents.keys());
        const agent = agents[Math.floor(Math.random() * agents.length)];

        const tools = [
            'read_file',
            'write_file',
            'run_command',
            'send_notification',
            'query_database',
            'call_api',
            'analyze_vitals',
            'dispatch_emergency',
            'update_family_dashboard',
            'schedule_appointment'
        ];

        const toolParams = {
            read_file: '{ "path": "/data/patient_vitals.json" }',
            write_file: '{ "path": "/logs/emergency.log", "content": "Emergency resolved" }',
            run_command: '{ "command": "python analyze_vitals.py", "args": ["--patient-id", "123"] }',
            send_notification: '{ "recipient": "family@email.com", "message": "Health update available" }',
            query_database: '{ "query": "SELECT * FROM patients WHERE alert_level = critical" }',
            call_api: '{ "url": "https://hospital.api/emergency", "method": "POST" }',
            analyze_vitals: '{ "patient_id": "123", "vitals": { "hr": 75, "bp": "120/80" } }',
            dispatch_emergency: '{ "location": "Bangalore", "type": "cardiac", "priority": "high" }',
            update_family_dashboard: '{ "family_id": "456", "status": "all_clear" }',
            schedule_appointment: '{ "patient_id": "789", "doctor": "Dr. Kumar", "time": "2024-08-07T10:00:00Z" }'
        };

        const tool = tools[Math.floor(Math.random() * tools.length)];
        const success = Math.random() > 0.1; // 90% success rate

        const toolCall = {
            id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            agent: agent,
            tool: tool,
            parameters: toolParams[tool],
            status: success ? 'success' : 'failed',
            duration: Math.floor(Math.random() * 2000 + 100), // 100-2100ms
            result: success ? 'Operation completed successfully' : 'Tool execution failed - retry scheduled'
        };

        this.toolCalls.unshift(toolCall);

        // Update agent stats
        const agentData = this.agents.get(agent);
        if (agentData) {
            agentData.toolCallCount++;
            agentData.lastSeen = new Date();
        }

        // Keep only last 50 tool calls
        if (this.toolCalls.length > 50) {
            this.toolCalls.pop();
        }

        this.renderMCPToolCalls();

        if (!success) {
            this.showToast(`Tool call failed: ${tool} by ${agent}`, 'error');
        }
    }

    renderA2AMessages() {
        const logContainer = document.getElementById('a2a-log');
        const filteredMessages = this.filterMessages(this.messages);

        if (filteredMessages.length === 0) {
            logContainer.innerHTML = `
                <div class="log-placeholder">
                    <div class="placeholder-icon">📡</div>
                    <p>No A2A messages found</p>
                    <small>Try adjusting your filters or wait for new messages</small>
                </div>
            `;
            return;
        }

        logContainer.innerHTML = filteredMessages.map(message => `
            <div class="message-item" data-message-id="${message.id}" onclick="dashboard.showMessageDetails('${message.id}', 'a2a')">
                <div class="message-header">
                    <div class="message-title">
                        ${this.getMessageTypeIcon(message.type)} ${this.formatMessageType(message.type)}
                        <span class="message-timestamp">${this.formatTimestamp(message.timestamp)}</span>
                    </div>
                    <div class="status-indicator ${message.status === 'delivered' ? 'status-success' : 'status-error'}">
                        ${message.status === 'delivered' ? '✅' : '❌'}
                    </div>
                </div>
                <div class="message-meta">
                    <div class="message-sender">
                        From: <span class="agent-badge agent-${this.agents.get(message.sender)?.color || 'claude'}">${this.agents.get(message.sender)?.name || message.sender}</span>
                    </div>
                    <div class="message-recipient">
                        To: <span class="agent-badge agent-${this.agents.get(message.recipient)?.color || 'gemini'}">${this.agents.get(message.recipient)?.name || message.recipient}</span>
                    </div>
                    <div class="message-priority priority-${message.priority}">
                        Priority: ${message.priority.toUpperCase()}
                    </div>
                </div>
                <div class="message-content">
                    ${message.payload}
                </div>
            </div>
        `).join('');
    }

    renderMCPToolCalls() {
        const logContainer = document.getElementById('mcp-log');
        const filteredCalls = this.filterToolCalls(this.toolCalls);

        if (filteredCalls.length === 0) {
            logContainer.innerHTML = `
                <div class="log-placeholder">
                    <div class="placeholder-icon">⚡</div>
                    <p>No MCP tool calls detected</p>
                    <small>Tool executions will appear here as they occur</small>
                </div>
            `;
            return;
        }

        logContainer.innerHTML = filteredCalls.map(call => `
            <div class="tool-call-item" data-call-id="${call.id}" onclick="dashboard.showMessageDetails('${call.id}', 'mcp')">
                <div class="message-header">
                    <div class="message-title">
                        ${this.getToolIcon(call.tool)} ${call.tool}
                        <span class="message-timestamp">${this.formatTimestamp(call.timestamp)}</span>
                    </div>
                    <div class="status-indicator ${call.status === 'success' ? 'status-success' : 'status-error'}">
                        ${call.status === 'success' ? '✅' : '❌'}
                    </div>
                </div>
                <div class="message-meta">
                    <div class="message-sender">
                        Agent: <span class="agent-badge agent-${this.agents.get(call.agent)?.color || 'claude'}">${this.agents.get(call.agent)?.name || call.agent}</span>
                    </div>
                    <div class="message-duration">
                        Duration: ${call.duration}ms
                    </div>
                    <div class="tool-status status-${call.status}">
                        Status: ${call.status.toUpperCase()}
                    </div>
                </div>
                <div class="message-content">
                    ${call.result}
                </div>
            </div>
        `).join('');
    }

    renderAgentOverview() {
        const container = document.getElementById('agents-overview');
        const agentArray = Array.from(this.agents.values());

        container.innerHTML = agentArray.map(agent => `
            <div class="agent-card agent-${agent.color}">
                <div class="agent-icon">${agent.icon}</div>
                <div class="agent-name">${agent.name}</div>
                <div class="agent-status ${agent.status}">
                    <span class="status-dot ${agent.status}"></span>
                    ${agent.status}
                </div>
                <div class="agent-stats">
                    <small>${agent.messageCount} msgs • ${agent.toolCallCount} tools</small>
                </div>
            </div>
        `).join('');
    }

    updateMetrics() {
        // Simulate metric changes
        this.metrics.totalMessages = this.messages.length;
        this.metrics.activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active').length;
        this.metrics.toolCalls = this.toolCalls.length;

        // Small random variations for realism
        this.metrics.avgResponseTime += (Math.random() - 0.5) * 10;
        this.metrics.avgResponseTime = Math.max(50, Math.min(500, this.metrics.avgResponseTime));

        this.metrics.successRate += (Math.random() - 0.5) * 0.5;
        this.metrics.successRate = Math.max(85, Math.min(99.9, this.metrics.successRate));

        this.metrics.messagesPerMin += (Math.random() - 0.5) * 5;
        this.metrics.messagesPerMin = Math.max(10, Math.min(100, this.metrics.messagesPerMin));

        this.metrics.errorRate = 100 - this.metrics.successRate;

        // Update UI
        document.getElementById('total-messages').textContent = this.metrics.totalMessages;
        document.getElementById('active-agents').textContent = this.metrics.activeAgents;
        document.getElementById('tool-calls').textContent = this.metrics.toolCalls;
        document.getElementById('avg-response-time').textContent = Math.round(this.metrics.avgResponseTime) + 'ms';
        document.getElementById('success-rate').textContent = this.metrics.successRate.toFixed(1) + '%';
        document.getElementById('messages-per-min').textContent = Math.round(this.metrics.messagesPerMin);
        document.getElementById('error-rate').textContent = this.metrics.errorRate.toFixed(1) + '%';

        // Update status indicators
        document.getElementById('a2a-status').className = 'status-dot ' +
            (this.metrics.successRate > 95 ? 'active' : this.metrics.successRate > 90 ? 'warning' : 'error');
        document.getElementById('mcp-status').className = 'status-dot ' +
            (this.metrics.errorRate < 5 ? 'active' : this.metrics.errorRate < 10 ? 'warning' : 'error');
    }

    updateTimestamp() {
        document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
    }

    // Event Handlers
    toggleMonitoring() {
        this.isMonitoring = !this.isMonitoring;
        const button = document.getElementById('pause-monitoring');
        button.innerHTML = this.isMonitoring ? '⏸️ Pause' : '▶️ Resume';
        button.className = 'btn ' + (this.isMonitoring ? 'btn-secondary' : 'btn-primary');

        this.showToast(`Monitoring ${this.isMonitoring ? 'resumed' : 'paused'}`, 'info');
    }

    clearLogs() {
        if (confirm('Are you sure you want to clear all logs?')) {
            this.messages = [];
            this.toolCalls = [];
            this.renderA2AMessages();
            this.renderMCPToolCalls();
            this.showToast('All logs cleared', 'success');
        }
    }

    handleAgentFilter(event) {
        this.filters.agent = event.target.value;
        this.renderA2AMessages();
        this.renderMCPToolCalls();
    }

    handleTimeframeFilter(event) {
        this.filters.timeframe = event.target.value;
        this.updateMetrics();
    }

    // Utility Methods
    filterMessages(messages) {
        let filtered = messages;

        if (this.filters.agent) {
            filtered = filtered.filter(msg =>
                msg.sender === this.filters.agent || msg.recipient === this.filters.agent
            );
        }

        return filtered;
    }

    filterToolCalls(calls) {
        let filtered = calls;

        if (this.filters.agent) {
            filtered = filtered.filter(call => call.agent === this.filters.agent);
        }

        return filtered;
    }

    getMessageTypeIcon(type) {
        const icons = {
            health_alert: '🚨',
            emergency_response: '🆘',
            family_notification: '👨‍👩‍👧‍👦',
            system_status: '🔍',
            coordination_request: '🤝',
            data_sync: '🔄',
            task_assignment: '📋',
            status_update: '📊'
        };
        return icons[type] || '💬';
    }

    getToolIcon(tool) {
        const icons = {
            read_file: '📖',
            write_file: '📝',
            run_command: '⚡',
            send_notification: '📧',
            query_database: '🗄️',
            call_api: '🌐',
            analyze_vitals: '💓',
            dispatch_emergency: '🚑',
            update_family_dashboard: '📊',
            schedule_appointment: '📅'
        };
        return icons[tool] || '🔧';
    }

    formatMessageType(type) {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatTimestamp(timestamp) {
        const now = new Date();
        const diff = now - timestamp;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            return Math.floor(diff / 60000) + 'm ago';
        } else {
            return timestamp.toLocaleTimeString();
        }
    }

    // Modal Methods
    showMessageDetails(id, type) {
        let item;
        let title;

        if (type === 'a2a') {
            item = this.messages.find(m => m.id === id);
            title = `A2A Message: ${this.formatMessageType(item.type)}`;
        } else {
            item = this.toolCalls.find(c => c.id === id);
            title = `MCP Tool Call: ${item.tool}`;
        }

        if (!item) return;

        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = this.renderMessageDetails(item, type);
        document.getElementById('message-modal').classList.add('show');
    }

    renderMessageDetails(item, type) {
        if (type === 'a2a') {
            return `
                <div class="detail-section">
                    <h4>Message Information</h4>
                    <p><strong>ID:</strong> ${item.id}</p>
                    <p><strong>Timestamp:</strong> ${item.timestamp.toLocaleString()}</p>
                    <p><strong>Type:</strong> ${this.formatMessageType(item.type)}</p>
                    <p><strong>Priority:</strong> ${item.priority.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${item.status}</p>
                    <p><strong>Response Time:</strong> ${item.responseTime}ms</p>
                </div>
                <div class="detail-section">
                    <h4>Participants</h4>
                    <p><strong>Sender:</strong> ${this.agents.get(item.sender)?.name || item.sender}</p>
                    <p><strong>Recipient:</strong> ${this.agents.get(item.recipient)?.name || item.recipient}</p>
                </div>
                <div class="detail-section">
                    <h4>Message Payload</h4>
                    <p>${item.payload}</p>
                </div>
            `;
        } else {
            return `
                <div class="detail-section">
                    <h4>Tool Call Information</h4>
                    <p><strong>ID:</strong> ${item.id}</p>
                    <p><strong>Timestamp:</strong> ${item.timestamp.toLocaleString()}</p>
                    <p><strong>Tool:</strong> ${item.tool}</p>
                    <p><strong>Status:</strong> ${item.status}</p>
                    <p><strong>Duration:</strong> ${item.duration}ms</p>
                </div>
                <div class="detail-section">
                    <h4>Execution Details</h4>
                    <p><strong>Agent:</strong> ${this.agents.get(item.agent)?.name || item.agent}</p>
                    <p><strong>Parameters:</strong></p>
                    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto;">${item.parameters}</pre>
                </div>
                <div class="detail-section">
                    <h4>Result</h4>
                    <p>${item.result}</p>
                </div>
            `;
        }
    }

    closeModal() {
        document.getElementById('message-modal').classList.remove('show');
    }

    // Export Methods
    exportData(type) {
        const data = type === 'a2a' ? this.messages : this.toolCalls;
        const filename = `seniorcare_${type}_logs_${new Date().toISOString().split('T')[0]}.json`;

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`Exported ${data.length} ${type.toUpperCase()} records`, 'success');
    }

    refreshA2ALog() {
        this.renderA2AMessages();
        this.showToast('A2A log refreshed', 'info');
    }

    refreshMCPLog() {
        this.renderMCPToolCalls();
        this.showToast('MCP log refreshed', 'info');
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-message">${message}</div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AgentMonitorDashboard();

    // Add some initial demo messages for better presentation
    dashboard.generateMockA2AMessage();
    dashboard.generateMockA2AMessage();
    dashboard.generateMockToolCall();

    console.log('🤖 SeniorCare AI Multi-Agent Communication Monitor Dashboard initialized');
    console.log('💡 Simulating real-time A2A messages and MCP tool calls');
    console.log('🎯 Ready for production integration with actual agent systems');
});
