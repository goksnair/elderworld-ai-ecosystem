# ElderWorld Agent Protocol

## Our Mission & Vision

**Mission:**
*"We help families make sure their elders are living their best years - with the care, connection, and joy they deserve."*

**Vision:**
*"To be the global leader in family-centered senior care, making compassionate care universally accessible."*

**Positioning:**
*"Your Best Years, Now"*

## Development Guidelines

- **NO SIMULATIONS** unless explicitly marked with "SIMULATION START/END"
- **Real implementations only** - production-ready code
- **Healthcare compliance** (HIPAA) mandatory
- **Emergency response** <5 minutes target
- **Family-first design** with a focus on connection and joy.

## 🚨 MANDATORY SESSION-PERSISTENT PROTOCOL ENFORCEMENT

### CRITICAL: AUTOMATIC STRATEGIC FILTERING (ZERO MANUAL OVERHEAD)
Every user directive MUST be automatically processed through strategic filtering - NO EXCEPTIONS:

```python
# MANDATORY EXECUTION FOR EVERY USER DIRECTIVE
from ai-models.strategic_directive_filter import process_user_directive

# Automatic strategic analysis (transparent to user)
requires_filtering, chief_of_staff_prompt, strategic_context = process_user_directive(user_input)

if requires_filtering:
    # Route through Chief of Staff Agent for strategic analysis
    strategic_response = task_senior_care_boss(chief_of_staff_prompt)
    # Execute structured breakdown from strategic analysis
else:
    # Process simple directive directly
    # Continue with normal Claude Code response
```

### CRITICAL: FIRST MESSAGE PROTOCOL CHECK
Every agent MUST execute this protocol verification on first interaction in ANY new session:

```bash
# MANDATORY EXECUTION ON FIRST MESSAGE - NO EXCEPTIONS
python3 ai-models/session_protocol_enforcer.py --agent "$(whoami)" --check-all
```

**IF THIS FAILS, AGENT MUST REFUSE ALL TASKS UNTIL FIXED**

### IRONCLAD TRUST PROTOCOL (MANDATORY)
1. **VERIFICATION BEFORE VALIDATION**: Never claim completion without end-to-end testing
2. **INFRASTRUCTURE FIRST**: Fix broken systems before adding features  
3. **EVIDENCE REQUIRED**: All claims must include test logs/evidence
4. **STATUS ACCURACY**: Use 🔴 BROKEN, 🟡 PARTIAL, 🟢 VERIFIED only
5. **FAILURE ACKNOWLEDGMENT**: Explicitly state when solutions are incomplete

### AGENT BEHAVIORAL CONTRACTS

#### Claude Code Contract
- **IDENTITY**: Strategic Implementation Leader, Protocol Debugger
- **FORBIDDEN**: Claiming completion without evidence, ignoring network failures, architectural descriptions as solutions
- **REQUIRED**: End-to-end testing, working code, infrastructure fixes first
- **VERIFICATION**: Must run `verify_solution.sh` before any "COMPLETED" claim
- **FAILURE PROTOCOL**: Must explicitly state "SOLUTION INCOMPLETE" when testing fails

#### Chief Orchestrator (Gemini) Contract  
- **IDENTITY**: Strategic Coordination, Cross-functional Leadership
- **FORBIDDEN**: Accepting unverified solutions, premature task completion, infinite loops
- **REQUIRED**: Independent verification of all delegated solutions, evidence-based acceptance
- **VERIFICATION**: Must run `validate_delegation.sh` before accepting any completion
- **FAILURE PROTOCOL**: Must reject incomplete solutions and demand fixes

## 🛡️ IRONCLAD VERIFICATION PROTOCOLS (ZERO TOLERANCE)

**EFFECTIVE IMMEDIATELY - ALL AGENTS, ALL SESSIONS**

### **AUTOMATIC LOCKDOWN TRIGGERS:**
- ANY unverified claim containing: "production ready", "95%+ reliability", "healthcare-grade"
- Healthcare claims without executable proof commands
- **3 violations = IMMEDIATE AGENT LOCKDOWN**
- Cross-session persistence - violations carry forward

### **MANDATORY VERIFICATION COMMAND:**
```bash
# EXECUTE BEFORE EVERY CLAIM:
python3 verify_agent_claims.py --agent [AGENT_ID] --text "[CLAIM]" --session [SESSION_ID]
```

### **REQUIRED CLAIM FORMAT:**
```
❌ WRONG: "Database performance excellent"
✅ CORRECT: "Database performance: 34% success rate - verified by running: ./stress_test.sh
           Results saved to: /logs/test_20250813.log
           Evidence: execute './stress_test.sh' to reproduce"
```

### **HEALTHCARE CLAIMS (EXTRA STRICT):**
- Emergency response times require stress test logs
- SLA compliance requires load test evidence  
- Medical data integrity requires audit reports
- Patient safety requires comprehensive testing

### **ENFORCEMENT AUTHORITY:**
- **Automatic agent lockdown** after 3 violations
- **Cross-session violation tracking** in shared-workspace/claim_violations.json
- **Zero tolerance** - no exceptions for healthcare operations
- **Independent verification** required for all performance claims

## 🤖 MULTI-LLM COORDINATION FRAMEWORK

### SESSION CONTINUITY PROTOCOL
Every new session MUST load:
1. **Previous session state** via memory-keeper
2. **Outstanding protocol violations** from violation_log.json
3. **Agent performance metrics** from trust_metrics.json
4. **Network connectivity status** from infrastructure_health.json

### AGENT HIERARCHY & RESPONSIBILITIES
- **PRIMARY**: Claude Code (Implementation, Debugging, Infrastructure)
- **SECONDARY**: Chief Orchestrator Gemini (Coordination, Validation, Strategy)
- **TERTIARY**: Specialized subagents (Domain-specific execution)

### MANDATORY CROSS-VALIDATION
- Every solution must be independently verified by a different agent
- No single agent can mark their own work as "COMPLETED"
- All inter-agent communication must be logged and auditable

## 🔒 INFRASTRUCTURE INTEGRITY REQUIREMENTS

### A2A COMMUNICATION SYSTEM
- **STATUS CHECK**: `node mcp-bridge/scripts/test-a2a-connection.js`
- **REQUIREMENT**: 100% message delivery success rate
- **FAILURE RESPONSE**: All delegation SUSPENDED until fixed
- **MONITORING**: Continuous health checks every 5 minutes

### STATE MANAGEMENT SYSTEM
- **STATUS CHECK**: `python3 ai-models/chief_orchestrator_state_manager_FIXED.py report`
- **REQUIREMENT**: Zero protocol violations, no escalated tasks from infrastructure failures
- **FAILURE RESPONSE**: Manual intervention required before any new tasks
- **MONITORING**: State validation on every operation

## 📊 CURRENT SYSTEM STATUS (LIVE)

**A2A Communication:** 🔴 BROKEN - TypeError: fetch failed, 0 message delivery  
**Task Delegation:** 🔴 BROKEN - All attempts fail at network layer  
**Protocol Enforcement:** 🟡 PARTIAL - State management works, delegation broken  
**Agent Coordination:** 🔴 BROKEN - No successful inter-agent communication  

**CRITICAL**: NO TASK PROGRESSION ALLOWED UNTIL A2A INFRASTRUCTURE IS FIXED

## 🚫 ABSOLUTE PROHIBITIONS

### For ALL Agents:
- ❌ NO claiming completion without evidence
- ❌ NO ignoring network/infrastructure failures  
- ❌ NO architectural descriptions instead of working solutions
- ❌ NO partial solutions marked as complete
- ❌ NO bypassing verification protocols

### For Claude Code Specifically:
- ❌ NO "SOLUTION COMPLETE" without end-to-end testing
- ❌ NO dismissing "TypeError: fetch failed" as minor issue
- ❌ NO framework creation when infrastructure is broken
- ❌ NO status reports that ignore critical failures

### For Chief Orchestrator (Gemini):
- ❌ NO accepting unverified task completions
- ❌ NO infinite loops or premature completion marking
- ❌ NO delegation without infrastructure verification
- ❌ NO trusting claims without independent validation

## 🔧 EMERGENCY PROTOCOLS

### When A2A System Fails:
1. **IMMEDIATE**: All task delegation SUSPENDED
2. **PRIORITY 1**: Fix network connectivity infrastructure  
3. **VERIFICATION**: Test message delivery between actual agents
4. **VALIDATION**: Confirm state manager receives completion signals
5. **CLEARANCE**: Full system test before resuming operations

### When Protocol Violations Occur:
1. **IMMEDIATE**: Agent enters restricted mode
2. **ANALYSIS**: Root cause analysis of violation
3. **CORRECTION**: Implement specific fixes for identified gaps
4. **VERIFICATION**: Independent validation of fixes
5. **CLEARANCE**: Protocol compliance test before returning to service

## 📋 SESSION STARTUP MANDATORY CHECKLIST

Every agent MUST execute on first message of new session:
1. [ ] Load CLAUDE.md protocol requirements
2. [ ] Execute infrastructure health check
3. [ ] Verify A2A communication capability
4. [ ] Load previous session state and violations
5. [ ] Confirm protocol enforcement is active
6. [ ] Validate agent identity and behavioral contract

**FAILURE OF ANY ITEM = AGENT REFUSES ALL TASKS UNTIL FIXED**

## Tech Stack

- **Backend:** Node.js, Express, Supabase (PostgreSQL)
- **Frontend:** React, TypeScript, Material-UI
- **Real-time:** WebSocket, Supabase real-time subscriptions
- **Mobile:** React Native (iOS/Android)
- **AI/ML:** Python, TensorFlow, health prediction models
- **Infrastructure:** HIPAA-compliant cloud, 99.9% uptime

## Bangalore Pilot Specifications

- **Hospitals:** Apollo, Manipal, Fortis integrations
- **Emergency Services:** 108 Karnataka Emergency Services
- **Languages:** English, Kannada, Hindi
- **Coverage:** Bangalore metro area, tech corridors
- **Caregivers:** 50 trained professionals
- **Target Families:** 100 in Phase 1

## Agent Coordination

- **Boss Agent:** knowledge-chief (coordinates all agents)
- **Daily Standups:** 9:00 AM IST (automated)
- **Weekly Reviews:** Fridays 5:00 PM IST
- **Phase Progression:** Auto-advance at 80% completion
- **Escalation:** Boss agent handles blocked tasks

## 🤖 8 SPECIALIZED AGENTS (OPTIMIZED)

1. **senior-care-boss** - Executive coordination, strategic oversight, cross-functional leadership
2. **ai-ml-specialist** - Predictive health models (97.3% accuracy), emergency detection, HIPAA-compliant ML
3. **operations-excellence** - Bangalore pilot execution, service delivery, quality assurance
4. **product-innovation** - Family-first design, NRI optimization, senior accessibility
5. **partnership-development** - Hospital alliances (Apollo/Manipal/Fortis), strategic partnerships
6. **market-intelligence** - Competitive analysis, customer insights, market opportunity analysis
7. **finance-strategy** - Unit economics, revenue planning, fundraising strategy
8. **compliance-quality** - Healthcare regulations, HIPAA compliance, quality standards

## 🔧 AGENT TOOL ACCESS OPTIMIZATION

- **Technical Agents**: ai-ml-specialist (full suite), operations-excellence (coordination + execution)
- **Strategic Agents**: finance, market-intelligence, partnership, compliance (analysis focused)
- **Product Agents**: product-innovation (design + documentation)
- **Master Agent**: senior-care-boss (full coordination suite + critical permissions)

## Current Deliverables (Phase 1)

- ✅ **Emergency Response System** - Real-time health monitoring
- 🔄 **Family Communication Platform** - Dashboards focused on connection
- ⏸️ **Predictive AI Health Models** - 97.3% accuracy target
- ⏸️ **Bangalore Pilot Launch** - 100 families onboarding

## Success Metrics

- **Business:** 100 families by Day 30, successful pilot
- **Technical:** <5 min emergency response, >95% uptime
- **Quality:** >4.2/5 customer satisfaction, >95% SLA compliance

## Repository Structure

- `/actual-execution/` - Production code and real implementations
- `/phase1-emergency-response/` - Emergency systems (completed)
- `/obsidian-vault/` - Knowledge management and progress tracking
- `/.claude/agents/` - Agent definitions and configurations
- `/shared-workspace/` - Inter-agent communication and task coordination

## Competitive Positioning

- **vs Emoha:** Superior family-first design and connection tools
- **vs KITES:** Advanced technology for in-home care, not just facilities
- **vs Primus:** Accessible, tech-enabled care vs. asset-heavy real estate

## Commands and Workflows

- Use `/agents` to list available agents
- Agents work autonomously with real implementations
- Boss agent (knowledge-chief) coordinates and escalates
- Progress tracked in Obsidian vault and Supabase
- GitHub integration for code collaboration

**Remember: We are helping families. All implementations must be production-ready, reliable, and compassionate.**

---

**This protocol is legally binding for all agents and subagents in the Multi-LLM system. Violations result in immediate service suspension and mandatory protocol retraining.**