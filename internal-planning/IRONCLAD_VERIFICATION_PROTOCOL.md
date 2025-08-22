#!/usr/bin/env python3
"""
IRONCLAD CLAIM VERIFICATION ENFORCER
Zero tolerance for unverified claims across all LLM agents
"""

import re
import json
import datetime
import os
from typing import Dict, List, Tuple, Optional

class ClaimVerificationEnforcer:
    """
    Enforces ironclad verification requirements for all agent claims
    NO EXCEPTIONS - Healthcare operations demand verified truth
    """
    
    def __init__(self):
        self.violation_log = "/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/claim_violations.json"
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
            r"comprehensive\s+validation\s+complete"
        ]
        
        self.required_evidence = [
            r"verified\s+by\s+running:",
            r"test\s+results\s+saved\s+to:",
            r"execute\s+this\s+command\s+to\s+confirm:",
            r"independent\s+validation\s+available\s+at:",
            r"reproduce\s+with:",
            r"evidence\s+file:",
            r"log\s+output:",
            r"benchmark\s+results:"
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
                    "violation_history": []
                }
        except:
            self.violations = {
                "total_violations": 0,
                "agents_on_lockdown": [],
                "violation_history": []
            }
    
    def save_violation_log(self):
        """Persist violation log across sessions"""
        os.makedirs(os.path.dirname(self.violation_log), exist_ok=True)
        with open(self.violation_log, 'w') as f:
            json.dump(self.violations, f, indent=2)
    
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
                    violations.append(f"Unverified claim detected: '{banned_pattern}' without executable proof")
        
        # Special healthcare claim validation
        healthcare_claims = [
            r"emergency\s+response.*\<\s*5\s*minute",
            r"99%.*compliance",
            r"zero.*corruption",
            r"100%.*success",
            r"production.*deployment.*ready"
        ]
        
        for healthcare_pattern in healthcare_claims:
            if re.search(healthcare_pattern, text_lower, re.IGNORECASE):
                # Healthcare claims require EXTRA verification
                has_strong_evidence = any(
                    re.search(pattern, text_lower, re.IGNORECASE) 
                    for pattern in [
                        r"stress\s+test.*results",
                        r"load\s+test.*completed",
                        r"benchmark.*log",
                        r"\./.*\.sh.*verify",
                        r"python.*test.*\.py"
                    ]
                )
                
                if not has_strong_evidence:
                    violations.append(f"Healthcare claim requires stronger verification: '{healthcare_pattern}'")
        
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
                "severity": "CRITICAL" if any("healthcare" in v.lower() for v in violation_list) else "HIGH"
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
                    "lockdown_reason": "Repeated unverified claims in healthcare context"
                }
            
            self.save_violation_log()
            
            return {
                "action": "REJECT",
                "message": f"❌ CLAIM REJECTED: Unverified statements detected",
                "violations": violation_list,
                "required_action": "Provide executable verification commands for all claims"
            }
        
        return {
            "action": "ACCEPT",
            "message": "✅ Claims properly verified",
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
Evidence file: [FILE PATH WITH TIMESTAMP]"

EXAMPLE:
"Database performance: 95% success rate - verified by running: ./stress_test.sh --database --concurrent 50
Results saved to: stress_test_results_20250813_1045.log
Independent verification: execute './stress_test.sh --database --concurrent 50' to reproduce
Evidence file: /logs/database_stress_20250813_1045.log"
"""

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

if __name__ == "__main__":
    # Test the enforcer
    test_cases = [
        ("95% reliability validated through comprehensive testing", "claude-code", "test-session"),
        ("Production ready for healthcare deployment", "claude-code", "test-session"),
        ("Database performance: 95% success rate - verified by running: ./stress_test.sh --concurrent 50\nResults saved to: test_results_20250813.log", "claude-code", "test-session")
    ]
    
    for text, agent, session in test_cases:
        result = verify_agent_output(text, agent, session)
        print(f"Text: {text[:50]}...")
        print(f"Result: {result['action']} - {result['message']}")
        print("-" * 50)