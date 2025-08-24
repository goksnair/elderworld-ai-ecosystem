import time
import random
import os
from state_persistence_manager import StatePersistenceManager

class SimulatedAgent:
    """
    A simulated agent that performs a multi-step task and uses the
    StatePersistenceManager to save its progress.
    """
    def __init__(self, db_path='.gemini/agent_state.db'):
        self.state_manager = StatePersistenceManager(db_path)
        self.state = {
            'task_id': None,
            'current_step': 0,
            'total_steps': 0,
            'status': 'idle',
            'data': {}
        }

    def start_new_task(self, task_id, total_steps):
        """Initializes a new task for the agent."""
        self.state = {
            'task_id': task_id,
            'current_step': 1,
            'total_steps': total_steps,
            'status': 'in_progress',
            'data': {'files_processed': []}
        }
        print(f"\nStarting new task: {task_id} with {total_steps} steps.")
        self.state_manager.save_state(self.state)

    def resume_task(self):
        """Resumes a task from the last saved state."""
        last_state = self.state_manager.load_last_state()
        if last_state and last_state.get('status') == 'in_progress':
            self.state = last_state
            print(f"\nResuming task '{self.state['task_id']}' from step {self.state['current_step']}.")
            return True
        print("\nNo active task to resume.")
        return False

    def run_loop(self):
        """
        Runs the main task loop, processing steps and saving state.
        This loop can be interrupted to simulate a crash.
        """
        if self.state['status'] != 'in_progress':
            print("No task is currently in progress.")
            return

        while self.state['current_step'] <= self.state['total_steps']:
            # --- Simulate doing work ---
            step = self.state['current_step']
            print(f"Executing step {step}/{self.state['total_steps']}...")
            time.sleep(1) # Simulate work
            
            # Update state with work product
            processed_file = f"file_{random.randint(100, 999)}.dat"
            self.state['data']['files_processed'].append(processed_file)
            print(f"  - Processed '{processed_file}'")

            # --- Save state after completing the step ---
            self.state_manager.save_state(self.state)

            # --- Simulate a potential crash ---
            # Crash 1 out of 4 times on average, but not on the last step
            if random.randint(1, 4) == 1 and step < self.state['total_steps']:
                print("\n" + "="*40)
                print("! UNEXPECTED SHUTDOWN !")
                print("="*40 + "\n")
                return # Exit the loop abruptly

            # Move to the next step
            self.state['current_step'] += 1

        # Task finished
        self.state['status'] = 'completed'
        self.state_manager.save_state(self.state)
        print(f"\nTask '{self.state['task_id']}' completed successfully!")
        print(f"Final processed files: {self.state['data']['files_processed']}")


if __name__ == '__main__':
    DB_FILE = '.gemini/simulation_state.db'
    
    # Clean up previous run if it exists
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)

    agent = SimulatedAgent(db_path=DB_FILE)

    # --- First Run: Start a new task and simulate a crash ---
    print("--- SCENARIO 1: Starting a new task that will be interrupted. ---")
    agent.start_new_task(task_id='data-processing-pipeline', total_steps=10)
    agent.run_loop()

    # --- Second Run: Resume the task from where it left off ---
    print("\n\n--- SCENARIO 2: A new agent instance starts up. ---")
    
    # We create a new agent instance to simulate a fresh start after a crash
    resumed_agent = SimulatedAgent(db_path=DB_FILE)
    
    if resumed_agent.resume_task():
        resumed_agent.run_loop()
    else:
        # This block would run if the task had completed successfully
        print("Agent found no task to resume, starting a new one.")
        resumed_agent.start_new_task(task_id='new-analysis-job', total_steps=5)
        resumed_agent.run_loop()
