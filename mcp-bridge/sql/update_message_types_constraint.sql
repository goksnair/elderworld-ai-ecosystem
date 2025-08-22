-- SQL Migration: Update agent_messages table constraints
-- Run this in Supabase SQL Editor to allow all message types and agents
-- Date: 2025-08-12
-- Purpose: Fix A2A communication constraint violations

-- ========================================
-- Step 1: Update Message Type Constraint
-- ========================================

-- Drop existing type constraint
ALTER TABLE agent_messages DROP CONSTRAINT IF EXISTS agent_messages_type_check;

-- Add updated constraint with all valid message types
ALTER TABLE agent_messages ADD CONSTRAINT agent_messages_type_check 
CHECK (type IN (
    'TASK_DELEGATION',
    'TASK_ACCEPTED', 
    'PROGRESS_UPDATE',
    'TASK_COMPLETED',
    'TASK_DELIVERABLES',
    'BLOCKER_REPORT',
    'REQUEST_FOR_INFO',
    'STRATEGIC_QUERY',
    'BUSINESS_IMPACT_REPORT',
    'ERROR_NOTIFICATION',
    'ERROR_RESPONSE',
    'STATUS_RESPONSE',
    'EMERGENCY_ACKNOWLEDGED',
    'TASK_FAILED',
    'USAGE_LIMIT_WARNING',
    'API_QUOTA_EXCEEDED'
));

-- ========================================
-- Step 2: Update Agent Name Constraints
-- ========================================

-- Drop existing sender constraint if it exists
ALTER TABLE agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;

-- Drop existing recipient constraint if it exists  
ALTER TABLE agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;

-- Add updated sender constraint with all valid agents
ALTER TABLE agent_messages ADD CONSTRAINT agent_messages_sender_check
CHECK (sender IN (
    'Claude Code', 
    'Gemini Prime', 
    'GitHub Copilot', 
    'User', 
    'All', 
    'Chief Orchestrator (Gemini)', 
    'ai-ml-specialist', 
    'mobile-product-head',
    'senior-care-boss',
    'operations-excellence',
    'market-intelligence', 
    'product-innovation',
    'partnership-development',
    'compliance-quality',
    'finance-strategy',
    'test-agent',
    'test-sender',
    'constraint-checker',
    'constraint-tester'
));

-- Add updated recipient constraint with all valid agents
ALTER TABLE agent_messages ADD CONSTRAINT agent_messages_recipient_check
CHECK (recipient IN (
    'Claude Code', 
    'Gemini Prime', 
    'GitHub Copilot', 
    'User', 
    'All', 
    'Chief Orchestrator (Gemini)', 
    'ai-ml-specialist', 
    'mobile-product-head',
    'senior-care-boss',
    'operations-excellence',
    'market-intelligence', 
    'product-innovation',
    'partnership-development',
    'compliance-quality',
    'finance-strategy',
    'test-agent',
    'test-recipient',
    'constraint-checker',
    'constraint-tester'
));

-- ========================================
-- Step 3: Verification
-- ========================================

-- Verify all constraints were updated
SELECT 
    conname,
    CASE 
        WHEN conname LIKE '%type%' THEN 'Message Type Constraint'
        WHEN conname LIKE '%sender%' THEN 'Sender Agent Constraint'  
        WHEN conname LIKE '%recipient%' THEN 'Recipient Agent Constraint'
        ELSE 'Other Constraint'
    END as constraint_purpose
FROM pg_constraint 
WHERE conrelid = 'agent_messages'::regclass 
  AND conname LIKE '%agent_messages%'
ORDER BY conname;

-- Test constraint by counting existing records
SELECT 
    COUNT(*) as total_messages,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT sender) as unique_senders,
    COUNT(DISTINCT recipient) as unique_recipients
FROM agent_messages;