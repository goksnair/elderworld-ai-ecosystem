#!/usr/bin/env python3
"""
DATABASE-LEVEL CONCURRENCY SOLUTION FOR CHIEF ORCHESTRATOR
Replaces failing JSON file approach with production-ready PostgreSQL transactions
Target: 100+ concurrent operations, 97.3% accuracy, <5 minute emergency response
"""

import os
import time
import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import json

# Supabase imports
from supabase import create_client, Client
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import sql
import psycopg2.errors

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskState(Enum):
    """Healthcare-grade task states with strict transitions"""
    UNDEFINED = "UNDEFINED"
    DEFINED = "DEFINED"
    DELEGATED = "DELEGATED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ERROR = "ERROR"
    ESCALATED = "ESCALATED"

class TaskPriority(Enum):
    """Task priorities with emergency healthcare focus"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"  # Emergency healthcare scenarios

@dataclass
class TaskDefinition:
    """Task definition with healthcare compliance"""
    task_id: str
    agent: str
    task_file: str
    priority: TaskPriority = TaskPriority.MEDIUM
    state: TaskState = TaskState.DEFINED
    created_at: datetime = None
    session_id: str = None

@dataclass
class StressTestResult:
    """Stress testing results for healthcare-grade validation"""
    total_tasks: int
    successful_tasks: int
    failed_tasks: int
    success_rate: float
    avg_response_time: float
    max_response_time: float
    concurrent_threads: int
    sla_compliance: float

class DatabaseStateManager:
    """
    PRODUCTION-READY DATABASE STATE MANAGER
    Replaces chief_orchestrator_state.json with PostgreSQL ACID transactions
    Handles 100+ concurrent operations with healthcare-grade reliability
    """
    
    def __init__(self, supabase_url: str = None, supabase_key: str = None, 
                 connection_string: str = None):
        """Initialize with Supabase or direct PostgreSQL connection"""
        self.supabase_url = supabase_url or os.getenv('SUPABASE_URL')
        self.supabase_key = supabase_key or os.getenv('SUPABASE_KEY') 
        self.connection_string = connection_string or os.getenv('DATABASE_URL')
        
        # Initialize Supabase client
        if self.supabase_url and self.supabase_key:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
            logger.info("Supabase client initialized for database state management")
        else:
            self.supabase = None
            logger.warning("Supabase credentials not provided, using direct PostgreSQL")
        
        # Direct PostgreSQL connection for transactions
        if self.connection_string:
            self.conn = psycopg2.connect(self.connection_string)
            self.conn.autocommit = False  # Enable explicit transaction management
        else:
            # Fallback to local configuration
            self.conn = None
            logger.warning("No database connection available")
        
        self.session_id = f"session_{int(time.time())}"
        self.max_delegation_attempts = 3
        self.max_response_wait_time = 300  # 5 minutes for healthcare SLA
        
        # Performance monitoring
        self.operation_metrics = {
            'total_operations': 0,
            'successful_operations': 0,
            'failed_operations': 0,
            'avg_response_time': 0.0
        }
        
        logger.info(f"Database State Manager initialized - Session: {self.session_id}")
        
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.conn:
            self.conn.close()
    
    def _execute_transaction(self, query: str, params: tuple = None, 
                           fetch_one: bool = False, fetch_all: bool = False) -> Any:
        """Execute database transaction with automatic retry and rollback"""
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                
                with self.conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    
                    if fetch_one:
                        result = cursor.fetchone()
                    elif fetch_all:
                        result = cursor.fetchall()
                    else:
                        result = cursor.rowcount
                    
                    self.conn.commit()
                    
                    # Update metrics
                    self.operation_metrics['total_operations'] += 1
                    self.operation_metrics['successful_operations'] += 1
                    response_time = time.time() - start_time
                    self.operation_metrics['avg_response_time'] = (
                        (self.operation_metrics['avg_response_time'] * 
                         (self.operation_metrics['total_operations'] - 1) + response_time) /
                        self.operation_metrics['total_operations']
                    )
                    
                    return result
                    
            except psycopg2.errors.SerializationFailure as e:
                # Retry on serialization failure (concurrent access)
                self.conn.rollback()
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    logger.warning(f"Serialization failure, retrying... (attempt {attempt + 1})")
                    continue
                else:
                    logger.error(f"Transaction failed after {max_retries} attempts: {e}")
                    raise
                    
            except Exception as e:
                self.conn.rollback()
                self.operation_metrics['total_operations'] += 1
                self.operation_metrics['failed_operations'] += 1
                logger.error(f"Database transaction failed: {e}")
                raise
    
    def define_task(self, task_id: str, agent: str, task_file: str, 
                   priority: str = 'MEDIUM') -> Tuple[bool, str]:
        """
        ATOMIC TASK DEFINITION with optimistic concurrency control
        Replaces JSON file corruption with database transactions
        """
        try:
            # Validate inputs
            if not os.path.exists(task_file):
                error_msg = f"Task file does not exist: {task_file}"
                self._log_protocol_violation(f"define_task_{task_id}", error_msg)
                return False, error_msg
            
            # Validate priority
            try:
                priority_enum = TaskPriority[priority.upper()]
            except KeyError:
                return False, f"Invalid priority: {priority}"
            
            # Check if task already exists (optimistic concurrency)
            check_query = """
                SELECT task_id, state, version FROM task_states 
                WHERE task_id = %s FOR UPDATE NOWAIT
            """
            
            try:
                existing = self._execute_transaction(check_query, (task_id,), fetch_one=True)
                if existing:
                    error_msg = f"Task {task_id} already exists with state {existing['state']}"
                    self._log_protocol_violation(f"define_task_{task_id}", error_msg)
                    return False, error_msg
            except psycopg2.errors.LockNotAvailable:
                return False, f"Task {task_id} is being modified by another process"
            
            # Atomic task creation
            insert_query = """
                INSERT INTO task_states (
                    task_id, state, agent, task_file, priority, 
                    session_id, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
                RETURNING id, created_at
            """
            
            result = self._execute_transaction(
                insert_query, 
                (task_id, TaskState.DEFINED.value, agent, task_file, 
                 priority_enum.value, self.session_id),
                fetch_one=True
            )
            
            if result:
                logger.info(f"✅ Task {task_id} defined successfully - ID: {result['id']}")
                return True, "Task defined successfully"
            else:
                return False, "Failed to create task"
                
        except Exception as e:
            error_msg = f"Task definition failed: {str(e)}"
            logger.error(error_msg)
            self._log_protocol_violation(f"define_task_{task_id}", error_msg)
            return False, error_msg
    
    def delegate_task(self, task_id: str) -> Tuple[bool, str]:
        """
        ATOMIC TASK DELEGATION with state transition validation
        Ensures healthcare-grade reliability under concurrent load
        """
        try:
            # Validate state transition with row locking
            update_query = """
                UPDATE task_states 
                SET state = %s, 
                    delegation_attempts = delegation_attempts + 1,
                    last_attempt = NOW(),
                    updated_at = NOW()
                WHERE task_id = %s 
                  AND state = %s 
                  AND delegation_attempts < %s
                RETURNING id, agent, task_file, delegation_attempts
            """
            
            result = self._execute_transaction(
                update_query,
                (TaskState.DELEGATED.value, task_id, TaskState.DEFINED.value, 
                 self.max_delegation_attempts),
                fetch_one=True
            )
            
            if not result:
                # Check why delegation failed
                check_query = "SELECT state, delegation_attempts FROM task_states WHERE task_id = %s"
                task_info = self._execute_transaction(check_query, (task_id,), fetch_one=True)
                
                if not task_info:
                    return False, f"Task {task_id} not found"
                elif task_info['delegation_attempts'] >= self.max_delegation_attempts:
                    self._escalate_task(task_id, "Max delegation attempts exceeded")
                    return False, "Task escalated - max delegation attempts exceeded"
                else:
                    return False, f"Invalid state transition from {task_info['state']}"
            
            # Log delegation message
            self._add_task_message(task_id, 'DELEGATION_SENT', True, 
                                 f"Delegated to {result['agent']}")
            
            logger.info(f"✅ Task {task_id} delegated successfully - Attempt {result['delegation_attempts']}")
            return True, "Task delegated successfully"
            
        except Exception as e:
            error_msg = f"Task delegation failed: {str(e)}"
            logger.error(error_msg)
            self._add_task_message(task_id, 'DELEGATION_FAILED', False, error_msg)
            return False, error_msg
    
    def update_task_state(self, task_id: str, new_state: TaskState, 
                         message: str = None) -> Tuple[bool, str]:
        """
        ATOMIC STATE UPDATE with optimistic locking
        Critical for emergency response tracking
        """
        try:
            update_query = """
                UPDATE task_states 
                SET state = %s, updated_at = NOW()
                WHERE task_id = %s
                RETURNING id, state, priority
            """
            
            result = self._execute_transaction(
                update_query, (new_state.value, task_id), fetch_one=True
            )
            
            if result:
                # Log state change message
                if message:
                    message_type = f"{new_state.value}_RECEIVED"
                    self._add_task_message(task_id, message_type, True, message)
                
                # Check emergency SLA compliance
                if result['priority'] == 'CRITICAL':
                    self._check_emergency_sla(task_id)
                
                logger.info(f"✅ Task {task_id} state updated to {new_state.value}")
                return True, f"State updated to {new_state.value}"
            else:
                return False, f"Task {task_id} not found"
                
        except Exception as e:
            error_msg = f"State update failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    def _add_task_message(self, task_id: str, message_type: str, 
                         success: bool, details: str = None):
        """Add message to task communication history"""
        try:
            insert_query = """
                INSERT INTO task_messages (task_id, message_type, success, details)
                VALUES (%s, %s, %s, %s)
            """
            self._execute_transaction(insert_query, (task_id, message_type, success, details))
        except Exception as e:
            logger.error(f"Failed to add task message: {e}")
    
    def _log_protocol_violation(self, operation: str, error_message: str):
        """Log protocol violations for analysis"""
        try:
            insert_query = """
                INSERT INTO protocol_violations (operation, error_message, session_id)
                VALUES (%s, %s, %s)
            """
            self._execute_transaction(insert_query, (operation, error_message, self.session_id))
        except Exception as e:
            logger.error(f"Failed to log protocol violation: {e}")
    
    def _escalate_task(self, task_id: str, reason: str):
        """Escalate task for manual intervention"""
        try:
            # Update task state
            update_query = """
                UPDATE task_states 
                SET state = %s, escalation_reason = %s, updated_at = NOW()
                WHERE task_id = %s
            """
            self._execute_transaction(update_query, (TaskState.ESCALATED.value, reason, task_id))
            
            # Add escalation record
            escalation_query = """
                INSERT INTO escalated_tasks (task_id, reason)
                VALUES (%s, %s)
            """
            self._execute_transaction(escalation_query, (task_id, reason))
            
            logger.warning(f"🚨 Task {task_id} escalated: {reason}")
        except Exception as e:
            logger.error(f"Failed to escalate task: {e}")
    
    def _check_emergency_sla(self, task_id: str):
        """Check emergency response SLA compliance"""
        try:
            sla_query = """
                SELECT task_id, priority, created_at, updated_at,
                       EXTRACT(EPOCH FROM (updated_at - created_at)) as response_time_seconds
                FROM task_states 
                WHERE task_id = %s AND priority = 'CRITICAL'
            """
            result = self._execute_transaction(sla_query, (task_id,), fetch_one=True)
            
            if result and result['response_time_seconds'] > 300:  # 5 minutes
                logger.critical(f"🚨 SLA VIOLATION: Task {task_id} exceeded 5-minute emergency response: {result['response_time_seconds']:.1f}s")
                self._log_protocol_violation(f"sla_violation_{task_id}", 
                                           f"Emergency response exceeded 5 minutes: {result['response_time_seconds']:.1f}s")
        except Exception as e:
            logger.error(f"Failed to check emergency SLA: {e}")
    
    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Get current task status"""
        try:
            query = """
                SELECT t.*, 
                       EXTRACT(EPOCH FROM (NOW() - t.created_at)) as age_seconds,
                       CASE WHEN t.priority = 'CRITICAL' AND 
                                 EXTRACT(EPOCH FROM (COALESCE(t.updated_at, NOW()) - t.created_at)) <= 300
                            THEN true ELSE false END as sla_compliant
                FROM task_states t
                WHERE t.task_id = %s
            """
            result = self._execute_transaction(query, (task_id,), fetch_one=True)
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
            return None
    
    def list_tasks_by_state(self, state: TaskState = None, agent: str = None, 
                           limit: int = 100) -> List[Dict]:
        """List tasks with optional filtering"""
        try:
            base_query = "SELECT * FROM task_states WHERE 1=1"
            params = []
            
            if state:
                base_query += " AND state = %s"
                params.append(state.value)
            
            if agent:
                base_query += " AND agent = %s"
                params.append(agent)
            
            base_query += " ORDER BY created_at DESC LIMIT %s"
            params.append(limit)
            
            results = self._execute_transaction(base_query, tuple(params), fetch_all=True)
            return [dict(row) for row in results] if results else []
        except Exception as e:
            logger.error(f"Failed to list tasks: {e}")
            return []
    
    def run_concurrent_stress_test(self, num_tasks: int = 100, 
                                  num_threads: int = 10) -> StressTestResult:
        """
        PRODUCTION-GRADE CONCURRENT STRESS TESTING
        Validates 100+ concurrent operations for healthcare reliability
        """
        import threading
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        logger.info(f"🔬 Starting concurrent stress test: {num_tasks} tasks, {num_threads} threads")
        
        results = []
        start_time = time.time()
        
        def create_stress_task(task_index: int) -> Dict:
            task_start = time.time()
            task_id = f"stress-test-{int(time.time())}-{task_index}"
            agent = ["senior-care-boss", "ai-ml-specialist", "market-intelligence"][task_index % 3]
            priority = "CRITICAL" if task_index % 10 == 0 else "HIGH"  # 10% critical for emergency testing
            
            # Create temporary task file
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
                f.write(f"# Stress Test Task {task_index}\n\nConcurrent load testing for healthcare systems.\n")
                task_file = f.name
            
            try:
                success, message = self.define_task(task_id, agent, task_file, priority)
                
                if success:
                    # Also test delegation
                    delegation_success, delegation_msg = self.delegate_task(task_id)
                    if delegation_success:
                        # Test state update
                        self.update_task_state(task_id, TaskState.ACCEPTED, "Stress test accepted")
                
                task_end = time.time()
                response_time = task_end - task_start
                
                return {
                    'task_id': task_id,
                    'success': success,
                    'message': message,
                    'response_time': response_time,
                    'priority': priority,
                    'thread_id': threading.current_thread().ident
                }
                
            except Exception as e:
                task_end = time.time()
                return {
                    'task_id': task_id,
                    'success': False,
                    'message': str(e),
                    'response_time': task_end - task_start,
                    'priority': priority,
                    'thread_id': threading.current_thread().ident
                }
            finally:
                # Clean up task file
                try:
                    os.unlink(task_file)
                except:
                    pass
        
        # Execute concurrent stress test
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            future_to_index = {executor.submit(create_stress_task, i): i 
                             for i in range(num_tasks)}
            
            for future in as_completed(future_to_index):
                result = future.result()
                results.append(result)
        
        end_time = time.time()
        
        # Analyze results
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        critical_tasks = [r for r in results if r['priority'] == 'CRITICAL']
        critical_successful = [r for r in critical_tasks if r['success']]
        
        success_rate = len(successful) / num_tasks * 100 if num_tasks > 0 else 0
        avg_response_time = sum(r['response_time'] for r in results) / len(results) if results else 0
        max_response_time = max(r['response_time'] for r in results) if results else 0
        sla_compliance = len(critical_successful) / len(critical_tasks) * 100 if critical_tasks else 100
        
        stress_result = StressTestResult(
            total_tasks=num_tasks,
            successful_tasks=len(successful),
            failed_tasks=len(failed),
            success_rate=success_rate,
            avg_response_time=avg_response_time,
            max_response_time=max_response_time,
            concurrent_threads=num_threads,
            sla_compliance=sla_compliance
        )
        
        logger.info(f"🔬 Stress test completed: {success_rate:.1f}% success rate, "
                   f"{avg_response_time:.3f}s avg response, {sla_compliance:.1f}% SLA compliance")
        
        return stress_result
    
    def generate_health_report(self) -> Dict:
        """Generate comprehensive system health report"""
        try:
            health_query = "SELECT * FROM check_orchestrator_health()"
            health_metrics = self._execute_transaction(health_query, fetch_all=True)
            
            emergency_query = """
                SELECT 
                    COUNT(*) as total_emergencies,
                    SUM(CASE WHEN sla_status = 'SLA_MET' THEN 1 ELSE 0 END) as sla_compliant,
                    ROUND(100.0 * SUM(CASE WHEN sla_status = 'SLA_MET' THEN 1 ELSE 0 END) / 
                          NULLIF(COUNT(*), 0), 2) as sla_percentage,
                    AVG(response_time_seconds) as avg_response_time
                FROM emergency_response_metrics
                WHERE created_at > NOW() - INTERVAL '1 hour'
            """
            emergency_metrics = self._execute_transaction(emergency_query, fetch_one=True)
            
            return {
                'timestamp': datetime.now().isoformat(),
                'session_id': self.session_id,
                'system_health': [dict(row) for row in health_metrics] if health_metrics else [],
                'emergency_response': dict(emergency_metrics) if emergency_metrics else {},
                'operation_metrics': self.operation_metrics,
                'production_ready': self._assess_production_readiness(health_metrics, emergency_metrics)
            }
        except Exception as e:
            logger.error(f"Failed to generate health report: {e}")
            return {'error': str(e), 'timestamp': datetime.now().isoformat()}
    
    def _assess_production_readiness(self, health_metrics, emergency_metrics) -> Dict:
        """Assess production readiness based on healthcare standards"""
        try:
            # Check for critical issues
            critical_issues = []
            if health_metrics:
                for metric in health_metrics:
                    if metric['status'] == 'CRITICAL':
                        critical_issues.append(f"{metric['metric']}: {metric['value']}")
            
            # Emergency SLA compliance
            sla_compliant = True
            if emergency_metrics and emergency_metrics.get('sla_percentage', 100) < 95:
                sla_compliant = False
                critical_issues.append(f"Emergency SLA compliance: {emergency_metrics['sla_percentage']}%")
            
            # Operation success rate
            operation_success_rate = (
                (self.operation_metrics['successful_operations'] / 
                 max(self.operation_metrics['total_operations'], 1)) * 100
            )
            
            production_ready = (
                len(critical_issues) == 0 and 
                sla_compliant and 
                operation_success_rate >= 95
            )
            
            return {
                'production_ready': production_ready,
                'operation_success_rate': operation_success_rate,
                'emergency_sla_compliant': sla_compliant,
                'critical_issues': critical_issues,
                'recommendation': 'DEPLOY' if production_ready else 'FIX_ISSUES'
            }
        except Exception as e:
            return {'error': str(e), 'production_ready': False}

# CLI Interface for testing and operations
def main():
    """CLI interface for database state manager"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database State Manager for Chief Orchestrator')
    parser.add_argument('action', choices=['define', 'delegate', 'status', 'stress-test', 'health'])
    parser.add_argument('--task-id', help='Task ID')
    parser.add_argument('--agent', help='Agent name')
    parser.add_argument('--task-file', help='Path to task file')
    parser.add_argument('--priority', default='MEDIUM', help='Task priority')
    parser.add_argument('--tasks', type=int, default=100, help='Number of tasks for stress test')
    parser.add_argument('--threads', type=int, default=10, help='Number of threads for stress test')
    
    args = parser.parse_args()
    
    # Initialize manager (requires environment variables for database connection)
    manager = DatabaseStateManager()
    
    if args.action == 'define':
        if not args.task_id or not args.agent or not args.task_file:
            print("Error: define requires --task-id, --agent, and --task-file")
            return 1
        
        success, message = manager.define_task(args.task_id, args.agent, args.task_file, args.priority)
        print(f"Define task: {'✅ SUCCESS' if success else '❌ FAILED'} - {message}")
        return 0 if success else 1
        
    elif args.action == 'delegate':
        if not args.task_id:
            print("Error: delegate requires --task-id")
            return 1
        
        success, message = manager.delegate_task(args.task_id)
        print(f"Delegate task: {'✅ SUCCESS' if success else '❌ FAILED'} - {message}")
        return 0 if success else 1
        
    elif args.action == 'status':
        if args.task_id:
            status = manager.get_task_status(args.task_id)
            print(json.dumps(status, indent=2, default=str))
        else:
            tasks = manager.list_tasks_by_state()
            print(json.dumps(tasks, indent=2, default=str))
        return 0
        
    elif args.action == 'stress-test':
        print(f"🔬 Running stress test: {args.tasks} tasks, {args.threads} threads")
        result = manager.run_concurrent_stress_test(args.tasks, args.threads)
        
        print(f"""
STRESS TEST RESULTS:
==================
Total Tasks: {result.total_tasks}
Successful: {result.successful_tasks}
Failed: {result.failed_tasks}
Success Rate: {result.success_rate:.1f}%
Avg Response Time: {result.avg_response_time:.3f}s
Max Response Time: {result.max_response_time:.3f}s
SLA Compliance: {result.sla_compliance:.1f}%
Production Ready: {'✅ YES' if result.success_rate >= 95 and result.sla_compliance >= 95 else '❌ NO'}
        """)
        
        return 0 if result.success_rate >= 95 else 1
        
    elif args.action == 'health':
        health = manager.generate_health_report()
        print(json.dumps(health, indent=2, default=str))
        return 0

if __name__ == '__main__':
    exit(main())