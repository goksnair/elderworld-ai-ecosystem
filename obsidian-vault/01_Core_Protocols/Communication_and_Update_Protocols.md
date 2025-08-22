# Communication and Update Protocols

This document defines the communication and update protocols for the autonomous multi-agent system, ensuring clear, timely, and efficient information flow between agents and with the user, all aligned with the **Core Entrepreneurial Framework**.

## 1. General Principles (Business-Centric Communication)

*   **Clarity & Conciseness:** All communications should be clear, concise, and directly relevant to the task or status being reported, with an emphasis on business impact.
*   **Timeliness:** Updates should be provided promptly upon completion of tasks, reaching defined checkpoints, or encountering blockers, especially if they impact customer acquisition or revenue.
*   **Structured Reporting:** Use predefined formats for updates to ensure consistency and ease of parsing, focusing on key business metrics and entrepreneurial objectives.
*   **Asynchronous Communication:** Prioritize asynchronous communication channels to allow agents to operate independently without waiting for immediate responses, unless real-time collaboration is explicitly required for critical business outcomes.
*   **Business Impact Reporting:** All reports should clearly articulate the contribution of the work to customer value, revenue generation, and core service reliability.

## 2. Agent-to-Agent Communication (Orchestrated for Business Value)

### 2.1. Task Handoffs (Primary Agent to Secondary/Sub-Agents)
*   **Trigger:** Claude Code (Primary Agent) delegates a strategic task to Gemini Prime (Secondary Agent) or a sub-agent. Gemini Prime delegates detailed tasks to GitHub Copilot or other specialized agents.
*   **Format:** Clear task description, including:
    *   Task ID (if applicable)
    *   **Business Objective:** Explicitly state the customer value, revenue impact, or operational efficiency goal.
    *   Specific requirements/specifications (e.g., PRD section, technical design document reference).
    *   Expected output format (e.g., code, market research report, UI prototype).
    *   Deadline (if applicable), tied to business timelines (e.g., pilot launch).
    *   Relevant file paths or context.
*   **Channel:** Internal system messaging, shared workspace files (e.g., `shared-workspace/task-handoff-XYZ.md`), or dedicated message queues for MCP/A2A.

### 2.2. Progress Updates (Secondary/Sub-Agents to Primary Agent)
*   **Trigger:** Completion of a sub-task, reaching a significant milestone, or encountering a blocker/error.
*   **Format:** Structured updates including:
    *   Task ID
    *   Current status (e.g., "In Progress," "Completed," "Blocked").
    *   Brief description of work completed, explicitly linking it to the business objective.
    *   Any issues encountered and proposed solutions, with an assessment of their impact on business goals.
    *   Expected time to completion (if still in progress), re-evaluating business timelines.
    *   Link to generated code, test results, market insights, or other outputs.
*   **Channel:** Internal system messaging, shared workspace files (e.g., `shared-workspace/progress-report-XYZ.md`), or dedicated message queues for MCP/A2A.

### 2.3. Cross-Agent Collaboration (Optimized for Efficiency)
*   **Trigger:** When a task requires direct collaboration between agents (e.g., Claude Code and GitHub Copilot on integrated development).
*   **Format:** Agents will communicate directly on shared codebases (e.g., Git branches) and use internal messaging for coordination, focusing on efficient problem-solving for business outcomes.
*   **Channel:** Version control system (Git), internal system messaging, or direct MCP/A2A communication.

## 3. Agent-to-User Communication (Business-Focused Reporting)

### 3.1. Development Cycle Completion Updates
*   **Trigger:** Completion of a major product development cycle stage (e.g., PMF validated, customer onboarding workflow complete, revenue target hit).
*   **Format:** Gemini Prime will provide a concise summary including:
    *   Stage completed, with a clear statement of business value delivered.
    *   Key outputs/deliverables, framed in terms of customer impact and revenue.
    *   Overall status of the product development cycle against entrepreneurial goals.
    *   Next planned stage, with its primary business objective.
    *   Any critical decisions required from the user, always with a business context.
*   **Channel:** CLI output, `SYSTEM_ACTIVITY_LOG.md`, and `session-memory-YYYYMMDD.md`.

### 3.2. Infrastructure Requirements (Business Justified)
*   **Trigger:** Identification of a new infrastructure component or account setup required.
*   **Format:** Gemini Prime will clearly state:
    *   The required component/service.
    *   Its purpose, explicitly linking it to a business need (e.g., enabling customer acquisition, improving emergency response reliability).
    *   Why user intervention is needed (e.g., account creation, API key generation).
    *   Any specific configuration details.
*   **Channel:** CLI output, `SYSTEM_ACTIVITY_LOG.md`.

### 3.3. Critical Blockers/User Intervention Requests (Business Critical)
*   **Trigger:** An unresolvable blocker, a major strategic decision point, or a situation requiring explicit user approval that impacts business goals.
*   **Format:** Gemini Prime will provide:
    *   Description of the issue/decision, with its direct impact on customer acquisition, revenue, or core service delivery.
    *   Proposed options/solutions (if any), evaluated by their business implications.
    *   Clear request for user input/decision, emphasizing the entrepreneurial choice.
*   **Channel:** CLI output, `SYSTEM_ACTIVITY_LOG.md`.

### 3.4. Session Handoffs (Contextual for Business Continuity)
*   **Trigger:** End of a session or pausing a critical, multi-session task.
*   **Format:** Gemini Prime will update the `session-memory-YYYYMMDD.md` file with:
    *   Date and time.
    *   Summary of progress made, framed by business objectives.
    *   Current status of active tasks, with their entrepreneurial relevance.
    *   Next planned actions, linked to business outcomes.
    *   Any pending user inputs.
*   **Channel:** `session-memory-YYYYMMDD.md`.

## 4. Logging and Audit Trail (For Business Accountability)

*   **SYSTEM_ACTIVITY_LOG.md:** All significant agent activities, task delegations, completions, and user interactions will be logged here for an auditable trail, with an emphasis on business impact and decision rationale.
*   **Version Control:** Code changes and document updates will be tracked via Git repositories, ensuring a complete history of development and strategic decisions.
