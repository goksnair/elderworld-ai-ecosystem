import requests
import os

class JiraAPIWrapper:
    def __init__(self, base_url, username, api_token):
        self.base_url = base_url
        self.auth = (username, api_token)
        self.headers = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    def create_issue(self, project_key, summary, description, issue_type="Task"):
        url = f"{self.base_url}/rest/api/2/issue"
        payload = {
            "fields": {
                "project": {
                    "key": project_key
                },
                "summary": summary,
                "description": description,
                "issuetype": {
                    "name": issue_type
                }
            }
        }
        response = requests.post(url, headers=self.headers, auth=self.auth, json=payload)
        response.raise_for_status()
        return response.json()

    def get_issue(self, issue_key):
        url = f"{self.base_url}/rest/api/2/issue/{issue_key}"
        response = requests.get(url, headers=self.headers, auth=self.auth)
        response.raise_for_status()
        return response.json()

    def update_issue_status(self, issue_key, transition_id):
        url = f"{self.base_url}/rest/api/2/issue/{issue_key}/transitions"
        payload = {
            "transition": {
                "id": transition_id
            }
        }
        response = requests.post(url, headers=self.headers, auth=self.auth, json=payload)
        response.raise_for_status()
        return response.status_code

if __name__ == '__main__':
    # Example Usage (replace with your actual Jira details)
    JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
    JIRA_USERNAME = os.getenv("JIRA_USERNAME")
    JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")

    if not all([JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN]):
        print("Please set JIRA_BASE_URL, JIRA_USERNAME, and JIRA_API_TOKEN environment variables.")
    else:
        jira = JiraAPIWrapper(JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN)

        try:
            # Create an issue
            new_issue = jira.create_issue("TEST", "Test Issue from Gemini", "This is a test issue created by the Gemini AI.")
            print(f"Created issue: {new_issue['key']}")

            # Get issue details
            issue_details = jira.get_issue(new_issue['key'])
            print(f"Issue Summary: {issue_details['fields']['summary']}")

            # Update issue status (you'll need to find valid transition IDs for your workflow)
            # For example, to transition from 'To Do' to 'In Progress', the ID might be '11' or '21'
            # You can find transition IDs by calling GET /rest/api/2/issue/{issueIdOrKey}/transitions
            # status_code = jira.update_issue_status(new_issue['key'], "11") 
            # print(f"Updated issue status with code: {status_code}")

        except requests.exceptions.RequestException as e:
            print(f"Jira API Error: {e}")
            if e.response is not None:
                print(f"Response Text: {e.response.text}")
