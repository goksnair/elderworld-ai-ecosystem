import json

class TaskParser:
    def __init__(self, task_definition):
        self.task_definition = task_definition

    def parse_task(self):
        name = self.task_definition.get('name')
        agent = self.task_definition.get('agent')
        script = self.task_definition.get('script')
        
        # Extract required skills from the task definition (example: from a 'skills_required' field)
        # For now, we'll assume skills are implicitly tied to the agent type or explicitly defined.
        # In a real scenario, this might involve more complex parsing of the task description.
        skills_required = self.task_definition.get('skills_required', [])
        
        # Extract priority (default to a medium priority if not specified)
        priority = self.task_definition.get('priority', 5) # 1 (highest) to 10 (lowest)
        
        # Extract estimated duration (in minutes, default if not specified)
        estimated_duration = self.task_definition.get('estimated_duration', 60)

        return {
            'name': name,
            'agent': agent,
            'script': script,
            'skills_required': skills_required,
            'priority': priority,
            'estimated_duration': estimated_duration
        }

if __name__ == '__main__':
    # Example Task Definition (from WDL)
    example_task_definition = {
        'name': 'analyze_health_data',
        'agent': 'ai-ml-specialist',
        'script': 'analyze.py',
        'skills_required': ['machine_learning', 'python', 'data_analysis'],
        'priority': 2,
        'estimated_duration': 120
    }

    parser = TaskParser(example_task_definition)
    parsed_task = parser.parse_task()
    print(json.dumps(parsed_task, indent=2))

    example_task_definition_simple = {
        'name': 'send_notification',
        'agent': 'mobile-product-head',
        'script': 'notify.js',
    }
    parser_simple = TaskParser(example_task_definition_simple)
    parsed_task_simple = parser_simple.parse_task()
    print(json.dumps(parsed_task_simple, indent=2))
