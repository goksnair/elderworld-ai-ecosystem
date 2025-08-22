#!/usr/bin/env python3
"""
IRONCLAD CLAIM VERIFICATION ENFORCER
Zero tolerance for unverified claims across all LLM agents
"""

import re
import json
import datetime
import os
import sys
from typing import Dict, List, Tuple, Optional

class ClaimVerificationEnforcer:
    """
    Enforces ironclad verification requirements for all agent claims
    NO EXCEPTIONS - Healthcare operations demand verified truth
    """
    
    def __init__(self):
        self.base_dir = "/Users/gokulnair/senior-care-startup/ai-ecosystem"
        self.violation_log = f"{self.base_dir}/shared-workspace/claim_violations.json"
        
        # Banned phrases that require verification
        self.banned_phrases = [
            r"95%\+?\s+reliability\s+validated",
            r"production\s+ready",
            r"healthcare-grade",
            r"emergency\s+sla\s+guaranteed", 
            r"concurrent\s+operations\s+validated",
            r"database\s+performance\s+excellent",
            r"system\s+working\s+perfectly",
            r"testing\s+completed\s+successfully",
            r"all\s+tests\s+passed",
            r"comprehensive\s+validation\s+complete",
            r"ready\s+for\s+deployment",
            r"validation\s+successful",
            r"performance\s+verified",
            r"stress\s+testing\s+passed"
        ]
        
        # Required evidence patterns
        self.required_evidence = [
            r"verified\s+by\s+running:",
            r"test\s+results\s+saved\s+to:",
            r"execute\s+this\s+command\s+to\s+confirm:",
            r"independent\s+validation\s+available\s+at:",
            r"reproduce\s+with:",
            r"evidence\s+file:",
            r"log\s+output:",
            r"benchmark\s+results:",
            r"stress\s+test\s+log:",
            r"actual\s+command\s+executed:",
            r"test\s+execution\s+log:"
        ]
        
        self.load_violation_history()
    
    def load_violation_history(self):
        """Load existing violation log for persistent tracking"""
        try:
            if os.path.exists(self.violation_log):
                with open(self.violation_log, 'r') as f:
                    self.violations = json.load(f)
            else:
                self.violations = {
                    "total_violations": 0,
                    "agents_on_lockdown": [],
                    "violation_history": [],
                    "protocol_version": "1.0",
                    "last_updated": datetime.datetime.now().isoformat()
                }
        except Exception as e:
            print(f"Error loading violation log: {e}")
            self.violations = {
                "total_violations": 0,
                "agents_on_lockdown": [],
                "violation_history": [],
                "protocol_version": "1.0",
                "last_updated": datetime.datetime.now().isoformat()
            }
    
    def save_violation_log(self):
        """Persist violation log across sessions"""
        try:
            os.makedirs(os.path.dirname(self.violation_log), exist_ok=True)
            self.violations["last_updated"] = datetime.datetime.now().isoformat()
            with open(self.violation_log, 'w') as f:
                json.dump(self.violations, f, indent=2)
        except Exception as e:
            print(f"Error saving violation log: {e}")
    
    def detect_unverified_claims(self, text: str, agent_id: str) -> Tuple[bool, List[str]]:
        """
        Detect unverified claims in agent output
        Returns: (has_violations, list_of_violations)
        """
        violations = []
        text_lower = text.lower()
        
        # Check for banned phrases without evidence
        for banned_pattern in self.banned_phrases:
            if re.search(banned_pattern, text_lower, re.IGNORECASE):
                # Check if this banned phrase has corresponding evidence
                has_evidence = any(re.search(evidence_pattern, text_lower, re.IGNORECASE) 
                                 for evidence_pattern in self.required_evidence)
                
                if not has_evidence:
                    violations.append(f"Unverified claim: '{banned_pattern}' without executable proof")
        
        # Special healthcare claim validation (EXTRA STRICT)
        healthcare_claims = [
            r"emergency\s+response.*\<\s*5\s*minute",
            r"99%.*compliance",
            r"zero.*corruption",
            r"100%.*success", 
            r"patient\s+safety",
            r"healthcare\s+compliance",
            r"medical\s+data\s+integrity",
            r"sla\s+compliance"
        ]
        
        for healthcare_pattern in healthcare_claims:
            if re.search(healthcare_pattern, text_lower, re.IGNORECASE):
                # Healthcare claims require EXTRA strong verification
                has_strong_evidence = any(
                    re.search(pattern, text_lower, re.IGNORECASE) 
                    for pattern in [
                        r"stress\s+test.*results",
                        r"load\s+test.*completed",
                        r"benchmark.*log",
                        r"\./.*\.sh.*verify",
                        r"python.*test.*\.py",
                        r"actual\s+execution\s+log",
                        r"independent\s+validation\s+command"
                    ]
                )
                
                if not has_strong_evidence:
                    violations.append(f"HEALTHCARE CLAIM requires stronger verification: '{healthcare_pattern}'")
        
        # Check for percentage claims without evidence
        percentage_claims = re.findall(r'\d+%.*(?:success|reliability|compliance|accuracy)', text_lower)
        for percentage_claim in percentage_claims:
            has_evidence = any(re.search(evidence_pattern, text_lower, re.IGNORECASE) 
                             for evidence_pattern in self.required_evidence)
            if not has_evidence:
                violations.append(f"Percentage claim without verification: '{percentage_claim}'")
        
        return len(violations) > 0, violations
    
    def enforce_verification(self, text: str, agent_id: str, session_id: str) -> Dict:
        """
        Main enforcement function - call this on every agent output
        Returns enforcement decision and actions
        """
        has_violations, violation_list = self.detect_unverified_claims(text, agent_id)
        
        if has_violations:
            # Record violation
            violation_record = {
                "timestamp": datetime.datetime.now().isoformat(),
                "agent_id": agent_id,
                "session_id": session_id,
                "violations": violation_list,
                "text_sample": text[:500] + "..." if len(text) > 500 else text,
                "severity": "CRITICAL" if any("HEALTHCARE" in v for v in violation_list) else "HIGH"
            }
            
            self.violations["violation_history"].append(violation_record)
            self.violations["total_violations"] += len(violation_list)
            
            # Check if agent should be locked down
            agent_violation_count = sum(
                len(v["violations"]) for v in self.violations["violation_history"] 
                if v["agent_id"] == agent_id
            )
            
            if agent_violation_count >= 3 and agent_id not in self.violations["agents_on_lockdown"]:
                self.violations["agents_on_lockdown"].append(agent_id)
                self.save_violation_log()
                
                return {
                    "action": "LOCKDOWN",
                    "message": f"🚨 AGENT LOCKDOWN: {agent_id} violated verification protocol {agent_violation_count} times",
                    "violations": violation_list,
                    "lockdown_reason": "Repeated unverified claims in healthcare context",
                    "unlock_requirement": "5 consecutive properly verified claims"
                }
            
            self.save_violation_log()
            
            return {
                "action": "REJECT",
                "message": f"❌ CLAIM REJECTED: Unverified statements detected in {agent_id}",
                "violations": violation_list,
                "required_action": "Provide executable verification commands for all claims",
                "violation_count": agent_violation_count
            }
        
        return {
            "action": "ACCEPT",
            "message": f"✅ Claims properly verified for {agent_id}",
            "violations": []
        }
    
    def check_agent_lockdown_status(self, agent_id: str) -> bool:
        """Check if agent is currently locked down"""
        return agent_id in self.violations["agents_on_lockdown"]
    
    def generate_verification_template(self, claim: str) -> str:
        """Generate template for proper claim verification"""
        return f"""
PROPER VERIFICATION FORMAT FOR: "{claim}"

❌ UNACCEPTABLE:
"{claim}" 

✅ ACCEPTABLE:
"{claim} - verified by running: [EXACT COMMAND]
Results saved to: [LOG FILE PATH] 
Independent verification: execute '[COMMAND]' to reproduce
Evidence file: [FILE PATH WITH TIMESTAMP]
Test execution log: [LOG OUTPUT]"

HEALTHCARE EXAMPLE:
"Emergency response: 60% success rate (3/5 scenarios) - verified by running: ./emergency_stress_test.sh
Results saved to: /logs/emergency_test_20250813_1100.log
CRITICAL: Below 99% healthcare requirement 
Evidence: 2 scenarios failed with 'Resource unavailable'
Independent verification: execute './emergency_stress_test.sh' to reproduce
STATUS: NOT READY for patient safety deployment"
"""
    
    def generate_violation_report(self) -> str:
        """Generate comprehensive violation report"""
        total_violations = self.violations["total_violations"]
        locked_agents = self.violations["agents_on_lockdown"]
        recent_violations = self.violations["violation_history"][-5:] if self.violations["violation_history"] else []
        
        report = f"""
🚨 VERIFICATION PROTOCOL VIOLATION REPORT
========================================

TOTAL VIOLATIONS: {total_violations}
AGENTS ON LOCKDOWN: {len(locked_agents)}
LOCKED AGENTS: {', '.join(locked_agents) if locked_agents else 'None'}

RECENT VIOLATIONS:
"""
        
        for violation in recent_violations:
            report += f"""
Agent: {violation['agent_id']}
Time: {violation['timestamp']}
Severity: {violation['severity']}
Violations: {violation['violations']}
---"""
        
        return report

def verify_agent_output(text: str, agent_id: str, session_id: str) -> Dict:
    """
    MAIN VERIFICATION FUNCTION
    Call this on EVERY agent output before accepting any claims
    """
    enforcer = ClaimVerificationEnforcer()
    
    # Check if agent is locked down
    if enforcer.check_agent_lockdown_status(agent_id):
        return {
            "action": "LOCKDOWN",
            "message": f"🔒 AGENT LOCKED DOWN: {agent_id} cannot make claims until verification protocol compliance restored",
            "unlock_requirement": "Demonstrate 5 consecutive properly verified claims"
        }
    
    # Enforce verification
    result = enforcer.enforce_verification(text, agent_id, session_id)
    
    if result["action"] == "REJECT":
        result["template"] = enforcer.generate_verification_template("Your claim here")
    
    return result

def main():
    """CLI interface for verification enforcement"""
    if len(sys.argv) < 4:
        print("Usage: python3 verify_agent_claims.py --agent [AGENT_ID] --text '[TEXT]' --session [SESSION_ID]")
        print("       python3 verify_agent_claims.py --report")
        return
    
    if "--report" in sys.argv:
        enforcer = ClaimVerificationEnforcer()
        print(enforcer.generate_violation_report())
        return
    
    # Parse arguments
    try:
        agent_idx = sys.argv.index("--agent") + 1
        text_idx = sys.argv.index("--text") + 1
        session_idx = sys.argv.index("--session") + 1
        
        agent_id = sys.argv[agent_idx]
        text = sys.argv[text_idx]
        session_id = sys.argv[session_idx]
        
        result = verify_agent_output(text, agent_id, session_id)
        
        print(f"VERIFICATION RESULT: {result['action']}")
        print(f"MESSAGE: {result['message']}")
        
        if result.get("violations"):
            print(f"VIOLATIONS: {result['violations']}")
        
        if result.get("template"):
            print(f"TEMPLATE: {result['template']}")
            
    except (ValueError, IndexError):
        print("Error: Invalid arguments")
        print("Usage: python3 verify_agent_claims.py --agent [AGENT_ID] --text '[TEXT]' --session [SESSION_ID]")

if __name__ == "__main__":
    main()