import os
import json
from datetime import datetime, timedelta
from supabase import create_client, Client

class CaregiverDataIngestion:
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def get_caregiver_availability_data(self, start_date=None, end_date=None):
        # In a real scenario, this would query a more detailed availability log.
        # For now, we'll use the current availability and workload from the agents table
        # and simulate historical data.

        if not start_date:
            start_date = datetime.now() - timedelta(days=30) # Default to last 30 days
        if not end_date:
            end_date = datetime.now()

        all_agents = self.supabase.from_('agents').select('*').execute().data
        
        simulated_data = []
        current_date = start_date
        while current_date <= end_date:
            for agent in all_agents:
                # Simulate availability and workload changes over time
                # This is a very basic simulation for demonstration purposes
                is_available = (current_date.day % 7 != 0) # Simulate weekends off
                workload = (current_date.hour % 5) # Simulate varying workload

                simulated_data.append({
                    'timestamp': current_date.isoformat(),
                    'agent_id': agent['id'],
                    'agent_name': agent['name'],
                    'is_available': is_available,
                    'workload': workload,
                    'skills': agent['skills']
                })
            current_date += timedelta(hours=1) # Simulate hourly data
        
        return simulated_data

    def preprocess_data(self, raw_data):
        # Example preprocessing: convert to pandas DataFrame, handle missing values, feature scaling
        # For this prototype, we'll just return the raw data as is.
        print("Preprocessing data (for demonstration, returning raw data).")
        return raw_data

if __name__ == '__main__':
    ingestor = CaregiverDataIngestion()

    # Get and preprocess data for the last 7 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=7)
    
    raw_data = ingestor.get_caregiver_availability_data(start_date, end_date)
    processed_data = ingestor.preprocess_data(raw_data)

    print(f"\nIngested and processed {len(processed_data)} data points.")
    # Print a few sample data points
    for i in range(min(5, len(processed_data))):
        print(json.dumps(processed_data[i], indent=2))
