#!/usr/bin/env python3
"""
CHIEF ORCHESTRATOR FOOLPROOF STATE MANAGER - DEFINITIVE WORKING VERSION
Prevents protocol violations and infinite loops with robust error handling
"""

import json
import os
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple
import subprocess
import logging
import fcntl # For file locking on Unix-like systems
import threading # For thread-safe operations

# Global lock file path - used consistently throughout
LOCK_FILE = "/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/chief_orchestrator_state.lock"

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
        self.initial_check_wait_time = 30  # seconds
        self.backoff_factor = 2
        self.max_check_wait_time = 1800  # 30 minutes
        self.max_check_attempts = 10 # Max attempts before escalation
        
        # ETA-based optimization settings
        self.eta_buffer_minutes = 5  # Buffer before ETA to resume checking
        self.silence_threshold_multiplier = 2  # Resume if no update for 2x initial wait
        self.immediate_acceptance_timeout = 60  # Expect TASK_ACCEPTED within 60 seconds
        
        # Define lock file path as an instance attribute for consistent access
        self.LOCK_FILE = "/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/chief_orchestrator_state.lock"
        
        # Thread-safe operation lock for this instance
        self._operation_lock = threading.RLock()
        
        self.state = None # Lazy load state to prevent race conditions during init
        
        # Internal loop prevention
        self._current_operation = None
        self._operation_count = 0
        self._max_operations_per_cycle = 5
        
        logger.info(f"Chief Orchestrator State Manager initialized")
        logger.info(f"State file: {self.state_file}")

    def _load_or_create_state(self) -> Dict:
        """Load existing state or create new one with robust error handling and file locking"""
        with self._operation_lock:  # Thread-safe operation
            lock_fd = None # Initialize lock_fd
            try:
                # Try to acquire an exclusive lock to create the file if it doesn't exist
                # This is the critical part for initial creation race condition
                if not os.path.exists(self.state_file):
                    try:
                        lock_fd = os.open(self.LOCK_FILE, os.O_CREAT | os.O_EXCL | os.O_RDWR)
                        fcntl.flock(lock_fd, fcntl.LOCK_EX)
                        # File created and locked exclusively, now create empty state
                        new_state = self._create_empty_state()
                        with open(self.state_file, 'w') as f:
                            json.dump(new_state, f, indent=2)
                        logger.info("Created new state file and acquired exclusive lock.")
                        return new_state
                    except FileExistsError: # Another process created it
                        logger.info("State file created by another process, attempting to read.")
                        # Fall through to read existing file
                    except BlockingIOError:
                        logger.warning("Lock file contention during initial creation, retrying load.")
                        raise # Re-raise to be caught by _load_or_create_state_with_retry
                
                # If file exists or was just created by another process, acquire shared lock to read
                if lock_fd is None: # If not already exclusively locked by this process
                    lock_fd = os.open(self.LOCK_FILE, os.O_CREAT | os.O_RDWR)
                    fcntl.flock(lock_fd, fcntl.LOCK_SH)

                with open(self.state_file, 'r') as f:
                    state = json.load(f)
                
                logger.info(f"Loaded existing state with {len(state.get('tasks', {}))} tasks")
                # Ensure all tasks have new fields initialized for backward compatibility
                for task_id, task_data in state.get('tasks', {}).items():
                    task_data.setdefault('check_attempts', 0)
                    task_data.setdefault('next_check_time', None)
                return state

            except BlockingIOError:
                logger.warning("State file is locked, deferring load to retry mechanism...")
                raise # Re-raise to be caught by _load_or_create_state_with_retry
            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON from state file: {e}. Creating new state.")
                # Backup corrupted file
                backup_file = f"{self.state_file}.corrupted_{int(time.time())}"
                if os.path.exists(self.state_file):
                    os.rename(self.state_file, backup_file)
                return self._create_empty_state()
                
            except Exception as e:
                logger.error(f"Unexpected error loading state file: {e}. Creating new state.")
                return self._create_empty_state()
            finally:
                if lock_fd is not None: # Only close if successfully opened
                    fcntl.flock(lock_fd, fcntl.LOCK_UN)
                    os.close(lock_fd)
                    # Don't remove lock file - let OS handle it for better concurrency

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
        """Persist state to file with atomic write and file locking"""
        with self._operation_lock:  # Thread-safe operation
            state_to_save = self._prepare_state_for_json()
            
            lock_fd = None # Initialize lock_fd
            backup_file = None  # Initialize backup_file to prevent UnboundLocalError
            try:
                # Acquire exclusive lock with non-blocking approach
                lock_fd = os.open(self.LOCK_FILE, os.O_CREAT | os.O_RDWR)
                fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                
                # Atomic write with backup
                backup_file = f"{self.state_file}.backup"
                
                if os.path.exists(self.state_file):
                    import shutil
                    shutil.copy2(self.state_file, backup_file)
                
                with open(self.state_file, 'w') as f:
                    json.dump(state_to_save, f, indent=2)
                
                if os.path.exists(backup_file):
                    os.remove(backup_file)
                    
                logger.debug("State saved successfully")
                
            except BlockingIOError:
                logger.warning("State file is locked, deferring save to retry mechanism...")
                raise # Re-raise to be caught by _save_state_with_retry
            except Exception as e:
                logger.error(f"Failed to save state: {e}")
                # backup_file is now guaranteed to be initialized
                if backup_file and os.path.exists(backup_file):
                    import shutil
                    shutil.copy2(backup_file, self.state_file)
                    logger.info("Restored state from backup")
            finally:
                if lock_fd is not None: # Only close if successfully opened
                    fcntl.flock(lock_fd, fcntl.LOCK_UN)
                    os.close(lock_fd)
                    # Don't remove lock file - let OS handle it for better concurrency

    def _prepare_state_for_json(self) -> Dict:
        """Convert datetime objects to ISO strings for JSON serialization"""
        state_copy = json.loads(json.dumps(self.state, default=str))
        
        # Ensure last_updated is ISO string
        state_copy['last_updated'] = datetime.now().isoformat()
        
        # Convert task timestamps
        for task_id, task_data in state_copy['tasks'].items():
            if 'created_at' in task_data and isinstance(task_data['created_at'], datetime):
                task_data['created_at'] = task_data['created_at'].isoformat()
            if 'last_attempt' in task_data and isinstance(task_data['last_attempt'], datetime):
                task_data['last_attempt'] = task_data['last_attempt'].isoformat()
            if 'next_check_time' in task_data and isinstance(task_data['next_check_time'], datetime):
                task_data['next_check_time'] = task_data['next_check_time'].isoformat()
            
            # Convert message timestamps
            for msg in task_data.get('messages', []):
                if 'timestamp' in msg and isinstance(msg['timestamp'], datetime):
                    msg['timestamp'] = msg['timestamp'].isoformat()
        
        # Convert violation timestamps
        for violation in state_copy.get('protocol_violations', []):
            if 'timestamp' in violation and isinstance(violation['timestamp'], datetime):
                violation['timestamp'] = violation['timestamp'].isoformat()
        
        # Convert escalation timestamps
        for escalated in state_copy.get('escalated_tasks', []):
            if 'timestamp' in escalated and isinstance(escalated['timestamp'], datetime):
                escalated['timestamp'] = escalated['timestamp'].isoformat()
        
        return state_copy

    def _load_or_create_state_with_retry(self, max_retries: int = 3) -> Dict:
        """Load state with iterative retry instead of recursion"""
        for attempt in range(max_retries):
            try:
                return self._load_or_create_state()
            except BlockingIOError:
                if attempt < max_retries - 1:
                    wait_time = 0.1 * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Load retry {attempt + 1}/{max_retries}, waiting {wait_time}s")
                    time.sleep(wait_time)
                else:
                    logger.error("Max load retries exceeded, creating empty state")
                    return self._create_empty_state()
        return self._create_empty_state()

    def _save_state_with_retry(self, max_retries: int = 3):
        """Save state with iterative retry instead of recursion"""
        for attempt in range(max_retries):
            try:
                return self._save_state()
            except BlockingIOError:
                if attempt < max_retries - 1:
                    wait_time = 0.1 * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Save retry {attempt + 1}/{max_retries}, waiting {wait_time}s")
                    time.sleep(wait_time)
                else:
                    logger.error("Max save retries exceeded, state may be inconsistent")
                    break

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
        ATOMIC OPERATION: Read-modify-write cycle protected by locks
        """
        with self._operation_lock:  # Ensure atomic operation
            self._prevent_infinite_loops(f"define_task_{task_id}")
            
            logger.info(f"🎯 DEFINING TASK: {task_id}")
            
            # CRITICAL FIX: Lazy load state if not already loaded
            if self.state is None:
                self.state = self._load_or_create_state_with_retry()

            # Validation: Task file must exist
            if not os.path.exists(task_file):
                error_msg = f"Task file does not exist: {task_file}"
                logger.error(error_msg)
                self._log_protocol_violation(f"define_task_{task_id}", error_msg)
                return False
            
            # CRITICAL FIX: Reload state to get latest version before checking
            # This is still needed to ensure we have the absolute latest state before modification
            self.state = self._load_or_create_state_with_retry()
            
            # Validation: Cannot redefine existing task unless UNDEFINED
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
                'check_attempts': 0,
                'next_check_time': None,
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
        ATOMIC OPERATION: State transition protected by locks
        """
        with self._operation_lock:  # Ensure atomic operation
            self._prevent_infinite_loops(f"delegate_task_{task_id}")
            
            logger.info(f"📤 DELEGATING TASK: {task_id}")
            
            # CRITICAL FIX: Lazy load state if not already loaded
            if self.state is None:
                self.state = self._load_or_create_state_with_retry()

            # CRITICAL FIX: Reload state to get latest version before validation
            # This is still needed to ensure we have the absolute latest state before modification
            self.state = self._load_or_create_state_with_retry()
            
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
                'details': result.stdout.strip()
            })
            
            self._save_state()
            logger.info(f"✅ Task {task_id} delegated successfully to {agent}")
            return True
            
        except subprocess.TimeoutExpired:
            error_msg = f"Delegation timeout for task {task_id}"
            logger.error(error_msg)
            self._record_delegation_failure(task, error_msg)
            return False
            
        except subprocess.CalledProcessError as e:
            error_msg = f"Delegation failed for task {task_id}: {e.stderr}"
            logger.error(error_msg)
            self._record_delegation_failure(task, error_msg)
            return False

    def _record_delegation_failure(self, task: Dict, error_msg: str):
        """Record delegation failure in task state"""
        task['delegation_attempts'] += 1
        task['messages'].append({
            'type': 'DELEGATION_FAILED',
            'timestamp': datetime.now().isoformat(),
            'error': error_msg
        })
        self._save_state()

    def check_task_response(self, task_id: str) -> bool:
        """
        GATE 3: Check for agent response (TASK_ACCEPTED, PROGRESS_UPDATE, TASK_COMPLETED)
        Implements adaptive checking with exponential backoff and threshold-based escalation.
        MANDATORY: Task must be in DELEGATED, ACCEPTED, or IN_PROGRESS state.
        """
        self._prevent_infinite_loops(f"check_response_{task_id}")
        
        logger.info(f"📥 CHECKING RESPONSE: {task_id}")
        
        # CRITICAL FIX: Lazy load state if not already loaded
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()

        if task_id not in self.state['tasks']:
            logger.error(f"Task {task_id} not found")
            return False
        
        task = self.state['tasks'][task_id]
        current_state = TaskState(task['state'])
        
        if current_state not in [TaskState.DELEGATED, TaskState.ACCEPTED, TaskState.IN_PROGRESS]:
            logger.warning(f"Task {task_id} in state {current_state.value}, cannot check response")
            return False

        # Initialize next_check_time if not set (e.g., for newly delegated tasks)
        if task['next_check_time'] is None:
            task['next_check_time'] = (datetime.now() + timedelta(seconds=self.initial_check_wait_time)).isoformat()
            self._save_state()
            logger.info(f"Initialized next_check_time for {task_id} to {task['next_check_time']}")
            return True # Wait for the initial period before checking

        # Check if it's time to perform a check
        next_check_dt = datetime.fromisoformat(task['next_check_time'])
        if datetime.now() < next_check_dt:
            logger.info(f"Waiting for next check time for {task_id}. Next check at {task['next_check_time']}")
            return True # Not yet time to check

        # Increment check attempts
        task['check_attempts'] = task.get('check_attempts', 0) + 1
        self._save_state() # Save immediately after incrementing attempts

        # Check for max check attempts before escalation
        if task['check_attempts'] > self.max_check_attempts:
            return self._escalate_task(task_id, f"Max check attempts ({self.max_check_attempts}) exceeded without progress")
        
        # ETA-based optimization: Skip polling if within ETA window and agent is responsive
        if self._should_suspend_polling(task):
            logger.info(f"⏳ Task {task_id} within ETA window, suspending active polling")
            self._schedule_eta_based_check(task)
            return task

        # Use A2A message checker to verify task responses
        try:
            command = [
                'node',
                '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/a2a-message-checker.js',
                '--task',
                task_id
            ]
            
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=30 # Keep a reasonable timeout for the checker itself
            )
            
            output = result.stdout
            state_changed = False
            
            if "TASK_ACCEPTED" in output and ("sent" in output or "YES" in output):
                if task['state'] == TaskState.DELEGATED.value:
                    task['state'] = TaskState.ACCEPTED.value
                    task['messages'].append({
                        'type': 'TASK_ACCEPTED_RECEIVED',
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Extract ETA information from A2A messages if available
                    self._extract_and_store_eta(task, output)
                    
                    logger.info(f"✅ Task {task_id} accepted by agent with ETA optimization")
                    state_changed = True
                
            if "PROGRESS_UPDATE" in output and ("sent" in output or "YES" in output):
                if task['state'] in [TaskState.ACCEPTED.value, TaskState.DELEGATED.value]:
                    task['state'] = TaskState.IN_PROGRESS.value
                    task['messages'].append({
                        'type': 'PROGRESS_UPDATE_RECEIVED',
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Update ETA information from progress updates
                    self._extract_and_store_eta(task, output)
                    task['last_progress_update'] = datetime.now().isoformat()
                    
                    logger.info(f"📊 Task {task_id} in progress with ETA tracking")
                    state_changed = True
                
            if "TASK_COMPLETED" in output and ("sent" in output or "YES" in output):
                task['state'] = TaskState.COMPLETED.value
                task['messages'].append({
                    'type': 'TASK_COMPLETED_RECEIVED',
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"🎉 Task {task_id} completed")
                state_changed = True
            
            if state_changed:
                # Reset check_attempts and next_check_time on successful state change
                task['check_attempts'] = 0
                task['next_check_time'] = None # Reset to be re-initialized on next delegation/check
                self._save_state()
                return True
            else:
                # If no state change, calculate next check time with backoff
                wait_time = self.initial_check_wait_time * (self.backoff_factor ** task['check_attempts'])
                wait_time = min(wait_time, self.max_check_wait_time)
                task['next_check_time'] = (datetime.now() + timedelta(seconds=wait_time)).isoformat()
                self._save_state()
                logger.info(f"No state change for {task_id}. Next check in {wait_time} seconds at {task['next_check_time']}")
                return True # Still waiting, but with backoff

        except Exception as e:
            logger.error(f"Failed to check task response: {e}")
            # On error during check, still apply backoff to avoid hammering
            task['check_attempts'] = task.get('check_attempts', 0) + 1
            wait_time = self.initial_check_wait_time * (self.backoff_factor ** task['check_attempts'])
            wait_time = min(wait_time, self.max_check_wait_time)
            task['next_check_time'] = (datetime.now() + timedelta(seconds=wait_time)).isoformat()
            self._save_state()
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
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
        return self.state['tasks'].get(task_id)

    def list_tasks_by_state(self, state: TaskState = None) -> Dict:
        """List all tasks, optionally filtered by state"""
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
        if state is None:
            return self.state['tasks']
        
        return {
            task_id: task_data 
            for task_id, task_data in self.state['tasks'].items() 
            if task_data['state'] == state.value
        }

    def get_protocol_violations(self) -> List[Dict]:
        """Get all protocol violations"""
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
        return self.state.get('protocol_violations', [])

    def get_escalated_tasks(self) -> List[Dict]:
        """Get all escalated tasks requiring manual intervention"""
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
        return self.state.get('escalated_tasks', [])

    def reset_task(self, task_id: str, to_state: TaskState = TaskState.DEFINED) -> bool:
        """Reset task to specified state (for manual correction)"""
        logger.warning(f"⚠️ MANUALLY RESETTING TASK: {task_id} to {to_state.value}")
        
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()

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

    def force_complete_task(self, task_id: str, reason: str = "Manual override") -> bool:
        """EMERGENCY: Force complete a task (use only for corrections)"""
        logger.warning(f"🔴 FORCE COMPLETING TASK: {task_id} - {reason}")
        
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()

        if task_id in self.state['tasks']:
            self.state['tasks'][task_id]['state'] = TaskState.COMPLETED.value
            self.state['tasks'][task_id]['messages'].append({
                'type': 'FORCE_COMPLETED',
                'timestamp': datetime.now().isoformat(),
                'reason': reason
            })
            self._save_state()
            return True
        
        return False

    def clear_protocol_violations(self) -> bool:
        """Clear all protocol violations (after manual review)"""
        logger.info("🧹 Clearing all protocol violations")
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
        self.state['protocol_violations'] = []
        self._save_state()
        return True

    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        if self.state is None:
            self.state = self._load_or_create_state_with_retry()
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

    def _should_suspend_polling(self, task: Dict) -> bool:
        """Determine if polling should be suspended based on ETA and agent responsiveness"""
        # Don't suspend if task hasn't been accepted yet
        if task['state'] == TaskState.DELEGATED.value:
            # Check if we're past immediate acceptance timeout
            if task.get('created_at'):
                created_time = datetime.fromisoformat(task['created_at'])
                elapsed_seconds = (datetime.now() - created_time).total_seconds()
                if elapsed_seconds > self.immediate_acceptance_timeout:
                    return False  # Continue polling for overdue acceptance
            return False  # Don't suspend for DELEGATED tasks
        
        # Don't suspend if no ETA information available
        if not task.get('estimated_completion_time'):
            return False
        
        try:
            eta_time = datetime.fromisoformat(task['estimated_completion_time'])
            current_time = datetime.now()
            
            # Resume polling if ETA is approaching (within buffer)
            time_until_eta = (eta_time - current_time).total_seconds() / 60  # minutes
            if time_until_eta <= self.eta_buffer_minutes:
                return False  # Don't suspend, ETA is approaching
            
            # Resume polling if agent has been silent too long
            last_update = task.get('last_progress_update')
            if last_update:
                last_update_time = datetime.fromisoformat(last_update)
                silence_duration = (current_time - last_update_time).total_seconds()
                max_silence = self.initial_check_wait_time * self.silence_threshold_multiplier
                if silence_duration > max_silence:
                    return False  # Don't suspend, agent has been silent too long
            
            # Safe to suspend polling - within ETA window and agent is responsive
            return True
            
        except (ValueError, TypeError) as e:
            logger.warning(f"⚠️ Error parsing ETA for task {task.get('task_id', 'unknown')}: {e}")
            return False  # Don't suspend if we can't parse ETA

    def _schedule_eta_based_check(self, task: Dict):
        """Schedule next check based on ETA timing"""
        if not task.get('estimated_completion_time'):
            return
        
        try:
            eta_time = datetime.fromisoformat(task['estimated_completion_time'])
            # Schedule check for ETA buffer time before completion
            check_time = eta_time - timedelta(minutes=self.eta_buffer_minutes)
            
            # Ensure check time is not in the past
            current_time = datetime.now()
            if check_time <= current_time:
                check_time = current_time + timedelta(seconds=self.initial_check_wait_time)
            
            task['next_check_time'] = check_time.isoformat()
            logger.info(f"📅 Next ETA-based check scheduled for {check_time.isoformat()}")
            
        except (ValueError, TypeError) as e:
            logger.warning(f"⚠️ Error scheduling ETA-based check: {e}")
            # Fall back to normal exponential backoff
            self._calculate_next_check_time(task)

    def _extract_and_store_eta(self, task: Dict, a2a_output: str):
        """Extract and store ETA information from A2A message output"""
        try:
            # This is a simplified extraction - in production, you'd parse JSON from A2A messages
            # For now, we'll look for common patterns in the output
            
            import re
            
            # Look for completion time patterns (ISO format)
            completion_time_pattern = r'estimatedCompletionTime[\'\":\s]*([0-9T:\-\.Z]+)'
            match = re.search(completion_time_pattern, a2a_output)
            if match:
                task['estimated_completion_time'] = match.group(1)
                logger.info(f"📊 Extracted ETA: {match.group(1)}")
            
            # Look for remaining minutes
            remaining_pattern = r'estimatedRemainingMinutes[\'\":\s]*(\d+)'
            match = re.search(remaining_pattern, a2a_output)
            if match:
                task['estimated_remaining_minutes'] = int(match.group(1))
                logger.info(f"⏱️ Extracted remaining minutes: {match.group(1)}")
                
        except Exception as e:
            logger.warning(f"⚠️ Error extracting ETA information: {e}")

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Chief Orchestrator State Manager')
    parser.add_argument('action', choices=[
        'define', 'delegate', 'check', 'status', 'reset', 'report', 
        'force-complete', 'clear-violations'
    ])
    parser.add_argument('--task-id', help='Task ID')
    parser.add_argument('--agent', help='Agent name')
    parser.add_argument('--task-file', help='Path to task file')
    parser.add_argument('--priority', default='MEDIUM', help='Task priority')
    parser.add_argument('--state', help='State for reset operation')
    parser.add_argument('--reason', help='Reason for force operations')
    
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
            if status:
                print(json.dumps(status, indent=2))
            else:
                print(f"Task {args.task_id} not found")
                return 1
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
            
    elif args.action == 'force-complete':
        if not args.task_id:
            print("Error: force-complete requires --task-id")
            return 1
        
        reason = args.reason or "Manual override"
        success = manager.force_complete_task(args.task_id, reason)
        return 0 if success else 1
        
    elif args.action == 'clear-violations':
        success = manager.clear_protocol_violations()
        return 0 if success else 1
        
    elif args.action == 'report':
        print(manager.generate_status_report())
        return 0

if __name__ == '__main__':
    exit(main())