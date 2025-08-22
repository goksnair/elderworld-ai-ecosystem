#!/bin/bash
# MANDATORY DELEGATION VALIDATION SCRIPT FOR CHIEF ORCHESTRATOR (GEMINI)
# Must pass before accepting any task completion

set -e

echo "🔍 MANDATORY DELEGATION VALIDATION FOR CHIEF ORCHESTRATOR"
echo "========================================================="

# Track validation status
VALIDATION_FAILED=0
TASK_ID="$1"

# Function to log failure
log_failure() {
    echo "❌ VALIDATION FAILED: $1"
    VALIDATION_FAILED=1
}

# Function to log success
log_success() {
    echo "✅ VALIDATED: $1"
}

# Check if task ID provided
if [ -z "$TASK_ID" ]; then
    log_failure "No task ID provided for validation"
    exit 1
fi

echo "📋 Validating delegation for task: $TASK_ID"

# 1. Verify task exists in state manager
echo "🔍 Checking task existence in state manager..."
if python3 ai-models/chief_orchestrator_state_manager_FIXED.py status --task-id "$TASK_ID" >/dev/null 2>&1; then
    log_success "Task exists in state manager"
    
    # Get task details
    TASK_STATUS=$(python3 ai-models/chief_orchestrator_state_manager_FIXED.py status --task-id "$TASK_ID" 2>/dev/null)
    
    # Check task state
    if echo "$TASK_STATUS" | grep -q '"state": "COMPLETED"'; then
        log_success "Task marked as COMPLETED in state manager"
    else
        CURRENT_STATE=$(echo "$TASK_STATUS" | grep '"state"' | cut -d'"' -f4)
        log_failure "Task not completed - current state: $CURRENT_STATE"
    fi
    
    # Check for evidence of completion
    if echo "$TASK_STATUS" | grep -q "TASK_COMPLETED"; then
        log_success "Task completion evidence found in messages"
    else
        log_failure "No task completion evidence in message log"
    fi
    
else
    log_failure "Task not found in state manager"
fi

# 2. Check for deliverable files
echo "📄 Checking for task deliverables..."
DELIVERABLE_FILE="shared-workspace/${TASK_ID}-deliverable.md"
if [ -f "$DELIVERABLE_FILE" ]; then
    log_success "Deliverable file found: $DELIVERABLE_FILE"
    
    # Check deliverable content
    if [ -s "$DELIVERABLE_FILE" ]; then
        log_success "Deliverable file has content"
    else
        log_failure "Deliverable file is empty"
    fi
else
    log_failure "No deliverable file found"
fi

# 3. Verify agent response in A2A system
echo "📡 Checking agent response in A2A system..."
# This would check the A2A message log for actual agent responses
if [ -f "senior-care-boss.log" ]; then
    if grep -q "Task.*completed" senior-care-boss.log; then
        log_success "Agent completion logged"
    else
        log_failure "No agent completion evidence in logs"
    fi
else
    log_failure "No agent logs available for verification"
fi

# 4. Check protocol compliance
echo "🛡️ Checking protocol compliance..."
REPORT_OUTPUT=$(python3 ai-models/chief_orchestrator_state_manager_FIXED.py report 2>&1)

if echo "$REPORT_OUTPUT" | grep -q "Protocol Violations: 0"; then
    log_success "Zero protocol violations"
else
    VIOLATIONS=$(echo "$REPORT_OUTPUT" | grep "Protocol Violations:" | grep -o '[0-9]\+')
    log_failure "Protocol violations detected: $VIOLATIONS"
fi

# 5. Verify no network errors during task execution
echo "🌐 Checking for network errors..."
if grep -q "TypeError: fetch failed" senior-care-boss.log 2>/dev/null; then
    log_failure "Network errors detected during task execution"
else
    log_success "No network errors detected"
fi

# 6. Independent evidence verification
echo "🔬 Independent evidence verification..."
VERIFICATION_LOG="shared-workspace/verification_log.txt"
if [ -f "$VERIFICATION_LOG" ]; then
    if tail -10 "$VERIFICATION_LOG" | grep -q "verification PASSED"; then
        log_success "Independent verification evidence found"
    else
        log_failure "No recent independent verification evidence"
    fi
else
    log_failure "No verification log available"
fi

# Generate validation report
echo ""
echo "DELEGATION VALIDATION SUMMARY"
echo "============================"

if [ $VALIDATION_FAILED -eq 0 ]; then
    echo "🟢 ALL VALIDATIONS PASSED"
    echo "✅ Task completion is verified and can be accepted"
    
    # Log successful validation
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Chief Orchestrator validation PASSED for task $TASK_ID" >> shared-workspace/validation_log.txt
    
    exit 0
else
    echo "🔴 VALIDATION FAILED"
    echo "❌ Task completion is NOT verified - MUST REJECT"
    echo ""
    echo "MANDATORY ACTION: Demand evidence and fixes before accepting completion"
    
    # Log failed validation
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Chief Orchestrator validation FAILED for task $TASK_ID" >> shared-workspace/validation_log.txt
    
    exit 1
fi