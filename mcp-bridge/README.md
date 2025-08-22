# MCP Bridge Server

## Enhanced Inter-Agent Communication and Secure Programmatic Tool Interaction

This MCP (Model Context Protocol) Bridge Server provides a comprehensive solution for agent-to-agent communication and secure interaction with external services (GitHub, Vercel, Railway, Supabase). It implements standardized messaging protocols, granular permission controls, and healthcare-grade security for the Senior Care AI Ecosystem.

## 🚀 Features

### Core Capabilities
- **Multi-Service API Integration**: Unified access to GitHub, Vercel, Railway, and Supabase APIs
- **Agent-to-Agent Communication**: Standardized messaging system with 15+ message types
- **Security-First Design**: Encrypted credential management, granular permissions, comprehensive logging
- **Healthcare Compliance**: HIPAA-compliant architecture with audit trails
- **Production Ready**: Comprehensive error handling, rate limiting, and monitoring

### API Integrations
- **GitHub**: Repository management, PR automation, workflow triggers, issue tracking
- **Vercel**: Project deployment, environment management, domain configuration
- **Railway**: Service management, deployment monitoring, environment variables
- **Supabase**: Database operations, authentication, real-time subscriptions, storage

### Communication Features
- **Message Types**: Task delegation, progress updates, error reporting, resource requests
- **Delivery Confirmation**: Optional message acknowledgment with timeout handling
- **Broadcasting**: Targeted broadcasts with capability and status filtering
- **Agent Registration**: Dynamic agent discovery and capability management

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager
- Access tokens for integrated services

## 🛠️ Installation

1. **Clone and Navigate**:
   ```bash
   cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your service credentials
   ```

4. **Required Environment Variables**:
   ```env
   # GitHub Integration
   GITHUB_TOKEN=ghp_your_github_personal_access_token
   
   # Supabase Integration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   
   # Deployment Platforms (Vercel/Railway)
   DEPLOYMENT_PLATFORM_TOKEN=your_vercel_or_railway_token
   
   # Security (Optional - auto-generated if not provided)
   ENCRYPTION_KEY=your_32_character_encryption_key
   ```

## 🚦 Quick Start

### Basic Usage

```bash
# Start the server
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Health Check

```bash
curl http://localhost:3050/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "MCP Bridge Server is running",
  "services": {
    "github": { "success": true, "data": { "user": "your-username" } },
    "vercel": { "success": true, "data": { "user": "your-email" } },
    "railway": { "success": true, "data": { "user": "your-username" } },
    "supabase": { "success": true, "data": { "connected": true } }
  },
  "a2a_layer": { "status": "active", "agents": [] },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📡 API Reference

### GitHub Endpoints

#### Get Repository Information
```http
GET /github/repos/{owner}/{repo}
```

#### Create/Update File
```http
POST /github/repos/{owner}/{repo}/contents/{path}
Content-Type: application/json

{
  "content": "file content",
  "message": "commit message",
  "branch": "main"
}
```

#### Create Pull Request
```http
POST /github/repos/{owner}/{repo}/pulls
Content-Type: application/json

{
  "title": "PR title",
  "body": "PR description",
  "head": "feature-branch",
  "base": "main"
}
```

### Vercel Endpoints

#### List Projects
```http
GET /vercel/projects
```

#### Create Deployment
```http
POST /vercel/deployments
Content-Type: application/json

{
  "name": "project-name",
  "files": [],
  "target": "production"
}
```

#### Get Deployment Status
```http
GET /vercel/deployments/{id}/status
```

### Railway Endpoints

#### List Projects
```http
GET /railway/projects
```

#### Restart Service
```http
POST /railway/services/{serviceId}/restart
Content-Type: application/json

{
  "environmentId": "env-id"
}
```

### Supabase Endpoints

#### Database Operations
```http
POST /supabase/query/{table}
Content-Type: application/json

{
  "operation": "select|insert|update|delete",
  "data": { "field": "value" },
  "filters": [
    { "column": "id", "operator": "eq", "value": "123" }
  ],
  "options": { "limit": 10 }
}
```

### Agent-to-Agent Communication

#### Send Message
```http
POST /a2a/message
Content-Type: application/json

{
  "from": "agent-id-1",
  "to": "agent-id-2",
  "type": "TASK_DELEGATION",
  "payload": {
    "taskId": "task-123",
    "description": "Process user data",
    "priority": "high",
    "deadline": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Messages
```http
GET /a2a/messages/{agentId}?type=STATUS_REQUEST&limit=10
```

#### Broadcast Message
```http
POST /a2a/broadcast
Content-Type: application/json

{
  "from": "agent-id-1",
  "type": "ANNOUNCEMENT",
  "payload": {
    "title": "System Maintenance",
    "message": "Scheduled maintenance in 1 hour"
  },
  "targets": ["agent-2", "agent-3"]
}
```

### Tool Chain Execution

#### Execute Multiple Operations
```http
POST /tools/execute
Content-Type: application/json

{
  "tools": [
    {
      "service": "github",
      "operation": "getRepository",
      "params": { "owner": "user", "repo": "project" },
      "critical": true
    },
    {
      "service": "vercel",
      "operation": "deploy",
      "params": { "config": { "name": "app" } }
    }
  ],
  "context": { "user": "deployment-agent" }
}
```

## 🔒 Security Features

### Credential Management
- **Encrypted Storage**: All credentials encrypted at rest using AES-256
- **Environment Priority**: Environment variables override file-based credentials
- **Validation**: Format validation for all service credentials
- **Cache Management**: Secure in-memory caching with configurable expiration

### Permission Controls
- **Principle of Least Privilege**: Minimal permissions for each operation
- **Service-Specific Scopes**: Granular permissions per integrated service
- **Operation Validation**: Pre-execution permission checks

### Audit and Logging
- **Structured Logging**: JSON-formatted logs with contextual information
- **Request Tracking**: Comprehensive request/response logging
- **Performance Monitoring**: Built-in timing and performance metrics
- **Health Monitoring**: Continuous service health checks

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                    # Unit tests for individual components
│   ├── a2a-layer.test.js    # A2A communication tests
│   └── credential-manager.test.js  # Credential management tests
├── integration/             # Integration tests
│   └── mcp-bridge-server.test.js   # Full server tests
└── github-wrapper.test.js   # API wrapper tests
```

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Coverage Goals
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 🏗️ Architecture

### Components

#### API Wrappers
- **GitHubWrapper**: Repository operations, PR management, workflow automation
- **VercelWrapper**: Deployment management, project configuration
- **RailwayWrapper**: Service management, environment control
- **SupabaseWrapper**: Database operations, authentication, storage

#### Communication Layer
- **A2ACommunicationLayer**: Message routing, delivery confirmation, broadcasting
- **Message Types**: 15+ standardized message types for inter-agent communication
- **Agent Registry**: Dynamic agent registration and capability tracking

#### Security Components
- **SecureCredentialManager**: Encrypted credential storage and retrieval
- **Logger**: Structured logging with performance monitoring
- **Permission System**: Granular access control for all operations

#### Server Core
- **MCPBridgeServer**: Express-based HTTP server with middleware stack
- **Route Handlers**: Service-specific endpoint handling
- **Error Management**: Comprehensive error handling and recovery

### Message Types

#### Task Management
- `TASK_DELEGATION`: Assign tasks to agents
- `TASK_ACCEPTED`: Confirm task acceptance
- `TASK_REJECTED`: Reject task with reason
- `TASK_COMPLETED`: Report task completion

#### Status and Progress
- `PROGRESS_UPDATE`: Report progress on tasks
- `STATUS_REQUEST`: Request agent status
- `STATUS_RESPONSE`: Provide status information

#### Error Handling
- `BLOCKER_REPORT`: Report blocking issues
- `BLOCKER_RESOLVED`: Confirm blocker resolution
- `ERROR_REPORT`: Report errors or failures

#### Information Exchange
- `REQUEST_FOR_INFO`: Request specific information
- `INFO_RESPONSE`: Provide requested information
- `COLLABORATION_INVITE`: Invite collaboration

#### Resource Management
- `RESOURCE_REQUEST`: Request resource access
- `RESOURCE_GRANTED`: Grant resource access
- `RESOURCE_DENIED`: Deny resource access

#### Broadcasting
- `ANNOUNCEMENT`: General announcements
- `ALERT`: High-priority alerts

## 🔧 Configuration

### Server Options
```javascript
const server = new MCPBridgeServer({
  port: 3050,                    // Server port
  logLevel: 'info',              // Logging level
  maxMessageAge: 86400000,       // Message TTL (24 hours)
  confirmationTimeout: 30000,    // Delivery confirmation timeout
  rateLimitBuffer: 100          // Rate limit buffer
});
```

### Credential Manager Options
```javascript
const credentialManager = new SecureCredentialManager({
  encryptionKey: 'your-key',     // Encryption key
  credentialPath: '.env',        // Credential file path
  cacheTimeout: 300000          // Cache timeout (5 minutes)
});
```

### Logger Options
```javascript
const logger = new Logger('MCP-Bridge', {
  level: 'info',                 // Log level
  outputs: ['console', 'file'],  // Output destinations
  maxFileSize: 10485760,         // Max file size (10MB)
  maxFiles: 5                   // Max log files to keep
});
```

## 🐛 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check credential format
curl http://localhost:3050/health

# Verify permissions
# GitHub: repo, workflow scopes required
# Vercel: full access recommended
# Railway: full access recommended
# Supabase: service_role key required
```

#### Connection Issues
```bash
# Check service connectivity
curl -X POST http://localhost:3050/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tools": [
      {
        "service": "github",
        "operation": "healthCheck",
        "params": {}
      }
    ]
  }'
```

#### Message Delivery Issues
```bash
# Check A2A layer status
curl http://localhost:3050/a2a/status

# Register test agents
curl -X POST http://localhost:3050/a2a/register \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent", "capabilities": ["test"]}'
```

### Debug Mode

Enable debug logging:
```javascript
const server = new MCPBridgeServer({
  logger: new Logger('MCP-Bridge', { level: 'debug' })
});
```

### Performance Monitoring

Monitor performance metrics:
```bash
# Check server stats
curl http://localhost:3050/health

# Monitor message queue
curl http://localhost:3050/a2a/stats

# Check credential cache
curl http://localhost:3050/credentials/stats
```

## 🚀 Production Deployment

### Environment Setup
1. **Secure Credentials**: Use proper secrets management
2. **HTTPS**: Enable SSL/TLS in production
3. **Rate Limiting**: Configure appropriate rate limits
4. **Monitoring**: Set up application monitoring
5. **Logging**: Configure persistent log storage

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3050
CMD ["npm", "start"]
```

### Health Checks
```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3050/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 📊 Monitoring and Metrics

### Built-in Metrics
- Request/response times
- Error rates by service
- Message queue statistics
- Agent registration counts
- Credential usage patterns

### Health Endpoints
- `/health`: Overall system health
- `/health/github`: GitHub service health
- `/health/vercel`: Vercel service health  
- `/health/railway`: Railway service health
- `/health/supabase`: Supabase service health

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Code Standards
- **ESLint**: Enforced code style
- **Jest**: Unit and integration testing
- **JSDoc**: Comprehensive documentation
- **Error Handling**: Consistent error patterns

### Pull Request Process
1. Create feature branch
2. Implement changes with tests
3. Run full test suite
4. Update documentation
5. Submit PR with detailed description

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the test files for usage examples  
- Consult the API reference for endpoint details
- Check server logs for error information

---

**Senior Care AI Ecosystem - MCP Bridge Server**  
*Secure, scalable, healthcare-grade inter-agent communication*