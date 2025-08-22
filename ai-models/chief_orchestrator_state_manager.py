#!/usr/bin/env python3
"""
CHIEF ORCHESTRATOR FOOLPROOF STATE MANAGER
Prevents protocol violations and infinite loops
"""

import json
import os
import time
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple
import subprocess
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskState(Enum):
    """Mandatory task states - NO SKIPPING ALLOWED"""
    UNDEFINED = "UNDEFINED"
    DEFINED = "DEFINED"           # Task file created, agent assigned
    DELEGATED = "DELEGATED"       # A2A message sent successfully
    ACCEPTED = "ACCEPTED"         # Agent sent TASK_ACCEPTED
    IN_PROGRESS = "IN_PROGRESS"   # Agent sent PROGRESS_UPDATE
    COMPLETED = "COMPLETED"       # Agent sent TASK_COMPLETED
    ERROR = "ERROR"               # Task failed or agent unresponsive
    ESCALATED = "ESCALATED"       # Manual intervention required

class ProtocolViolationError(Exception):
    """Raised when protocol rules are violated"""
    pass

class ChiefOrchestratorStateManager:
    """
    FOOLPROOF STATE MANAGEMENT FOR CHIEF ORCHESTRATOR
    Enforces strict protocol adherence and prevents loops
    """
    
    def __init__(self, state_file: str = None):
        self.state_file = state_file or '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/chief_orchestrator_state.json'
        self.max_delegation_attempts = 3
        self.max_response_wait_time = 300  # 5 minutes
        self.state = self._load_or_create_state()
        
        # Internal loop prevention
        self._current_operation = None
        self._operation_count = 0
        self._max_operations_per_cycle = 10
        
        logger.info(f"Chief Orchestrator State Manager initialized")
        logger.info(f"State file: {self.state_file}")
        logger.info(f"Current tasks: {len(self.state.get('tasks', {}))}")

    def _load_or_create_state(self) -> Dict:
        """Load existing state or create new one"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                # Convert datetime strings back to datetime objects
                if 'last_updated' in state: state['last_updated'] = datetime.fromisoformat(state['last_updated'])
                for task_id, task_data in state['tasks'].items():
                    if 'created_at' in task_data: task_data['created_at'] = datetime.fromisoformat(task_data['created_at'])
                    if 'last_attempt' in task_data and task_data['last_attempt'] is not None: task_data['last_attempt'] = datetime.fromisoformat(task_data['last_attempt'])
                    for msg in task_data.get('messages', []):
                        if 'timestamp' in msg: msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
                for violation in state.get('protocol_violations', []):
                    if 'timestamp' in violation: violation['timestamp'] = datetime.fromisoformat(violation['timestamp'])
                for escalated in state.get('escalated_tasks', []):
                    if 'timestamp' in escalated: escalated['timestamp'] = datetime.fromisoformat(escalated['timestamp'])

                logger.info(f"Loaded existing state with {len(state.get('tasks', {}))} tasks")
                return state
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON from state file: {e}. Creating new state.")
                return self._create_empty_state()
            except Exception as e:
                logger.error(f"Unexpected error loading state file: {e}. Creating new state.")
                return self._create_empty_state()
        else:
            empty_state = self._create_empty_state()
            self.state = empty_state # Assign to self.state first
            self._save_state() # Save the newly created empty state
            return empty_state

    def _create_empty_state(self) -> Dict:
        """Create empty state structure"""
        return {
            'tasks': {},
            'last_updated': datetime.now(),
            'protocol_violations': [],
            'escalated_tasks': [],
            'session_id': f"session_{int(time.time())}"
        }

    def _save_state(self):
        """Persist state to file"""
        self.state['last_updated'] = datetime.now()
        try:
            # Atomic write with backup
            backup_file = f"{self.state_file}.backup"
            if os.path.exists(self.state_file):
                os.rename(self.state_file, backup_file)
            
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2, cls=DateTimeEncoder)
            
            # Remove backup on successful write
            if os.path.exists(backup_file):
                os.remove(backup_file)
                
            logger.info("State saved successfully")
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
            # Restore from backup if available
            backup_file = f"{self.state_file}.backup"
            if os.path.exists(backup_file):
                os.rename(backup_file, self.state_file)

    def _prevent_infinite_loops(self, operation: str):
        """Prevent infinite operation loops"""
        if self._current_operation == operation:
            self._operation_count += 1
        else:
            self._current_operation = operation
            self._operation_count = 1
            
        if self._operation_count > self._max_operations_per_cycle:
            error_msg = f"INFINITE LOOP DETECTED: {operation} attempted {self._operation_count} times"
            logger.error(error_msg)
            self._log_protocol_violation(operation, error_msg)
            raise ProtocolViolationError(error_msg)

    def _log_protocol_violation(self, operation: str, error: str):
        """Log protocol violations for analysis"""
        violation = {
            'timestamp': datetime.now(),
            'operation': operation,
            'error': error,
            'tasks_affected': list(self.state['tasks'].keys())
        }
        self.state['protocol_violations'].append(violation)
        self._save_state()

    def define_task(self, task_id: str, agent: str, task_file: str, priority: str = 'MEDIUM') -> bool:
        """
        GATE 1: Define a task - Creates task file and assigns agent
        MANDATORY: Task file must exist before calling this
        """
        self._prevent_infinite_loops(f"define_task_{task_id}")
        
        logger.info(f"🎯 DEFINING TASK: {task_id}")
        
        # Validation: Task file must exist
        if not os.path.exists(task_file):
            error_msg = f"Task file does not exist: {task_file}"
            logger.error(error_msg)
            self._log_protocol_violation(f"define_task_{task_id}", error_msg)
            return False
        
        # Validation: Cannot redefine existing task
        if task_id in self.state['tasks']:
            current_state = self.state['tasks'][task_id]['state']
            if current_state != TaskState.UNDEFINED.value:
                error_msg = f"Task {task_id} already defined with state {current_state}"
                logger.error(error_msg)
                self._log_protocol_violation(f"define_task_{task_id}", error_msg)
                return False
        
        # Define task
        self.state['tasks'][task_id] = {
            'state': TaskState.DEFINED.value,
            'agent': agent,
            'task_file': task_file,
            'priority': priority,
            'created_at': datetime.now(),
            'delegation_attempts': 0,
            'last_attempt': None,
            'messages': [],
            'escalation_reason': None
        }
        
        self._save_state()
        logger.info(f"✅ Task {task_id} defined successfully")
        return True

    def delegate_task(self, task_id: str) -> bool:
        """
        GATE 2: Delegate task to agent via A2A system
        MANDATORY: Task must be in DEFINED state
        """
        self._prevent_infinite_loops(f"delegate_task_{task_id}")
        
        logger.info(f"📤 DELEGATING TASK: {task_id}")
        
        # Validation: Task must exist and be in correct state
        if not self._validate_task_transition(task_id, TaskState.DEFINED, TaskState.DELEGATED):
            return False
        
        task = self.state['tasks'][task_id]
        
        # Check delegation attempt limit
        if task['delegation_attempts'] >= self.max_delegation_attempts:
            return self._escalate_task(task_id, f"Max delegation attempts ({self.max_delegation_attempts}) exceeded")
        
        # Attempt delegation via A2A system
        try:
            sender = 'Chief Orchestrator (Gemini)'
            agent = task['agent']
            task_file = task['task_file']
            
            command = [
                'node',
                '/Users/gokulnair/senior-care-startup/ai-ecosystem/mcp-bridge/send_task.js',
                sender,
                agent, 
                task_id,
                task_file
            ]
            
            logger.info(f"Executing: {' '.join(command)}")
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30,
                check=True
            )
            
            # Update task state on successful delegation
            task['state'] = TaskState.DELEGATED.value
            task['delegation_attempts'] += 1
            task['last_attempt'] = datetime.now()
            task['messages'].append({
                'type': 'DELEGATION_SENT',
                'timestamp': datetime.now(),
                'success': True,
                'details': result.stdout
            })
            
            self._save_state()
            logger.info(f"✅ Task {task_id} delegated successfully to {agent}")
            return True
            
        except subprocess.TimeoutExpired:
            error_msg = f"Delegation timeout for task {task_id}"
            logger.error(error_msg)
            task['delegation_attempts'] += 1
            task['messages'].append({
                'type': 'DELEGATION_FAILED',
                'timestamp': datetime.now(),
                'error': error_msg
            })
            self._save_state()
            return False
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Delegation failed for task {task_id}: {e.stderr}"
            logger.error(error_msg)
            task['delegation_attempts'] += 1
            task['messages'].append({
                'type': 'DELEGATION_FAILED',
                'timestamp': datetime.now(),
                'error': error_msg
            })
            self._save_state()
            return False

    def check_task_response(self, task_id: str) -> bool:
        """
        GATE 3: Check for agent response (TASK_ACCEPTED, PROGRESS_UPDATE)
        MANDATORY: Task must be in DELEGATED state
        """
        self._prevent_infinite_loops(f"check_response_{task_id}")
        
        logger.info(f"📥 CHECKING RESPONSE: {task_id}")
        
        if task_id not in self.state['tasks']:
            logger.error(f"Task {task_id} not found")
            return False
        
        task = self.state['tasks'][task_id]
        current_state = TaskState(task['state'])
        
        if current_state not in [TaskState.DELEGATED, TaskState.ACCEPTED, TaskState.IN_PROGRESS]:
            logger.warning(f"Task {task_id} in state {current_state.value}, cannot check response")
            return False
        
        # Check for timeout
        if task['last_attempt']:
            last_attempt = datetime.fromisoformat(task['last_attempt'])
            elapsed = (datetime.now() - last_attempt).total_seconds()
            
            if elapsed > self.max_response_wait_time:
                return self._escalate_task(task_id, f"No response after {self.max_response_wait_time} seconds")
        
        # Use protocol checker to verify A2A messages
        try:
            command = [
                'node',
                '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/protocol-checker.js',
                '--task',
                task_id
            ]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse protocol checker output
            output = result.stdout
            
            if "TASK_ACCEPTED sent" in output or "TASK_ACCEPTED: YES" in output:
                task['state'] = TaskState.ACCEPTED.value
                task['messages'].append({
                    'type': 'TASK_ACCEPTED_RECEIVED',
                    'timestamp': datetime.now()
                })
                logger.info(f"✅ Task {task_id} accepted by agent")
                
            if "PROGRESS_UPDATE sent" in output or "Progress: YES" in output:
                task['state'] = TaskState.IN_PROGRESS.value
                task['messages'].append({
                    'type': 'PROGRESS_UPDATE_RECEIVED',
                    'timestamp': datetime.now()
                })
                logger.info(f"📊 Task {task_id} in progress")
                
            if "TASK_COMPLETED sent" in output or "Completed: YES" in output:
                task['state'] = TaskState.COMPLETED.value
                task['messages'].append({
                    'type': 'TASK_COMPLETED_RECEIVED',
                    'timestamp': datetime.now()
                })
                logger.info(f"🎉 Task {task_id} completed")
                
            self._save_state()
            return True
            
        except Exception as e:
            logger.error(f"Failed to check task response: {e}")
            return False

    def _validate_task_transition(self, task_id: str, from_state: TaskState, to_state: TaskState) -> bool:
        """Validate that task state transition is allowed"""
        if task_id not in self.state['tasks']:
            error_msg = f"Task {task_id} not found for transition {from_state.value} -> {to_state.value}"
            logger.error(error_msg)
            self._log_protocol_violation(f"transition_{task_id}", error_msg)
            return False
        
        current_state = TaskState(self.state['tasks'][task_id]['state'])
        
        if current_state != from_state:
            error_msg = f"Task {task_id} in state {current_state.value}, cannot transition from {from_state.value} to {to_state.value}"
            logger.error(error_msg)
            self._log_protocol_violation(f"transition_{task_id}", error_msg)
            return False
        
        return True

    def _escalate_task(self, task_id: str, reason: str) -> bool:
        """Escalate task for manual intervention"""
        logger.warning(f"🚨 ESCALATING TASK: {task_id} - {reason}")
        
        if task_id in self.state['tasks']:
            self.state['tasks'][task_id]['state'] = TaskState.ESCALATED.value
            self.state['tasks'][task_id]['escalation_reason'] = reason
            self.state['escalated_tasks'].append({
                'task_id': task_id,
                'reason': reason,
                'timestamp': datetime.now()
            })
            self._save_state()
        
        return True

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get current task status"""
        return self.state['tasks'].get(task_id)

    def list_tasks_by_state(self, state: TaskState = None) -> Dict:
        """List all tasks, optionally filtered by state"""
        if state is None:
            return self.state['tasks']
        
        return {
            task_id: task_data 
            for task_id, task_data in self.state['tasks'].items() 
            if task_data['state'] == state.value
        }

    def get_protocol_violations(self) -> List[Dict]:
        """Get all protocol violations"""
        return self.state.get('protocol_violations', [])

    def get_escalated_tasks(self) -> List[Dict]:
        """Get all escalated tasks requiring manual intervention"""
        return self.state.get('escalated_tasks', [])

    def reset_task(self, task_id: str, to_state: TaskState = TaskState.DEFINED) -> bool:
        """Reset task to specified state (for manual correction)"""
        logger.warning(f"⚠️ MANUALLY RESETTING TASK: {task_id} to {to_state.value}")
        
        if task_id in self.state['tasks']:
            self.state['tasks'][task_id]['state'] = to_state.value
            self.state['tasks'][task_id]['messages'].append({
                'type': 'MANUAL_RESET',
                'timestamp': datetime.now()
            })
            self._save_state()
            return True
        
        return False

    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        tasks = self.state['tasks']
        total_tasks = len(tasks)
        
        state_counts = {}
        for task_data in tasks.values():
            state = task_data['state']
            state_counts[state] = state_counts.get(state, 0) + 1
        
        report = f"""
CHIEF ORCHESTRATOR STATUS REPORT
================================
Session ID: {self.state.get('session_id', 'N/A')}
Last Updated: {self.state.get('last_updated', 'N/A')}

TASK SUMMARY:
Total Tasks: {total_tasks}
"""
        
        for state in TaskState:
            count = state_counts.get(state.value, 0)
            report += f"  {state.value}: {count}\n"
        
        report += f"""
PROTOCOL COMPLIANCE:
Protocol Violations: {len(self.state.get('protocol_violations', []))}
Escalated Tasks: {len(self.state.get('escalated_tasks', []))}

SYSTEM STATUS: {'🟢 HEALTHY' if len(self.state.get('protocol_violations', [])) == 0 and len(self.state.get('escalated_tasks', [])) == 0 else '🔴 NEEDS ATTENTION'}
"""
        
        return report

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Chief Orchestrator State Manager')
    parser.add_argument('action', choices=['define', 'delegate', 'check', 'status', 'reset', 'report'])
    parser.add_argument('--task-id', help='Task ID')
    parser.add_argument('--agent', help='Agent name')
    parser.add_argument('--task-file', help='Path to task file')
    parser.add_argument('--priority', default='MEDIUM', help='Task priority')
    parser.add_argument('--state', help='State for reset operation')
    
    args = parser.parse_args()
    
    manager = ChiefOrchestratorStateManager()
    
    if args.action == 'define':
        if not args.task_id or not args.agent or not args.task_file:
            print("Error: define requires --task-id, --agent, and --task-file")
            return 1
        
        success = manager.define_task(args.task_id, args.agent, args.task_file, args.priority)
        return 0 if success else 1
        
    elif args.action == 'delegate':
        if not args.task_id:
            print("Error: delegate requires --task-id")
            return 1
        
        success = manager.delegate_task(args.task_id)
        return 0 if success else 1
        
    elif args.action == 'check':
        if not args.task_id:
            print("Error: check requires --task-id")
            return 1
        
        success = manager.check_task_response(args.task_id)
        return 0 if success else 1
        
    elif args.action == 'status':
        if args.task_id:
            status = manager.get_task_status(args.task_id)
            print(json.dumps(status, indent=2))
        else:
            tasks = manager.list_tasks_by_state()
            print(json.dumps(tasks, indent=2))
        return 0
        
    elif args.action == 'reset':
        if not args.task_id or not args.state:
            print("Error: reset requires --task-id and --state")
            return 1
        
        try:
            state = TaskState(args.state.upper())
            success = manager.reset_task(args.task_id, state)
            return 0 if success else 1
        except ValueError:
            print(f"Error: Invalid state {args.state}")
            return 1
            
    elif args.action == 'report':
        print(manager.generate_status_report())
        return 0

if __name__ == '__main__':
    exit(main())


    def _load_or_create_state(self) -> Dict:
        """Load existing state or create new one"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                # Convert datetime strings back to datetime objects
                if 'last_updated' in state: state['last_updated'] = datetime.fromisoformat(state['last_updated'])
                for task_id, task_data in state['tasks'].items():
                    if 'created_at' in task_data: task_data['created_at'] = datetime.fromisoformat(task_data['created_at'])
                    if 'last_attempt' in task_data and task_data['last_attempt'] is not None: task_data['last_attempt'] = datetime.fromisoformat(task_data['last_attempt'])
                    for msg in task_data.get('messages', []):
                        if 'timestamp' in msg: msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
                for violation in state.get('protocol_violations', []):
                    if 'timestamp' in violation: violation['timestamp'] = datetime.fromisoformat(violation['timestamp'])
                for escalated in state.get('escalated_tasks', []):
                    if 'timestamp' in escalated: escalated['timestamp'] = datetime.fromisoformat(escalated['timestamp'])

                logger.info(f"Loaded existing state with {len(state.get('tasks', {}))} tasks")
                return state
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON from state file: {e}. Creating new state.")
                return self._create_empty_state()
            except Exception as e:
                logger.error(f"Unexpected error loading state file: {e}. Creating new state.")
                return self._create_empty_state()
        else:
            empty_state = self._create_empty_state()
            self.state = empty_state # Assign to self.state first
            self._save_state() # Save the newly created empty state
            return empty_state

    def _create_empty_state(self) -> Dict:
        """Create empty state structure"""
        return {
            'tasks': {},
            'last_updated': datetime.now().isoformat(),
            'protocol_violations': [],
            'escalated_tasks': [],
            'session_id': f"session_{int(time.time())}"
        }

    def _save_state(self):
        """Persist state to file"""
        self.state['last_updated'] = datetime.now().isoformat()
        try:
            # Atomic write with backup
            backup_file = f"{self.state_file}.backup"
            if os.path.exists(self.state_file):
                os.rename(self.state_file, backup_file)
            
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2)
            
            # Remove backup on successful write
            if os.path.exists(backup_file):
                os.remove(backup_file)
                
            logger.info("State saved successfully")
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
            # Restore from backup if available
            backup_file = f"{self.state_file}.backup"
            if os.path.exists(backup_file):
                os.rename(backup_file, self.state_file)

    def _prevent_infinite_loops(self, operation: str):
        """Prevent infinite operation loops"""
        if self._current_operation == operation:
            self._operation_count += 1
        else:
            self._current_operation = operation
            self._operation_count = 1
            
        if self._operation_count > self._max_operations_per_cycle:
            error_msg = f"INFINITE LOOP DETECTED: {operation} attempted {self._operation_count} times"
            logger.error(error_msg)
            self._log_protocol_violation(operation, error_msg)
            raise ProtocolViolationError(error_msg)

    def _log_protocol_violation(self, operation: str, error: str):
        """Log protocol violations for analysis"""
        violation = {
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'error': error,
            'tasks_affected': list(self.state['tasks'].keys())
        }
        self.state['protocol_violations'].append(violation)
        self._save_state()

    def define_task(self, task_id: str, agent: str, task_file: str, priority: str = 'MEDIUM') -> bool:
        """
        GATE 1: Define a task - Creates task file and assigns agent
        MANDATORY: Task file must exist before calling this
        """
        self._prevent_infinite_loops(f"define_task_{task_id}")
        
        logger.info(f"🎯 DEFINING TASK: {task_id}")
        
        # Validation: Task file must exist
        if not os.path.exists(task_file):
            error_msg = f"Task file does not exist: {task_file}"
            logger.error(error_msg)
            self._log_protocol_violation(f"define_task_{task_id}", error_msg)
            return False
        
        # Validation: Cannot redefine existing task
        if task_id in self.state['tasks']:
            current_state = self.state['tasks'][task_id]['state']
            if current_state != TaskState.UNDEFINED.value:
                error_msg = f"Task {task_id} already defined with state {current_state}"
                logger.error(error_msg)
                self._log_protocol_violation(f"define_task_{task_id}", error_msg)
                return False
        
        # Define task
        self.state['tasks'][task_id] = {
            'state': TaskState.DEFINED.value,
            'agent': agent,
            'task_file': task_file,
            'priority': priority,
            'created_at': datetime.now().isoformat(),
            'delegation_attempts': 0,
            'last_attempt': None,
            'messages': [],
            'escalation_reason': None
        }
        
        self._save_state()
        logger.info(f"✅ Task {task_id} defined successfully")
        return True

    def delegate_task(self, task_id: str) -> bool:
        """
        GATE 2: Delegate task to agent via A2A system
        MANDATORY: Task must be in DEFINED state
        """
        self._prevent_infinite_loops(f"delegate_task_{task_id}")
        
        logger.info(f"📤 DELEGATING TASK: {task_id}")
        
        # Validation: Task must exist and be in correct state
        if not self._validate_task_transition(task_id, TaskState.DEFINED, TaskState.DELEGATED):
            return False
        
        task = self.state['tasks'][task_id]
        
        # Check delegation attempt limit
        if task['delegation_attempts'] >= self.max_delegation_attempts:
            return self._escalate_task(task_id, f"Max delegation attempts ({self.max_delegation_attempts}) exceeded")
        
        # Attempt delegation via A2A system
        try:
            sender = 'Chief Orchestrator (Gemini)'
            agent = task['agent']
            task_file = task['task_file']
            
            command = [
                'node',
                '/Users/gokulnair/senior-care-startup/ai-ecosystem/mcp-bridge/send_task.js',
                sender,
                agent, 
                task_id,
                task_file
            ]
            
            logger.info(f"Executing: {' '.join(command)}")
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30,
                check=True
            )
            
            # Update task state on successful delegation
            task['state'] = TaskState.DELEGATED.value
            task['delegation_attempts'] += 1
            task['last_attempt'] = datetime.now().isoformat()
            task['messages'].append({
                'type': 'DELEGATION_SENT',
                'timestamp': datetime.now().isoformat(),
                'success': True,
                'details': result.stdout
            })
            
            self._save_state()
            logger.info(f"✅ Task {task_id} delegated successfully to {agent}")
            return True
            
        except subprocess.TimeoutExpired:
            error_msg = f"Delegation timeout for task {task_id}"
            logger.error(error_msg)
            task['delegation_attempts'] += 1
            task['messages'].append({
                'type': 'DELEGATION_FAILED',
                'timestamp': datetime.now().isoformat(),
                'error': error_msg
            })
            self._save_state()
            return False
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Delegation failed for task {task_id}: {e.stderr}"
            logger.error(error_msg)
            task['delegation_attempts'] += 1
            task['messages'].append({
                'type': 'DELEGATION_FAILED',
                'timestamp': datetime.now().isoformat(),
                'error': error_msg
            })
            self._save_state()
            return False

    def check_task_response(self, task_id: str) -> bool:
        """
        GATE 3: Check for agent response (TASK_ACCEPTED, PROGRESS_UPDATE)
        MANDATORY: Task must be in DELEGATED state
        """
        self._prevent_infinite_loops(f"check_response_{task_id}")
        
        logger.info(f"📥 CHECKING RESPONSE: {task_id}")
        
        if task_id not in self.state['tasks']:
            logger.error(f"Task {task_id} not found")
            return False
        
        task = self.state['tasks'][task_id]
        current_state = TaskState(task['state'])
        
        if current_state not in [TaskState.DELEGATED, TaskState.ACCEPTED, TaskState.IN_PROGRESS]:
            logger.warning(f"Task {task_id} in state {current_state.value}, cannot check response")
            return False
        
        # Check for timeout
        if task['last_attempt']:
            last_attempt = datetime.fromisoformat(task['last_attempt'])
            elapsed = (datetime.now() - last_attempt).total_seconds()
            
            if elapsed > self.max_response_wait_time:
                return self._escalate_task(task_id, f"No response after {self.max_response_wait_time} seconds")
        
        # Use protocol checker to verify A2A messages
        try:
            command = [
                'node',
                '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/protocol-checker.js',
                '--task',
                task_id
            ]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Parse protocol checker output
            output = result.stdout
            
            if "TASK_ACCEPTED sent" in output or "TASK_ACCEPTED: YES" in output:
                task['state'] = TaskState.ACCEPTED.value
                task['messages'].append({
                    'type': 'TASK_ACCEPTED_RECEIVED',
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"✅ Task {task_id} accepted by agent")
                
            if "PROGRESS_UPDATE sent" in output or "Progress: YES" in output:
                task['state'] = TaskState.IN_PROGRESS.value
                task['messages'].append({
                    'type': 'PROGRESS_UPDATE_RECEIVED',
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"📊 Task {task_id} in progress")
                
            if "TASK_COMPLETED sent" in output or "Completed: YES" in output:
                task['state'] = TaskState.COMPLETED.value
                task['messages'].append({
                    'type': 'TASK_COMPLETED_RECEIVED',
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"🎉 Task {task_id} completed")
                
            self._save_state()
            return True
            
        except Exception as e:
            logger.error(f"Failed to check task response: {e}")
            return False

    def _validate_task_transition(self, task_id: str, from_state: TaskState, to_state: TaskState) -> bool:
        """Validate that task state transition is allowed"""
        if task_id not in self.state['tasks']:
            error_msg = f"Task {task_id} not found for transition {from_state.value} -> {to_state.value}"
            logger.error(error_msg)
            self._log_protocol_violation(f"transition_{task_id}", error_msg)
            return False
        
        current_state = TaskState(self.state['tasks'][task_id]['state'])
        
        if current_state != from_state:
            error_msg = f"Task {task_id} in state {current_state.value}, cannot transition from {from_state.value} to {to_state.value}"
            logger.error(error_msg)
            self._log_protocol_violation(f"transition_{task_id}", error_msg)
            return False
        
        return True

    def _escalate_task(self, task_id: str, reason: str) -> bool:
        """Escalate task for manual intervention"""
        logger.warning(f"🚨 ESCALATING TASK: {task_id} - {reason}")
        
        if task_id in self.state['tasks']:
            self.state['tasks'][task_id]['state'] = TaskState.ESCALATED.value
            self.state['tasks'][task_id]['escalation_reason'] = reason
            self.state['escalated_tasks'].append({
                'task_id': task_id,
                'reason': reason,
                'timestamp': datetime.now().isoformat()
            })
            self._save_state()
        
        return True

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get current task status"""
        return self.state['tasks'].get(task_id)

    def list_tasks_by_state(self, state: TaskState = None) -> Dict:
        """List all tasks, optionally filtered by state"""
        if state is None:
            return self.state['tasks']
        
        return {
            task_id: task_data 
            for task_id, task_data in self.state['tasks'].items() 
            if task_data['state'] == state.value
        }

    def get_protocol_violations(self) -> List[Dict]:
        """Get all protocol violations"""
        return self.state.get('protocol_violations', [])

    def get_escalated_tasks(self) -> List[Dict]:
        """Get all escalated tasks requiring manual intervention"""
        return self.state.get('escalated_tasks', [])

    def reset_task(self, task_id: str, to_state: TaskState = TaskState.DEFINED) -> bool:
        """Reset task to specified state (for manual correction)"""
        logger.warning(f"⚠️ MANUALLY RESETTING TASK: {task_id} to {to_state.value}")
        
        if task_id in self.state['tasks']:
            self.state['tasks'][task_id]['state'] = to_state.value
            self.state['tasks'][task_id]['messages'].append({
                'type': 'MANUAL_RESET',
                'timestamp': datetime.now().isoformat(),
                'reset_to': to_state.value
            })
            self._save_state()
            return True
        
        return False

    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        tasks = self.state['tasks']
        total_tasks = len(tasks)
        
        state_counts = {}
        for task_data in tasks.values():
            state = task_data['state']
            state_counts[state] = state_counts.get(state, 0) + 1
        
        violations = len(self.state.get('protocol_violations', []))
        escalated = len(self.state.get('escalated_tasks', []))
        
        report = f"""
CHIEF ORCHESTRATOR STATUS REPORT
================================
Session ID: {self.state.get('session_id', 'N/A')}
Last Updated: {self.state.get('last_updated', 'N/A')}

TASK SUMMARY:
Total Tasks: {total_tasks}
"""
        
        for state in TaskState:
            count = state_counts.get(state.value, 0)
            report += f"  {state.value}: {count}\n"
        
        report += f"""
PROTOCOL COMPLIANCE:
Protocol Violations: {violations}
Escalated Tasks: {escalated}

SYSTEM STATUS: {'🟢 HEALTHY' if violations == 0 and escalated == 0 else '🔴 NEEDS ATTENTION'}
"""
        
        return report

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Chief Orchestrator State Manager')
    parser.add_argument('action', choices=['define', 'delegate', 'check', 'status', 'reset', 'report'])
    parser.add_argument('--task-id', help='Task ID')
    parser.add_argument('--agent', help='Agent name')
    parser.add_argument('--task-file', help='Path to task file')
    parser.add_argument('--priority', default='MEDIUM', help='Task priority')
    parser.add_argument('--state', help='State for reset operation')
    
    args = parser.parse_args()
    
    manager = ChiefOrchestratorStateManager()
    
    if args.action == 'define':
        if not args.task_id or not args.agent or not args.task_file:
            print("Error: define requires --task-id, --agent, and --task-file")
            return 1
        
        success = manager.define_task(args.task_id, args.agent, args.task_file, args.priority)
        return 0 if success else 1
        
    elif args.action == 'delegate':
        if not args.task_id:
            print("Error: delegate requires --task-id")
            return 1
        
        success = manager.delegate_task(args.task_id)
        return 0 if success else 1
        
    elif args.action == 'check':
        if not args.task_id:
            print("Error: check requires --task-id")
            return 1
        
        success = manager.check_task_response(args.task_id)
        return 0 if success else 1
        
    elif args.action == 'status':
        if args.task_id:
            status = manager.get_task_status(args.task_id)
            print(json.dumps(status, indent=2))
        else:
            tasks = manager.list_tasks_by_state()
            print(json.dumps(tasks, indent=2))
        return 0
        
    elif args.action == 'reset':
        if not args.task_id or not args.state:
            print("Error: reset requires --task-id and --state")
            return 1
        
        try:
            state = TaskState(args.state.upper())
            success = manager.reset_task(args.task_id, state)
            return 0 if success else 1
        except ValueError:
            print(f"Error: Invalid state {args.state}")
            return 1
            
    elif args.action == 'report':
        print(manager.generate_status_report())
        return 0

if __name__ == '__main__':
    exit(main())