/**
 * SeniorCare AI - Multi-Agent Communication Monitor React Component
 * Real-time A2A message and MCP tool call monitoring dashboard
 * Production-ready React component for integration with existing system
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AgentMonitorDashboard.css';

const AgentMonitorDashboard = ({ websocketUrl, apiEndpoint }) => {
    // State management
    const [messages, setMessages] = useState([]);
    const [toolCalls, setToolCalls] = useState([]);
    const [agents, setAgents] = useState(new Map());
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filters, setFilters] = useState({ agent: '', timeframe: '5m' });
    const [metrics, setMetrics] = useState({
        totalMessages: 0,
        activeAgents: 0,
        toolCalls: 0,
        avgResponseTime: 125,
        successRate: 97.4,
        messagesPerMin: 42,
        errorRate: 2.1
    });

    // Refs for intervals
    const messageInterval = useRef(null);
    const toolCallInterval = useRef(null);
    const metricsInterval = useRef(null);
    const wsRef = useRef(null);

    // Initialize agents configuration
    const initializeAgents = useCallback(() => {
        const agentConfigs = [
            { id: 'claude-code', name: 'Claude Code CLI', icon: '🤖', status: 'active', color: 'claude' },
            { id: 'gemini-prime', name: 'Gemini Prime', icon: '💎', status: 'active', color: 'gemini' },
            { id: 'emergency-ai', name: 'Emergency AI', icon: '🚨', status: 'active', color: 'emergency' },
            { id: 'family-coordinator', name: 'Family Coordinator', icon: '👨‍👩‍👧‍👦', status: 'active', color: 'family' },
            { id: 'health-monitor', name: 'Health Monitor', icon: '💊', status: 'active', color: 'health' }
        ];

        const agentMap = new Map();
        agentConfigs.forEach(agent => {
            agentMap.set(agent.id, {
                ...agent,
                lastSeen: new Date(),
                messageCount: 0,
                toolCallCount: 0,
                avgResponseTime: Math.random() * 200 + 50
            });
        });

        setAgents(agentMap);
    }, []);

    // Generate mock A2A message
    const generateMockA2AMessage = useCallback(() => {
        if (!isMonitoring) return;

        const agentIds = Array.from(agents.keys());
        if (agentIds.length < 2) return;

        const sender = agentIds[Math.floor(Math.random() * agentIds.length)];
        let recipient = agentIds[Math.floor(Math.random() * agentIds.length)];
        while (recipient === sender) {
            recipient = agentIds[Math.floor(Math.random() * agentIds.length)];
        }

        const messageTypes = [
            'health_alert',
            'emergency_response',
            'family_notification',
            'system_status',
            'coordination_request',
            'data_sync'
        ];

        const payloads = {
            health_alert: 'Vital signs anomaly detected - HR: 45 BPM, requesting immediate assessment',
            emergency_response: 'Emergency protocol activated - dispatching response team to location',
            family_notification: 'Sending critical health update to family members across timezones',
            system_status: 'System health check completed - all components operational',
            coordination_request: 'Requesting coordination for multi-agent emergency response',
            data_sync: 'Synchronizing patient data across all monitoring systems'
        };

        const messageType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
        const priority = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)];

        const newMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            sender,
            recipient,
            type: messageType,
            priority,
            payload: payloads[messageType],
            status: Math.random() > 0.05 ? 'delivered' : 'failed',
            responseTime: Math.floor(Math.random() * 300 + 50)
        };

        setMessages(prev => [newMessage, ...prev.slice(0, 99)]);

        // Update agent stats
        setAgents(prev => {
            const updated = new Map(prev);
            const senderAgent = updated.get(sender);
            const recipientAgent = updated.get(recipient);

            if (senderAgent) {
                senderAgent.messageCount++;
                senderAgent.lastSeen = new Date();
            }
            if (recipientAgent) {
                recipientAgent.lastSeen = new Date();
            }

            return updated;
        });
    }, [agents, isMonitoring]);

    // Generate mock MCP tool call
    const generateMockToolCall = useCallback(() => {
        if (!isMonitoring) return;

        const agentIds = Array.from(agents.keys());
        if (agentIds.length === 0) return;

        const agent = agentIds[Math.floor(Math.random() * agentIds.length)];

        const tools = [
            'read_file',
            'write_file',
            'run_command',
            'send_notification',
            'query_database',
            'analyze_vitals',
            'dispatch_emergency',
            'update_family_dashboard'
        ];

        const tool = tools[Math.floor(Math.random() * tools.length)];
        const success = Math.random() > 0.1;

        const newToolCall = {
            id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            agent,
            tool,
            parameters: `{ "tool": "${tool}", "agent": "${agent}" }`,
            status: success ? 'success' : 'failed',
            duration: Math.floor(Math.random() * 2000 + 100),
            result: success ? 'Operation completed successfully' : 'Tool execution failed - retry scheduled'
        };

        setToolCalls(prev => [newToolCall, ...prev.slice(0, 49)]);

        // Update agent stats
        setAgents(prev => {
            const updated = new Map(prev);
            const agentData = updated.get(agent);
            if (agentData) {
                agentData.toolCallCount++;
                agentData.lastSeen = new Date();
            }
            return updated;
        });
    }, [agents, isMonitoring]);

    // Update metrics
    const updateMetrics = useCallback(() => {
        setMetrics(prev => ({
            ...prev,
            totalMessages: messages.length,
            activeAgents: Array.from(agents.values()).filter(a => a.status === 'active').length,
            toolCalls: toolCalls.length,
            avgResponseTime: Math.max(50, Math.min(500, prev.avgResponseTime + (Math.random() - 0.5) * 10)),
            successRate: Math.max(85, Math.min(99.9, prev.successRate + (Math.random() - 0.5) * 0.5))
        }));
    }, [messages.length, agents, toolCalls.length]);

    // Setup monitoring intervals
    useEffect(() => {
        if (isMonitoring) {
            messageInterval.current = setInterval(generateMockA2AMessage, 3000);
            toolCallInterval.current = setInterval(generateMockToolCall, 5000);
        } else {
            clearInterval(messageInterval.current);
            clearInterval(toolCallInterval.current);
        }

        return () => {
            clearInterval(messageInterval.current);
            clearInterval(toolCallInterval.current);
        };
    }, [isMonitoring, generateMockA2AMessage, generateMockToolCall]);

    // Setup metrics updates
    useEffect(() => {
        metricsInterval.current = setInterval(updateMetrics, 2000);
        return () => clearInterval(metricsInterval.current);
    }, [updateMetrics]);

    // Initialize on mount
    useEffect(() => {
        initializeAgents();
    }, [initializeAgents]);

    // WebSocket connection (for real integration)
    useEffect(() => {
        if (websocketUrl && !wsRef.current) {
            wsRef.current = new WebSocket(websocketUrl);

            wsRef.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'a2a_message') {
                    setMessages(prev => [data.message, ...prev.slice(0, 99)]);
                } else if (data.type === 'mcp_tool_call') {
                    setToolCalls(prev => [data.toolCall, ...prev.slice(0, 49)]);
                }
            };

            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        }
    }, [websocketUrl]);

    // Utility functions
    const getMessageTypeIcon = (type) => {
        const icons = {
            health_alert: '🚨',
            emergency_response: '🆘',
            family_notification: '👨‍👩‍👧‍👦',
            system_status: '🔍',
            coordination_request: '🤝',
            data_sync: '🔄'
        };
        return icons[type] || '💬';
    };

    const getToolIcon = (tool) => {
        const icons = {
            read_file: '📖',
            write_file: '📝',
            run_command: '⚡',
            send_notification: '📧',
            query_database: '🗄️',
            analyze_vitals: '💓',
            dispatch_emergency: '🚑',
            update_family_dashboard: '📊'
        };
        return icons[tool] || '🔧';
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return timestamp.toLocaleTimeString();
    };

    const formatMessageType = (type) => {
        return type.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Filter functions
    const filteredMessages = messages.filter(msg =>
        !filters.agent || msg.sender === filters.agent || msg.recipient === filters.agent
    );

    const filteredToolCalls = toolCalls.filter(call =>
        !filters.agent || call.agent === filters.agent
    );

    // Render components
    const MessageItem = ({ message, onClick }) => (
        <div className="message-item" onClick={() => onClick(message, 'a2a')}>
            <div className="message-header">
                <div className="message-title">
                    {getMessageTypeIcon(message.type)} {formatMessageType(message.type)}
                    <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                </div>
                <div className={`status-indicator ${message.status === 'delivered' ? 'status-success' : 'status-error'}`}>
                    {message.status === 'delivered' ? '✅' : '❌'}
                </div>
            </div>
            <div className="message-meta">
                <div className="message-sender">
                    From: <span className={`agent-badge agent-${agents.get(message.sender)?.color || 'claude'}`}>
                        {agents.get(message.sender)?.name || message.sender}
                    </span>
                </div>
                <div className="message-recipient">
                    To: <span className={`agent-badge agent-${agents.get(message.recipient)?.color || 'gemini'}`}>
                        {agents.get(message.recipient)?.name || message.recipient}
                    </span>
                </div>
                <div className={`message-priority priority-${message.priority}`}>
                    Priority: {message.priority.toUpperCase()}
                </div>
            </div>
            <div className="message-content">
                {message.payload}
            </div>
        </div>
    );

    const ToolCallItem = ({ toolCall, onClick }) => (
        <div className="tool-call-item" onClick={() => onClick(toolCall, 'mcp')}>
            <div className="message-header">
                <div className="message-title">
                    {getToolIcon(toolCall.tool)} {toolCall.tool}
                    <span className="message-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
                </div>
                <div className={`status-indicator ${toolCall.status === 'success' ? 'status-success' : 'status-error'}`}>
                    {toolCall.status === 'success' ? '✅' : '❌'}
                </div>
            </div>
            <div className="message-meta">
                <div className="message-sender">
                    Agent: <span className={`agent-badge agent-${agents.get(toolCall.agent)?.color || 'claude'}`}>
                        {agents.get(toolCall.agent)?.name || toolCall.agent}
                    </span>
                </div>
                <div className="message-duration">
                    Duration: {toolCall.duration}ms
                </div>
                <div className={`tool-status status-${toolCall.status}`}>
                    Status: {toolCall.status.toUpperCase()}
                </div>
            </div>
            <div className="message-content">
                {toolCall.result}
            </div>
        </div>
    );

    const handleMessageClick = (item, type) => {
        setSelectedMessage({ item, type });
        setModalOpen(true);
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>🤖 Multi-Agent Communication Monitor</h1>
                        <p className="header-subtitle">SeniorCare AI Ecosystem - Real-time Agent Coordination</p>
                    </div>
                    <div className="header-right">
                        <div className="status-indicators">
                            <div className="status-item">
                                <span className="status-dot active"></span>
                                <span>System Online</span>
                            </div>
                            <div className="status-item">
                                <span className={`status-dot ${metrics.successRate > 95 ? 'active' : metrics.successRate > 90 ? 'warning' : 'error'}`}></span>
                                <span>A2A Communications</span>
                            </div>
                            <div className="status-item">
                                <span className={`status-dot ${metrics.errorRate < 5 ? 'active' : metrics.errorRate < 10 ? 'warning' : 'error'}`}></span>
                                <span>MCP Tools</span>
                            </div>
                        </div>
                        <div className="timestamp">
                            Last Updated: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </header>

            {/* Control Panel */}
            <section className="control-panel">
                <div className="controls-left">
                    <button
                        className={`btn ${isMonitoring ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setIsMonitoring(!isMonitoring)}
                    >
                        {isMonitoring ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => {
                            setMessages([]);
                            setToolCalls([]);
                        }}
                    >
                        🗑️ Clear Logs
                    </button>
                    <select
                        className="filter-select"
                        value={filters.agent}
                        onChange={(e) => setFilters({ ...filters, agent: e.target.value })}
                    >
                        <option value="">All Agents</option>
                        {Array.from(agents.values()).map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                    </select>
                </div>
                <div className="controls-right">
                    <div className="metrics-summary">
                        <div className="metric">
                            <span className="metric-value">{metrics.totalMessages}</span>
                            <span className="metric-label">Messages</span>
                        </div>
                        <div className="metric">
                            <span className="metric-value">{metrics.activeAgents}</span>
                            <span className="metric-label">Active Agents</span>
                        </div>
                        <div className="metric">
                            <span className="metric-value">{metrics.toolCalls}</span>
                            <span className="metric-label">Tool Calls</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dashboard Grid */}
            <div className="dashboard-grid">
                {/* A2A Messages */}
                <section className="dashboard-section a2a-section">
                    <div className="section-header">
                        <h2>🔄 Agent-to-Agent Messages</h2>
                    </div>
                    <div className="message-log">
                        {filteredMessages.length === 0 ? (
                            <div className="log-placeholder">
                                <div className="placeholder-icon">📡</div>
                                <p>Waiting for agent communications...</p>
                                <small>A2A messages will appear here in real-time</small>
                            </div>
                        ) : (
                            filteredMessages.map(message => (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    onClick={handleMessageClick}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* MCP Tool Calls */}
                <section className="dashboard-section mcp-section">
                    <div className="section-header">
                        <h2>🛠️ MCP Tool Call Status</h2>
                    </div>
                    <div className="tool-call-log">
                        {filteredToolCalls.length === 0 ? (
                            <div className="log-placeholder">
                                <div className="placeholder-icon">⚡</div>
                                <p>No tool calls detected...</p>
                                <small>MCP tool executions will be tracked here</small>
                            </div>
                        ) : (
                            filteredToolCalls.map(toolCall => (
                                <ToolCallItem
                                    key={toolCall.id}
                                    toolCall={toolCall}
                                    onClick={handleMessageClick}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* Agent Overview */}
                <section className="dashboard-section agents-section">
                    <div className="section-header">
                        <h2>🤖 Agent Status Overview</h2>
                    </div>
                    <div className="agents-grid">
                        {Array.from(agents.values()).map(agent => (
                            <div key={agent.id} className={`agent-card agent-${agent.color}`}>
                                <div className="agent-icon">{agent.icon}</div>
                                <div className="agent-name">{agent.name}</div>
                                <div className={`agent-status ${agent.status}`}>
                                    <span className={`status-dot ${agent.status}`}></span>
                                    {agent.status}
                                </div>
                                <div className="agent-stats">
                                    <small>{agent.messageCount} msgs • {agent.toolCallCount} tools</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* System Metrics */}
                <section className="dashboard-section metrics-section">
                    <div className="section-header">
                        <h2>📊 System Health Metrics</h2>
                    </div>
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Response Time</span>
                                <span className="metric-trend up">↗️</span>
                            </div>
                            <div className="metric-value">
                                {Math.round(metrics.avgResponseTime)}ms
                                <small>avg</small>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Success Rate</span>
                                <span className="metric-trend stable">→</span>
                            </div>
                            <div className="metric-value">
                                {metrics.successRate.toFixed(1)}%
                                <small>success</small>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Messages/Min</span>
                                <span className="metric-trend up">↗️</span>
                            </div>
                            <div className="metric-value">
                                {Math.round(metrics.messagesPerMin)}
                                <small>msg/min</small>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-header">
                                <span className="metric-title">Error Rate</span>
                                <span className="metric-trend down">↘️</span>
                            </div>
                            <div className="metric-value">
                                {(100 - metrics.successRate).toFixed(1)}%
                                <small>errors</small>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Modal */}
            {modalOpen && selectedMessage && (
                <div className="modal show" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                {selectedMessage.type === 'a2a' ?
                                    `A2A Message: ${formatMessageType(selectedMessage.item.type)}` :
                                    `MCP Tool Call: ${selectedMessage.item.tool}`
                                }
                            </h3>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Details</h4>
                                <p><strong>ID:</strong> {selectedMessage.item.id}</p>
                                <p><strong>Timestamp:</strong> {selectedMessage.item.timestamp.toLocaleString()}</p>
                                {selectedMessage.type === 'a2a' ? (
                                    <>
                                        <p><strong>Sender:</strong> {agents.get(selectedMessage.item.sender)?.name}</p>
                                        <p><strong>Recipient:</strong> {agents.get(selectedMessage.item.recipient)?.name}</p>
                                        <p><strong>Priority:</strong> {selectedMessage.item.priority}</p>
                                        <p><strong>Status:</strong> {selectedMessage.item.status}</p>
                                        <p><strong>Payload:</strong> {selectedMessage.item.payload}</p>
                                    </>
                                ) : (
                                    <>
                                        <p><strong>Agent:</strong> {agents.get(selectedMessage.item.agent)?.name}</p>
                                        <p><strong>Tool:</strong> {selectedMessage.item.tool}</p>
                                        <p><strong>Duration:</strong> {selectedMessage.item.duration}ms</p>
                                        <p><strong>Status:</strong> {selectedMessage.item.status}</p>
                                        <p><strong>Result:</strong> {selectedMessage.item.result}</p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentMonitorDashboard;
