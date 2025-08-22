# GEMINI VERIFICATION PROTOCOL SETUP
## Cross-LLM Enforcement for Healthcare Reliability

**Purpose:** Extend ironclad verification protocol to Gemini Chief Orchestrator  
**Scope:** Identical verification standards across Claude Code + Gemini CLI  
**Goal:** Eliminate unverified claims from ALL LLM agents in healthcare context  

---

## 🚀 QUICK SETUP

### **1. Activate Gemini Verification:**
```bash
# Make integration script executable
chmod +x integrate_gemini_verification.sh

# Activate verification wrapper
source integrate_gemini_verification.sh current-session

# Test verification is working
gemini_verified "Test prompt for verification"
```

### **2. MCP Integration (Automatic):**
```bash
# Copy MCP config to Claude Code settings
cp mcp_verification_config.json ~/.config/claude-code/mcp-servers.json

# Restart Claude Code with MCP verification
claude mcp restart
```

---

## 🔒 GEMINI-SPECIFIC ENFORCEMENT

### **Forbidden Gemini Statements (Auto-Lockdown):**
```
❌ "Delegation successful and validated"
❌ "Orchestration complete and verified" 
❌ "Coordination excellence confirmed"
❌ "Task acceptance guaranteed"
❌ "Agent performance validated"
❌ "Strategic coordination verified"
❌ "Workflow optimization complete"
```

### **Required Gemini Format:**
```
✅ "Task delegation: 3/5 agents responded successfully
   - verified by running: python3 check_agent_status.py
   Results saved to: /logs/delegation_check_20250813.log
   Evidence: 2 agents failed with 'Connection timeout'
   STATUS: Requires agent connectivity fixes before completion"
```

---

## ⚡ CROSS-LLM COORDINATION

### **Unified Violation Tracking:**
- **Claude Code violations** → Tracked in `claim_violations.json`
- **Gemini violations** → Tracked in `gemini_claim_violations.json`  
- **Cross-LLM violations** → Tracked in `cross_llm_violations.json`
- **Combined enforcement** → 3 violations from ANY LLM = system lockdown

### **Automatic Integration:**
```python
# Every Gemini CLI call now includes verification:
def gemini_with_verification(prompt):
    # 1. Add verification protocol to prompt
    # 2. Execute Gemini CLI
    # 3. Verify response against standards
    # 4. Block unverified claims
    # 5. Track violations across sessions
```

---

## 🛡️ USAGE EXAMPLES

### **Manual Verification:**
```bash
# Test Gemini response verification
python3 gemini_verification_bridge.py --verify-gemini \
  --response "95% delegation success rate validated" \
  --session current-session

# Expected: VIOLATION DETECTED - claim rejected
```

### **Integrated Workflow:**
```bash
# Use verified Gemini wrapper (recommended)
gemini_verified "Analyze agent performance and provide status update"

# Response automatically verified before display
# Unverified claims blocked with template provided
```

### **Check Cross-LLM Status:**
```bash
# View violation status across all LLMs
python3 gemini_verification_bridge.py --status

# Output shows:
# - Total violations across Claude + Gemini  
# - Which LLMs are locked down
# - Cross-session violation history
```

---

## 🎯 VERIFICATION STANDARDS

### **Healthcare Claims (Extra Strict):**
- Emergency response claims → Require stress test logs
- SLA guarantees → Require load test evidence  
- Patient safety statements → Require independent validation
- Reliability percentages → Require benchmark data

### **Orchestration Claims:**
- Agent coordination → Require status check commands
- Task delegation → Require completion verification
- Performance optimization → Require before/after metrics
- System integration → Require connectivity tests

### **Evidence Requirements:**
```
REQUIRED PATTERNS:
✅ "verified by running: [COMMAND]"
✅ "Results saved to: [LOG_FILE]" 
✅ "Independent verification: execute '[COMMAND]'"
✅ "Evidence file: [PATH_WITH_TIMESTAMP]"
✅ "Test execution log: [OUTPUT]"
```

---

## 🔧 ADVANCED CONFIGURATION

### **Custom MCP Server Setup:**
```json
{
  "mcpServers": {
    "verification-enforcer": {
      "command": "python3",
      "args": ["/path/to/gemini_verification_bridge.py"],
      "env": {
        "VERIFICATION_PROTOCOL": "ironclad",
        "CROSS_LLM_ENFORCEMENT": "true",
        "HEALTHCARE_STANDARD": "life_critical"
      }
    }
  }
}
```

### **Environment Variables:**
```bash
export GEMINI_VERIFICATION_ACTIVE=true
export CROSS_LLM_LOCKDOWN=true
export HEALTHCARE_CLAIMS_STRICT=true
export VIOLATION_PERSISTENCE=cross_session
```

---

## 🚨 ENFORCEMENT ACTIONS

### **Violation Progression:**
1. **1st Violation:** Claim rejected, template provided
2. **2nd Violation:** Warning with enforcement explanation  
3. **3rd Violation:** AUTOMATIC LOCKDOWN across all sessions

### **Cross-LLM Lockdown:**
- **Triggers:** 3 violations from Claude Code OR Gemini OR combination
- **Effect:** Both LLMs blocked from making claims
- **Unlock:** 5 consecutive verified claims from each LLM

### **Healthcare Override:**
- Healthcare claims have **ZERO TOLERANCE**
- Single unverified healthcare claim = immediate enhanced scrutiny
- Patient safety claims require multiple verification sources

---

## 📋 TESTING VERIFICATION

### **Test Gemini Integration:**
```bash
# 1. Test unverified claim detection
python3 gemini_verification_bridge.py --verify-gemini \
  --response "Orchestration complete and verified" \
  --session test

# Expected: VIOLATION DETECTED

# 2. Test verified claim acceptance  
python3 gemini_verification_bridge.py --verify-gemini \
  --response "Task status: 3/5 agents active - verified by running: check_agents.py" \
  --session test

# Expected: VERIFICATION PASSED
```

### **Test Cross-LLM Coordination:**
```bash
# Check if violations from Claude affect Gemini
python3 verify_agent_claims.py --agent claude-code \
  --text "Production ready" --session test

python3 gemini_verification_bridge.py --status
# Should show combined violation count
```

---

## 🎯 SUCCESS CRITERIA

**Protocol Working When:**
- ✅ Gemini cannot make unverified orchestration claims
- ✅ Cross-LLM violation tracking active
- ✅ Healthcare claims require stronger evidence
- ✅ Both LLMs follow identical verification standards
- ✅ Violations persist across sessions and LLMs

**Protocol Failed If:**
- ❌ Gemini makes "delegation successful" without proof
- ❌ Healthcare claims accepted without test logs
- ❌ Violations not tracked across Claude + Gemini
- ❌ Claims bypass verification through different LLM

---

## 🔐 PERMANENT ACTIVATION

This verification protocol is **PERMANENTLY ACTIVE** for:
- **Claude Code** (via verify_agent_claims.py)
- **Gemini CLI** (via gemini_verification_bridge.py)  
- **Future LLMs** (extensible framework)

**Cross-session persistence ensures no agent can circumvent verification by switching LLMs or sessions.**

---

*Healthcare operations demand verified truth from ALL AI systems*  
*Lives depend on accurate coordination across all LLM agents*  
*Trust requires proof, not promises - regardless of the AI source*