# 🌐 Global System Guidelines & User-Level Memory Framework

**Purpose**: Establish persistent, reliable guidelines that transcend individual chat sessions to ensure consistent, high-quality autonomous system operation.

---

## 🎯 Core Principles (Global Memory)

### 1. Verification-First Approach
**NEVER make claims without verification. ALWAYS test before delivering.**

```bash
# Standard verification commands to run BEFORE making any claims:
pwd                          # Confirm working directory
node --version              # Verify Node.js availability
npm ls --depth=0           # Check installed dependencies
ls -la .claude/            # Verify Claude configuration
```

### 2. Ground-Up Development
- Start with basic functionality before complex features
- Test each component individually before integration
- Build incrementally with verification at each step
- Document what actually works vs. what's planned

### 3. Truth in Documentation
- Documentation must reflect actual system state
- Update docs immediately when reality changes
- Remove or correct inaccurate claims immediately
- Maintain clear distinction between working vs. planned features

---

## 🔧 Claude CLI Optimization (User Level Setup)

### System Requirements (Manual User Setup)
```bash
# 1. Node.js 18+ (Required)
node --version  # Must be >= 18.0.0

# 2. Install Claude CLI globally
npm install -g @anthropic-ai/claude-code

# 3. Verify installation
claude --version
```

### Efficient Usage Patterns
1. **Use Planning Mode**: Start complex tasks with "think" or "think harder" commands
2. **Context Management**: Use `/clear` when switching between unrelated tasks
3. **Custom Commands**: Store repeated workflows in `.claude/commands/` folder
4. **Project Memory**: Maintain CLAUDE.md in project root for architecture and conventions

### MCP (Model Context Protocol) Setup
```bash
# Add MCP servers for enhanced functionality
claude mcp add obsidian-vault npx @modelcontextprotocol/server-obsidian
claude mcp add filesystem npx @modelcontextprotocol/server-filesystem

# Configure in .mcp.json for team sharing
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-obsidian"]
    }
  }
}
```

---

## 🧠 Prompt Engineering Framework (Global Application)

### Core Prompt Structure
```
ROLE: [Specific expert role with clear authority]
CONTEXT: [Project background, constraints, success criteria]
TASK: [Specific, measurable objective]
FORMAT: [Expected output structure]
VERIFICATION: [How to test the result]
```

### Advanced Techniques for Autonomous Systems
1. **Meta-Prompting**: Use structured prompts that guide Claude to create better prompts
2. **Chain of Thought**: Encourage step-by-step reasoning with "Let me think through this..."
3. **XML Formatting**: Use `<thinking>`, `<plan>`, `<implementation>` tags for structure
4. **Error Prevention**: Include "If uncertain, ask for clarification" instructions

### Claude-Specific Optimizations
- End examples with `### New Input:` for better context switching
- Use XML tags for complex instructions: `<task>`, `<context>`, `<output>`
- Leverage Claude's safety features with clear ethical boundaries
- Utilize extended thinking with "ultrathink" for complex problems

---

## 🤖 Multi-LLM & Meta-Prompting Strategy

### When to Use Multiple LLMs
1. **Claude Code**: Primary development, code review, system architecture
2. **Gemini CLI**: Dynamic prompt generation, complex reasoning chains
3. **Coordination**: Use one LLM to generate prompts for another

### Meta-Prompting Implementation
```
Primary LLM (Gemini): Generate optimized prompts for specific tasks
Secondary LLM (Claude): Execute tasks using generated prompts
Feedback Loop: Analyze results and improve prompt generation
```

### Multi-Agent Coordination
- **Role-Based Teams**: Assign specific expertise to each agent
- **Dynamic Communication**: Use ranker systems to activate best-performing agents
- **Error Prevention**: Implement validation layers to prevent hallucination propagation

---

## 📚 Context Engineering & Memory Management

### Project Memory Structure
```
CLAUDE.md (Project Root):
├── Architecture Overview
├── Development Guidelines  
├── Current Status (Updated Daily)
├── Known Issues & Blockers
├── Success Criteria
└── Next Steps

.claude/commands/ (Custom Workflows):
├── setup-dev-environment.md
├── run-tests.md
├── deploy-production.md
└── health-check.md
```

### Obsidian Integration for Persistent Memory
```bash
# Install Obsidian MCP Server
npm install -g @modelcontextprotocol/server-obsidian

# Configure for knowledge management
{
  "vault_path": "./obsidian-vault",
  "auto_sync": true,
  "cross_reference": true
}
```

### Memory Persistence Strategies
1. **Session Continuity**: Store critical decisions in CLAUDE.md
2. **Knowledge Base**: Use Obsidian for cross-project learning
3. **Version Control**: Commit memory updates to git
4. **Automated Backup**: Script regular backups of configuration

---

## 🔍 Quality Assurance Framework

### Pre-Implementation Checklist
- [ ] **Discovery**: Scan existing structure before making changes
- [ ] **Documentation**: Read current docs and identify gaps
- [ ] **Testing**: Verify current functionality before building
- [ ] **Planning**: Create step-by-step implementation plan

### Post-Implementation Verification
```bash
# Standard test suite for any changes
npm test                    # Run project tests
node basic-health-check.js  # Custom health verification
npm run lint               # Code quality check
git status                 # Verify changes are intentional
```

### Continuous Improvement
1. **Error Tracking**: Log all failures in obsidian-vault/Errors/
2. **Success Patterns**: Document working solutions in Templates/
3. **Performance Metrics**: Track response times and accuracy
4. **User Feedback**: Regular retrospectives on system effectiveness

---

## 🚀 Autonomous System Architecture

### Core Components
1. **Verification Engine**: Always test before claiming functionality
2. **Memory System**: Persistent storage of decisions and learnings
3. **Communication Protocol**: Structured inter-agent coordination
4. **Quality Gates**: Automated validation at each step
5. **Feedback Loop**: Continuous improvement based on results

### System Health Indicators
```javascript
// Monitor these metrics continuously
{
  "verification_rate": ">95%",      // Commands tested before delivery
  "documentation_accuracy": ">98%", // Docs match reality
  "error_recovery_time": "<5min",   // Time to fix blocking issues
  "knowledge_retention": ">90%"     // Session-to-session consistency
}
```

### Escalation Protocols
1. **Level 1**: Standard verification fails → Run extended diagnostics
2. **Level 2**: Multiple failures → Review system architecture
3. **Level 3**: Critical blocker → Engage human oversight
4. **Level 4**: System integrity compromise → Full system reset

---

## 💡 Implementation Priorities

### Phase 1: Foundation (Immediate)
1. Implement verification framework in all responses
2. Create project health check system
3. Establish accurate documentation baseline
4. Configure basic MCP servers

### Phase 2: Enhancement (Week 2)
1. Set up Obsidian knowledge base
2. Implement multi-LLM coordination
3. Create custom command workflows
4. Build automated testing pipeline

### Phase 3: Optimization (Week 3+)
1. Fine-tune prompt engineering templates
2. Implement advanced MCP integrations
3. Create self-improving feedback loops
4. Scale to multi-project architecture

---

## 🔒 Security & Compliance

### Data Protection
- Store sensitive data in encrypted formats
- Use environment variables for credentials
- Implement audit logging for all changes
- Regular security reviews of integrations

### Access Control
- Limit MCP server permissions to minimum required
- Verify third-party MCP servers before installation
- Monitor for unusual system behavior
- Maintain backup of all configurations

---

## 📋 Daily Operating Procedures

### Morning System Check
```bash
cd /path/to/project
node basic-health-check.js
git status
npm outdated
```

### Session Startup Protocol
1. Read CLAUDE.md for current project state
2. Review any blockers or known issues
3. Verify working directory and dependencies
4. Set clear objectives for the session

### Session Closure Protocol
1. Update CLAUDE.md with progress made
2. Document any new issues discovered
3. Commit changes to version control
4. Plan next session objectives

---

**🎯 Success Metric**: When every technical claim can be verified with a simple command, and every session builds reliably on the previous one, we've achieved true autonomous system operation.**

---

*This document serves as the persistent memory for our autonomous development system. Update it as patterns emerge and improve over time.*