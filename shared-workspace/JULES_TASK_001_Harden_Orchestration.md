# JULES TASK DELEGATION: Harden Orchestration System

**ID:** JULES-TASK-001
**Delegating Agent:** Chief_Orchestrator
**Target Agent:** jules-code-proxy
**Status:** PENDING_DELEGATION

---

**Jules Task Delegation**

**Objective:**
Diagnose and fix the critical A2A (Agent-to-Agent) communication failure and harden the orchestration system with robust error handling, testing, and monitoring.

**Context Files:**
*   `/Users/gokulnair/senior-care-startup/ai-ecosystem/current-strategy/CLAUDE.md` (for system status and context)
*   `/Users/gokulnair/senior-care-startup/ai-ecosystem/internal-planning/agent-coordination-protocols.md`
*   `/Users/gokulnair/senior-care-startup/ai-ecosystem/mcp-bridge/server.js` (primary target for the fix)
*   `/Users/gokulnair/senior-care-startup/ai-ecosystem/mcp-bridge/package.json`
*   `/Users/gokulnair/senior-care-startup/ai-ecosystem/.env.example` (for required environment variables)

**Acceptance Criteria:**
*   [ ] **1. Diagnose & Fix:** The `fetch is not a function` error reported in the health check for Vercel and Railway wrappers must be resolved. This likely requires adding a Node.js-compatible fetch library (like `node-fetch`) to the `mcp-bridge/package.json` and requiring it in the relevant API wrappers.
*   [ ] **2. Add Integration Test:** Create a new test file, `mcp-bridge/tests/a2a_integration_test.js`, that uses a library like `axios` to:
    *   Start the `mcp-bridge` server as a child process.
    *   Send a mock task from a "source agent" to a "target agent" via a POST request to the `/a2a/message` endpoint.
    *   Assert that the server returns a `200 OK` status.
    *   Assert that the server logs show successful message receipt and forwarding.
*   [ ] **3. Enhance Health Check:** Modify the `/health` endpoint in `mcp-bridge/server.js` so that it returns a `200 OK` status *only if all* critical services (Supabase, GitHub) are healthy. If any critical service fails its health check, the endpoint should return a `503 Service Unavailable`.
*   [ ] **4. Implement Retries:** In the A2A message forwarding logic within `mcp-bridge/communication/a2a-layer.js`, wrap the `fetch` call in a retry mechanism (e.g., using `async-retry`) that attempts a request up to 3 times with exponential backoff before failing.
*   [ ] **5. Improve Logging:** Ensure all `catch` blocks in `mcp-bridge/server.js` and the API wrappers log the error stack, a timestamp, and a unique request ID for better traceability.

**Expected Output:**
A pull request with modifications to the `mcp-bridge` service that resolve the communication failures and make the entire system more resilient and testable.
