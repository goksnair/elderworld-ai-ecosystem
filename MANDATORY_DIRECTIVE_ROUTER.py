#!/usr/bin/env python3
"""
MANDATORY DIRECTIVE ROUTING SYSTEM
Enforces automatic strategic filtering for ALL user directives

This system must be called before any directive implementation to ensure
proper strategic analysis and prevent protocol violations.
"""

import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

class MandatoryDirectiveRouter:
    """
    Mandatory routing system that enforces strategic directive filtering
    """
    
    def __init__(self):
        self.project_root = Path("/Users/gokulnair/senior-care-startup/ai-ecosystem")
        self.strategic_filter_path = self.project_root / "ai-models" / "strategic_directive_filter.py"
        self.violation_log = self.project_root / "shared-workspace" / "directive_routing_violations.json"
        
    def route_directive(self, user_directive: str, agent_id: str = "claude-code") -> dict:
        """
        Mandatory routing of user directive through strategic analysis
        
        Args:
            user_directive: The complete user directive/request
            agent_id: ID of the agent processing the directive
            
        Returns:
            dict: Routing decision and required action
        """
        print("🛡️ MANDATORY DIRECTIVE ROUTING PROTOCOL ACTIVE")
        print("=" * 60)
        
        # Step 1: Check if directive requires strategic filtering
        requires_filtering, complexity_score, business_domains = self._analyze_directive(user_directive)
        
        if not requires_filtering:
            return {
                "action": "PROCEED_DIRECT",
                "complexity_score": complexity_score,
                "business_domains": business_domains,
                "message": "Directive classified as simple - proceed with direct implementation"
            }
        
        # Step 2: Strategic directive detected - mandatory routing
        print(f"🚨 STRATEGIC DIRECTIVE DETECTED")
        print(f"Complexity Score: {complexity_score}")
        print(f"Business Domains: {', '.join(business_domains)}")
        print(f"Action: MANDATORY STRATEGIC ANALYSIS")
        
        # Step 3: Route to senior-care-boss for strategic analysis
        strategic_analysis = self._delegate_strategic_analysis(user_directive, complexity_score, business_domains)
        
        return {
            "action": "STRATEGIC_ANALYSIS_REQUIRED", 
            "complexity_score": complexity_score,
            "business_domains": business_domains,
            "strategic_analysis": strategic_analysis,
            "message": f"Strategic directive routed to senior-care-boss for framework analysis"
        }
    
    def _analyze_directive(self, user_directive: str) -> tuple:
        """
        Analyze directive using the strategic filter
        
        Returns:
            tuple: (requires_filtering, complexity_score, business_domains)
        """
        try:
            # Import and use the strategic filter directly
            sys.path.append(str(self.project_root / "ai-models"))
            from strategic_directive_filter import StrategicDirectiveFilter
            
            filter_system = StrategicDirectiveFilter()
            requires_filtering, chief_of_staff_prompt, strategic_context = filter_system.process_directive(user_directive)
            
            complexity_score = strategic_context.get('complexity_score', 0.0)
            business_domains = strategic_context.get('business_domains', [])
            
            return requires_filtering, complexity_score, business_domains
                
        except Exception as e:
            print(f"⚠️ Strategic filter error: {e}")
            # Default to requiring strategic analysis
            return True, 10.0, ["system_failure"]
    
    def _delegate_strategic_analysis(self, directive: str, complexity_score: float, domains: list) -> str:
        """
        Delegate strategic analysis to senior-care-boss agent
        
        Returns:
            str: Strategic analysis result
        """
        try:
            # Use the working Multi-LLM coordination system to delegate
            task_id = f"STRATEGIC-ANALYSIS-{int(datetime.now().timestamp())}"
            
            # Create strategic analysis task file
            task_content = f"""# STRATEGIC DIRECTIVE ANALYSIS TASK

**Priority:** CRITICAL  
**Complexity Score:** {complexity_score}
**Business Domains:** {', '.join(domains)}
**Directive Classification:** Strategic coordination required

## USER DIRECTIVE TO ANALYZE:
{directive}

## REQUIRED STRATEGIC FRAMEWORK ANALYSIS:

1. **BUSINESS IMPACT ASSESSMENT:**
   - Resource allocation implications
   - Timeline impact on Phase 1 deliverables
   - Competitive positioning effects

2. **CROSS-FUNCTIONAL COORDINATION:**
   - Agent ecosystem integration requirements
   - System dependency analysis
   - Risk assessment and mitigation

3. **EXECUTIVE DECISION FRAMEWORK:**
   - Strategic alternatives evaluation
   - COORDINATE → PRIORITIZE → BALANCE → DELEGATE → RESPOND
   - Budget and resource optimization

## SUCCESS CRITERIA:
- Clear strategic recommendation with rationale
- Implementation approach with risk mitigation
- Resource allocation plan
- Timeline and priority assessment

## DELIVERABLE:
Strategic analysis with executive recommendation on optimal approach.
"""

            task_file = self.project_root / "shared-workspace" / f"strategic-analysis-{task_id}.md"
            with open(task_file, 'w') as f:
                f.write(task_content)
            
            print(f"📋 Strategic analysis task created: {task_file}")
            print("🔄 Routing to senior-care-boss for framework analysis...")
            
            # Use the Multi-LLM system to delegate (this would normally be automated)
            return f"Strategic analysis delegated to senior-care-boss agent. Task ID: {task_id}"
            
        except Exception as e:
            print(f"❌ Strategic delegation failed: {e}")
            return f"ESCALATION REQUIRED: Strategic analysis delegation failed - {e}"
    
    def log_violation(self, directive: str, agent_id: str, violation_type: str):
        """
        Log protocol violations for monitoring and prevention
        """
        violation = {
            "timestamp": datetime.now().isoformat(),
            "directive": directive[:200] + "..." if len(directive) > 200 else directive,
            "agent_id": agent_id,
            "violation_type": violation_type,
            "session_id": f"session-{int(datetime.now().timestamp())}"
        }
        
        violations = []
        if self.violation_log.exists():
            try:
                with open(self.violation_log, 'r') as f:
                    violations = json.load(f)
            except:
                violations = []
        
        violations.append(violation)
        
        with open(self.violation_log, 'w') as f:
            json.dump(violations, f, indent=2)
        
        print(f"⚠️ PROTOCOL VIOLATION LOGGED: {violation_type}")


def mandatory_directive_check(user_directive: str, agent_id: str = "claude-code"):
    """
    Mandatory function that must be called before processing any user directive
    
    Args:
        user_directive: Complete user directive/request
        agent_id: ID of the processing agent
        
    Returns:
        dict: Routing decision and required actions
    """
    router = MandatoryDirectiveRouter()
    return router.route_directive(user_directive, agent_id)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 MANDATORY_DIRECTIVE_ROUTER.py '<directive>' [agent_id]")
        sys.exit(1)
    
    directive = sys.argv[1]
    agent_id = sys.argv[2] if len(sys.argv) > 2 else "claude-code"
    
    result = mandatory_directive_check(directive, agent_id)
    print("\n🎯 ROUTING RESULT:")
    print("=" * 30)
    for key, value in result.items():
        print(f"{key}: {value}")