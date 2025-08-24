import sqlite3
import json
from datetime import datetime

class StatePersistenceManager:
    """
    Handles the saving and loading of the agent's state to an SQLite database
    to ensure persistence across sessions.
    """
    def __init__(self, db_path='.gemini/agent_state.db'):
        """
        Initializes the manager with the path to the SQLite database.

        Args:
            db_path (str): The path to the database file.
        """
        self.db_path = db_path
        self._setup_database()

    def _setup_database(self):
        """
        Creates the database and the 'agent_state' table if they don't exist.
        """
        try:
            # Ensure the directory exists
            import os
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS agent_state (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp DATETIME NOT NULL,
                        state_json TEXT NOT NULL
                    )
                ''')
                conn.commit()
        except sqlite3.Error as e:
            print(f"Database error during setup: {e}")
            raise

    def save_state(self, state_dict: dict):
        """
        Saves the current state dictionary to the database.

        Args:
            state_dict (dict): The dictionary representing the agent's current state.
        """
        try:
            state_json = json.dumps(state_dict)
            timestamp = datetime.now()
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO agent_state (timestamp, state_json) VALUES (?, ?)",
                    (timestamp, state_json)
                )
                conn.commit()
                print(f"State saved at {timestamp}")
        except (sqlite3.Error, json.JSONDecodeError, TypeError) as e:
            print(f"Error saving state: {e}")
            raise

    def load_last_state(self) -> dict | None:
        """
        Loads the most recent state from the database.

        Returns:
            dict or None: The most recent state dictionary, or None if no state is found.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT state_json FROM agent_state ORDER BY timestamp DESC LIMIT 1"
                )
                row = cursor.fetchone()
                if row:
                    print("Found previous state. Loading...")
                    return json.loads(row[0])
                else:
                    print("No previous state found.")
                    return None
        except (sqlite3.Error, json.JSONDecodeError) as e:
            print(f"Error loading state: {e}")
            return None

    def clear_state(self):
        """
        Deletes all saved states from the database. Useful for testing.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM agent_state")
                conn.commit()
                print("All saved states have been cleared.")
        except sqlite3.Error as e:
            print(f"Error clearing state: {e}")

if __name__ == '__main__':
    # Example usage and simple test
    print("Running a simple test of the StatePersistenceManager...")
    manager = StatePersistenceManager(db_path='.gemini/test_agent_state.db')
    
    # 1. Clear any previous test state
    manager.clear_state()
    
    # 2. Verify no state is loaded initially
    initial_state = manager.load_last_state()
    assert initial_state is None, "Initial state should be None"
    
    # 3. Save a new state
    test_state = {
        'task': 'implementing persistence',
        'step': 2,
        'files_modified': ['file1.py', 'file2.js'],
        'user_prompt': 'Please continue.'
    }
    manager.save_state(test_state)
    
    # 4. Load the state and verify it's correct
    loaded_state = manager.load_last_state()
    assert loaded_state is not None, "Loaded state should not be None"
    assert loaded_state['task'] == 'implementing persistence', "Task data is incorrect"
    assert loaded_state['step'] == 2, "Step data is incorrect"
    
    print("\nState loaded successfully:")
    print(json.dumps(loaded_state, indent=2))
    
    # 5. Clean up the test database
    manager.clear_state()
    print("\nTest completed successfully.")
