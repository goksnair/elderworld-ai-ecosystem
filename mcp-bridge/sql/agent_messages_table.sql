-- Agent Messages Table for A2A Communication
-- Secure, auditable messaging between Prime Agents
-- Healthcare-grade compliance with audit trails

-- Drop table if exists (for development)
-- DROP TABLE IF EXISTS public.agent_messages;

-- Create agent_messages table
CREATE TABLE IF NOT EXISTS public.agent_messages (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON public.agent_messages(sender);  
CREATE INDEX IF NOT EXISTS idx_agent_messages_type ON public.agent_messages(type);
CREATE INDEX IF NOT EXISTS idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient_status_created ON public.agent_messages(recipient, status, created_at DESC);

-- Enable Row Level Security (RLS) for HIPAA compliance
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - allow all operations for service role
-- In production, this would be more restrictive based on agent authentication
CREATE POLICY "Allow all operations for service role" ON public.agent_messages
    FOR ALL USING (true);

-- Create RLS policy for authenticated agents (when implementing agent auth)
-- CREATE POLICY "Agents can read their messages" ON public.agent_messages  
--     FOR SELECT USING (recipient = current_setting('app.agent_id', true));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_agent_messages_updated_at
    BEFORE UPDATE ON public.agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for message analytics  
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

-- Grant permissions (adjust based on your user setup)
-- GRANT ALL ON public.agent_messages TO authenticated;
-- GRANT ALL ON public.agent_messages TO service_role;

-- Insert sample data for testing
INSERT INTO public.agent_messages (
    id, sender, recipient, type, payload, context_id
) VALUES 
(
    'msg_' || extract(epoch from now())::bigint || '_init',
    'Claude Code',
    'Gemini Prime', 
    'TASK_DELEGATION',
    jsonb_build_object(
        'task_id', 'setup_a2a_system',
        'objective', 'Initialize autonomous agent communication',
        'description', 'Set up A2A messaging system for Prime Agent coordination',
        'business_impact', 'Enables real-time autonomous task execution and coordination',
        'expected_output_format', 'Confirmation of successful implementation'
    ),
    'ctx_system_initialization'
) ON CONFLICT (id) DO NOTHING;

-- Display table info
SELECT 'Agent Messages table created successfully!' as status;
SELECT 'Sample data inserted for testing' as info;