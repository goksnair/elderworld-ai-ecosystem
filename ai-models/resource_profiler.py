import os
import json
from supabase import create_client, Client

class ResourceProfiler:
    def __init__(self):
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)

    def get_agent_profile(self, agent_id):
        response = self.supabase.from_('agents').select('*').eq('id', agent_id).execute()
        if response.data:
            return response.data[0]
        return None

    def update_agent_profile(self, agent_id, updates):
        response = self.supabase.from_('agents').update(updates).eq('id', agent_id).execute()
        if response.data:
            return response.data[0]
        return None

    def get_all_agent_profiles(self):
        response = self.supabase.from_('agents').select('*').execute()
        if response.data:
            return response.data
        return []

if __name__ == '__main__':
    # Example Usage
    profiler = ResourceProfiler()

    # Get a single agent profile
    agent_id = 'agent_ai_ml'
    profile = profiler.get_agent_profile(agent_id)
    if profile:
        print(f"Profile for {agent_id}: {json.dumps(profile, indent=2)}")
    else:
        print(f"Agent {agent_id} not found.")

    # Update an agent profile
    updates = {'availability': False, 'current_workload': 5}
    updated_profile = profiler.update_agent_profile(agent_id, updates)
    if updated_profile:
        print(f"Updated profile for {agent_id}: {json.dumps(updated_profile, indent=2)}")

    # Get all agent profiles
    all_profiles = profiler.get_all_agent_profiles()
    print("\nAll Agent Profiles:")
    for profile in all_profiles:
        print(json.dumps(profile, indent=2))