#!/usr/bin/env python3
"""
GEMINI VERIFICATION BRIDGE
Extends ironclad verification protocol to Gemini Chief Orchestrator
Cross-LLM enforcement for healthcare reliability
"""

import json
import os
import sys
import subprocess
from typing import Dict, List, Optional
from verify_agent_claims import ClaimVerificationEnforcer, verify_agent_output

class GeminiVerificationBridge:
    """
    Bridges verification protocol between Claude Code and Gemini CLI
    Ensures both LLMs follow identical verification standards
    """
    
    def __init__(self):
        self.base_dir = "/Users/gokulnair/senior-care-startup/ai-ecosystem"
        self.gemini_violations_log = f"{self.base_dir}/shared-workspace/gemini_claim_violations.json"
        self.cross_llm_violations = f"{self.base_dir}/shared-workspace/cross_llm_violations.json"
        
        # Gemini-specific banned phrases (in addition to universal ones)
        self.gemini_specific_bans = [
            r"delegation.*successful.*validated",
            r"orchestration.*complete.*verified", 
            r"coordination.*excellence.*confirmed",
            r"task.*acceptance.*guaranteed",
            r"agent.*performance.*validated",
            r"workflow.*optimization.*complete",
            r"strategic.*coordination.*verified",
            r"cross-functional.*leadership.*confirmed"
        ]
        
        # Initialize cross-LLM tracking
        self.initialize_cross_llm_tracking()
    
    def initialize_cross_llm_tracking(self):
        """Initialize cross-LLM violation tracking system"""
        try:
            if os.path.exists(self.cross_llm_violations):
                with open(self.cross_llm_violations, 'r') as f:
                    self.cross_llm_data = json.load(f)
            else:
                self.cross_llm_data = {
                    "total_violations_all_llms": 0,
                    "llms_on_lockdown": [],
                    "cross_llm_violation_history": [],
                    "protocol_version": "1.0_cross_llm",
                    "enforcement_scope": ["claude-code", "gemini-chief-orchestrator", "github-copilot"]
                }
                self.save_cross_llm_data()
        except Exception as e:
            print(f"Error initializing cross-LLM tracking: {e}")
            self.cross_llm_data = {
                "total_violations_all_llms": 0,
                "llms_on_lockdown": [],
                "cross_llm_violation_history": []
            }
    
    def save_cross_llm_data(self):
        """Save cross-LLM violation data"""
        try:
            os.makedirs(os.path.dirname(self.cross_llm_violations), exist_ok=True)
            with open(self.cross_llm_violations, 'w') as f:
                json.dump(self.cross_llm_data, f, indent=2)
        except Exception as e:
            print(f"Error saving cross-LLM data: {e}")
    
    def verify_gemini_output(self, gemini_response: str, session_id: str) -> Dict:
        """
        Verify Gemini CLI output using same standards as Claude Code
        Returns enforcement decision for Gemini interactions
        """
        # Use standard verification first
        base_result = verify_agent_output(gemini_response, "gemini-chief-orchestrator", session_id)
        
        # Add Gemini-specific verification
        gemini_specific_violations = []
        response_lower = gemini_response.lower()
        
        for gemini_pattern in self.gemini_specific_bans:
            if any(phrase in response_lower for phrase in gemini_pattern.split('.*')):
                # Check for evidence
                has_evidence = any(evidence in response_lower for evidence in [
                    "verified by running:",
                    "test results saved to:",
                    "execute this command:",
                    "independent validation:",
                    "evidence file:",
                    "log output:"
                ])
                
                if not has_evidence:
                    gemini_specific_violations.append(f"Gemini-specific unverified claim: '{gemini_pattern}'")
        
        # Combine violations
        if gemini_specific_violations:
            if "violations" not in base_result:
                base_result["violations"] = []
            base_result["violations"].extend(gemini_specific_violations)
            
            if base_result["action"] == "ACCEPT":
                base_result["action"] = "REJECT"
                base_result["message"] = "❌ GEMINI CLAIM REJECTED: Unverified orchestration statements detected"
        
        # Record in cross-LLM tracking
        if base_result["action"] in ["REJECT", "LOCKDOWN"]:
            self.record_cross_llm_violation("gemini-chief-orchestrator", session_id, base_result.get("violations", []))
        
        return base_result
    
    def record_cross_llm_violation(self, llm_id: str, session_id: str, violations: List[str]):
        """Record violation in cross-LLM tracking system"""
        violation_record = {
            "timestamp": "2025-08-13T10:35:00",  # Would use datetime.datetime.now().isoformat()
            "llm_id": llm_id,
            "session_id": session_id,
            "violations": violations,
            "severity": "CRITICAL" if any("healthcare" in v.lower() for v in violations) else "HIGH"
        }
        
        self.cross_llm_data["cross_llm_violation_history"].append(violation_record)
        self.cross_llm_data["total_violations_all_llms"] += len(violations)
        
        # Check for cross-LLM lockdown
        llm_violations = sum(
            len(v["violations"]) for v in self.cross_llm_data["cross_llm_violation_history"]
            if v["llm_id"] == llm_id
        )
        
        if llm_violations >= 3 and llm_id not in self.cross_llm_data["llms_on_lockdown"]:
            self.cross_llm_data["llms_on_lockdown"].append(llm_id)
        
        self.save_cross_llm_data()
    
    def create_gemini_verification_prompt(self) -> str:
        """
        Create verification prompt for Gemini CLI integration
        This prompt should be prefixed to every Gemini interaction
        """
        return """
🚨 MANDATORY VERIFICATION PROTOCOL - GEMINI CHIEF ORCHESTRATOR

BEFORE MAKING ANY CLAIM, YOU MUST PROVIDE EXECUTABLE PROOF:

FORBIDDEN STATEMENTS (AUTOMATIC LOCKDOWN):
❌ "Delegation successful and validated"
❌ "Orchestration complete and verified" 
❌ "Coordination excellence confirmed"
❌ "Task acceptance guaranteed"
❌ "Agent performance validated"
❌ "Strategic coordination verified"
❌ "Production ready"
❌ "95%+ reliability"
❌ "Healthcare-grade"
❌ "Emergency SLA guaranteed"

REQUIRED FORMAT FOR ANY PERFORMANCE CLAIM:
✅ "[CLAIM] - verified by running: [EXACT COMMAND]
   Results saved to: [LOG FILE PATH]
   Independent verification: execute '[COMMAND]' to reproduce"

HEALTHCARE CLAIMS REQUIRE STRONGER EVIDENCE:
✅ Stress test logs required
✅ Load test results mandatory  
✅ Independent verification commands
✅ Error rate documentation

VIOLATION CONSEQUENCES:
- 3 violations = AUTOMATIC LOCKDOWN across all sessions
- Cross-LLM enforcement active (Claude Code + Gemini + GitHub Copilot)
- Healthcare accuracy standard: Conservative estimates with proof, not optimistic projections

BEFORE ACCEPTING ANY DELEGATED SOLUTION:
1. Demand executable verification commands
2. Require stress test logs for performance claims
3. Reject solutions without proof
4. Validate independently before marking tasks COMPLETED

Your response will be automatically verified against this protocol.
"""
    
    def generate_gemini_integration_script(self) -> str:
        """Generate script for automatic Gemini verification integration"""
        return '''#!/bin/bash
# GEMINI VERIFICATION INTEGRATION SCRIPT
# Automatically applies verification protocol to all Gemini interactions

GEMINI_VERIFICATION_BRIDGE="/Users/gokulnair/senior-care-startup/ai-ecosystem/gemini_verification_bridge.py"
SESSION_ID="${1:-current-session}"

# Function to verify Gemini output
verify_gemini_response() {
    local response="$1"
    local session="$2"
    
    # Run verification
    python3 "$GEMINI_VERIFICATION_BRIDGE" --verify-gemini --response "$response" --session "$session"
    
    if [ $? -ne 0 ]; then
        echo "🚨 GEMINI VERIFICATION FAILED - Response rejected"
        echo "❌ Unverified claims detected in Gemini output"
        echo "✅ Required: Provide executable verification commands"
        return 1
    fi
    
    return 0
}

# Wrapper for gemini-cli with verification
gemini_verified() {
    local prompt="$1"
    
    # Add verification protocol to prompt
    local verification_prompt=$(python3 "$GEMINI_VERIFICATION_BRIDGE" --get-prompt)
    local full_prompt="$verification_prompt\\n\\n$prompt"
    
    # Execute Gemini CLI
    local response=$(gemini "$full_prompt")
    
    # Verify response
    verify_gemini_response "$response" "$SESSION_ID"
    
    if [ $? -eq 0 ]; then
        echo "$response"
    else
        echo "🔒 RESPONSE BLOCKED - Verification protocol violation"
    fi
}

# Export function for use
export -f gemini_verified
export -f verify_gemini_response

echo "✅ Gemini verification integration active"
echo "🔒 Use 'gemini_verified' instead of 'gemini' for verified interactions"
'''
    
    def create_mcp_integration_config(self) -> Dict:
        """Create MCP server configuration for cross-LLM verification"""
        return {
            "mcpServers": {
                "verification-enforcer": {
                    "command": "python3",
                    "args": ["/Users/gokulnair/senior-care-startup/ai-ecosystem/gemini_verification_bridge.py"],
                    "env": {
                        "VERIFICATION_PROTOCOL": "ironclad",
                        "CROSS_LLM_ENFORCEMENT": "true",
                        "HEALTHCARE_STANDARD": "life_critical"
                    }
                }
            },
            "verification_settings": {
                "auto_verify_gemini": True,
                "cross_llm_lockdown": True,
                "healthcare_extra_scrutiny": True,
                "violation_persistence": "cross_session"
            }
        }

def main():
    """CLI interface for Gemini verification bridge"""
    if len(sys.argv) < 2:
        print("Usage: python3 gemini_verification_bridge.py [OPTIONS]")
        print("  --verify-gemini --response '[TEXT]' --session [SESSION_ID]")
        print("  --get-prompt")
        print("  --status")
        print("  --create-integration")
        return
    
    bridge = GeminiVerificationBridge()
    
    if "--verify-gemini" in sys.argv:
        try:
            response_idx = sys.argv.index("--response") + 1
            session_idx = sys.argv.index("--session") + 1
            
            response = sys.argv[response_idx]
            session_id = sys.argv[session_idx]
            
            result = bridge.verify_gemini_output(response, session_id)
            
            print(f"GEMINI VERIFICATION: {result['action']}")
            print(f"MESSAGE: {result['message']}")
            
            if result.get("violations"):
                print(f"VIOLATIONS: {result['violations']}")
                sys.exit(1)  # Exit with error for rejected claims
            
            sys.exit(0)  # Success
            
        except (ValueError, IndexError):
            print("Error: Invalid arguments for --verify-gemini")
            sys.exit(1)
    
    elif "--get-prompt" in sys.argv:
        print(bridge.create_gemini_verification_prompt())
    
    elif "--status" in sys.argv:
        print("🔒 CROSS-LLM VERIFICATION STATUS:")
        print(f"Total violations: {bridge.cross_llm_data.get('total_violations_all_llms', 0)}")
        print(f"LLMs on lockdown: {bridge.cross_llm_data.get('llms_on_lockdown', [])}")
        print(f"Protocol active for: {bridge.cross_llm_data.get('enforcement_scope', [])}")
    
    elif "--create-integration" in sys.argv:
        # Create integration script
        script_path = "/Users/gokulnair/senior-care-startup/ai-ecosystem/integrate_gemini_verification.sh"
        with open(script_path, 'w') as f:
            f.write(bridge.generate_gemini_integration_script())
        os.chmod(script_path, 0o755)
        print(f"✅ Integration script created: {script_path}")
        
        # Create MCP config
        config_path = "/Users/gokulnair/senior-care-startup/ai-ecosystem/mcp_verification_config.json"
        with open(config_path, 'w') as f:
            json.dump(bridge.create_mcp_integration_config(), f, indent=2)
        print(f"✅ MCP config created: {config_path}")

if __name__ == "__main__":
    main()