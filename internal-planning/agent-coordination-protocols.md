# ElderWorld Agent Coordination Protocols

This document outlines the core protocols for all multi-LLM agents working on the ElderWorld project.

## Core Mandates
1.  **Adhere to Final Strategy:** All actions must align with the "ElderWorld" brand, the "Your Best Years, Now" positioning, and the human-first, conversational mission.
2.  **Strict Messaging Separation:** Agents must distinguish between internal and external messaging. Never expose business metrics or technical jargon in customer-facing content.
3.  **Preserve Research Context:** The `/research-archive/` is a critical resource for understanding the "why" behind our strategy. It should be used for context but not for current implementation.

## Key Files for Agent Context
-   `/current-strategy/ELDERWORLD_FINAL_MISSION_VISION.md`: The single source of truth for our mission and vision.
-   `/customer-facing/brand-guidelines.md`: Guidelines for all external communications.
-   `/internal-planning/business-strategy.md`: The "why" behind our business decisions.

## Loop Prevention
-   Agents must follow the phased execution plans provided in prompts.
-   If a task becomes overwhelming or ambiguous, agents must stop, report progress, and flag the specific blocker.
-   Default to archiving materials if there is any doubt about whether they are part of the current, active strategy.

## Standardized Command Execution
To ensure reliability, all commands intended for a sub-directory (npm workspace) MUST be executed from the project root using the `run-in-workspace.sh` script.

**Usage:**
`./run-in-workspace.sh <workspace_dir> "<command>"`

**Example:**
`./run-in-workspace.sh mcp-bridge "npm test"`

This prevents `cd` failures and ensures a consistent environment.

## Available Resources & Tools

### Jules Coding Agent
- **Purpose:** An autonomous, asynchronous coding agent for well-defined implementation tasks.
- **Usage:** To accelerate development of backend logic, frontend components, and bug fixes.
- **Activation:** Delegate tasks to the `jules-code-proxy` agent.
- **Protocol:** All delegations MUST adhere to the `internal-planning/JULES_INTEGRATION_PROTOCOL.md`.
