# Multi-Agent Communication Monitor Dashboard

A comprehensive React-based dashboard for monitoring Agent-to-Agent (A2A) message flows and Model Context Protocol (MCP) tool call executions in real-time.

## 🌟 Features

- **Real-time A2A Message Monitoring**: Track communications between Claude Code CLI, Gemini Prime, Emergency AI, Family Coordinator, and Health Monitor agents
- **MCP Tool Call Status Tracking**: Monitor database queries, notifications, health assessments, and other tool executions
- **Agent Status Overview**: Visual status indicators for all agents in the ecosystem
- **System Health Metrics**: Total messages, successful tool calls, active agents, and average response times
- **Interactive Modals**: Detailed views for messages and tool calls with metadata
- **Export Functionality**: JSON export of all monitoring data
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility Features**: WCAG-compliant with keyboard navigation and screen reader support

## 🏗️ Architecture

### Component Structure

```
communication_dashboard/
├── index.html                     # Vanilla JavaScript version
├── dashboard.css                  # Comprehensive styling
├── dashboard.js                   # Core monitoring logic
├── AgentMonitorDashboard.jsx     # Original React component
├── AgentMonitorDashboardComplete.jsx  # Enhanced React component
├── AgentMonitorDashboard.css     # React-optimized styles
├── App.jsx                       # React app entry point
├── react-demo.html              # React demo page
├── package.json                 # React project configuration
└── README.md                    # This file
```

### Agent Configuration

The dashboard monitors 5 core agents:

- **Claude Code CLI** (🤖): Primary code execution and development agent
- **Gemini Prime** (✨): Advanced reasoning and analysis agent  
- **Emergency AI** (🚨): Crisis detection and response agent
- **Family Coordinator** (👨‍👩‍👧‍👦): Family communication and scheduling agent
- **Health Monitor** (💗): Vital signs and health tracking agent

## 🚀 Quick Start

### Option 1: Vanilla JavaScript (No Dependencies)

```bash
# Open in browser directly
open index.html
```

### Option 2: React Component Integration

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production  
npm run build
```

### Option 3: React Demo

```bash
# Open React demo
open react-demo.html
```

## 📋 Usage

### Basic Implementation

```jsx
import AgentMonitorDashboard from './AgentMonitorDashboardComplete';

function App() {
    return (
        <AgentMonitorDashboard 
            websocketUrl="ws://localhost:8080/agent-monitor"
            apiEndpoint="/api/agent-monitor"
            autoConnect={true}
        />
    );
}
```

### WebSocket Integration

```javascript
// Connect to live agent communication hub
const ws = new WebSocket('ws://your-server/agent-monitor');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'a2a-message') {
        // Handle new A2A message
        console.log('New message:', data.message);
    }
    
    if (data.type === 'mcp-call') {
        // Handle new MCP tool call
        console.log('New tool call:', data.call);
    }
};
```

## 🎯 Integration Points

### SeniorCare AI Ecosystem Integration

```javascript
// Connect to existing Claude Code CLI
const claudeMonitor = new AgentMonitorDashboard({
    websocketUrl: 'ws://localhost:8080/claude-monitor',
    agentFilters: ['claude-code', 'gemini-prime'],
    toolFilters: ['database-query', 'health-assessment']
});

// Connect to MCP server
const mcpConnection = {
    endpoint: '/api/mcp-tools',
    authentication: 'bearer-token',
    realTimeUpdates: true
};
```

### Production Deployment

```bash
# Build optimized version
npm run build

# Deploy to production server
cp -r build/* /var/www/agent-monitor/

# Configure nginx/apache to serve static files
# Set up WebSocket proxy for real-time updates
```

## 📊 Data Format

### A2A Message Format

```json
{
    "id": "abc123",
    "timestamp": "2024-01-02T15:30:00.000Z",
    "sender": "claude-code",
    "recipient": "health-monitor", 
    "type": "health-check",
    "status": "delivered",
    "content": "Request vitals update for patient ID 12345",
    "metadata": {
        "priority": "high",
        "encrypted": true,
        "retryCount": 0
    }
}
```

### MCP Tool Call Format

```json
{
    "id": "def456",
    "timestamp": "2024-01-02T15:31:00.000Z",
    "agent": "health-monitor",
    "tool": "database-query",
    "status": "completed",
    "duration": 1250,
    "parameters": {
        "target": "patient_vitals",
        "timeout": 30000
    },
    "result": "Vitals retrieved successfully",
    "error": null
}
```

## 🔧 Configuration Options

### Component Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `websocketUrl` | string | null | WebSocket endpoint for real-time updates |
| `apiEndpoint` | string | null | REST API endpoint for data fetching |
| `autoConnect` | boolean | true | Automatically connect to WebSocket on mount |
| `refreshInterval` | number | 2000 | Mock data refresh interval (ms) |
| `maxMessages` | number | 50 | Maximum A2A messages to retain |
| `maxToolCalls` | number | 50 | Maximum tool calls to retain |

### Environment Variables

```bash
REACT_APP_WEBSOCKET_URL=ws://localhost:8080/agent-monitor
REACT_APP_API_ENDPOINT=http://localhost:3001/api
REACT_APP_REFRESH_INTERVAL=2000
```

## 🎨 Customization

### Theme Colors

```css
:root {
    --primary-color: #2E7D32;
    --secondary-color: #1976D2;
    --success-color: #388E3C;
    --warning-color: #F57C00;
    --error-color: #D32F2F;
    
    /* Agent Colors */
    --claude-color: #8B5CF6;
    --gemini-color: #10B981;
    --emergency-color: #EF4444;
    --family-color: #3B82F6;
    --health-color: #F59E0B;
}
```

### Custom Agent Configuration

```javascript
const customAgents = {
    'my-agent': {
        id: 'my-agent',
        name: 'My Custom Agent',
        icon: '🔥',
        color: '#FF6B35',
        status: 'active'
    }
};
```

## 📱 Responsive Design

- **Desktop**: Full grid layout with all panels visible
- **Tablet**: Stacked layout with collapsible sections  
- **Mobile**: Single-column responsive design with touch-friendly controls

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader optimized
- High contrast mode support
- Reduced motion preferences respected

## 🔒 Security Considerations

- WebSocket connections support WSS (secure WebSocket)
- Message content can be encrypted/redacted for sensitive data
- CORS configuration required for cross-origin requests
- Authentication tokens can be passed via WebSocket headers

## 📈 Performance

- **Render Optimization**: React.memo and useMemo for expensive calculations
- **Virtual Scrolling**: Efficient handling of large message lists
- **Lazy Loading**: Components loaded on demand
- **Bundle Size**: ~45KB gzipped (excluding React)

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**

```bash
# Check server status
curl -I ws://localhost:8080/agent-monitor

# Verify WebSocket support
netstat -an | grep 8080
```

**React Build Errors**

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**CSS Loading Issues**

```javascript
// Ensure CSS import in component
import './AgentMonitorDashboard.css';
```

## 🚀 Production Checklist

- [ ] Configure real WebSocket endpoints
- [ ] Set up authentication/authorization
- [ ] Enable HTTPS/WSS for secure connections
- [ ] Configure CORS policies
- [ ] Set up monitoring and logging
- [ ] Test responsive design across devices
- [ ] Validate accessibility compliance
- [ ] Performance test with high message volume
- [ ] Set up error boundaries and fallbacks

## 📝 Development

### Local Development

```bash
# Clone and setup
git clone [repository]
cd communication_dashboard
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build production
npm run build
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Support

For technical support and integration assistance:

- Create an issue in the repository
- Contact the SeniorCare AI development team
- Check the documentation for common solutions

---

**Built with ❤️ for the SeniorCare AI Multi-Agent Ecosystem**
