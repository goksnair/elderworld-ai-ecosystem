-- FIX AGENT CONSTRAINT VIOLATIONS
-- This script ensures all agent names are properly allowed in the database

-- First, check what constraints currently exist
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.agent_messages'::regclass 
AND contype = 'c'
AND conname LIKE '%agent_messages_%check%';

-- Drop existing constraints to avoid conflicts
ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;
ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;

-- Create comprehensive sender constraint
ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_sender_check 
CHECK (sender IN (
    'Claude Code',
    'Gemini Prime', 
    'GitHub Copilot',
    'User',
    'Chief Orchestrator (Gemini)',
    'ai-ml-specialist',
    'mobile-product-head',
    'senior-care-boss',
    'operations-excellence',
    'market-intelligence', 
    'product-innovation',
    'partnership-development',
    'compliance-quality',
    'finance-strategy'
));

-- Create comprehensive recipient constraint  
ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_recipient_check
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
    'finance-strategy'
));

-- Verify constraints are properly created
SELECT 'Agent constraints updated successfully!' as status;
SELECT conname, consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.agent_messages'::regclass 
AND contype = 'c'
AND conname LIKE '%agent_messages_%check%';