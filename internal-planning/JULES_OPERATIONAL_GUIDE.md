# Jules Operational Guide

**Status:** ACTIVE
**Version:** 1.0
**Date:** August 22, 2025

## 1. Core Operational Principles

This document contains the definitive guide for interacting with the Jules Coding Agent. All agents MUST adhere to these principles to ensure successful task delegation and execution.

### **Principle 1: Jules Operates in an Isolated Cloud Environment**

Jules **does not** have access to any local file system. When a task is delegated, Jules performs the following steps:
1.  Clones the **remote Git repository** into a fresh, secure Google Cloud VM.
2.  Executes the task based *only* on the contents of the repository and the prompt.
3.  Submits its work back as a **Pull Request**.

**Implication:** Jules cannot see or use local-only files, scripts (like `run-in-workspace.sh`), or environment variables (from a local `.env` file).

### **Principle 2: All Interactions are Git-Based**

-   **Input:** The *only* context Jules receives is the state of the remote repository and the content of the prompt.
-   **Output:** The *only* output from Jules is a pull request. It will never modify local files directly.

### **Principle 3: All Tasks Must Be Self-Contained in the Repository**

-   **Commands:** All necessary commands for testing, building, or linting **must** be defined as scripts in the relevant `package.json` file. This is the standard, repository-native way to define tasks.
-   **Configuration:** All configuration files required for a task must be committed to the repository.

## 2. Standard Operating Procedures

### **Delegating a Task to Jules**

1.  **Ensure All Context is in Git:** Before delegating, confirm that all necessary context files, scripts, and configurations are pushed to the remote repository.
2.  **Use the Standard Prompt Format:** All delegations must follow the format defined in `internal-planning/JULES_INTEGRATION_PROTOCOL.md`.
3.  **Define Commands as `npm` Scripts:** If Jules needs to run a command (e.g., to test its work), ensure there is a corresponding script in the appropriate `package.json`. For example, to run tests in the `mcp-bridge` workspace, the root `package.json` has a `"test": "npm test --workspaces --if-present"` script.

### **Handling Secrets and Environment Variables**

-   Jules **cannot** access a local `.env` file.
-   Our code is architected to use `dotenv` for local development, but in Jules's cloud environment, secrets must be provided as secure environment variables through its platform interface.
-   For tasks requiring secrets, ensure the prompt clearly lists the required variable names as defined in `.env.example`.

### **Troubleshooting Jules's Failures**

-   If Jules reports `No such file or directory`, it means the file it needs is **not in the remote repository**.
-   If Jules reports `command not found`, it means the command is not defined as a script in the relevant `package.json`.
-   If Jules is blocked, the root cause is almost always a discrepancy between the local environment and the state of the remote repository. The solution is to ensure the repository is self-contained and provides all necessary instructions and dependencies.
