#!/bin/bash
# GEMINI VERIFICATION INTEGRATION SCRIPT
# Automatically applies verification protocol to all Gemini interactions

GEMINI_VERIFICATION_BRIDGE="/Users/gokulnair/senior-care-startup/ai-ecosystem/gemini_verification_bridge.py"
SESSION_ID="${1:-current-session}"

# Function to verify Gemini output
verify_gemini_response() {
    local response="$1"
    local session="$2"
    
    # Run verification
    python3 "$GEMINI_VERIFICATION_BRIDGE" --verify-gemini --response "$response" --session "$session"
    
    if [ $? -ne 0 ]; then
        echo "🚨 GEMINI VERIFICATION FAILED - Response rejected"
        echo "❌ Unverified claims detected in Gemini output"
        echo "✅ Required: Provide executable verification commands"
        return 1
    fi
    
    return 0
}

# Wrapper for gemini-cli with verification
gemini_verified() {
    local prompt="$1"
    
    # Add verification protocol to prompt
    local verification_prompt=$(python3 "$GEMINI_VERIFICATION_BRIDGE" --get-prompt)
    local full_prompt="$verification_prompt\n\n$prompt"
    
    # Execute Gemini CLI
    local response=$(gemini "$full_prompt")
    
    # Verify response
    verify_gemini_response "$response" "$SESSION_ID"
    
    if [ $? -eq 0 ]; then
        echo "$response"
    else
        echo "🔒 RESPONSE BLOCKED - Verification protocol violation"
    fi
}

# Export function for use
export -f gemini_verified
export -f verify_gemini_response

echo "✅ Gemini verification integration active"
echo "🔒 Use 'gemini_verified' instead of 'gemini' for verified interactions"
