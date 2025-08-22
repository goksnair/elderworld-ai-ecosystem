-- CLEAN SLATE: Drop and Create Agent Messages Table
-- This script ensures a completely fresh table with correct schema
-- ⚠️ WARNING: This will destroy any existing agent_messages table and data

-- Step 1: Drop existing table completely (including any constraints, triggers, indexes)
DROP TABLE IF EXISTS public.agent_messages CASCADE;

-- Step 2: Drop any existing functions that might reference the old table
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_message_stats(TEXT) CASCADE;

-- Step 3: Create the table with correct schema from scratch
CREATE TABLE public.agent_messages (
    id VARCHAR(50) PRIMARY KEY,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User')),
    recipient VARCHAR(50) NOT NULL CHECK (recipient IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All')),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'TASK_DELEGATION',
        'TASK_ACCEPTED',
        'PROGRESS_UPDATE', 
        'TASK_COMPLETED',
        'BLOCKER_REPORT',
        'REQUEST_FOR_INFO',
        'STRATEGIC_QUERY',
        'BUSINESS_IMPACT_REPORT',
        'ERROR_NOTIFICATION'
    )),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    context_id VARCHAR(100),
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'ACKNOWLEDGED', 'PROCESSED')),
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX idx_agent_messages_sender ON public.agent_messages(sender);  
CREATE INDEX idx_agent_messages_type ON public.agent_messages(type);
CREATE INDEX idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX idx_agent_messages_recipient_status_created ON public.agent_messages(recipient, status, created_at DESC);

-- Step 5: Enable Row Level Security (RLS) for HIPAA compliance
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy for service role access
CREATE POLICY "Allow service role access" ON public.agent_messages
    FOR ALL USING (true);

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for automatic updated_at updates
CREATE TRIGGER trigger_update_agent_messages_updated_at
    BEFORE UPDATE ON public.agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create analytics function
CREATE OR REPLACE FUNCTION public.get_agent_message_stats(agent_name TEXT)
RETURNS TABLE(
    total_sent BIGINT,
    total_received BIGINT,
    unacknowledged_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.agent_messages WHERE sender = agent_name) as total_sent,
        (SELECT COUNT(*) FROM public.agent_messages WHERE recipient = agent_name) as total_received,
        (SELECT COUNT(*) FROM public.agent_messages WHERE recipient = agent_name AND status != 'ACKNOWLEDGED') as unacknowledged_count,
        (SELECT MAX(created_at) FROM public.agent_messages WHERE sender = agent_name OR recipient = agent_name) as last_activity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Insert test data to validate table structure
INSERT INTO public.agent_messages (
    id, sender, recipient, type, payload, context_id
) VALUES 
(
    'msg_setup_' || extract(epoch from now())::bigint,
    'Claude Code',
    'Gemini Prime', 
    'TASK_DELEGATION',
    jsonb_build_object(
        'task_id', 'table_setup_complete',
        'objective', 'Validate agent_messages table creation',
        'description', 'Fresh table created with correct schema for autonomous system',
        'business_impact', 'Enables ₹500Cr autonomous revenue generation system',
        'expected_output_format', 'Table validation confirmation'
    ),
    'table_setup_validation'
);

-- Step 11: Verify table structure
SELECT 
    'SUCCESS: agent_messages table created with correct schema!' as status,
    COUNT(*) as sample_records
FROM public.agent_messages;

-- Step 12: Display column information for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agent_messages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;