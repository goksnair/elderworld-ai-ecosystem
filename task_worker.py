import os
import json
import time
import subprocess
import random

PENDING_DIR = "tasks/pending"
IN_PROGRESS_DIR = "tasks/in_progress"
COMPLETED_DIR = "tasks/completed"
DELIVERABLES_DIR = "deliverables"

def run_command(command):
    """Executes a shell command, raising an error if it fails."""
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return result.stdout

def find_pending_task():
    """Finds the first available task in the pending directory."""
    if not os.path.exists(PENDING_DIR):
        return None
    
    files = os.listdir(PENDING_DIR)
    if not files:
        return None
        
    return files[0] # Simple FIFO queue

def process_task(task_file_name):
    """
    The main logic for a worker to claim, execute, and complete a task.
    """
    pending_path = os.path.join(PENDING_DIR, task_file_name)
    inprogress_path = os.path.join(IN_PROGRESS_DIR, task_file_name)
    
    # 1. Claim the task
    print(f"\nAttempting to claim task: {task_file_name}")
    try:
        run_command(["git", "pull"]) # Ensure we are up to date
        run_command(["git", "mv", pending_path, inprogress_path])
        commit_message = f"chore(task): Worker claiming {task_file_name}"
        run_command(["git", "commit", "-m", commit_message])
        run_command(["git", "push"])
        print(f"Successfully claimed {task_file_name}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to claim task, another worker may have taken it. Error: {e.stderr}")
        run_command(["git", "reset", "--hard", "HEAD~1"]) # Revert failed claim
        return

    # 2. Perform the work
    print(f"\nProcessing task: {task_file_name}")
    with open(inprogress_path, 'r') as f:
        task_data = json.load(f)
    
    # Simulate work based on the prompt
    print(f"  Prompt: {task_data['prompt']}")
    work_time = random.randint(5, 10)
    print(f"  Simulating work for {work_time} seconds...")
    time.sleep(work_time)
    
    # 3. Create deliverables
    deliverable_path_info = task_data['deliverables'][0]['path']
    deliverable_dir = os.path.dirname(deliverable_path_info)
    os.makedirs(deliverable_dir, exist_ok=True)
    
    report_content = f"# Report for {task_data['task_id']}\n\n"
    report_content += f"This report was generated in response to the prompt: '{task_data['prompt']}'.\n\n"
    report_content += "Analysis complete. Key findings are summarized here.\n"
    
    with open(deliverable_path_info, 'w') as f:
        f.write(report_content)
    print(f"  Created deliverable at: {deliverable_path_info}")

    # 4. Complete the task
    print(f"\nCompleting task: {task_file_name}")
    completed_path = os.path.join(COMPLETED_DIR, task_file_name)
    task_data['status'] = 'completed'
    with open(inprogress_path, 'w') as f:
        json.dump(task_data, f, indent=2)
        
    try:
        run_command(["git", "add", deliverable_path_info, inprogress_path])
        run_command(["git", "mv", inprogress_path, completed_path])
        commit_message = f"feat(task): Complete {task_file_name}"
        run_command(["git", "commit", "-m", commit_message])
        run_command(["git", "push"])
        print(f"\nSuccessfully completed and pushed results for {task_file_name}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to push completed task. Error: {e.stderr}")


if __name__ == "__main__":
    print("Starting worker...")
    # In a real scenario, this would be a long-running process.
    # For this simulation, we just check once.
    run_command(["git", "pull"])
    task_to_process = find_pending_task()
    
    if task_to_process:
        process_task(task_to_process)
    else:
        print("No pending tasks found.")
    
    print("\nWorker finished.")
