#!/usr/bin/env python3
"""
ADAPTIVE TASK CHECKING PROTOCOL
Intelligent, context-aware task monitoring with exponential backoff and agent-specific optimization
"""

import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
from chief_orchestrator_state_manager_FIXED import ChiefOrchestratorStateManager, TaskState

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentCategory(Enum):
    """Agent categories with different response characteristics"""
    FAST_RESPONSE = "fast_response"      # Technical agents, quick tasks (ai-ml-specialist)
    STRATEGIC = "strategic"              # Strategic agents, complex analysis (senior-care-boss)
    OPERATIONAL = "operational"          # Operations agents, coordination tasks (operations-excellence)
    ANALYTICAL = "analytical"            # Research agents, deep analysis (market-intelligence)

class CheckStrategy(Enum):
    """Different checking strategies based on task state and history"""
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    EVENT_DRIVEN = "event_driven"
    FIXED_INTERVAL = "fixed_interval"
    ADAPTIVE_LEARNING = "adaptive_learning"

@dataclass
class AgentProfile:
    """Agent-specific response characteristics"""
    category: AgentCategory
    expected_acceptance_time: int  # seconds
    expected_completion_time: int  # seconds
    reliability_score: float      # 0.0 to 1.0
    preferred_check_strategy: CheckStrategy
    escalation_threshold: int     # minutes before escalation

@dataclass
class CheckSchedule:
    """Dynamic checking schedule for a task"""
    next_check_time: datetime
    check_interval: int          # seconds
    attempt_count: int
    strategy: CheckStrategy
    backoff_multiplier: float

class AdaptiveTaskChecker:
    """
    Intelligent task checking with adaptive behavior based on:
    - Agent characteristics and historical response patterns
    - Task complexity and expected duration
    - Previous success/failure patterns
    - Current system load and priorities
    """
    
    def __init__(self, state_manager: ChiefOrchestratorStateManager = None):
        self.state_manager = state_manager or ChiefOrchestratorStateManager()
        self.agent_profiles = self._initialize_agent_profiles()
        self.task_schedules: Dict[str, CheckSchedule] = {}
        self.check_history: Dict[str, List[Dict]] = {}
        
        # Adaptive parameters
        self.base_intervals = {
            AgentCategory.FAST_RESPONSE: 30,    # 30 seconds
            AgentCategory.STRATEGIC: 120,       # 2 minutes  
            AgentCategory.OPERATIONAL: 60,      # 1 minute
            AgentCategory.ANALYTICAL: 180       # 3 minutes
        }
        
        self.escalation_thresholds = {
            AgentCategory.FAST_RESPONSE: 10,    # 10 minutes
            AgentCategory.STRATEGIC: 30,        # 30 minutes
            AgentCategory.OPERATIONAL: 20,      # 20 minutes
            AgentCategory.ANALYTICAL: 45        # 45 minutes
        }
        
        logger.info("🧠 Adaptive Task Checker initialized")
        logger.info(f"📊 Monitoring {len(self.agent_profiles)} agent profiles")

    def _initialize_agent_profiles(self) -> Dict[str, AgentProfile]:
        """Initialize agent profiles with response characteristics"""
        return {
            'ai-ml-specialist': AgentProfile(
                category=AgentCategory.FAST_RESPONSE,
                expected_acceptance_time=30,
                expected_completion_time=600,  # 10 minutes
                reliability_score=0.9,
                preferred_check_strategy=CheckStrategy.EXPONENTIAL_BACKOFF,
                escalation_threshold=10
            ),
            'senior-care-boss': AgentProfile(
                category=AgentCategory.STRATEGIC,
                expected_acceptance_time=60,
                expected_completion_time=1800,  # 30 minutes
                reliability_score=0.95,
                preferred_check_strategy=CheckStrategy.ADAPTIVE_LEARNING,
                escalation_threshold=30
            ),
            'operations-excellence': AgentProfile(
                category=AgentCategory.OPERATIONAL,
                expected_acceptance_time=45,
                expected_completion_time=900,   # 15 minutes
                reliability_score=0.85,
                preferred_check_strategy=CheckStrategy.EVENT_DRIVEN,
                escalation_threshold=20
            ),
            'market-intelligence': AgentProfile(
                category=AgentCategory.ANALYTICAL,
                expected_acceptance_time=90,
                expected_completion_time=2700,  # 45 minutes
                reliability_score=0.8,
                preferred_check_strategy=CheckStrategy.ADAPTIVE_LEARNING,
                escalation_threshold=45
            ),
            'finance-strategy': AgentProfile(
                category=AgentCategory.ANALYTICAL,
                expected_acceptance_time=75,
                expected_completion_time=2100,  # 35 minutes
                reliability_score=0.85,
                preferred_check_strategy=CheckStrategy.EXPONENTIAL_BACKOFF,
                escalation_threshold=40
            ),
            'product-innovation': AgentProfile(
                category=AgentCategory.FAST_RESPONSE,
                expected_acceptance_time=45,
                expected_completion_time=1200,  # 20 minutes
                reliability_score=0.9,
                preferred_check_strategy=CheckStrategy.EVENT_DRIVEN,
                escalation_threshold=15
            ),
            'partnership-development': AgentProfile(
                category=AgentCategory.STRATEGIC,
                expected_acceptance_time=120,
                expected_completion_time=3600,  # 60 minutes
                reliability_score=0.75,
                preferred_check_strategy=CheckStrategy.ADAPTIVE_LEARNING,
                escalation_threshold=45
            ),
            'compliance-quality': AgentProfile(
                category=AgentCategory.OPERATIONAL,
                expected_acceptance_time=60,
                expected_completion_time=1800,  # 30 minutes
                reliability_score=0.95,
                preferred_check_strategy=CheckStrategy.FIXED_INTERVAL,
                escalation_threshold=25
            )
        }

    def schedule_task_checking(self, task_id: str, agent: str, priority: str = 'MEDIUM') -> bool:
        """Schedule intelligent checking for a delegated task"""
        logger.info(f"📅 Scheduling adaptive checking for task: {task_id}")
        
        # Get agent profile
        agent_profile = self.agent_profiles.get(agent)
        if not agent_profile:
            logger.warning(f"⚠️ Unknown agent {agent}, using default profile")
            agent_profile = AgentProfile(
                category=AgentCategory.FAST_RESPONSE,
                expected_acceptance_time=60,
                expected_completion_time=900,
                reliability_score=0.8,
                preferred_check_strategy=CheckStrategy.EXPONENTIAL_BACKOFF,
                escalation_threshold=15
            )
        
        # Calculate initial check interval based on agent category and priority
        base_interval = self.base_intervals[agent_profile.category]
        
        # Adjust for task priority
        priority_multipliers = {'LOW': 1.5, 'MEDIUM': 1.0, 'HIGH': 0.7, 'CRITICAL': 0.5}
        interval = int(base_interval * priority_multipliers.get(priority, 1.0))
        
        # Create adaptive schedule
        schedule = CheckSchedule(
            next_check_time=datetime.now() + timedelta(seconds=interval),
            check_interval=interval,
            attempt_count=0,
            strategy=agent_profile.preferred_check_strategy,
            backoff_multiplier=1.0
        )
        
        self.task_schedules[task_id] = schedule
        self.check_history[task_id] = []
        
        logger.info(f"✅ Task {task_id} scheduled with {schedule.strategy.value} strategy")
        logger.info(f"⏰ Initial check in {interval} seconds")
        
        return True

    def should_check_task(self, task_id: str) -> bool:
        """Determine if a task should be checked now"""
        if task_id not in self.task_schedules:
            return False
        
        schedule = self.task_schedules[task_id]
        return datetime.now() >= schedule.next_check_time

    def check_task_with_adaptive_strategy(self, task_id: str) -> Tuple[bool, str]:
        """Check task using adaptive strategy and update schedule"""
        logger.info(f"🔍 Adaptive check for task: {task_id}")
        
        if task_id not in self.task_schedules:
            logger.error(f"❌ No schedule found for task {task_id}")
            return False, "No schedule found"
        
        schedule = self.task_schedules[task_id]
        schedule.attempt_count += 1
        
        # Record check attempt
        check_record = {
            'timestamp': datetime.now().isoformat(),
            'attempt': schedule.attempt_count,
            'strategy': schedule.strategy.value
        }
        
        # Perform the actual check
        success = self.state_manager.check_task_response(task_id)
        
        # Get current task status
        task_status = self.state_manager.get_task_status(task_id)
        if not task_status:
            return False, "Task not found"
        
        current_state = TaskState(task_status['state'])
        check_record['state_after_check'] = current_state.value
        check_record['success'] = success
        
        # Update schedule based on results and strategy
        self._update_schedule_adaptive(task_id, schedule, current_state, success)
        
        # Record check in history
        self.check_history[task_id].append(check_record)
        
        # Check if escalation is needed
        escalation_needed, escalation_reason = self._should_escalate_task(task_id, task_status)
        
        if escalation_needed:
            logger.warning(f"🚨 Escalation needed for task {task_id}: {escalation_reason}")
            self._remove_task_schedule(task_id)
            return False, escalation_reason
        
        logger.info(f"✅ Check completed for {task_id}, next check: {schedule.next_check_time}")
        return True, f"State: {current_state.value}, Next check: {schedule.next_check_time}"

    def _update_schedule_adaptive(self, task_id: str, schedule: CheckSchedule, 
                                 current_state: TaskState, success: bool):
        """Update checking schedule based on strategy and results"""
        
        task_status = self.state_manager.get_task_status(task_id)
        agent = task_status['agent'] if task_status else 'unknown'
        agent_profile = self.agent_profiles.get(agent, self.agent_profiles['ai-ml-specialist'])
        
        if current_state in [TaskState.COMPLETED, TaskState.ERROR, TaskState.ESCALATED]:
            # Task finished, remove from schedule
            self._remove_task_schedule(task_id)
            return
        
        # Calculate next interval based on strategy
        if schedule.strategy == CheckStrategy.EXPONENTIAL_BACKOFF:
            if current_state == TaskState.DELEGATED and schedule.attempt_count > 2:
                # No acceptance yet, increase backoff
                schedule.backoff_multiplier *= 1.5
            elif current_state == TaskState.ACCEPTED:
                # Accepted, reduce frequency slightly
                schedule.backoff_multiplier = 1.2
            elif current_state == TaskState.IN_PROGRESS:
                # In progress, moderate checking
                schedule.backoff_multiplier = 1.0
            
            next_interval = min(int(schedule.check_interval * schedule.backoff_multiplier), 600)
            
        elif schedule.strategy == CheckStrategy.ADAPTIVE_LEARNING:
            # Learn from historical patterns
            avg_response_time = self._calculate_average_response_time(agent)
            if avg_response_time:
                next_interval = max(int(avg_response_time * 0.5), schedule.check_interval)
            else:
                next_interval = schedule.check_interval
                
        elif schedule.strategy == CheckStrategy.EVENT_DRIVEN:
            # Longer intervals, rely more on agent notifications
            if current_state == TaskState.DELEGATED:
                next_interval = schedule.check_interval * 2  # Wait longer for acceptance
            else:
                next_interval = schedule.check_interval * 3  # Even longer for progress
                
        elif schedule.strategy == CheckStrategy.FIXED_INTERVAL:
            # Consistent checking
            next_interval = schedule.check_interval
        
        else:
            next_interval = schedule.check_interval
        
        # Apply bounds
        next_interval = max(30, min(next_interval, 600))  # Between 30s and 10min
        
        schedule.check_interval = next_interval
        schedule.next_check_time = datetime.now() + timedelta(seconds=next_interval)
        
        logger.debug(f"📊 Updated schedule for {task_id}: next check in {next_interval}s")

    def _should_escalate_task(self, task_id: str, task_status: Dict) -> Tuple[bool, str]:
        """Determine if task should be escalated based on adaptive criteria"""
        
        agent = task_status['agent']
        agent_profile = self.agent_profiles.get(agent, self.agent_profiles['ai-ml-specialist'])
        
        # Time-based escalation
        if task_status['last_attempt']:
            try:
                last_attempt = datetime.fromisoformat(task_status['last_attempt'])
                elapsed_minutes = (datetime.now() - last_attempt).total_seconds() / 60
                
                if elapsed_minutes > agent_profile.escalation_threshold:
                    return True, f"No response after {elapsed_minutes:.1f} minutes (threshold: {agent_profile.escalation_threshold})"
            except (ValueError, TypeError):
                pass
        
        # Attempt-based escalation (adaptive)
        schedule = self.task_schedules.get(task_id)
        if schedule and schedule.attempt_count > 10:  # Too many checks
            return True, f"Excessive check attempts: {schedule.attempt_count}"
        
        # Delegation failure escalation
        if task_status['delegation_attempts'] >= 3:
            return True, f"Multiple delegation failures: {task_status['delegation_attempts']}"
        
        return False, ""

    def _calculate_average_response_time(self, agent: str) -> Optional[int]:
        """Calculate average response time for an agent based on history"""
        # This would analyze historical data to learn agent patterns
        # For now, return None to use default intervals
        return None

    def _remove_task_schedule(self, task_id: str):
        """Remove task from checking schedule"""
        if task_id in self.task_schedules:
            del self.task_schedules[task_id]
            logger.info(f"🗑️ Removed schedule for completed task: {task_id}")

    def get_scheduled_tasks(self) -> Dict[str, Dict]:
        """Get all currently scheduled tasks with their next check times"""
        result = {}
        for task_id, schedule in self.task_schedules.items():
            result[task_id] = {
                'next_check': schedule.next_check_time.isoformat(),
                'check_interval': schedule.check_interval,
                'attempt_count': schedule.attempt_count,
                'strategy': schedule.strategy.value,
                'time_until_check': (schedule.next_check_time - datetime.now()).total_seconds()
            }
        return result

    def process_pending_checks(self) -> List[Dict]:
        """Process all tasks that need checking"""
        results = []
        
        for task_id in list(self.task_schedules.keys()):
            if self.should_check_task(task_id):
                success, message = self.check_task_with_adaptive_strategy(task_id)
                results.append({
                    'task_id': task_id,
                    'success': success,
                    'message': message,
                    'timestamp': datetime.now().isoformat()
                })
        
        return results

    def generate_checking_report(self) -> str:
        """Generate comprehensive report on task checking status"""
        scheduled_tasks = self.get_scheduled_tasks()
        
        report = f"""
ADAPTIVE TASK CHECKING REPORT
============================
Generated: {datetime.now().isoformat()}

ACTIVE SCHEDULES: {len(scheduled_tasks)}
"""
        
        for task_id, info in scheduled_tasks.items():
            report += f"""
Task: {task_id}
  Strategy: {info['strategy']}
  Next Check: {info['next_check']}
  Interval: {info['check_interval']}s
  Attempts: {info['attempt_count']}
  Time Until Check: {info['time_until_check']:.1f}s
"""
        
        report += f"""
AGENT PROFILES: {len(self.agent_profiles)}
"""
        for agent, profile in self.agent_profiles.items():
            report += f"""
{agent}:
  Category: {profile.category.value}
  Expected Acceptance: {profile.expected_acceptance_time}s
  Expected Completion: {profile.expected_completion_time}s
  Reliability: {profile.reliability_score}
  Strategy: {profile.preferred_check_strategy.value}
  Escalation Threshold: {profile.escalation_threshold}min
"""
        
        return report

# CLI Interface
def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Adaptive Task Checker')
    parser.add_argument('action', choices=[
        'schedule', 'check', 'process', 'report', 'status'
    ])
    parser.add_argument('--task-id', help='Task ID')
    parser.add_argument('--agent', help='Agent name')
    parser.add_argument('--priority', default='MEDIUM', help='Task priority')
    
    args = parser.parse_args()
    
    checker = AdaptiveTaskChecker()
    
    if args.action == 'schedule':
        if not args.task_id or not args.agent:
            print("Error: schedule requires --task-id and --agent")
            return 1
        
        success = checker.schedule_task_checking(args.task_id, args.agent, args.priority)
        return 0 if success else 1
        
    elif args.action == 'check':
        if not args.task_id:
            print("Error: check requires --task-id")
            return 1
        
        success, message = checker.check_task_with_adaptive_strategy(args.task_id)
        print(f"Check result: {message}")
        return 0 if success else 1
        
    elif args.action == 'process':
        results = checker.process_pending_checks()
        print(f"Processed {len(results)} checks")
        for result in results:
            print(f"  {result['task_id']}: {result['message']}")
        return 0
        
    elif args.action == 'status':
        scheduled = checker.get_scheduled_tasks()
        print(json.dumps(scheduled, indent=2))
        return 0
        
    elif args.action == 'report':
        print(checker.generate_checking_report())
        return 0

if __name__ == '__main__':
    exit(main())