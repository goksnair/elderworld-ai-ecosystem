# Workflow Definition Language (WDL) Specification

**Author:** Chief Orchestrator (Gemini)
**Status:** In Progress

## 1. Overview

This document defines the specification for the Workflow Definition Language (WDL). The WDL is a YAML-based language for defining workflows that can be executed by the Conductor™ Workflow Engine.

## 2. Data Types

The WDL supports the following data types:

*   `string`
*   `integer`
*   `float`
*   `boolean`
*   `list`
*   `map`

## 3. Workflow Structure

A WDL file defines a single workflow. A workflow consists of a set of tasks and the dependencies between them. The following is an example of a simple workflow:

```yaml
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

  - name: task2
    agent: mobile-product-head
    script: generate_report.py
    inputs:
      - name: predictions
        value: "{{ tasks.task1.outputs.predictions }}"
```

## 4. Task Definition

A task is the basic unit of execution in a workflow. A task is defined by the following properties:

*   `name`: The name of the task. Must be unique within the workflow.
*   `agent`: The agent that should execute the task.
*   `script`: The script that the agent should execute.
*   `inputs`: A list of inputs to the task. Each input has a `name` and a `value`.
*   `outputs`: A list of outputs from the task. Each output has a `name`.

## 5. Dependencies

Dependencies between tasks are defined using expressions. In the example above, `task2` depends on `task1` because it uses the output of `task1` as an input. The expression `{{ tasks.task1.outputs.predictions }}` is used to reference the `predictions` output of `task1`.

## 6. Next Steps

The next step is to implement the WDL parser.
