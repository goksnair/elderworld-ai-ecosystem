#!/usr/bin/env python3
"""
SESSION PROTOCOL ENFORCER
Guarantees protocol compliance from first message of every new session
MANDATORY execution by all agents at session start
"""

import json
import os
import sys
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import subprocess

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProtocolViolationError(Exception):
    """Critical protocol violation that blocks all operations"""
    pass

class SessionProtocolEnforcer:
    """
    IRONCLAD SESSION PROTOCOL ENFORCEMENT
    Ensures all agents comply with trust protocols from session start
    """
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.base_dir = Path('/Users/gokulnair/senior-care-startup/ai-ecosystem')
        self.protocol_state_file = self.base_dir / 'shared-workspace' / 'protocol_state.json'
        self.violation_log_file = self.base_dir / 'shared-workspace' / 'violation_log.json'
        self.trust_metrics_file = self.base_dir / 'shared-workspace' / 'trust_metrics.json'
        self.infrastructure_health_file = self.base_dir / 'shared-workspace' / 'infrastructure_health.json'
        
        # Agent behavioral contracts
        self.agent_contracts = {
            'Claude Code': {
                'identity': 'Strategic Implementation Leader, Protocol Debugger',
                'forbidden': ['claiming_completion_without_evidence', 'ignoring_network_failures', 'architectural_descriptions_as_solutions'],
                'required': ['end_to_end_testing', 'working_code', 'infrastructure_fixes_first'],
                'verification_script': 'verify_solution.sh',
                'failure_response': 'SOLUTION INCOMPLETE'
            },
            'Chief Orchestrator (Gemini)': {
                'identity': 'Strategic Coordination, Cross-functional Leadership',
                'forbidden': ['accepting_unverified_solutions', 'premature_task_completion', 'infinite_loops'],
                'required': ['independent_verification', 'evidence_based_acceptance'],
                'verification_script': 'validate_delegation.sh',
                'failure_response': 'REJECT_INCOMPLETE_SOLUTIONS'
            }
        }
        
        logger.info(f"🛡️ Session Protocol Enforcer initialized for agent: {agent_name}")

    def enforce_session_startup_protocol(self) -> bool:
        """
        MANDATORY SESSION STARTUP PROTOCOL
        Must pass all checks or agent is blocked from operations
        """
        logger.info("🚨 EXECUTING MANDATORY SESSION STARTUP PROTOCOL")
        
        try:
            # 1. Load CLAUDE.md protocol requirements
            self._verify_claude_md_loaded()
            
            # 2. Execute infrastructure health check
            self._check_infrastructure_health()
            
            # 3. Verify A2A communication capability
            self._verify_a2a_communication()
            
            # 4. Load previous session state and violations
            self._load_session_state()
            
            # 5. Confirm protocol enforcement is active
            self._confirm_protocol_enforcement()
            
            # 6. Validate agent identity and behavioral contract
            self._validate_agent_contract()
            
            logger.info("✅ SESSION STARTUP PROTOCOL PASSED - Agent cleared for operations")
            self._record_successful_startup()
            return True
            
        except ProtocolViolationError as e:
            logger.error(f"🚨 SESSION STARTUP PROTOCOL FAILED: {e}")
            self._record_protocol_violation(str(e))
            return False
        except Exception as e:
            logger.error(f"💥 Unexpected error in protocol enforcement: {e}")
            self._record_protocol_violation(f"Unexpected error: {e}")
            return False

    def _verify_claude_md_loaded(self):
        """Verify CLAUDE.md protocol requirements are accessible"""
        claude_md_path = self.base_dir / 'CLAUDE.md'
        
        if not claude_md_path.exists():
            raise ProtocolViolationError("CLAUDE.md protocol file not found")
        
        with open(claude_md_path, 'r') as f:
            content = f.read()
        
        # Check for critical protocol sections
        required_sections = [
            'MANDATORY SESSION-PERSISTENT PROTOCOL ENFORCEMENT',
            'IRONCLAD TRUST PROTOCOL',
            'AGENT BEHAVIORAL CONTRACTS',
            'BULLETPROOF VERIFICATION PROTOCOLS',
            'ABSOLUTE PROHIBITIONS'
        ]
        
        for section in required_sections:
            if section not in content:
                raise ProtocolViolationError(f"Missing critical protocol section: {section}")
        
        logger.info("✅ CLAUDE.md protocol requirements verified")

    def _check_infrastructure_health(self):
        """Check critical infrastructure components"""
        logger.info("🔍 Checking infrastructure health...")
        
        # Check A2A communication system
        try:
            result = subprocess.run(
                ['node', str(self.base_dir / 'mcp-bridge/scripts/test-a2a-connection.js')],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0 or 'TypeError: fetch failed' in result.stderr:
                self._update_infrastructure_health('a2a_communication', '🔴 BROKEN', 
                                                 'Network connectivity failure - fetch failed')
                raise ProtocolViolationError("A2A Communication System BROKEN - network connectivity failure")
            else:
                self._update_infrastructure_health('a2a_communication', '🟢 VERIFIED', 
                                                 'Connection successful')
                
        except subprocess.TimeoutExpired:
            self._update_infrastructure_health('a2a_communication', '🔴 BROKEN', 'Connection timeout')
            raise ProtocolViolationError("A2A Communication System BROKEN - connection timeout")
        except FileNotFoundError:
            self._update_infrastructure_health('a2a_communication', '🔴 BROKEN', 
                                             'Test script not found')
            logger.warning("⚠️ A2A test script not found - marking as unknown status")
        
        # Check state management system
        try:
            result = subprocess.run([
                'python3', 
                str(self.base_dir / 'ai-models/chief_orchestrator_state_manager_FIXED.py'),
                'report'
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                self._update_infrastructure_health('state_management', '🔴 BROKEN', 
                                                 'State manager execution failed')
                raise ProtocolViolationError("State Management System BROKEN")
            
            # Check for protocol violations in state
            if 'Protocol Violations: 0' not in result.stdout:
                self._update_infrastructure_health('state_management', '🟡 PARTIAL', 
                                                 'Protocol violations detected')
                logger.warning("⚠️ Protocol violations detected in state manager")
            else:
                self._update_infrastructure_health('state_management', '🟢 VERIFIED', 
                                                 'No protocol violations')
                
        except subprocess.TimeoutExpired:
            self._update_infrastructure_health('state_management', '🔴 BROKEN', 'Execution timeout')
            raise ProtocolViolationError("State Management System BROKEN - execution timeout")
        except FileNotFoundError:
            self._update_infrastructure_health('state_management', '🔴 BROKEN', 
                                             'State manager not found')
            raise ProtocolViolationError("State Management System BROKEN - files missing")
        
        logger.info("✅ Infrastructure health check completed")

    def _verify_a2a_communication(self):
        """Verify A2A communication capability"""
        logger.info("📡 Verifying A2A communication capability...")
        
        # Check if any agents are running and responsive
        senior_care_boss_log = self.base_dir / 'senior-care-boss.log'
        
        if senior_care_boss_log.exists():
            with open(senior_care_boss_log, 'r') as f:
                log_content = f.read()
            
            # Check for message retrieval capability
            if 'Retrieved 0 A2A messages for undefined' in log_content:
                logger.warning("⚠️ Senior-care-boss agent receiving 0 messages - potential A2A issue")
                self._update_infrastructure_health('agent_communication', '🟡 PARTIAL', 
                                                 'Agent running but receiving 0 messages')
            elif 'A2A Client initialized' in log_content:
                self._update_infrastructure_health('agent_communication', '🟢 VERIFIED', 
                                                 'Agent initialized and polling')
                logger.info("✅ Senior-care-boss agent operational")
        else:
            self._update_infrastructure_health('agent_communication', '🔴 BROKEN', 
                                             'No agent activity detected')
            logger.warning("⚠️ No agent activity logs found")

    def _load_session_state(self):
        """Load previous session state and violations"""
        logger.info("📚 Loading previous session state...")
        
        # Load protocol violations
        if self.violation_log_file.exists():
            with open(self.violation_log_file, 'r') as f:
                violations = json.load(f)
            
            recent_violations = [v for v in violations if self._is_recent(v.get('timestamp', ''))]
            
            if recent_violations:
                logger.warning(f"⚠️ {len(recent_violations)} recent protocol violations found")
                for violation in recent_violations:
                    logger.warning(f"   - {violation.get('agent', 'Unknown')}: {violation.get('violation', 'Unknown')}")
        
        # Load trust metrics
        if self.trust_metrics_file.exists():
            with open(self.trust_metrics_file, 'r') as f:
                metrics = json.load(f)
            
            agent_metrics = metrics.get(self.agent_name, {})
            trust_score = agent_metrics.get('trust_score', 1.0)
            
            if trust_score < 0.8:
                logger.warning(f"⚠️ Low trust score for {self.agent_name}: {trust_score}")
                # Could implement restricted mode here
        
        logger.info("✅ Session state loaded")

    def _confirm_protocol_enforcement(self):
        """Confirm protocol enforcement mechanisms are active"""
        logger.info("🔒 Confirming protocol enforcement is active...")
        
        # Check if verification scripts exist
        verification_scripts = [
            'verify_solution.sh',
            'validate_delegation.sh'
        ]
        
        for script in verification_scripts:
            script_path = self.base_dir / script
            if not script_path.exists():
                logger.warning(f"⚠️ Verification script missing: {script}")
        
        # Update protocol state
        self._update_protocol_state('enforcement_active', True)
        logger.info("✅ Protocol enforcement confirmed active")

    def _validate_agent_contract(self):
        """Validate agent identity and behavioral contract"""
        logger.info(f"📋 Validating behavioral contract for {self.agent_name}...")
        
        if self.agent_name not in self.agent_contracts:
            logger.warning(f"⚠️ No behavioral contract found for agent: {self.agent_name}")
            return
        
        contract = self.agent_contracts[self.agent_name]
        logger.info(f"✅ Agent identity confirmed: {contract['identity']}")
        logger.info(f"📝 Behavioral contract loaded with {len(contract['forbidden'])} prohibitions")

    def _update_infrastructure_health(self, component: str, status: str, details: str):
        """Update infrastructure health status"""
        health_data = {}
        
        if self.infrastructure_health_file.exists():
            with open(self.infrastructure_health_file, 'r') as f:
                health_data = json.load(f)
        
        health_data[component] = {
            'status': status,
            'details': details,
            'last_checked': datetime.now().isoformat(),
            'checked_by': self.agent_name
        }
        
        with open(self.infrastructure_health_file, 'w') as f:
            json.dump(health_data, f, indent=2)

    def _update_protocol_state(self, key: str, value):
        """Update protocol state"""
        state_data = {}
        
        if self.protocol_state_file.exists():
            with open(self.protocol_state_file, 'r') as f:
                state_data = json.load(f)
        
        state_data[key] = value
        state_data['last_updated'] = datetime.now().isoformat()
        state_data['updated_by'] = self.agent_name
        
        with open(self.protocol_state_file, 'w') as f:
            json.dump(state_data, f, indent=2)

    def _record_protocol_violation(self, violation: str):
        """Record protocol violation"""
        violations = []
        
        if self.violation_log_file.exists():
            with open(self.violation_log_file, 'r') as f:
                violations = json.load(f)
        
        violations.append({
            'timestamp': datetime.now().isoformat(),
            'agent': self.agent_name,
            'violation': violation,
            'severity': 'CRITICAL',
            'session_startup': True
        })
        
        with open(self.violation_log_file, 'w') as f:
            json.dump(violations, f, indent=2)

    def _record_successful_startup(self):
        """Record successful protocol startup"""
        self._update_protocol_state(f'{self.agent_name}_last_successful_startup', datetime.now().isoformat())

    def _is_recent(self, timestamp_str: str, hours: int = 24) -> bool:
        """Check if timestamp is within recent hours"""
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
            return (datetime.now() - timestamp).total_seconds() < (hours * 3600)
        except (ValueError, TypeError):
            return False

    def get_compliance_status(self) -> Dict:
        """Get current compliance status for this agent"""
        return {
            'agent': self.agent_name,
            'last_startup_check': self._get_last_startup_check(),
            'infrastructure_health': self._get_infrastructure_status(),
            'recent_violations': self._get_recent_violations(),
            'trust_score': self._get_trust_score(),
            'compliant': self._is_compliant()
        }

    def _get_last_startup_check(self) -> Optional[str]:
        """Get timestamp of last successful startup check"""
        if self.protocol_state_file.exists():
            with open(self.protocol_state_file, 'r') as f:
                state = json.load(f)
            return state.get(f'{self.agent_name}_last_successful_startup')
        return None

    def _get_infrastructure_status(self) -> Dict:
        """Get current infrastructure status"""
        if self.infrastructure_health_file.exists():
            with open(self.infrastructure_health_file, 'r') as f:
                return json.load(f)
        return {}

    def _get_recent_violations(self) -> List[Dict]:
        """Get recent protocol violations"""
        if self.violation_log_file.exists():
            with open(self.violation_log_file, 'r') as f:
                violations = json.load(f)
            return [v for v in violations if self._is_recent(v.get('timestamp', '')) 
                   and v.get('agent') == self.agent_name]
        return []

    def _get_trust_score(self) -> float:
        """Get current trust score for agent"""
        if self.trust_metrics_file.exists():
            with open(self.trust_metrics_file, 'r') as f:
                metrics = json.load(f)
            return metrics.get(self.agent_name, {}).get('trust_score', 1.0)
        return 1.0

    def _is_compliant(self) -> bool:
        """Check if agent is currently compliant"""
        # Check recent violations
        recent_violations = self._get_recent_violations()
        if recent_violations:
            return False
        
        # Check trust score
        trust_score = self._get_trust_score()
        if trust_score < 0.8:
            return False
        
        # Check infrastructure status
        health = self._get_infrastructure_status()
        for component, status in health.items():
            if '🔴 BROKEN' in status.get('status', ''):
                return False
        
        return True

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Session Protocol Enforcer')
    parser.add_argument('--agent', required=True, help='Agent name')
    parser.add_argument('--check-all', action='store_true', 
                       help='Run complete startup protocol check')
    parser.add_argument('--status', action='store_true', 
                       help='Show compliance status')
    
    args = parser.parse_args()
    
    enforcer = SessionProtocolEnforcer(args.agent)
    
    if args.check_all:
        success = enforcer.enforce_session_startup_protocol()
        if not success:
            print("🚨 PROTOCOL ENFORCEMENT FAILED - AGENT BLOCKED")
            sys.exit(1)
        else:
            print("✅ PROTOCOL ENFORCEMENT PASSED - AGENT CLEARED")
            sys.exit(0)
    
    elif args.status:
        status = enforcer.get_compliance_status()
        print(json.dumps(status, indent=2))
        sys.exit(0)
    
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()