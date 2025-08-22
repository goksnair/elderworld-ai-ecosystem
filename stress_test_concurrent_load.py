import subprocess
import json
import time
import threading
import os

# Configuration
NUM_TASKS = 25
AGENTS = ["senior-care-boss", "ai-ml-specialist", "market-intelligence"]
TASK_FILE_TEMPLATE = "shared-workspace/load-test-task-{}.md"

# Path to the state manager script
STATE_MANAGER_SCRIPT = "ai-models/chief_orchestrator_state_manager_FIXED.py"

def define_and_delegate_task(task_id, agent, task_file):
    """Defines and delegates a single task."""
    print(f"[Thread] Defining task {task_id} for {agent}...")
    define_command = [
        "python3", STATE_MANAGER_SCRIPT, "define",
        "--task-id", task_id,
        "--agent", agent,
        "--task-file", task_file
    ]
    define_result = subprocess.run(define_command, capture_output=True, text=True)
    if define_result.returncode != 0:
        print(f"[Thread ERROR] Failed to define {task_id}: {define_result.stderr}")
        return False
    print(f"[Thread] Delegating task {task_id} for {agent}...")
    delegate_command = [
        "python3", STATE_MANAGER_SCRIPT, "delegate",
        "--task-id", task_id
    ]
    delegate_result = subprocess.run(delegate_command, capture_output=True, text=True)
    if delegate_result.returncode != 0:
        print(f"[Thread ERROR] Failed to delegate {task_id}: {delegate_result.stderr}")
        return False
    print(f"[Thread] Successfully delegated {task_id}")
    return True

def create_task_file(task_id):
    """Creates a dummy task file for the load test."""
    file_path = TASK_FILE_TEMPLATE.format(task_id)
    content = f"""
# Load Test Task: {task_id}

## Agent: {{agent_name}}

## Context:
This is a dummy task for concurrent load testing of the Chief Orchestrator and agent communication.

## Objective:
Accept this task and send a TASK_COMPLETED message back to the Chief Orchestrator.

## Key Deliverables:
- A TASK_COMPLETED message sent to Chief Orchestrator.

## Success Metrics:
- Task status transitions to COMPLETED in Chief Orchestrator's state.
"""
    with open(file_path, "w") as f:
        f.write(content)
    return file_path

def main():
    print("Starting concurrent load test...")
    threads = []
    task_ids = []

    # Clean up old task files if any
    for f in os.listdir("shared-workspace"):
        if f.startswith("load-test-task-") and f.endswith(".md"):
            os.remove(os.path.join("shared-workspace", f))

    for i in range(NUM_TASKS):
        task_id = f"load-test-task-{i}"
        agent = AGENTS[i % len(AGENTS)]
        task_file = create_task_file(task_id)
        task_ids.append(task_id)

        thread = threading.Thread(target=define_and_delegate_task, args=(task_id, agent, task_file))
        threads.append(thread)
        thread.start()
        # Introduce a small delay to avoid overwhelming the system immediately
        time.sleep(0.1)

    for thread in threads:
        thread.join()

    print(f"All {NUM_TASKS} tasks defined and delegated. Monitoring system status...")

    # Monitor tasks until all are completed or escalated
    completed_tasks = 0
    escalated_tasks = 0
    total_tasks_to_monitor = NUM_TASKS

    start_time = time.time()
    while completed_tasks + escalated_tasks < total_tasks_to_monitor and (time.time() - start_time < 300): # 5 min timeout
        time.sleep(10) # Check every 10 seconds
        report_command = ["python3", STATE_MANAGER_SCRIPT, "report"]
        report_result = subprocess.run(report_command, capture_output=True, text=True)
        report_output = report_result.stdout
        print(f"\n--- Current Status ({int(time.time() - start_time)}s) ---")
        print(report_output)

        # Parse report to get counts
        lines = report_output.splitlines()
        for line in lines:
            if "COMPLETED:" in line:
                completed_tasks = int(line.split(":")[1].strip())
            elif "ESCALATED:" in line:
                escalated_tasks = int(line.split(":")[1].strip())
        
        # Check individual task statuses for more detail
        for tid in task_ids:
            status_command = ["python3", STATE_MANAGER_SCRIPT, "status", "--task-id", tid]
            status_result = subprocess.run(status_command, capture_output=True, text=True)
            try:
                task_status_data = json.loads(status_result.stdout)
                if task_status_data["state"] == "COMPLETED":
                    if tid not in [t.get("task_id") for t in manager.list_tasks_by_state(TaskState.COMPLETED)]:
                        print(f"Task {tid} COMPLETED.")
                elif task_status_data["state"] == "ESCALATED":
                    if tid not in [t.get("task_id") for t in manager.list_tasks_by_state(TaskState.ESCALATED)]:
                        print(f"Task {tid} ESCALATED.")
            except json.JSONDecodeError:
                pass # Ignore if status output is not valid JSON

    print("\nLoad test monitoring complete.")
    print(f"Final Status: {completed_tasks} completed, {escalated_tasks} escalated out of {NUM_TASKS} tasks.")

    # Clean up created task files
    for i in range(NUM_TASKS):
        file_path = TASK_FILE_TEMPLATE.format(f"load-test-task-{i}")
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    main()
