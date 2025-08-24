#!/usr/bin/env python3
"""
AUTOMATIC STRATEGIC DIRECTIVE FILTERING SYSTEM
Implements transparent strategic analysis for all user directives

This system automatically detects strategic directives and routes them through
the Chief of Staff Agent for proper analysis and three-tier task categorization.
"""

import re
import time
import json
from typing import Dict, List, Tuple, Optional
from datetime import datetime

class StrategicDirectiveFilter:
    """
    Automatic strategic filtering system that intercepts user directives
    and routes them through proper strategic analysis channels.
    """
    
    def __init__(self):
        """Initialize the strategic filtering system"""
        self.strategic_patterns = [
            # Session startup triggers (HIGHEST PRIORITY)
            r'^(begin session|start session|continue session|new session|resume session)$',
            r'^(start work|begin work|start day|new day)$',
            r'^(initialize|startup|boot|activate)$',
            
            # Multi-step operations
            r'operational sequence|priority|strategic',
            r'coordination|alignment|phase-based',
            r'multi-step|breakdown|sequence',
            
            # Business operations
            r'business.*(operations|healthcare systems)',
            r'competitive.*(positioning|response)',
            r'market.*(research|analysis)',
            r'revenue.*(scale|milestone)',
            
            # System architecture
            r'protocol.*(failure|repair|fix)',
            r'task categorization|priority ranking',
            r'autonomous|synchronous|multi.*agent',
            r'integration.*(testing|system)',
            
            # Healthcare operations
            r'emergency response|healthcare.*grade',
            r'patient.*(safety|care)',
            r'HIPAA|compliance',
            
            # Implementation requests
            r'implement|create|develop|build',
            r'analyze|optimize|design',
            r'dashboard|mvp|system',
            
            # Agent coordination
            r'(claude|gemini|jules).*(agent|task|delegation)',
            r'chief.*staff|orchestrator',
            r'multi.*llm|agent.*system'
        ]
        
        self.filtering_history = []
        
    def detect_strategic_directive(self, user_input: str) -> bool:
        """
        Detect if user input requires strategic analysis
        
        Args:
            user_input: Raw user directive text
            
        Returns:
            bool: True if strategic filtering required, False otherwise
        """
        user_input_lower = user_input.lower().strip()
        
        # Check for strategic patterns
        for pattern in self.strategic_patterns:
            if re.search(pattern, user_input_lower, re.IGNORECASE):
                return True
        
        # Check for complexity indicators
        complexity_indicators = [
            len(user_input.split()) > 20,  # Long directives likely complex
            user_input.count('and') > 2,   # Multiple conjunctions indicate multi-part
            user_input.count(',') > 3,     # Multiple clauses
            bool(re.search(r'\d+\.\s', user_input)),  # Numbered lists
            bool(re.search(r'first|second|third|then|next|after', user_input, re.IGNORECASE))
        ]
        
        return sum(complexity_indicators) >= 2
    
    def is_session_startup_trigger(self, user_input: str) -> bool:
        """
        Check if user input is a session startup trigger command
        
        Args:
            user_input: Raw user input
            
        Returns:
            bool: True if this is a session startup trigger
        """
        user_input_clean = user_input.lower().strip()
        
        startup_triggers = [
            r'^(begin session|start session|continue session|new session|resume session)$',
            r'^(start work|begin work|start day|new day)$', 
            r'^(initialize|startup|boot|activate)$'
        ]
        
        for trigger in startup_triggers:
            if re.match(trigger, user_input_clean):
                return True
                
        return False
    
    def create_strategic_context(self, user_input: str) -> Dict:
        """
        Create strategic context for Chief of Staff analysis
        
        Args:
            user_input: Raw user directive
            
        Returns:
            Dict: Strategic context for analysis
        """
        context = {
            'timestamp': datetime.now().isoformat(),
            'raw_directive': user_input,
            'detected_patterns': [],
            'complexity_score': 0,
            'business_domains': [],
            'agent_types_involved': [],
            'estimated_priority': 'MEDIUM'
        }
        
        # Analyze detected patterns
        for pattern in self.strategic_patterns:
            if re.search(pattern, user_input.lower(), re.IGNORECASE):
                context['detected_patterns'].append(pattern)
        
        # Classify business domains
        domain_patterns = {
            'healthcare': r'healthcare|patient|emergency|medical|hipaa',
            'business_operations': r'business|revenue|market|competitive',
            'technical_infrastructure': r'system|database|integration|protocol',
            'product_development': r'dashboard|mvp|app|component|ui',
            'agent_coordination': r'agent|claude|gemini|jules|coordination'
        }
        
        for domain, pattern in domain_patterns.items():
            if re.search(pattern, user_input.lower(), re.IGNORECASE):
                context['business_domains'].append(domain)
        
        # Calculate complexity score
        complexity_factors = [
            len(user_input.split()) / 10,  # Word count factor
            len(context['detected_patterns']) * 2,  # Pattern matches
            len(context['business_domains']) * 1.5,  # Domain complexity
            user_input.count('and') + user_input.count('or'),  # Logical operators
        ]
        
        context['complexity_score'] = sum(complexity_factors)
        
        # Estimate priority
        if any(p in user_input.lower() for p in ['emergency', 'critical', 'urgent', 'immediate']):
            context['estimated_priority'] = 'HIGH'
        elif context['complexity_score'] > 8:
            context['estimated_priority'] = 'HIGH'
        elif context['complexity_score'] < 3:
            context['estimated_priority'] = 'LOW'
        
        return context
    
    def format_chief_of_staff_prompt(self, strategic_context: Dict) -> str:
        """
        Format strategic context into Chief of Staff analysis prompt
        
        Args:
            strategic_context: Analysis context from create_strategic_context
            
        Returns:
            str: Formatted prompt for Chief of Staff Agent
        """
        prompt = f"""STRATEGIC DIRECTIVE ANALYSIS REQUIRED

USER'S DIRECTIVE:
{strategic_context['raw_directive']}

STRATEGIC CONTEXT ANALYSIS:
- Detected Patterns: {', '.join(strategic_context['detected_patterns'])}
- Business Domains: {', '.join(strategic_context['business_domains'])}
- Complexity Score: {strategic_context['complexity_score']:.1f}
- Estimated Priority: {strategic_context['estimated_priority']}

REQUIRED STRATEGIC ANALYSIS:

1. **BUSINESS IMPACT ASSESSMENT**
   - How does this directive align with revenue scale milestones?
   - What competitive positioning implications exist?
   - What healthcare compliance considerations apply?

2. **THREE-TIER TASK CATEGORIZATION**
   - **CLAUDE AGENTS**: Which tasks require internal specialized implementation?
   - **GEMINI CLI TASKS**: Which require terminal-based external execution?
   - **JULES AGENT TASKS**: Which need autonomous coding delegation?

3. **IMPLEMENTATION ROADMAP**
   - Priority ranking with business impact rationale
   - Dependencies and sequencing logic
   - Success metrics and verification methods
   - Timeline recommendations with milestone checkpoints

4. **DECISION PRINCIPLES APPLICATION**
   - Healthcare-first: Patient safety and family wellbeing considerations
   - Growth-oriented: Revenue advancement and competitive advantage
   - Transparency: Clear rationale and measurable outcomes
   - Efficiency: Optimal resource utilization while maintaining quality

DELIVERABLE STRUCTURE:
- Executive strategic assessment
- Structured TODO breakdown with priority ranking
- Implementation approach with three-tier categorization
- Success criteria and verification methods

Analyze this directive through the strategic lens and provide comprehensive implementation guidance."""
        
        return prompt
    
    def log_filtering_decision(self, user_input: str, strategic_context: Dict, decision: str):
        """
        Log filtering decision for audit and improvement
        
        Args:
            user_input: Original user input
            strategic_context: Strategic analysis context
            decision: Filtering decision made
        """
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'user_input_length': len(user_input),
            'strategic_patterns_detected': len(strategic_context['detected_patterns']),
            'business_domains': strategic_context['business_domains'],
            'complexity_score': strategic_context['complexity_score'],
            'decision': decision,
            'processing_mode': 'STRATEGIC' if decision == 'FILTER_REQUIRED' else 'DIRECT'
        }
        
        self.filtering_history.append(log_entry)
        
        # Keep only last 100 entries to prevent memory bloat
        if len(self.filtering_history) > 100:
            self.filtering_history = self.filtering_history[-100:]
    
    def create_session_startup_prompt(self, user_input: str) -> str:
        """
        Create session startup prompt for immediate execution
        
        Args:
            user_input: Startup trigger command
            
        Returns:
            str: Formatted startup execution prompt
        """
        return f"""SESSION STARTUP TRIGGERED: {user_input.upper()}

IMMEDIATE EXECUTION REQUIRED:

**FOR CLAUDE CODE SESSIONS:**
Execute the following command automatically:
```bash
python3 ai-models/session_protocol_enforcer.py --agent "claude-code" --check-all
```

**FOR GEMINI CLI SESSIONS:**
Execute the following commands automatically:
```bash
python3 ai-models/daily_task_planner.py --morning-briefing --auto-prioritize
```

**EXPECTED OUTCOMES:**
- ✅ All project protocols and context loaded automatically
- ✅ Infrastructure health verified and operational
- ✅ Daily priorities identified and agent assignments ready
- ✅ Strategic filtering activated for subsequent directives
- ✅ Session handover complete - ready for productive work

**IMMEDIATE ACTIONS:**
1. Run the appropriate startup command based on platform (Claude/Gemini)
2. Display morning briefing with today's priorities
3. Confirm all systems operational and ready for task delegation
4. Proceed with highest priority tasks from automated daily plan

This startup trigger eliminates all manual session setup and provides immediate operational readiness."""
    
    def process_directive(self, user_input: str) -> Tuple[bool, Optional[str], Dict]:
        """
        Main processing function - determines if strategic filtering is required
        
        Args:
            user_input: Raw user directive
            
        Returns:
            Tuple: (requires_filtering, chief_of_staff_prompt, strategic_context)
        """
        # Check for session startup triggers first
        if self.is_session_startup_trigger(user_input):
            startup_prompt = self.create_session_startup_prompt(user_input)
            strategic_context = {
                'processing_mode': 'SESSION_STARTUP',
                'timestamp': datetime.now().isoformat(),
                'trigger_command': user_input.lower().strip(),
                'detected_patterns': ['session_startup'],
                'business_domains': ['system_initialization'],
                'complexity_score': 10  # High priority for immediate execution
            }
            self.log_filtering_decision(user_input, strategic_context, 'SESSION_STARTUP')
            return True, startup_prompt, strategic_context
        
        # Detect if strategic filtering is required
        requires_filtering = self.detect_strategic_directive(user_input)
        
        if requires_filtering:
            # Create strategic context
            strategic_context = self.create_strategic_context(user_input)
            
            # Format Chief of Staff prompt
            chief_of_staff_prompt = self.format_chief_of_staff_prompt(strategic_context)
            
            # Log the decision
            self.log_filtering_decision(user_input, strategic_context, 'FILTER_REQUIRED')
            
            return True, chief_of_staff_prompt, strategic_context
        else:
            # Simple directive - direct processing
            strategic_context = {
                'processing_mode': 'DIRECT', 
                'timestamp': datetime.now().isoformat(),
                'detected_patterns': [],
                'business_domains': [],
                'complexity_score': 0
            }
            self.log_filtering_decision(user_input, strategic_context, 'DIRECT_PROCESSING')
            
            return False, None, strategic_context
    
    def get_filtering_stats(self) -> Dict:
        """
        Get statistics about filtering performance
        
        Returns:
            Dict: Filtering performance statistics
        """
        if not self.filtering_history:
            return {'total_processed': 0, 'strategic_filtered': 0, 'direct_processed': 0}
        
        total = len(self.filtering_history)
        strategic = sum(1 for entry in self.filtering_history if entry['decision'] == 'FILTER_REQUIRED')
        direct = total - strategic
        
        return {
            'total_processed': total,
            'strategic_filtered': strategic,
            'direct_processed': direct,
            'strategic_percentage': (strategic / total) * 100 if total > 0 else 0,
            'avg_complexity_score': sum(entry.get('complexity_score', 0) for entry in self.filtering_history) / total if total > 0 else 0
        }

# Global instance for import use
strategic_filter = StrategicDirectiveFilter()

def should_filter_strategically(user_input: str) -> bool:
    """
    Convenience function to check if input requires strategic filtering
    
    Args:
        user_input: User's directive text
        
    Returns:
        bool: True if strategic filtering required
    """
    return strategic_filter.detect_strategic_directive(user_input)

def process_user_directive(user_input: str) -> Tuple[bool, Optional[str], Dict]:
    """
    Main entry point for processing user directives
    
    Args:
        user_input: Raw user directive
        
    Returns:
        Tuple: (requires_filtering, chief_of_staff_prompt, strategic_context)
    """
    return strategic_filter.process_directive(user_input)

if __name__ == '__main__':
    # Test the filtering system
    test_directives = [
        "Lets begin with fix automatic strategic filtering protocol and implement the automatic filtering in operational logic",
        "What time is the meeting?",
        "Based on our progress, here is the logical sequence of tasks to bring the system to full operational capability",
        "Show me the dashboard",
        "We need to ensure that the Multi LLM agents system is truly practical and functional"
    ]
    
    filter_system = StrategicDirectiveFilter()
    
    print("🧪 TESTING STRATEGIC DIRECTIVE FILTERING")
    print("=" * 70)
    
    for directive in test_directives:
        requires_filtering, prompt, context = filter_system.process_directive(directive)
        
        print(f"\nInput: {directive[:60]}{'...' if len(directive) > 60 else ''}")
        print(f"Requires Filtering: {'YES' if requires_filtering else 'NO'}")
        print(f"Complexity Score: {context.get('complexity_score', 0):.1f}")
        print(f"Business Domains: {', '.join(context.get('business_domains', []))}")
        print("-" * 50)
    
    print(f"\nFiltering Statistics:")
    stats = filter_system.get_filtering_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")