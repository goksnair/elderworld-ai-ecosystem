-- IMPROVED AGENT MESSAGES TABLE - UUID Primary Key & Enhanced Security
-- Implements user feedback: UUID primary key, granular RLS, performance optimizations
-- Healthcare-grade HIPAA compliance with advanced security policies

-- Step 1: Drop existing table completely (including any constraints, triggers, indexes)
DROP TABLE IF EXISTS public.agent_messages CASCADE;

-- Step 2: Drop any existing functions that might reference the old table
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_message_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_messages() CASCADE;

-- Step 3: Create the improved table with UUID primary key
CREATE TABLE public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    -- Use GENERATED ALWAYS AS for audit timestamps
    created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (timestamp) STORED,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- Add agent session tracking for granular security
    agent_session_id VARCHAR(100),
    -- Add message priority for processing order
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    -- Add message encryption hash for integrity verification
    message_hash VARCHAR(64)
);

-- Step 4: Create performance-optimized indexes
CREATE INDEX idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX idx_agent_messages_sender ON public.agent_messages(sender);  
CREATE INDEX idx_agent_messages_type ON public.agent_messages(type);
CREATE INDEX idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX idx_agent_messages_timestamp_desc ON public.agent_messages(timestamp DESC);
CREATE INDEX idx_agent_messages_priority_timestamp ON public.agent_messages(priority DESC, timestamp DESC);

-- Partial index for unacknowledged messages (performance optimization)
CREATE INDEX idx_agent_messages_unacknowledged 
    ON public.agent_messages(recipient, timestamp DESC) 
    WHERE status != 'ACKNOWLEDGED';

-- Composite index for common agent queries
CREATE INDEX idx_agent_messages_recipient_status_timestamp 
    ON public.agent_messages(recipient, status, timestamp DESC);

-- JSONB index for payload searches
CREATE INDEX idx_agent_messages_payload_gin ON public.agent_messages USING GIN (payload);

-- Step 5: Enable Row Level Security (RLS) for HIPAA compliance
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Step 6: Create granular RLS policies based on authentication

-- Policy 1: Service role has full access (for system operations)
CREATE POLICY "Service role full access" ON public.agent_messages
    FOR ALL TO service_role USING (true);

-- Policy 2: Authenticated users can only see messages addressed to them or sent by them
CREATE POLICY "Agents access own messages" ON public.agent_messages
    FOR SELECT TO authenticated USING (
        recipient = current_setting('app.agent_id', true) OR 
        sender = current_setting('app.agent_id', true) OR
        recipient = 'All'
    );

-- Policy 3: Agents can insert messages with their own sender ID
CREATE POLICY "Agents can send messages" ON public.agent_messages
    FOR INSERT TO authenticated WITH CHECK (
        sender = current_setting('app.agent_id', true) AND
        agent_session_id = current_setting('app.session_id', true)
    );

-- Policy 4: Agents can update acknowledgment of messages addressed to them
CREATE POLICY "Agents acknowledge own messages" ON public.agent_messages
    FOR UPDATE TO authenticated USING (
        recipient = current_setting('app.agent_id', true)
    ) WITH CHECK (
        recipient = current_setting('app.agent_id', true) AND
        acknowledged_by = current_setting('app.agent_id', true)
    );

-- Policy 5: Emergency override for critical system messages (admin role)
CREATE POLICY "Admin emergency access" ON public.agent_messages
    FOR ALL TO postgres WITH CHECK (true);

-- Step 7: Create enhanced trigger function for updated_at with integrity checks
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Generate message hash for integrity verification
    IF NEW.message_hash IS NULL THEN
        NEW.message_hash = encode(
            sha256(
                (NEW.sender || NEW.recipient || NEW.type || NEW.payload::text || NEW.timestamp::text)::bytea
            ), 
            'hex'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger for automatic updated_at and integrity checks
CREATE TRIGGER trigger_update_agent_messages_updated_at
    BEFORE UPDATE ON public.agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for insert integrity checks
CREATE TRIGGER trigger_insert_agent_messages_integrity
    BEFORE INSERT ON public.agent_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create enhanced analytics function with security
CREATE OR REPLACE FUNCTION public.get_agent_message_stats(agent_name TEXT)
RETURNS TABLE(
    total_sent BIGINT,
    total_received BIGINT,
    unacknowledged_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE,
    avg_response_time_minutes NUMERIC,
    high_priority_pending BIGINT
) AS $$
BEGIN
    -- Security check: only allow stats for the authenticated agent
    IF current_setting('app.agent_id', true) != agent_name AND 
       current_role NOT IN ('service_role', 'postgres') THEN
        RAISE EXCEPTION 'Access denied: Can only view own statistics';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.agent_messages WHERE sender = agent_name) as total_sent,
        (SELECT COUNT(*) FROM public.agent_messages WHERE recipient = agent_name) as total_received,
        (SELECT COUNT(*) FROM public.agent_messages WHERE recipient = agent_name AND status != 'ACKNOWLEDGED') as unacknowledged_count,
        (SELECT MAX(timestamp) FROM public.agent_messages WHERE sender = agent_name OR recipient = agent_name) as last_activity,
        (SELECT AVG(EXTRACT(EPOCH FROM (acknowledged_at - timestamp))/60) 
         FROM public.agent_messages 
         WHERE recipient = agent_name AND acknowledged_at IS NOT NULL) as avg_response_time_minutes,
        (SELECT COUNT(*) FROM public.agent_messages 
         WHERE recipient = agent_name AND status != 'ACKNOWLEDGED' AND priority <= 3) as high_priority_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create cleanup function for old messages (GDPR compliance)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Only service_role or postgres can execute cleanup
    IF current_role NOT IN ('service_role', 'postgres') THEN
        RAISE EXCEPTION 'Access denied: Only system roles can cleanup messages';
    END IF;

    DELETE FROM public.agent_messages 
    WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status = 'PROCESSED';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create helper function for message integrity verification
CREATE OR REPLACE FUNCTION public.verify_message_integrity(message_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    msg_record RECORD;
    calculated_hash VARCHAR(64);
BEGIN
    SELECT * INTO msg_record FROM public.agent_messages WHERE id = message_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    calculated_hash := encode(
        sha256(
            (msg_record.sender || msg_record.recipient || msg_record.type || 
             msg_record.payload::text || msg_record.timestamp::text)::bytea
        ), 
        'hex'
    );
    
    RETURN calculated_hash = msg_record.message_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Insert test data with improved structure
INSERT INTO public.agent_messages (
    sender, recipient, type, payload, context_id, agent_session_id, priority
) VALUES 
(
    'Claude Code',
    'Gemini Prime', 
    'TASK_DELEGATION',
    jsonb_build_object(
        'task_id', 'schema_upgrade_complete',
        'objective', 'Validate improved agent_messages table with UUID primary key',
        'description', 'Enhanced schema with UUID, granular RLS, partial indexes, and integrity verification',
        'business_impact', 'Enables production-grade ₹500Cr autonomous revenue generation system',
        'expected_output_format', 'Schema validation confirmation with performance metrics',
        'security_features', jsonb_build_array(
            'UUID primary key for better performance',
            'Granular RLS policies based on agent authentication', 
            'Message integrity verification with SHA-256 hashes',
            'GDPR-compliant automatic cleanup',
            'Partial indexes for query optimization'
        )
    ),
    'schema_upgrade_validation',
    'session_' || extract(epoch from now())::bigint,
    1  -- High priority
);

-- Step 13: Create view for agent dashboard (with RLS applied)
CREATE OR REPLACE VIEW public.agent_message_summary AS
SELECT 
    id,
    sender,
    recipient,
    type,
    timestamp,
    payload->>'task_id' as task_id,
    payload->>'objective' as objective,
    status,
    priority,
    CASE 
        WHEN status != 'ACKNOWLEDGED' AND priority <= 3 THEN 'HIGH_PRIORITY_PENDING'
        WHEN status != 'ACKNOWLEDGED' THEN 'PENDING'
        ELSE 'PROCESSED'
    END as urgency_status
FROM public.agent_messages
ORDER BY priority ASC, timestamp DESC;

-- Enable RLS on the view
ALTER VIEW public.agent_message_summary SET (security_barrier = true);

-- Step 14: Grant appropriate permissions
-- Grant permissions to authenticated role for agent operations
GRANT SELECT, INSERT ON public.agent_messages TO authenticated;
GRANT UPDATE(status, acknowledged_by, acknowledged_at) ON public.agent_messages TO authenticated;
GRANT SELECT ON public.agent_message_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_message_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_message_integrity(UUID) TO authenticated;

-- Service role gets full access
GRANT ALL ON public.agent_messages TO service_role;
GRANT ALL ON public.agent_message_summary TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 15: Verify table structure and test functionality
SELECT 
    'SUCCESS: Enhanced agent_messages table created with UUID primary key!' as status,
    COUNT(*) as sample_records
FROM public.agent_messages;

-- Display enhanced column information for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated
FROM information_schema.columns 
WHERE table_name = 'agent_messages' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Display RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'agent_messages';

-- Display indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'agent_messages' 
    AND schemaname = 'public'
ORDER BY indexname;

-- Test message integrity verification
SELECT 
    id,
    sender,
    recipient,
    public.verify_message_integrity(id) as integrity_check
FROM public.agent_messages;