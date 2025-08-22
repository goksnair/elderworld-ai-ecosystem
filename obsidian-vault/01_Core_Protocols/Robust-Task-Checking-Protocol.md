# Robust Task Checking Protocol for Chief Orchestrator (Gemini)

## Overview
This document outlines the robust and adaptive protocol for the Chief Orchestrator (Gemini) to monitor and verify the progress of delegated tasks. This protocol is designed to prevent infinite checking loops, reduce unnecessary system load, and ensure timely escalation of unresponsive tasks, leveraging both internal state management and external message verification.

## Core Principles
1.  **Event-Driven Primary:** The Chief Orchestrator primarily relies on explicit A2A messages from delegated agents (`TASK_ACCEPTED`, `PROGRESS_UPDATE`, `TASK_COMPLETED`) to track task progress.
2.  **Adaptive Polling as Fallback:** Manual polling (via `check_task_response`) is used only as a fallback mechanism when expected event-driven updates are not received within a calculated timeframe.
3.  **Exponential Backoff:** The interval between polling attempts increases exponentially to reduce system load and avoid hammering unresponsive agents.
4.  **Threshold-Based Escalation:** Clear thresholds are defined for escalating tasks that remain unresponsive despite adaptive polling.
5.  **External Verification:** The `protocol-checker.js` utility is used to independently verify message flow and task gate transitions in the A2A system.

## Implementation Details (in `ai-models/chief_orchestrator_state_manager_FIXED.py`)

### 1. Task State Fields
Each task in the Chief Orchestrator's state (`chief_orchestrator_state.json`) now includes:
*   `check_attempts`: Integer, counts how many times `check_task_response` has been called without a state change.
*   `next_check_time`: ISO formatted datetime string, the earliest time the task should be checked again.

### 2. Configuration Parameters
The `ChiefOrchestratorStateManager` is configured with:
*   `initial_check_wait_time`: (e.g., 30 seconds) - The initial delay before the first check after delegation.
*   `backoff_factor`: (e.g., 2) - Multiplier for exponential backoff.
*   `max_check_wait_time`: (e.g., 1800 seconds / 30 minutes) - Maximum interval between checks.
*   `max_check_attempts`: (e.g., 10 attempts) - Maximum number of checks before a task is escalated.

### 3. `check_task_response` Logic
This method now incorporates the adaptive logic:

*   **Initial Check Time Initialization:** If `next_check_time` is `None` (e.g., after initial delegation or reset), it's set to `current_time + initial_check_wait_time`.
*   **Time-Based Gate:** The method first checks if `current_time >= next_check_time`. If not, it returns, indicating that it's not yet time to check the task, thus preventing frequent polling.
*   **Increment Attempts:** If it's time to check, `check_attempts` is incremented.
*   **Max Attempts Escalation:** If `check_attempts` exceeds `max_check_attempts`, the task is immediately escalated.
*   **`protocol-checker.js` Execution:** The external `protocol-checker.js` is run to query the Supabase `agent_messages` table for `TASK_ACCEPTED`, `PROGRESS_UPDATE`, or `TASK_COMPLETED` messages.
*   **State Change & Reset:** If `protocol-checker.js` indicates a state change (e.g., `DELEGATED` to `ACCEPTED`), `check_attempts` is reset to 0, and `next_check_time` is set to `None` (to be re-initialized on the next relevant event or check).
*   **Exponential Backoff Calculation:** If no state change is detected, `next_check_time` is recalculated using `initial_check_wait_time * (backoff_factor ** check_attempts)`. The calculated wait time is capped by `max_check_wait_time`.

### 4. `reset_task` Updates
When a task is manually reset, `check_attempts` is reset to 0 and `next_check_time` is set to `None` to ensure the adaptive checking restarts cleanly.

## Role of `protocol-checker.js`
`protocol-checker.js` acts as the independent verification layer. It directly queries the A2A message database (Supabase) to confirm that agents are sending the expected lifecycle messages. This decouples the Chief Orchestrator's state from direct message parsing, making the system more robust and auditable.

## Benefits
*   **Reduced System Load:** Prevents continuous polling of unresponsive agents.
*   **Improved Efficiency:** Orchestrator spends less time checking and more time on strategic tasks.
*   **Clearer Escalation:** Automated escalation based on defined thresholds ensures timely human intervention for truly stuck tasks.
*   **Robustness:** Adaptive nature handles temporary network glitches or agent delays gracefully.
*   **Auditability:** `check_attempts` and `next_check_time` provide insight into task monitoring history.

## Future Enhancements
*   **Agent-Specific Backoff:** Allow `initial_check_wait_time` and `max_check_attempts` to be configured per agent based on their typical task complexity and response times.
*   **Event-Driven Triggers:** Implement real-time listeners on the Supabase `agent_messages` table to trigger `check_task_response` immediately upon message receipt, further reducing reliance on polling.

## Verification
This protocol's effectiveness is verified by observing the `check_attempts` and `next_check_time` fields in the `chief_orchestrator_state.json` for delegated tasks. Successful state transitions (e.g., `DELEGATED` to `ACCEPTED` to `COMPLETED`) without hitting `max_check_attempts` or triggering escalations confirm the protocol's success. Conversely, tasks that do escalate will clearly show the reason and the number of attempts made.
