// Complete React Multi-Agent Communication Monitor Dashboard
// AgentMonitorDashboardComplete.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './AgentMonitorDashboard.css';

// Agent Configurations
const AGENT_CONFIGS = {
    'claude-code': {
        id: 'claude-code',
        name: 'Claude Code CLI',
        icon: '🤖',
        color: '#8B5CF6',
        status: 'active'
    },
    'gemini-prime': {
        id: 'gemini-prime',
        name: 'Gemini Prime',
        icon: '✨',
        color: '#10B981',
        status: 'active'
    },
    'emergency-ai': {
        id: 'emergency-ai',
        name: 'Emergency AI',
        icon: '🚨',
        color: '#EF4444',
        status: 'standby'
    },
    'family-coordinator': {
        id: 'family-coordinator',
        name: 'Family Coordinator',
        icon: '👨‍👩‍👧‍👦',
        color: '#3B82F6',
        status: 'active'
    },
    'health-monitor': {
        id: 'health-monitor',
        name: 'Health Monitor',
        icon: '💗',
        color: '#F59E0B',
        status: 'maintenance'
    }
};

const MESSAGE_TYPES = [
    'task-coordination',
    'status-update',
    'alert-notification',
    'data-request',
    'tool-execution',
    'health-check',
    'emergency-response'
];

const MCP_TOOLS = [
    'database-query',
    'notification-send',
    'health-assessment',
    'emergency-alert',
    'schedule-management',
    'family-update',
    'medication-reminder',
    'vitals-check'
];

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const generateMockA2AMessage = () => {
    const agentKeys = Object.keys(AGENT_CONFIGS);
    const sender = agentKeys[Math.floor(Math.random() * agentKeys.length)];
    let recipient = agentKeys[Math.floor(Math.random() * agentKeys.length)];
    while (recipient === sender) {
        recipient = agentKeys[Math.floor(Math.random() * agentKeys.length)];
    }

    const messageType = MESSAGE_TYPES[Math.floor(Math.random() * MESSAGE_TYPES.length)];

    return {
        id: generateId(),
        timestamp: new Date().toISOString(),
        sender,
        recipient,
        type: messageType,
        status: Math.random() > 0.1 ? 'delivered' : 'pending',
        content: `${messageType.replace('-', ' ')} message from ${AGENT_CONFIGS[sender].name} to ${AGENT_CONFIGS[recipient].name}`,
        metadata: {
            priority: Math.random() > 0.7 ? 'high' : 'normal',
            encrypted: Math.random() > 0.3,
            retryCount: Math.floor(Math.random() * 3)
        }
    };
};

const generateMockMCPCall = () => {
    const agentKeys = Object.keys(AGENT_CONFIGS);
    const agent = agentKeys[Math.floor(Math.random() * agentKeys.length)];
    const tool = MCP_TOOLS[Math.floor(Math.random() * MCP_TOOLS.length)];
    const statuses = ['completed', 'running', 'failed', 'queued'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
        id: generateId(),
        timestamp: new Date().toISOString(),
        agent,
        tool,
        status,
        duration: status === 'completed' ? Math.floor(Math.random() * 5000) + 100 : null,
        parameters: {
            target: `${tool}-${Math.floor(Math.random() * 1000)}`,
            timeout: 30000
        },
        result: status === 'completed' ? `${tool} executed successfully` : null,
        error: status === 'failed' ? `${tool} execution failed: timeout` : null
    };
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Main Dashboard Component
const AgentMonitorDashboard = ({ websocketUrl, apiEndpoint, autoConnect = true }) => {
    // State Management
    const [a2aMessages, setA2aMessages] = useState([]);
    const [mcpCalls, setMcpCalls] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [messageFilter, setMessageFilter] = useState('all');
    const [toolFilter, setToolFilter] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [metrics, setMetrics] = useState({
        totalMessages: 0,
        successfulCalls: 0,
        activeAgents: 0,
        avgResponseTime: 0
    });
    const [websocket, setWebsocket] = useState(null);

    // WebSocket Connection Effect
    useEffect(() => {
        if (!autoConnect) return;

        const connectToWebSocket = () => {
            console.log('🔌 Connecting to Multi-Agent Communication System...');

            // For demo purposes, simulate connection
            setTimeout(() => {
                setIsConnected(true);
                console.log('✅ Connected to Agent Communication Hub');
            }, 1000);

            // In production, implement actual WebSocket connection:
            /*
            if (websocketUrl) {
                const ws = new WebSocket(websocketUrl);
                ws.onopen = () => {
                    setIsConnected(true);
                    setWebsocket(ws);
                };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'a2a-message') {
                        setA2aMessages(prev => [data.message, ...prev.slice(0, 49)]);
                    } else if (data.type === 'mcp-call') {
                        setMcpCalls(prev => [data.call, ...prev.slice(0, 49)]);
                    }
                };
                ws.onclose = () => setIsConnected(false);
            }
            */
        };

        connectToWebSocket();

        return () => {
            if (websocket) {
                websocket.close();
            }
            setIsConnected(false);
            console.log('🔌 Disconnected from Agent Communication Hub');
        };
    }, [websocketUrl, autoConnect]);

    // Mock Data Generation Effect (for demo)
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            // Add new A2A message occasionally
            if (Math.random() > 0.3) {
                const newMessage = generateMockA2AMessage();
                setA2aMessages(prev => [newMessage, ...prev.slice(0, 49)]);
            }

            // Add new MCP call occasionally
            if (Math.random() > 0.4) {
                const newCall = generateMockMCPCall();
                setMcpCalls(prev => [newCall, ...prev.slice(0, 49)]);
            }

            setLastUpdate(new Date());
        }, 2000);

        return () => clearInterval(interval);
    }, [autoRefresh]);

    // Metrics Calculation Effect
    useEffect(() => {
        setMetrics({
            totalMessages: a2aMessages.length,
            successfulCalls: mcpCalls.filter(call => call.status === 'completed').length,
            activeAgents: Object.values(AGENT_CONFIGS).filter(agent => agent.status === 'active').length,
            avgResponseTime: mcpCalls.filter(call => call.duration).reduce((acc, call) => acc + call.duration, 0) /
                Math.max(1, mcpCalls.filter(call => call.duration).length)
        });
    }, [a2aMessages, mcpCalls]);

    // Filtered Data
    const filteredMessages = useMemo(() => {
        return messageFilter === 'all'
            ? a2aMessages
            : a2aMessages.filter(msg => msg.type === messageFilter);
    }, [a2aMessages, messageFilter]);

    const filteredCalls = useMemo(() => {
        return toolFilter === 'all'
            ? mcpCalls
            : mcpCalls.filter(call => call.status === toolFilter);
    }, [mcpCalls, toolFilter]);

    // Event Handlers
    const handleExportData = useCallback(() => {
        const data = {
            timestamp: new Date().toISOString(),
            a2aMessages,
            mcpCalls,
            metrics
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agent-communication-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [a2aMessages, mcpCalls, metrics]);

    const toggleAutoRefresh = useCallback(() => {
        setAutoRefresh(prev => !prev);
    }, []);

    const clearLogs = useCallback(() => {
        setA2aMessages([]);
        setMcpCalls([]);
    }, []);

    // Render Helper Methods
    const renderAgentBadge = useCallback((agentId) => {
        const agent = AGENT_CONFIGS[agentId];
        return (
            <span className={`agent-badge agent-${agentId}`}>
                {agent?.icon} {agent?.name || agentId}
            </span>
        );
    }, []);

    const renderStatusIcon = useCallback((status) => {
        const icons = {
            delivered: '✅',
            pending: '⏳',
            failed: '❌',
            completed: '✅',
            running: '⏳',
            queued: '📋'
        };
        return icons[status] || '❓';
    }, []);

    const formatDuration = useCallback((ms) => {
        if (!ms) return '--';
        return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    }, []);

    const formatTimestamp = useCallback((timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    }, []);

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-left">
                        <h1>Multi-Agent Communication Monitor</h1>
                        <p className="header-subtitle">Real-time A2A Message Flow & MCP Tool Call Status</p>
                    </div>
                    <div className="header-right">
                        <div className="status-indicators">
                            <div className="status-item">
                                <span className={`status-dot ${isConnected ? 'active' : ''}`}></span>
                                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                            </div>
                            <div className="status-item">
                                <span className="status-dot active"></span>
                                <span>Live Updates</span>
                            </div>
                        </div>
                        <div className="timestamp">
                            Last Update: {formatTimestamp(lastUpdate)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Control Panel */}
            <div className="control-panel">
                <div className="controls-left">
                    <button
                        className={`btn ${autoRefresh ? 'btn-primary' : 'btn-outline'}`}
                        onClick={toggleAutoRefresh}
                    >
                        {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportData}>
                        📥 Export Data
                    </button>
                    <button className="btn btn-outline" onClick={clearLogs}>
                        🗑️ Clear Logs
                    </button>

                    <select
                        className="filter-select"
                        value={messageFilter}
                        onChange={(e) => setMessageFilter(e.target.value)}
                    >
                        <option value="all">All Messages</option>
                        {MESSAGE_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace('-', ' ')}</option>
                        ))}
                    </select>

                    <select
                        className="filter-select"
                        value={toolFilter}
                        onChange={(e) => setToolFilter(e.target.value)}
                    >
                        <option value="all">All Tool Calls</option>
                        <option value="completed">Completed</option>
                        <option value="running">Running</option>
                        <option value="failed">Failed</option>
                        <option value="queued">Queued</option>
                    </select>
                </div>

                <div className="controls-right">
                    <div className="metrics-summary">
                        <div className="metric">
                            <span className="metric-value">{metrics.totalMessages}</span>
                            <span className="metric-label">Messages</span>
                        </div>
                        <div className="metric">
                            <span className="metric-value">{metrics.successfulCalls}</span>
                            <span className="metric-label">Tool Calls</span>
                        </div>
                        <div className="metric">
                            <span className="metric-value">{metrics.activeAgents}</span>
                            <span className="metric-label">Active Agents</span>
                        </div>
                        <div className="metric">
                            <span className="metric-value">{Math.round(metrics.avgResponseTime)}ms</span>
                            <span className="metric-label">Avg Response</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <main className="dashboard-grid">
                {/* A2A Messages Section */}
                <section className="dashboard-section a2a-section">
                    <div className="section-header">
                        <h2>Agent-to-Agent Messages</h2>
                        <span className="badge">{filteredMessages.length} messages</span>
                    </div>
                    <div className="message-log">
                        {filteredMessages.length === 0 ? (
                            <div className="log-placeholder">
                                <div className="placeholder-icon">💬</div>
                                <p>No A2A messages yet</p>
                                <small>Messages will appear here as agents communicate</small>
                            </div>
                        ) : (
                            filteredMessages.map(message => (
                                <div
                                    key={message.id}
                                    className="message-item"
                                    onClick={() => setSelectedMessage(message)}
                                >
                                    <div className="message-header">
                                        <div className="message-title">
                                            {renderStatusIcon(message.status)}
                                            <span>{message.type.replace('-', ' ')}</span>
                                        </div>
                                        <div className="message-timestamp">
                                            {formatTimestamp(message.timestamp)}
                                        </div>
                                    </div>
                                    <div className="message-meta">
                                        <div className="message-sender">
                                            From: {renderAgentBadge(message.sender)}
                                        </div>
                                        <div className="message-recipient">
                                            To: {renderAgentBadge(message.recipient)}
                                        </div>
                                    </div>
                                    <div className="message-content">
                                        {message.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* MCP Tool Calls Section */}
                <section className="dashboard-section mcp-section">
                    <div className="section-header">
                        <h2>MCP Tool Call Status</h2>
                        <span className="badge">{filteredCalls.length} calls</span>
                    </div>
                    <div className="tool-call-log">
                        {filteredCalls.length === 0 ? (
                            <div className="log-placeholder">
                                <div className="placeholder-icon">🔧</div>
                                <p>No tool calls yet</p>
                                <small>MCP tool executions will appear here</small>
                            </div>
                        ) : (
                            filteredCalls.map(call => (
                                <div
                                    key={call.id}
                                    className="tool-call-item"
                                    onClick={() => setSelectedTool(call)}
                                >
                                    <div className="message-header">
                                        <div className="message-title">
                                            {renderStatusIcon(call.status)}
                                            <span>{call.tool.replace('-', ' ')}</span>
                                        </div>
                                        <div className="message-timestamp">
                                            {formatTimestamp(call.timestamp)}
                                        </div>
                                    </div>
                                    <div className="message-meta">
                                        <div className="message-sender">
                                            Agent: {renderAgentBadge(call.agent)}
                                        </div>
                                        <div className="message-duration">
                                            Duration: {formatDuration(call.duration)}
                                        </div>
                                    </div>
                                    <div className="message-content">
                                        Status: <span className={`status-${call.status}`}>
                                            {call.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Agents Overview Section */}
                <section className="dashboard-section agents-section">
                    <div className="section-header">
                        <h2>Agent Status Overview</h2>
                    </div>
                    <div className="agents-grid">
                        {Object.values(AGENT_CONFIGS).map(agent => (
                            <div key={agent.id} className="agent-card">
                                <div className="agent-icon">{agent.icon}</div>
                                <div className="agent-name">{agent.name}</div>
                                <div className="agent-status">
                                    <span className={`status-dot ${agent.status === 'active' ? 'active' :
                                        agent.status === 'maintenance' ? 'warning' : ''}`}></span>
                                    <span>{agent.status.toUpperCase()}</span>
                                </div>
                                <div className="agent-stats">
                                    {a2aMessages.filter(msg =>
                                        msg.sender === agent.id || msg.recipient === agent.id
                                    ).length} messages
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Message Detail Modal */}
            <Modal
                isOpen={selectedMessage !== null}
                onClose={() => setSelectedMessage(null)}
                title="Message Details"
            >
                {selectedMessage && (
                    <>
                        <div className="detail-section">
                            <h4>Message Information</h4>
                            <p><strong>ID:</strong> {selectedMessage.id}</p>
                            <p><strong>Type:</strong> {selectedMessage.type}</p>
                            <p><strong>Status:</strong> <span className={`status-${selectedMessage.status}`}>
                                {selectedMessage.status.toUpperCase()}
                            </span></p>
                            <p><strong>Timestamp:</strong> {new Date(selectedMessage.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="detail-section">
                            <h4>Routing Information</h4>
                            <p><strong>From:</strong> {AGENT_CONFIGS[selectedMessage.sender]?.name} ({selectedMessage.sender})</p>
                            <p><strong>To:</strong> {AGENT_CONFIGS[selectedMessage.recipient]?.name} ({selectedMessage.recipient})</p>
                        </div>
                        <div className="detail-section">
                            <h4>Message Content</h4>
                            <p>{selectedMessage.content}</p>
                        </div>
                        <div className="detail-section">
                            <h4>Metadata</h4>
                            <p><strong>Priority:</strong> {selectedMessage.metadata?.priority || 'normal'}</p>
                            <p><strong>Encrypted:</strong> {selectedMessage.metadata?.encrypted ? 'Yes' : 'No'}</p>
                            <p><strong>Retry Count:</strong> {selectedMessage.metadata?.retryCount || 0}</p>
                        </div>
                    </>
                )}
            </Modal>

            {/* Tool Call Detail Modal */}
            <Modal
                isOpen={selectedTool !== null}
                onClose={() => setSelectedTool(null)}
                title="Tool Call Details"
            >
                {selectedTool && (
                    <>
                        <div className="detail-section">
                            <h4>Call Information</h4>
                            <p><strong>ID:</strong> {selectedTool.id}</p>
                            <p><strong>Tool:</strong> {selectedTool.tool}</p>
                            <p><strong>Status:</strong> <span className={`status-${selectedTool.status}`}>
                                {selectedTool.status.toUpperCase()}
                            </span></p>
                            <p><strong>Agent:</strong> {AGENT_CONFIGS[selectedTool.agent]?.name} ({selectedTool.agent})</p>
                            <p><strong>Timestamp:</strong> {new Date(selectedTool.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="detail-section">
                            <h4>Execution Details</h4>
                            <p><strong>Duration:</strong> {formatDuration(selectedTool.duration)}</p>
                            <p><strong>Parameters:</strong> {JSON.stringify(selectedTool.parameters, null, 2)}</p>
                        </div>
                        {selectedTool.result && (
                            <div className="detail-section">
                                <h4>Result</h4>
                                <p>{selectedTool.result}</p>
                            </div>
                        )}
                        {selectedTool.error && (
                            <div className="detail-section">
                                <h4>Error</h4>
                                <p className="status-error">{selectedTool.error}</p>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AgentMonitorDashboard;
