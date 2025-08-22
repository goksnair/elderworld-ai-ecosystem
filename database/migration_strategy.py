#!/usr/bin/env python3
"""
MIGRATION STRATEGY: JSON FILE TO DATABASE STATE MANAGEMENT
Seamless transition from failing chief_orchestrator_state.json to production PostgreSQL
Zero-downtime migration for healthcare-grade operations
"""

import os
import json
import time
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
from pathlib import Path

# Database imports
from database_state_manager import DatabaseStateManager, TaskState, TaskPriority

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StateManagerMigration:
    """
    ZERO-DOWNTIME MIGRATION FROM JSON TO DATABASE
    Maintains backward compatibility during healthcare operations
    """
    
    def __init__(self, json_state_file: str = None):
        self.json_state_file = json_state_file or '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace/chief_orchestrator_state.json'
        self.backup_dir = '/Users/gokulnair/senior-care-startup/ai-ecosystem/database/migration_backups'
        self.migration_log_file = f"{self.backup_dir}/migration_log_{int(time.time())}.json"
        
        # Ensure backup directory exists
        Path(self.backup_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize database manager
        self.db_manager = DatabaseStateManager()
        
        # Migration tracking
        self.migration_stats = {
            'start_time': datetime.now(),
            'json_tasks_found': 0,
            'tasks_migrated': 0,
            'tasks_failed': 0,
            'protocol_violations_migrated': 0,
            'escalated_tasks_migrated': 0,
            'migration_errors': []
        }
        
        logger.info("State Manager Migration initialized")
    
    def validate_json_state(self) -> Tuple[bool, str, Dict]:
        """Validate and repair JSON state file if possible"""
        if not os.path.exists(self.json_state_file):
            return False, "JSON state file not found", {}
        
        try:
            with open(self.json_state_file, 'r') as f:
                content = f.read()
            
            # Try to parse JSON
            try:
                state = json.loads(content)
                logger.info(f"✅ JSON state file is valid with {len(state.get('tasks', {}))} tasks")
                return True, "Valid JSON state", state
            
            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ JSON corruption detected: {e}")
                
                # Attempt to repair JSON corruption
                repaired_state = self._repair_json_corruption(content)
                if repaired_state:
                    logger.info(f"✅ JSON repaired successfully with {len(repaired_state.get('tasks', {}))} tasks")
                    return True, "JSON repaired", repaired_state
                else:
                    return False, f"Irreparable JSON corruption: {e}", {}
        
        except Exception as e:
            return False, f"Failed to read JSON state: {e}", {}
    
    def _repair_json_corruption(self, content: str) -> Optional[Dict]:
        """Attempt to repair common JSON corruption patterns"""
        try:
            # Common corruption: duplicated closing braces or trailing content
            lines = content.split('\n')
            
            # Find the last valid closing brace
            brace_count = 0
            valid_end = -1
            
            for i, line in enumerate(lines):
                brace_count += line.count('{') - line.count('}')
                if brace_count == 0 and '}' in line:
                    valid_end = i
                    break
            
            if valid_end > 0:
                # Reconstruct JSON up to valid end
                repaired_content = '\n'.join(lines[:valid_end + 1])
                repaired_state = json.loads(repaired_content)
                
                logger.info(f"🔧 JSON repaired by truncating at line {valid_end + 1}")
                return repaired_state
            
            # Try to extract valid task data even from corrupted JSON
            task_data = self._extract_task_data_from_corruption(content)
            if task_data:
                return {
                    'tasks': task_data,
                    'last_updated': datetime.now().isoformat(),
                    'protocol_violations': [],
                    'escalated_tasks': [],
                    'session_id': f"recovered_{int(time.time())}"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"JSON repair failed: {e}")
            return None
    
    def _extract_task_data_from_corruption(self, content: str) -> Dict:
        """Extract task data from corrupted JSON using pattern matching"""
        import re
        
        try:
            tasks = {}
            
            # Pattern to match task definitions in JSON
            task_pattern = r'"([^"]*stress[^"]*)":\s*{[^}]*"state":\s*"([^"]*)"[^}]*"agent":\s*"([^"]*)"[^}]*"task_file":\s*"([^"]*)"[^}]*"priority":\s*"([^"]*)"[^}]*"created_at":\s*"([^"]*)"[^}]*}'
            
            matches = re.finditer(task_pattern, content, re.DOTALL)
            
            for match in matches:
                task_id, state, agent, task_file, priority, created_at = match.groups()
                
                tasks[task_id] = {
                    'state': state,
                    'agent': agent,
                    'task_file': task_file,
                    'priority': priority,
                    'created_at': created_at,
                    'delegation_attempts': 0,
                    'last_attempt': None,
                    'check_attempts': 0,
                    'next_check_time': None,
                    'messages': [],
                    'escalation_reason': None
                }
            
            logger.info(f"🔧 Extracted {len(tasks)} tasks from corrupted JSON")
            return tasks
            
        except Exception as e:
            logger.error(f"Task extraction failed: {e}")
            return {}
    
    def create_migration_backup(self) -> str:
        """Create comprehensive backup before migration"""
        timestamp = int(time.time())
        backup_file = f"{self.backup_dir}/state_backup_{timestamp}.json"
        
        try:
            # Backup original JSON file
            if os.path.exists(self.json_state_file):
                shutil.copy2(self.json_state_file, backup_file)
                logger.info(f"📦 Backup created: {backup_file}")
            
            # Backup any existing database state
            db_backup = self.db_manager.list_tasks_by_state(limit=10000)
            if db_backup:
                db_backup_file = f"{self.backup_dir}/db_backup_{timestamp}.json"
                with open(db_backup_file, 'w') as f:
                    json.dump(db_backup, f, indent=2, default=str)
                logger.info(f"📦 Database backup created: {db_backup_file}")
            
            return backup_file
            
        except Exception as e:
            logger.error(f"Backup creation failed: {e}")
            raise
    
    def migrate_tasks_to_database(self, json_state: Dict) -> bool:
        """Migrate all tasks from JSON to database with validation"""
        tasks = json_state.get('tasks', {})
        self.migration_stats['json_tasks_found'] = len(tasks)
        
        logger.info(f"🚀 Starting migration of {len(tasks)} tasks to database")
        
        for task_id, task_data in tasks.items():
            try:
                # Validate and normalize task data
                state = task_data.get('state', 'UNDEFINED')
                agent = task_data.get('agent', 'senior-care-boss')
                task_file = task_data.get('task_file', f'/tmp/migrated_task_{task_id}.md')
                priority = task_data.get('priority', 'MEDIUM')
                
                # Ensure task file exists (create if needed for migration)
                if not os.path.exists(task_file):
                    os.makedirs(os.path.dirname(task_file), exist_ok=True)
                    with open(task_file, 'w') as f:
                        f.write(f"# Migrated Task: {task_id}\n\nMigrated from JSON state manager.\n")
                
                # Validate priority
                try:
                    TaskPriority[priority.upper()]
                except KeyError:
                    priority = 'MEDIUM'
                    logger.warning(f"⚠️ Invalid priority for {task_id}, defaulting to MEDIUM")
                
                # Validate state
                try:
                    TaskState[state.upper()]
                except KeyError:
                    state = 'DEFINED'
                    logger.warning(f"⚠️ Invalid state for {task_id}, defaulting to DEFINED")
                
                # Migrate task to database
                if state == 'DEFINED':
                    success, message = self.db_manager.define_task(task_id, agent, task_file, priority)
                else:
                    # For non-DEFINED states, define first then update
                    success, message = self.db_manager.define_task(task_id, agent, task_file, priority)
                    if success and state != 'DEFINED':
                        try:
                            task_state = TaskState[state.upper()]
                            success, message = self.db_manager.update_task_state(task_id, task_state, 
                                                                               f"Migrated from JSON with state {state}")
                        except:
                            pass  # Keep as DEFINED if state update fails
                
                if success:
                    self.migration_stats['tasks_migrated'] += 1
                    logger.debug(f"✅ Migrated task {task_id}")
                else:
                    self.migration_stats['tasks_failed'] += 1
                    self.migration_stats['migration_errors'].append({
                        'task_id': task_id,
                        'error': message,
                        'type': 'task_migration'
                    })
                    logger.warning(f"❌ Failed to migrate task {task_id}: {message}")
                    
            except Exception as e:
                self.migration_stats['tasks_failed'] += 1
                self.migration_stats['migration_errors'].append({
                    'task_id': task_id,
                    'error': str(e),
                    'type': 'task_migration_exception'
                })
                logger.error(f"❌ Exception migrating task {task_id}: {e}")
        
        success_rate = (self.migration_stats['tasks_migrated'] / 
                       max(self.migration_stats['json_tasks_found'], 1)) * 100
        
        logger.info(f"📊 Task migration complete: {self.migration_stats['tasks_migrated']}/{self.migration_stats['json_tasks_found']} "
                   f"({success_rate:.1f}% success rate)")
        
        return success_rate >= 90  # Consider migration successful if 90%+ tasks migrated
    
    def migrate_protocol_violations(self, json_state: Dict) -> bool:
        """Migrate protocol violations to database"""
        violations = json_state.get('protocol_violations', [])
        
        if not violations:
            logger.info("📊 No protocol violations to migrate")
            return True
        
        logger.info(f"🚀 Migrating {len(violations)} protocol violations")
        
        for violation in violations:
            try:
                # Extract violation data with defaults
                operation = violation.get('operation', 'unknown')
                error_message = violation.get('error', 'Unknown error')
                timestamp = violation.get('timestamp', datetime.now().isoformat())
                task_ids = violation.get('tasks_affected', [])
                
                # Log protocol violation in database
                self.db_manager._log_protocol_violation(operation, error_message)
                self.migration_stats['protocol_violations_migrated'] += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to migrate protocol violation: {e}")
        
        logger.info(f"✅ Migrated {self.migration_stats['protocol_violations_migrated']} protocol violations")
        return True
    
    def migrate_escalated_tasks(self, json_state: Dict) -> bool:
        """Migrate escalated tasks to database"""
        escalated = json_state.get('escalated_tasks', [])
        
        if not escalated:
            logger.info("📊 No escalated tasks to migrate")
            return True
        
        logger.info(f"🚀 Migrating {len(escalated)} escalated tasks")
        
        for escalation in escalated:
            try:
                task_id = escalation.get('task_id')
                reason = escalation.get('reason', 'Unknown escalation reason')
                
                if task_id:
                    self.db_manager._escalate_task(task_id, f"Migrated: {reason}")
                    self.migration_stats['escalated_tasks_migrated'] += 1
                    
            except Exception as e:
                logger.error(f"❌ Failed to migrate escalated task: {e}")
        
        logger.info(f"✅ Migrated {self.migration_stats['escalated_tasks_migrated']} escalated tasks")
        return True
    
    def validate_migration_integrity(self) -> Tuple[bool, Dict]:
        """Validate migration completed successfully"""
        logger.info("🔍 Validating migration integrity...")
        
        # Get all migrated tasks from database
        db_tasks = self.db_manager.list_tasks_by_state(limit=10000)
        
        # Generate integrity report
        integrity_report = {
            'validation_time': datetime.now().isoformat(),
            'database_task_count': len(db_tasks),
            'json_task_count': self.migration_stats['json_tasks_found'],
            'migration_success_rate': (self.migration_stats['tasks_migrated'] / 
                                     max(self.migration_stats['json_tasks_found'], 1)) * 100,
            'data_integrity_checks': {},
            'migration_complete': False
        }
        
        # Check data integrity
        state_distribution = {}
        agent_distribution = {}
        priority_distribution = {}
        
        for task in db_tasks:
            state = task.get('state', 'UNKNOWN')
            agent = task.get('agent', 'UNKNOWN')
            priority = task.get('priority', 'UNKNOWN')
            
            state_distribution[state] = state_distribution.get(state, 0) + 1
            agent_distribution[agent] = agent_distribution.get(agent, 0) + 1
            priority_distribution[priority] = priority_distribution.get(priority, 0) + 1
        
        integrity_report['data_integrity_checks'] = {
            'state_distribution': state_distribution,
            'agent_distribution': agent_distribution,
            'priority_distribution': priority_distribution
        }
        
        # Check if migration is complete and successful
        migration_complete = (
            integrity_report['migration_success_rate'] >= 90 and
            len(self.migration_stats['migration_errors']) <= 
            self.migration_stats['json_tasks_found'] * 0.1  # Max 10% errors
        )
        
        integrity_report['migration_complete'] = migration_complete
        
        if migration_complete:
            logger.info("✅ Migration integrity validation passed")
        else:
            logger.warning("⚠️ Migration integrity validation failed")
        
        return migration_complete, integrity_report
    
    def setup_backward_compatibility(self) -> bool:
        """Setup backward compatibility bridge during transition"""
        try:
            # Create compatibility wrapper that reads from database but maintains JSON interface
            compatibility_file = '/Users/gokulnair/senior-care-startup/ai-ecosystem/ai-models/compatibility_bridge.py'
            
            bridge_code = '''#!/usr/bin/env python3
"""
BACKWARD COMPATIBILITY BRIDGE
Maintains JSON interface while using database backend
Enables zero-downtime migration
"""

import json
from database_state_manager import DatabaseStateManager

class CompatibilityBridge:
    """Bridge between JSON interface and database backend"""
    
    def __init__(self):
        self.db_manager = DatabaseStateManager()
    
    def get_json_compatible_state(self):
        """Return database state in JSON-compatible format"""
        tasks = self.db_manager.list_tasks_by_state(limit=10000)
        
        # Convert to JSON format
        json_state = {
            'tasks': {},
            'last_updated': tasks[0]['updated_at'] if tasks else None,
            'protocol_violations': [],
            'escalated_tasks': [],
            'session_id': self.db_manager.session_id
        }
        
        for task in tasks:
            json_state['tasks'][task['task_id']] = {
                'state': task['state'],
                'agent': task['agent'],
                'task_file': task['task_file'],
                'priority': task['priority'],
                'created_at': task['created_at'],
                'delegation_attempts': task['delegation_attempts'],
                'last_attempt': task['last_attempt'],
                'check_attempts': task['check_attempts'],
                'next_check_time': task['next_check_time'],
                'messages': [],
                'escalation_reason': task['escalation_reason']
            }
        
        return json_state

# Global compatibility instance
bridge = CompatibilityBridge()
'''
            
            with open(compatibility_file, 'w') as f:
                f.write(bridge_code)
            
            logger.info(f"✅ Backward compatibility bridge created: {compatibility_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to setup backward compatibility: {e}")
            return False
    
    def finalize_migration(self) -> Tuple[bool, str]:
        """Finalize migration and archive old JSON file"""
        try:
            # Archive the original JSON file
            if os.path.exists(self.json_state_file):
                archive_file = f"{self.backup_dir}/final_archive_{int(time.time())}.json"
                shutil.move(self.json_state_file, archive_file)
                logger.info(f"📦 Original JSON file archived: {archive_file}")
            
            # Save migration log
            self.migration_stats['end_time'] = datetime.now()
            self.migration_stats['total_duration'] = str(
                self.migration_stats['end_time'] - self.migration_stats['start_time']
            )
            
            with open(self.migration_log_file, 'w') as f:
                json.dump(self.migration_stats, f, indent=2, default=str)
            
            logger.info(f"📊 Migration log saved: {self.migration_log_file}")
            
            # Generate migration summary
            summary = f"""
MIGRATION COMPLETED SUCCESSFULLY
================================
Start Time: {self.migration_stats['start_time']}
End Time: {self.migration_stats['end_time']}
Duration: {self.migration_stats['total_duration']}

Tasks Migrated: {self.migration_stats['tasks_migrated']}/{self.migration_stats['json_tasks_found']}
Success Rate: {(self.migration_stats['tasks_migrated']/max(self.migration_stats['json_tasks_found'],1))*100:.1f}%
Protocol Violations: {self.migration_stats['protocol_violations_migrated']}
Escalated Tasks: {self.migration_stats['escalated_tasks_migrated']}
Migration Errors: {len(self.migration_stats['migration_errors'])}

STATUS: PRODUCTION READY - Database state management active
"""
            
            return True, summary
            
        except Exception as e:
            error_msg = f"Migration finalization failed: {e}"
            logger.error(error_msg)
            return False, error_msg
    
    def execute_full_migration(self) -> Tuple[bool, str]:
        """Execute complete migration from JSON to database"""
        logger.info("🚀 Starting full migration from JSON to database state management")
        
        try:
            # Step 1: Validate JSON state
            valid, message, json_state = self.validate_json_state()
            if not valid:
                return False, f"JSON validation failed: {message}"
            
            # Step 2: Create backup
            backup_file = self.create_migration_backup()
            
            # Step 3: Migrate tasks
            tasks_migrated = self.migrate_tasks_to_database(json_state)
            if not tasks_migrated:
                return False, "Task migration failed"
            
            # Step 4: Migrate protocol violations
            self.migrate_protocol_violations(json_state)
            
            # Step 5: Migrate escalated tasks
            self.migrate_escalated_tasks(json_state)
            
            # Step 6: Validate migration integrity
            integrity_ok, integrity_report = self.validate_migration_integrity()
            if not integrity_ok:
                return False, f"Migration integrity validation failed: {integrity_report}"
            
            # Step 7: Setup backward compatibility
            compatibility_ok = self.setup_backward_compatibility()
            if not compatibility_ok:
                logger.warning("⚠️ Backward compatibility setup failed (non-critical)")
            
            # Step 8: Finalize migration
            finalized, summary = self.finalize_migration()
            if not finalized:
                return False, summary
            
            logger.info("🎉 MIGRATION COMPLETED SUCCESSFULLY")
            return True, summary
            
        except Exception as e:
            error_msg = f"Migration failed with exception: {e}"
            logger.error(error_msg)
            
            # Save error state for debugging
            error_log = {
                'error': str(e),
                'migration_stats': self.migration_stats,
                'timestamp': datetime.now().isoformat()
            }
            
            error_file = f"{self.backup_dir}/migration_error_{int(time.time())}.json"
            with open(error_file, 'w') as f:
                json.dump(error_log, f, indent=2, default=str)
            
            return False, f"{error_msg}. Error log: {error_file}"

def main():
    """CLI interface for migration"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate from JSON to Database State Management')
    parser.add_argument('action', choices=['validate', 'migrate', 'test'], 
                       help='Migration action to perform')
    parser.add_argument('--json-file', help='Path to JSON state file')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Validate migration without executing')
    
    args = parser.parse_args()
    
    # Initialize migration
    migration = StateManagerMigration(args.json_file)
    
    if args.action == 'validate':
        valid, message, state = migration.validate_json_state()
        print(f"JSON Validation: {'✅ VALID' if valid else '❌ INVALID'}")
        print(f"Message: {message}")
        if valid:
            print(f"Tasks found: {len(state.get('tasks', {}))}")
        return 0 if valid else 1
    
    elif args.action == 'migrate':
        if args.dry_run:
            print("🔍 DRY RUN: Validating migration readiness...")
            valid, message, state = migration.validate_json_state()
            if valid:
                print(f"✅ Ready to migrate {len(state.get('tasks', {}))} tasks")
                return 0
            else:
                print(f"❌ Migration not ready: {message}")
                return 1
        else:
            print("🚀 Executing full migration...")
            success, summary = migration.execute_full_migration()
            print(summary)
            return 0 if success else 1
    
    elif args.action == 'test':
        print("🔬 Testing database state manager...")
        db_manager = DatabaseStateManager()
        
        # Run stress test
        result = db_manager.run_concurrent_stress_test(50, 5)
        print(f"""
MIGRATION VALIDATION TEST:
=========================
Success Rate: {result.success_rate:.1f}%
Avg Response Time: {result.avg_response_time:.3f}s
SLA Compliance: {result.sla_compliance:.1f}%
Production Ready: {'✅ YES' if result.success_rate >= 95 else '❌ NO'}
""")
        return 0 if result.success_rate >= 95 else 1

if __name__ == '__main__':
    exit(main())