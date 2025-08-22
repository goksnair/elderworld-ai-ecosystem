name: my_workflow
description: A simple example workflow

tasks:
  - name: task1
    agent: ai-ml-specialist
    script: run_model.py
    inputs:
      - name: data
        value: "my_data.csv"
    outputs:
      - name: predictions
    task_management_system: jira

  - name: task2
    agent: mobile-product-head
    script: generate_report.py
    inputs:
      - name: predictions
        value: "{{ tasks.task1.outputs.predictions }}"
    task_management_system: asana