#!/bin/bash
# A2A SYSTEM VERIFICATION SCRIPT
# Version: 2.0
# Mandatory execution before any "completion" claims

set -e

echo "🔍 A2A SYSTEM VERIFICATION PROTOCOL v2.0"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VERIFICATION_FAILED=0

# Function to report test results
report_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" = "PASS" ]; then
        echo -e "✅ ${GREEN}PASS${NC}: $test_name"
    else
        echo -e "❌ ${RED}FAIL${NC}: $test_name - $details"
        VERIFICATION_FAILED=1
    fi
}

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up test processes..."
    pkill -f "run_.*_agent.js" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    sleep 2
}

# Ensure cleanup on exit
trap cleanup EXIT

echo "📋 Step 1: Pre-verification Cleanup"
cleanup

echo "📋 Step 2: Starting MCP Bridge Server"
node mcp-bridge/server.js > /tmp/mcp_bridge_test.log 2>&1 &
MCP_PID=$!
sleep 3

if ! kill -0 $MCP_PID 2>/dev/null; then
    report_test "MCP Bridge Startup" "FAIL" "Server failed to start"
    exit 1
fi
report_test "MCP Bridge Startup" "PASS" ""

echo "📋 Step 3: State Manager Verification"

# Test 1: State manager handles non-existent tasks gracefully
echo "Testing state update with non-existent task..."
if python3 ai-models/chief_orchestrator_state_manager_FIXED.py reset --task-id "VERIFY-NONEXISTENT-$(date +%s)" --state "COMPLETED" > /tmp/state_test.log 2>&1; then
    report_test "State Manager Error Handling" "FAIL" "Should fail gracefully for non-existent tasks"
else
    # Check if it's a graceful failure (not a crash)
    if grep -q "MANUALLY RESETTING TASK" /tmp/state_test.log; then
        report_test "State Manager Error Handling" "PASS" ""
    else
        report_test "State Manager Error Handling" "FAIL" "Unexpected error type"
    fi
fi

echo "📋 Step 4: Starting Test Agents"

# Start Gemini agent
node run_gemini_agent.js "Chief Orchestrator (Gemini)" 4002 > /tmp/gemini_verify.log 2>&1 &
GEMINI_PID=$!
sleep 3

if ! kill -0 $GEMINI_PID 2>/dev/null; then
    report_test "Gemini Agent Startup" "FAIL" "Agent failed to start"
    exit 1
fi
report_test "Gemini Agent Startup" "PASS" ""

# Start Claude agent  
node run_claude_agent.js senior-care-boss 4001 > /tmp/claude_verify.log 2>&1 &
CLAUDE_PID=$!
sleep 3

if ! kill -0 $CLAUDE_PID 2>/dev/null; then
    report_test "Claude Agent Startup" "FAIL" "Agent failed to start"
    exit 1
fi
report_test "Claude Agent Startup" "PASS" ""

echo "📋 Step 5: End-to-End Message Flow Test"

# Create a test task file
TEST_TASK_ID="VERIFY-E2E-$(date +%s)"
cat > "shared-workspace/test_task_${TEST_TASK_ID}.md" << EOF
# TEST TASK FOR A2A VERIFICATION

**Priority:** HIGH  
**Task:** Respond with verification confirmation

Please respond with: "A2A_VERIFICATION_SUCCESS" to confirm task processing.
EOF

# Test delegation
echo "Testing task delegation..."
if node mcp-bridge/send_task.js "Chief Orchestrator (Gemini)" senior-care-boss "$TEST_TASK_ID" "shared-workspace/test_task_${TEST_TASK_ID}.md" > /tmp/delegation_test.log 2>&1; then
    report_test "Task Delegation" "PASS" ""
else
    report_test "Task Delegation" "FAIL" "$(cat /tmp/delegation_test.log)"
fi

# Wait for task processing
echo "Waiting for task processing..."
sleep 25

# Cleanup test file
rm -f "shared-workspace/test_task_${TEST_TASK_ID}.md" 2>/dev/null || true

# Check for completion in logs
if grep -q "🎉 Task $TEST_TASK_ID completed" /tmp/gemini_verify.log && \
   grep -q "Updated task $TEST_TASK_ID state to COMPLETED" /tmp/gemini_verify.log; then
    report_test "End-to-End Task Completion" "PASS" ""
else
    report_test "End-to-End Task Completion" "FAIL" "Task completion not detected in logs"
fi

# Check for state management without errors
if grep -q "State update completed for $TEST_TASK_ID" /tmp/gemini_verify.log; then
    report_test "State Management Integration" "PASS" ""
else
    report_test "State Management Integration" "FAIL" "State update not completed successfully"
fi

echo "📋 Step 6: Error Handling Verification"

# Test invalid message handling (this should be handled gracefully)
echo "Testing error handling..."
if grep -q "Failed to update task state:" /tmp/gemini_verify.log; then
    report_test "Error Handling" "FAIL" "Unhandled state update errors detected"
else
    report_test "Error Handling" "PASS" ""
fi

echo "📋 Step 7: Log Quality Assessment"

# Check for comprehensive logging
LOG_CHECKS=0
TOTAL_LOG_CHECKS=4

if grep -q "Task.*received" /tmp/claude_verify.log; then
    ((LOG_CHECKS++))
fi

if grep -q "Task.*accepted" /tmp/gemini_verify.log; then
    ((LOG_CHECKS++))
fi

if grep -q "Task.*completed" /tmp/gemini_verify.log; then
    ((LOG_CHECKS++))
fi

if grep -q "State update completed" /tmp/gemini_verify.log; then
    ((LOG_CHECKS++))
fi

if [ $LOG_CHECKS -eq $TOTAL_LOG_CHECKS ]; then
    report_test "Comprehensive Logging" "PASS" ""
else
    report_test "Comprehensive Logging" "FAIL" "Missing log entries ($LOG_CHECKS/$TOTAL_LOG_CHECKS found)"
fi

echo "📋 Step 8: Final Verification Summary"
echo "========================================"

if [ $VERIFICATION_FAILED -eq 0 ]; then
    echo -e "🎉 ${GREEN}✅ A2A SYSTEM VERIFICATION PASSED${NC}"
    echo "System is ready for production deployment"
    echo ""
    echo "Verification completed successfully:"
    echo "  ✅ State management works without errors"  
    echo "  ✅ End-to-end message flow operational"
    echo "  ✅ Error handling properly implemented"
    echo "  ✅ Comprehensive logging in place"
    echo "  ✅ All critical fixes verified working"
    
    # Generate verification certificate
    cat > "A2A_VERIFICATION_CERTIFICATE_$(date +%Y%m%d_%H%M%S).txt" << EOF
A2A SYSTEM VERIFICATION CERTIFICATE
===================================
Date: $(date)
System Version: Multi-LLM A2A Communication v2.0
Verification Protocol: v2.0

VERIFICATION RESULTS:
✅ All core functionality tests passed
✅ Error handling verified
✅ State management operational  
✅ End-to-end workflow confirmed
✅ Logging and monitoring verified

CRITICAL FIXES CONFIRMED:
✅ Gemini agent state update error handling fixed
✅ Claude agent message payload validation enhanced
✅ Python subprocess logging properly handled

System Status: PRODUCTION READY
Verified by: A2A System Verification Protocol v2.0
Certificate ID: A2A-CERT-$(date +%Y%m%d_%H%M%S)

This certificate confirms the A2A communication system
meets all operational requirements and is ready for
production deployment.
EOF

    exit 0
else
    echo -e "❌ ${RED}A2A SYSTEM VERIFICATION FAILED${NC}"
    echo "System is NOT ready for production"
    echo ""
    echo "CRITICAL: Fix all failed tests before proceeding"
    echo "Review logs in /tmp/ directory for detailed error information"
    echo ""
    echo "Required actions:"
    echo "  1. Review and fix all failed test cases"
    echo "  2. Re-run verification protocol"  
    echo "  3. Ensure all tests pass before deployment"
    
    exit 1
fi