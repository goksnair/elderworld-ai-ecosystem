# Agent Communication Design: A2A and MCP Interfaces

This document details the design for enhanced agent-to-agent (A2A) communication and Model Context Protocol (MCP) tool interfaces, ensuring robust, real-time, and secure interaction within the autonomous multi-agent system.

## 1. Core Principles

*   **Structured Messaging:** All communications will use a standardized JSON format for clarity and machine readability.
*   **Context Preservation:** Mechanisms will be in place to ensure critical context is passed seamlessly between agents during handoffs.
*   **Security:** Authentication, authorization (least privilege), and encryption will be paramount for all communication channels.
*   **Business-Centricity:** Communication will always be framed in terms of its contribution to entrepreneurial goals (customer acquisition, revenue, service reliability).

## 2. Agent-to-Agent (A2A) Communication Schema

**Objective:** To enable direct, nuanced, and efficient communication between Claude Code (Primary Agent), Gemini Prime (Secondary Agent), and GitHub Copilot (Specialized Agent).

**Messaging Mechanism:**
*   A lightweight, persistent message queue or a dedicated table in Supabase will be used for asynchronous message exchange.
*   Agents will poll or subscribe to their respective message queues/tables.

**Message Structure (JSON Schema):**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentMessage",
  "description": "Standardized message format for inter-agent communication.",
  "type": "object",
  "required": ["id", "sender", "recipient", "type", "timestamp", "payload"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique message identifier."
    },
    "sender": {
      "type": "string",
      "enum": ["Claude Code", "Gemini Prime", "GitHub Copilot", "User"],
      "description": "The agent sending the message."
    },
    "recipient": {
      "type": "string",
      "enum": ["Claude Code", "Gemini Prime", "GitHub Copilot", "User", "All"],
      "description": "The intended recipient agent or 'All' for broadcast."
    },
    "type": {
      "type": "string",
      "enum": [
        "TASK_DELEGATION",
        "TASK_ACCEPTED",
        "PROGRESS_UPDATE",
        "TASK_COMPLETED",
        "BLOCKER_REPORT",
        "REQUEST_FOR_INFO",
        "STRATEGIC_QUERY",
        "BUSINESS_IMPACT_REPORT",
        "ERROR_NOTIFICATION"
      ],
      "description": "Type of message, indicating its purpose."
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of message creation."
    },
    "context_id": {
      "type": "string",
      "description": "Optional: ID linking messages to a specific task or conversation context."
    },
    "payload": {
      "type": "object",
      "description": "Message content, varying based on message type.",
      "properties": {
        "task_id": {"type": "string"},
        "objective": {"type": "string"},
        "description": {"type": "string"},
        "status": {"type": "string"},
        "progress_percentage": {"type": "number"},
        "expected_output_format": {"type": "string"},
        "business_impact": {"type": "string"},
        "key_metrics": {"type": "object"},
        "error_details": {"type": "string"},
        "proposed_solution": {"type": "string"},
        "file_paths": {"type": "array", "items": {"type": "string"}},
        "data": {"type": "object"}
      },
      "required": []
    }
  }
}
```

**Key Message Types & Payloads:**

*   **TASK_DELEGATION:**
    *   `task_id`: Unique ID for the delegated task.
    *   `objective`: High-level business objective.
    *   `description`: Detailed task description.
    *   `business_impact`: How this task contributes to entrepreneurial goals.
    *   `expected_output_format`: Format of the expected deliverable.
    *   `file_paths`: Relevant files for context.

*   **PROGRESS_UPDATE:**
    *   `task_id`: ID of the task being updated.
    *   `status`: Current status (e.g., "In Progress", "Completed", "Blocked").
    *   `progress_percentage`: Numeric progress.
    *   `description`: Brief update on work done.
    *   `key_metrics`: Relevant business or technical metrics.

*   **BLOCKER_REPORT:**
    *   `task_id`: ID of the blocked task.
    *   `error_details`: Description of the blocker.
    *   `business_impact`: Impact on entrepreneurial goals.
    *   `proposed_solution`: Agent's proposed solution.

## 3. Model Context Protocol (MCP) Tool Interfaces

**Objective:** To enable agents to securely and programmatically interact with external cloud platforms (GitHub, Vercel, Railway, Supabase) via the MCP Bridge Server.

**MCP Bridge Server Role:** Acts as a secure gateway, exposing platform-specific functionalities as callable tools to the agents.

**Tool Interface Design Principles:**
*   **Granular Permissions:** Each tool will require specific, least-privilege permissions.
*   **Structured Inputs/Outputs:** Tools will expect and return JSON-formatted data.
*   **Error Handling:** Tools will return standardized error messages for failures.
*   **Asynchronous Execution:** Long-running operations will be handled asynchronously with status callbacks.

**Example MCP Tool Definitions (Conceptual):**

### 3.1. GitHub Tools
*   **`github.clone_repository`:**
    *   `params`: `repo_url`, `local_path`, `branch`
    *   `returns`: `success` (boolean), `message` (string), `local_path` (string)
*   **`github.create_pull_request`:**
    *   `params`: `repo_name`, `title`, `head_branch`, `base_branch`, `body`
    *   `returns`: `pr_url` (string), `pr_number` (number)
*   **`github.update_file`:**
    *   `params`: `repo_name`, `file_path`, `content`, `commit_message`, `branch`
    *   `returns`: `success` (boolean), `sha` (string)

### 3.2. Vercel Tools
*   **`vercel.deploy_project`:**
    *   `params`: `project_id`, `source_path`, `env_vars` (object)
    *   `returns`: `deployment_url` (string), `status` (string)
*   **`vercel.get_deployment_status`:**
    *   `params`: `deployment_id`
    *   `returns`: `status` (string), `url` (string)

### 3.3. Railway Tools
*   **`railway.deploy_service`:**
    *   `params`: `project_id`, `service_id`, `commit_id` (optional)
    *   `returns`: `deployment_id` (string), `status` (string)
*   **`railway.get_service_logs`:**
    *   `params`: `service_id`, `limit` (number)
    *   `returns`: `logs` (array of strings)

### 3.4. Supabase Tools
*   **`supabase.insert_record`:**
    *   `params`: `table_name`, `data` (object)
    *   `returns`: `record_id` (string), `success` (boolean)
*   **`supabase.query_table`:**
    *   `params`: `table_name`, `filters` (object), `select_columns` (array of strings)
    *   `returns`: `results` (array of objects)
*   **`supabase.upload_file`:**
    *   `params`: `bucket_name`, `file_path`, `file_content` (base64 encoded)
    *   `returns`: `public_url` (string)

## 4. Security Considerations

*   **API Key Management:** All API keys and secrets will be stored securely (e.g., environment variables, dedicated secret manager) and never hardcoded.
*   **Least Privilege:** Each tool will be configured with the minimum necessary permissions for its function.
*   **Input Validation:** All inputs to MCP tools will be rigorously validated to prevent injection attacks.
*   **Logging & Auditing:** Comprehensive logs of all tool calls, including parameters and results, will be maintained for auditability and debugging.

## 5. Next Steps

*   Claude Code to implement the MCP tool interfaces and A2A messaging mechanisms based on this design.
*   Gemini Prime to integrate the use of these tools and A2A messages into its orchestration logic.
