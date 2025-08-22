import requests
import os

class AsanaAPIWrapper:
    def __init__(self, access_token):
        self.base_url = "https://app.asana.com/api/1.0"
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }

    def create_task(self, workspace_gid, project_gid, name, notes=None, assignee_gid=None):
        url = f"{self.base_url}/tasks"
        payload = {
            "data": {
                "name": name,
                "notes": notes,
                "projects": [project_gid],
                "workspace": workspace_gid
            }
        }
        if assignee_gid:
            payload["data"]["assignee"] = assignee_gid

        response = requests.post(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

    def get_task(self, task_gid):
        url = f"{self.base_url}/tasks/{task_gid}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def update_task(self, task_gid, updates):
        url = f"{self.base_url}/tasks/{task_gid}"
        payload = {"data": updates}
        response = requests.put(url, headers=self.headers, json=payload)
        response.raise_for_status()
        return response.json()

    def get_projects(self, workspace_gid):
        url = f"{self.base_url}/workspaces/{workspace_gid}/projects"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_users(self, workspace_gid):
        url = f"{self.base_url}/workspaces/{workspace_gid}/users"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

if __name__ == '__main__':
    # Example Usage (replace with your actual Asana details)
    ASANA_ACCESS_TOKEN = os.getenv("ASANA_ACCESS_TOKEN")
    ASANA_WORKSPACE_GID = os.getenv("ASANA_WORKSPACE_GID") # GID of your workspace
    ASANA_PROJECT_GID = os.getenv("ASANA_PROJECT_GID")     # GID of your project

    if not all([ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_GID, ASANA_PROJECT_GID]):
        print("Please set ASANA_ACCESS_TOKEN, ASANA_WORKSPACE_GID, and ASANA_PROJECT_GID environment variables.")
    else:
        asana = AsanaAPIWrapper(ASANA_ACCESS_TOKEN)

        try:
            # Get projects in your workspace
            # projects = asana.get_projects(ASANA_WORKSPACE_GID)
            # print("Projects:", [p['name'] for p in projects['data']])

            # Get users in your workspace
            # users = asana.get_users(ASANA_WORKSPACE_GID)
            # print("Users:", [u['name'] for u in users['data']])

            # Create a task
            new_task = asana.create_task(
                workspace_gid=ASANA_WORKSPACE_GID,
                project_gid=ASANA_PROJECT_GID,
                name="Test Task from Gemini",
                notes="This is a test task created by the Gemini AI for integration testing."
                # assignee_gid="YOUR_ASSIGNEE_GID" # Optional: GID of the assignee
            )
            print(f"Created task: {new_task['data']['gid']}")
            print(f"Task Name: {new_task['data']['name']}")

            # Get task details
            task_details = asana.get_task(new_task['data']['gid'])
            print(f"Task Notes: {task_details['data']['notes']}")

            # Update task
            # updated_task = asana.update_task(new_task['data']['gid'], {"completed": True})
            # print(f"Updated task status: {updated_task['data']['completed']}")

        except requests.exceptions.RequestException as e:
            print(f"Asana API Error: {e}")
            if e.response is not None:
                print(f"Response Text: {e.response.text}")
