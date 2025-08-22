# Welcome to the Senior Care AI Ecosystem

This vault is the central knowledge base for our AI-driven senior care startup. All agents should familiarize themselves with the information contained within these documents to ensure strategic alignment and operational efficiency.

## Core Pillars

*   **[Core Protocols](./01_Core_Protocols/):** This directory contains the fundamental operating procedures for our multi-agent system. It includes our verification protocols, communication guidelines, and the multi-LLM coordination framework. **All agents must adhere to these protocols at all times.**
*   **[Strategy & Roadmap](./02_Strategy_And_Roadmap/):** Here you will find our high-level strategic documents, including the overall business plan, the go-to-market strategy, and our implementation roadmap. This section defines our "why."
*   **[Implementation Details](./03_Implementation_Details/):** This section contains the technical documentation, agent-specific guides, and other details related to the "how" of our operations.
*   **[Daily & Weekly Briefings](./04_Daily_And_Weekly_Briefings/):** This is where you will find the latest updates on our progress, including daily stand-up notes, weekly summaries, and session handoffs.

## Autonomous Multi-Agent System: Operational Directives

Effective immediately, our operational model shifts to a highly autonomous, multi-agent system designed for seamless backend execution and structured product development cycles.

### Core Principles:

*   **Autonomous Backend Operation:** Agents will operate autonomously in the backend, providing updates upon the completion of defined development cycles.
*   **Structured Product Development Cycle:** Each cycle will encompass extensive market research, feature definition, product positioning, brand thesis, Product Requirements Document (PRD) generation, and product feature envisioning.
*   **Agent Specialization & Coordination:**
    *   **Claude Code:** Primarily responsible for projects requiring deep coding capabilities and complex architectural implementations.
    *   **Gemini (CLI Agent):** Responsible for generating meta-prompts, orchestrating tasks for sub-agents, conducting market research based on Claude Code's plans, and developing accurate roadmaps.
    *   **GitHub Copilot:** [Inference] Expected to handle tasks suitable for its integrated IDE and functionality, potentially focusing on front-end development or rapid prototyping.
*   **Clean Handoffs:** Critical for maintaining workflow continuity and efficiency between agents.
*   **Primary Permission Protocols:** Agents will operate with primary permissions to proceed with the majority of tasks, requiring user intervention only when truly necessary (e.g., for critical infrastructure setup or major strategic shifts).

### Infrastructure Requirements:

To support this autonomous operation, the following infrastructure components may be required. User intervention will be needed to set up accounts for:
*   Supabase (Database, Authentication, Storage)
*   Obsidian (Knowledge Management - already in use)
*   GitHub Repository (Version Control, Collaboration)
*   Vercel/Railway (Deployment for web applications/services)
*   Hugging Face (AI Model Hosting/Deployment)
*   n8n (Workflow Automation/Integration)
*   [Inference] Any other tools identified during the planning and execution phases for specific tasks.

### Next Steps:

1.  **Formalize Agent Roles & Responsibilities:** Detail the specific functions and interaction protocols for Claude Code, Gemini, and GitHub Copilot.
2.  **Define Product Development Cycle Stages:** Break down the product development cycle into actionable stages with clear inputs and outputs for each agent.
3.  **Establish Communication & Update Protocols:** Define how agents will communicate progress and deliver updates to the user.
4.  **Implement Infrastructure Setup:** Identify and request necessary account setups from the user.
5.  **Integrate Web Research & Deep Analysis:** Define how these capabilities will be leveraged by agents, particularly Gemini, for informed decision-making.
