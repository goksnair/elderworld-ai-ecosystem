#!/usr/bin/env python3
"""
CORRECTED WDL PARSER WITH FOOLPROOF PROTOCOL ENFORCEMENT
Replaces the flawed original parser with strict state management
"""

import yaml
import re
import time
import logging
from typing import Dict, List, Optional
from chief_orchestrator_state_manager import ChiefOrchestratorStateManager, TaskState, ProtocolViolationError

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CorrectedWorkflowExecutor:
    """
    CORRECTED WORKFLOW EXECUTOR WITH MANDATORY PROTOCOL ENFORCEMENT
    """
    
    def __init__(self, workflow_config: Dict):
        self.workflow = workflow_config
        self.state_manager = ChiefOrchestratorStateManager()
        self.task_graph = {}
        self.max_execution_cycles = 50  # Prevent infinite loops
        self.cycle_count = 0
        
        logger.info("🤖 Corrected Workflow Executor initialized")
        logger.info(f"Workflow: {self.workflow.get('name', 'Unknown')}")
        logger.info("🛡️ Protocol enforcement ACTIVE")

    def build_dependency_graph(self):
        """Build task dependency graph without executing anything"""
        logger.info("🔗 Building dependency graph...")
        
        for task in self.workflow.get('tasks', []):
            task_name = task.get('name')
            dependencies = []
            
            # Parse dependencies from inputs
            for input_def in task.get('inputs', []):
                value = input_def.get('value', '')
                matches = re.findall(r'{{(.*?)}}', str(value))
                
                for match in matches:
                    parts = match.strip().split('.')
                    if len(parts) >= 2 and parts[0] == 'tasks':
                        dependency = parts[1]
                        dependencies.append(dependency)
            
            self.task_graph[task_name] = {
                'dependencies': dependencies,
                'task': task,
                'processed': False
            }
            
            logger.info(f"📋 Task {task_name}: {len(dependencies)} dependencies")
        
        logger.info(f"✅ Dependency graph built: {len(self.task_graph)} tasks")

    def execute_workflow(self) -> bool:
        """
        Execute workflow with MANDATORY protocol enforcement
        """
        logger.info("🚀 Starting workflow execution with protocol enforcement")
        
        try:
            self.build_dependency_graph()
            
            # Phase 1: Define all tasks (GATE 1)
            if not self._define_all_tasks():
                logger.error("❌ Failed to define all tasks")
                return False
            
            # Phase 2: Execute tasks with dependency resolution
            return self._execute_with_dependency_resolution()
            
        except ProtocolViolationError as e:
            logger.error(f"🚨 PROTOCOL VIOLATION: {e}")
            return False
        except Exception as e:
            logger.error(f"💥 Unexpected error: {e}")
            return False

    def _define_all_tasks(self) -> bool:
        """Phase 1: Define all tasks (GATE 1 - DEFINITION)"""
        logger.info("📝 Phase 1: Defining all tasks...")
        
        success_count = 0
        total_tasks = len(self.task_graph)
        
        for task_name, task_info in self.task_graph.items():
            task = task_info['task']
            agent = task.get('agent', 'ai-ml-specialist')
            task_file = task.get('script', f'shared-workspace/{task_name}-task.md')
            priority = task.get('priority', 'MEDIUM')
            
            logger.info(f"📋 Defining task: {task_name}")
            
            # GATE 1: Define task with mandatory validation
            success = self.state_manager.define_task(
                task_id=task_name,
                agent=agent,
                task_file=task_file,
                priority=priority
            )
            
            if success:
                success_count += 1
                logger.info(f"✅ Task {task_name} defined successfully")
            else:
                logger.error(f"❌ Failed to define task {task_name}")
        
        logger.info(f"📊 Phase 1 Results: {success_count}/{total_tasks} tasks defined")
        return success_count == total_tasks

    def _execute_with_dependency_resolution(self) -> bool:
        """Phase 2: Execute tasks with proper dependency resolution"""
        logger.info("⚙️ Phase 2: Executing tasks with dependency resolution...")
        
        while not self._all_tasks_processed():
            self.cycle_count += 1
            
            if self.cycle_count > self.max_execution_cycles:
                logger.error("🔄 Maximum execution cycles exceeded - preventing infinite loop")
                return False
            
            logger.info(f"🔄 Execution cycle {self.cycle_count}")
            
            # Find tasks ready for execution (dependencies satisfied)
            ready_tasks = self._find_ready_tasks()
            
            if not ready_tasks:
                # Check if we have tasks in progress
                in_progress_tasks = self._count_tasks_in_progress()
                
                if in_progress_tasks > 0:
                    logger.info(f"⏳ Waiting for {in_progress_tasks} tasks to complete...")
                    time.sleep(10)  # Wait for agent responses
                    self._update_all_task_statuses()
                    continue
                else:
                    logger.warning("⚠️ No tasks ready and none in progress - possible deadlock")
                    break
            
            # Process ready tasks
            for task_name in ready_tasks:
                if not self._process_single_task(task_name):
                    logger.error(f"❌ Failed to process task {task_name}")
        
        return self._check_final_completion_status()

    def _find_ready_tasks(self) -> List[str]:
        """Find tasks that are ready for delegation (dependencies satisfied)"""
        ready_tasks = []
        
        for task_name, task_info in self.task_graph.items():
            if task_info['processed']:
                continue
            
            # Check if all dependencies are completed
            dependencies_met = True
            for dep_task in task_info['dependencies']:
                dep_status = self.state_manager.get_task_status(dep_task)
                if not dep_status or dep_status['state'] != TaskState.COMPLETED.value:
                    dependencies_met = False
                    break
            
            if dependencies_met:
                # Check if task is in correct state for delegation
                task_status = self.state_manager.get_task_status(task_name)
                if task_status and task_status['state'] == TaskState.DEFINED.value:
                    ready_tasks.append(task_name)
        
        logger.info(f"🎯 Found {len(ready_tasks)} ready tasks: {ready_tasks}")
        return ready_tasks

    def _process_single_task(self, task_name: str) -> bool:
        """Process a single task through the complete lifecycle"""
        logger.info(f"⚙️ Processing task: {task_name}")
        
        try:
            # GATE 2: Delegate task
            if not self.state_manager.delegate_task(task_name):
                logger.error(f"❌ Failed to delegate task {task_name}")
                return False
            
            logger.info(f"📤 Task {task_name} delegated successfully")
            
            # Mark as processed in workflow (not completed - that comes from agent)
            self.task_graph[task_name]['processed'] = True
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Error processing task {task_name}: {e}")
            return False

    def _update_all_task_statuses(self):
        """Update status of all tasks by checking A2A responses"""
        logger.info("🔄 Updating all task statuses...")
        
        for task_name in self.task_graph.keys():
            task_status = self.state_manager.get_task_status(task_name)
            
            if task_status and task_status['state'] in [
                TaskState.DELEGATED.value,
                TaskState.ACCEPTED.value, 
                TaskState.IN_PROGRESS.value
            ]:
                # Check for agent responses
                self.state_manager.check_task_response(task_name)

    def _count_tasks_in_progress(self) -> int:
        """Count tasks currently in progress"""
        count = 0
        for task_name in self.task_graph.keys():
            task_status = self.state_manager.get_task_status(task_name)
            if task_status and task_status['state'] in [
                TaskState.DELEGATED.value,
                TaskState.ACCEPTED.value,
                TaskState.IN_PROGRESS.value
            ]:
                count += 1
        return count

    def _all_tasks_processed(self) -> bool:
        """Check if all tasks have been processed (delegated or completed)"""
        for task_info in self.task_graph.values():
            if not task_info['processed']:
                return False
        return True

    def _check_final_completion_status(self) -> bool:
        """Check final completion status of all tasks"""
        logger.info("🏁 Checking final completion status...")
        
        completed_count = 0
        total_tasks = len(self.task_graph)
        
        status_summary = {}
        
        for task_name in self.task_graph.keys():
            task_status = self.state_manager.get_task_status(task_name)
            
            if task_status:
                state = task_status['state']
                status_summary[state] = status_summary.get(state, 0) + 1
                
                if state == TaskState.COMPLETED.value:
                    completed_count += 1
            else:
                status_summary['UNKNOWN'] = status_summary.get('UNKNOWN', 0) + 1
        
        logger.info("📊 FINAL STATUS SUMMARY:")
        for state, count in status_summary.items():
            logger.info(f"   {state}: {count}")
        
        success_rate = (completed_count / total_tasks) * 100
        logger.info(f"✅ Completion Rate: {completed_count}/{total_tasks} ({success_rate:.1f}%)")
        
        # Generate comprehensive report
        report = self.state_manager.generate_status_report()
        logger.info(f"📋 Status Report:\n{report}")
        
        return completed_count == total_tasks

    def get_execution_summary(self) -> Dict:
        """Get execution summary"""
        tasks = self.state_manager.list_tasks_by_state()
        violations = self.state_manager.get_protocol_violations()
        escalated = self.state_manager.get_escalated_tasks()
        
        return {
            'total_tasks': len(self.task_graph),
            'execution_cycles': self.cycle_count,
            'tasks_by_state': {
                state.value: len(self.state_manager.list_tasks_by_state(state))
                for state in TaskState
            },
            'protocol_violations': len(violations),
            'escalated_tasks': len(escalated),
            'success': len(violations) == 0 and len(escalated) == 0
        }

def load_workflow_from_file(wdl_file: str) -> Dict:
    """Load workflow from YAML/WDL file"""
    try:
        with open(wdl_file, 'r') as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load workflow file {wdl_file}: {e}")
        return {}

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Corrected WDL Parser with Protocol Enforcement')
    parser.add_argument('workflow_file', help='Path to workflow YAML/WDL file')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be executed without running')
    parser.add_argument('--status-only', action='store_true', help='Show current status without executing')
    
    args = parser.parse_args()
    
    if args.status_only:
        # Show current status
        state_manager = ChiefOrchestratorStateManager()
        print(state_manager.generate_status_report())
        return 0
    
    # Load workflow
    workflow = load_workflow_from_file(args.workflow_file)
    if not workflow:
        logger.error("Failed to load workflow")
        return 1
    
    # Create executor
    executor = CorrectedWorkflowExecutor(workflow)
    
    if args.dry_run:
        # Dry run - show what would be executed
        logger.info("🔍 DRY RUN MODE - Analyzing workflow...")
        executor.build_dependency_graph()
        
        print("WORKFLOW ANALYSIS:")
        print(f"Total Tasks: {len(executor.task_graph)}")
        
        for task_name, task_info in executor.task_graph.items():
            task = task_info['task']
            deps = task_info['dependencies']
            
            print(f"\nTask: {task_name}")
            print(f"  Agent: {task.get('agent', 'ai-ml-specialist')}")
            print(f"  Dependencies: {deps if deps else 'None'}")
            print(f"  Script: {task.get('script', 'N/A')}")
        
        return 0
    
    # Execute workflow
    logger.info("🚀 Starting workflow execution...")
    success = executor.execute_workflow()
    
    # Print summary
    summary = executor.get_execution_summary()
    
    print("\nEXECUTION SUMMARY:")
    print("==================")
    print(f"Total Tasks: {summary['total_tasks']}")
    print(f"Execution Cycles: {summary['execution_cycles']}")
    print(f"Protocol Violations: {summary['protocol_violations']}")
    print(f"Escalated Tasks: {summary['escalated_tasks']}")
    print(f"Overall Success: {'YES' if summary['success'] else 'NO'}")
    
    return 0 if success else 1

if __name__ == '__main__':
    exit(main())