# Jules Coding Agent Integration Protocol

**Status:** DRAFT
**Version:** 1.0
**Date:** August 20, 2025

## 1. Overview

This document outlines the protocol for integrating and utilizing the Jules Coding Agent by Google within the ElderWorld project's multi-agent ecosystem.

Jules is to be treated as a specialized, autonomous, and asynchronous **implementation tool**. It is not a strategic agent and does not replace the domain expertise of our existing specialized agents. Its primary function is to accelerate development by taking on well-defined coding tasks, which are then reviewed and integrated by our existing agent hierarchy.

## 2. Delegation Authority

The following agents are authorized to delegate tasks to the Jules Coding Agent, via the `jules-code-proxy`:

-   **Chief Orchestrator (Gemini):** For project-wide tasks like refactoring, dependency updates, and code quality enforcement.
-   **`ai-ml-specialist`:** For tasks related to backend logic, database functions, and AI model integration code.
-   **`product-innovation`:** For tasks related to frontend component creation, UI/UX implementation, and adherence to brand guidelines in code.
-   **`operations-excellence`:** For tasks related to scripting operational procedures and automating workflows.

## 3. Task Formatting Guidelines

To ensure predictable and high-quality output from Jules, all delegated tasks MUST be formatted using the following structure:

```markdown
**Jules Task Delegation**

**Objective:**
A clear, single-sentence description of the desired outcome.
*Example: "Create a new React component to display a patient's daily medication schedule."*

**Context Files:**
A list of absolute paths to files that Jules must use for context. This is critical for consistency.
*Example:*
*   `/customer-facing/brand-guidelines.md`
*   `/implementation/ui-ux-components/ui-components/css/elderworld-theme.css`
*   `/implementation/backend-systems/actual-execution/family-communication-platform/FamilyDashboard.jsx` (for style reference)

**Acceptance Criteria:**
A checklist of specific, verifiable requirements for the task to be considered complete.
*Example:*
*   [ ] Component must be written in React with TypeScript.
*   [ ] All styling must use CSS variables from `elderworld-theme.css`.
*   [ ] The component must be named `MedicationSchedule.tsx`.
*   [ ] Unit tests with at least 80% coverage must be included.
*   [ ] The code must pass all existing linting rules.

**Expected Output:**
A description of the final deliverable.
*Example: "A new file named `MedicationSchedule.tsx` and a corresponding test file `MedicationSchedule.test.tsx` in the `/implementation/ui-ux-components/ui-components/` directory."*
```

## 4. Review and Integration Process

Jules operates asynchronously and will submit its work as a pull request. The following review process is mandatory:

1.  **Jules Submits PR:** Jules completes the task in its secure VM and creates a pull request, including its reasoning and a diff of the changes.
2.  **Primary Review:** The **delegating agent** is responsible for the primary review of the pull request. The agent must:
    *   Verify that all acceptance criteria have been met.
    *   Assess the code quality, logic, and adherence to project conventions.
    *   Review Jules's reasoning to understand the approach taken.
3.  **Verification:** Before approval, the delegating agent MUST run the standard project verification scripts on the changed code.
    *   `sh verify_solution.sh --path /path/to/changed/files`
4.  **Secondary Review (Optional but Recommended):** For critical changes (e.g., modifications to core APIs, emergency systems), the Chief Orchestrator must perform a secondary review.
5.  **Merge:** Once approved and verified, the pull request can be merged.

## 5. Feedback Loop

Jules's performance can be improved with feedback. After a pull request is reviewed, the primary reviewer should provide concise feedback on the quality of the work, especially if changes were required.

-   **Positive Feedback:** "The code was clean, well-documented, and met all acceptance criteria on the first try."
-   **Constructive Feedback:** "The logic was correct, but the code did not adhere to our internal style guide for variable naming. Please ensure all future code follows the conventions in `GLOBAL-SYSTEM-GUIDELINES.md`."

## 6. Example Task Delegation

**From:** `product-innovation`
**To:** `jules-code-proxy`

**Jules Task Delegation**

**Objective:**
Create a new React component that displays a "Family Circle" of members, showing their name, role, and online status.

**Context Files:**
*   `/customer-facing/brand-guidelines.md`
*   `/implementation/ui-ux-components/ui-components/css/elderworld-theme.css`
*   `/implementation/ui-ux-components/ui-components/ADVANCED_FIXED.html` (for visual reference of the "Family Circle" card)

**Acceptance Criteria:**
*   [ ] The component must be a functional React component using TypeScript.
*   [ ] The component should be named `FamilyCircle.tsx`.
*   [ ] It should accept an array of family members as a prop, with each member having `name`, `role`, and `status` ('online', 'away', 'offline').
*   [ ] The styling must match the "Family Circle" card in `ADVANCED_FIXED.html` and use variables from `elderworld-theme.css`.
*   [ ] The component must be self-contained and have no external dependencies beyond React.

**Expected Output:**
A single new file, `FamilyCircle.tsx`, located in `/implementation/ui-ux-components/ui-components/`.
