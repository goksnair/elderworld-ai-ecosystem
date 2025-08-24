import json
import uuid
import subprocess
import argparse
from datetime import datetime

TASKS_DIR = "tasks/pending"

def run_command(command):
    """Executes a shell command and returns its output."""
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        raise RuntimeError(f"Command failed: {' '.join(command)}")
    print(result.stdout)
    return result.stdout

def assign_task(prompt: str, assigned_to: str, assigned_by: str):
    """
    Creates a task file, commits it to the repository, and pushes it.
    """
    task_id = f"TASK-{uuid.uuid4()}"
    task_file_name = f"{task_id}.json"
    task_file_path = f"{TASKS_DIR}/{task_file_name}"

    task_definition = {
        "task_id": task_id,
        "assigned_to": assigned_to,
        "assigned_by": assigned_by,
        "timestamp": datetime.now().isoformat(),
        "status": "pending",
        "prompt": prompt,
        "deliverables": [
            {"type": "markdown", "path": f"deliverables/{task_id}/report.md"}
        ]
    }

    print(f"Creating task definition for {task_id}...")
    with open(task_file_path, 'w') as f:
        json.dump(task_definition, f, indent=2)
    
    print(f"Task file created at {task_file_path}")

    try:
        # Git operations
        run_command(["git", "add", task_file_path])
        commit_message = f"feat(task): Assign {task_id} to {assigned_to}"
        run_command(["git", "commit", "-m", commit_message])
        run_command(["git", "push"])
        print(f"\nSuccessfully assigned {task_id} to {assigned_to}.")
    except RuntimeError as e:
        print(f"\nFailed to assign task via Git. Please check your Git status and credentials.")
        # Optional: Clean up the created file if git push fails
        # import os
        # os.remove(task_file_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Assign a new task via the Git-based protocol.")
    parser.add_argument("prompt", type=str, help="The detailed prompt for the task.")
    parser.add_argument("--assigned_to", type=str, default="Jules", help="The agent to assign the task to.")
    parser.add_argument("--assigned_by", type=str, default="Gemini", help="The agent assigning the task.")
    
    args = parser.parse_args()
    
    assign_task(args.prompt, args.assigned_to, args.assigned_by)
