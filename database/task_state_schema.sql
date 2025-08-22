-- DATABASE SCHEMA FOR HEALTHCARE-GRADE TASK STATE MANAGEMENT
-- Replaces chief_orchestrator_state.json with production-ready PostgreSQL solution
-- Target: 100+ concurrent operations, <5 minute emergency response SLA

-- Main tasks table with optimistic concurrency control
CREATE TABLE IF NOT EXISTS task_states (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL UNIQUE,
    state VARCHAR(50) NOT NULL DEFAULT 'UNDEFINED',
    agent VARCHAR(100) NOT NULL,
    task_file TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delegation_attempts INTEGER DEFAULT 0,
    last_attempt TIMESTAMP WITH TIME ZONE,
    check_attempts INTEGER DEFAULT 0,
    next_check_time TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    session_id VARCHAR(100),
    version INTEGER DEFAULT 1, -- For optimistic locking
    
    CONSTRAINT valid_states CHECK (state IN (
        'UNDEFINED', 'DEFINED', 'DELEGATED', 'ACCEPTED', 
        'IN_PROGRESS', 'COMPLETED', 'ERROR', 'ESCALATED'
    )),
    CONSTRAINT valid_priorities CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    CONSTRAINT valid_agents CHECK (agent IN (
        'senior-care-boss', 'ai-ml-specialist', 'operations-excellence',
        'product-innovation', 'partnership-development', 'market-intelligence',
        'finance-strategy', 'compliance-quality'
    ))
);

-- Task messages for communication history
CREATE TABLE IF NOT EXISTS task_messages (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    details TEXT,
    error_message TEXT,
    
    FOREIGN KEY (task_id) REFERENCES task_states(task_id) ON DELETE CASCADE,
    CONSTRAINT valid_message_types CHECK (message_type IN (
        'DELEGATION_SENT', 'DELEGATION_FAILED', 'TASK_ACCEPTED_RECEIVED',
        'PROGRESS_UPDATE_RECEIVED', 'TASK_COMPLETED_RECEIVED', 'MANUAL_RESET'
    ))
);

-- Protocol violations tracking
CREATE TABLE IF NOT EXISTS protocol_violations (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operation VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    task_ids TEXT[], -- Array of affected task IDs
    session_id VARCHAR(100)
);

-- Escalated tasks tracking
CREATE TABLE IF NOT EXISTS escalated_tasks (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (task_id) REFERENCES task_states(task_id) ON DELETE CASCADE
);

-- Session state tracking
CREATE TABLE IF NOT EXISTS orchestrator_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    total_tasks INTEGER DEFAULT 0,
    successful_tasks INTEGER DEFAULT 0,
    failed_tasks INTEGER DEFAULT 0
);

-- Indexes for performance optimization under concurrent load
CREATE INDEX IF NOT EXISTS idx_task_states_task_id ON task_states(task_id);
CREATE INDEX IF NOT EXISTS idx_task_states_state ON task_states(state);
CREATE INDEX IF NOT EXISTS idx_task_states_agent ON task_states(agent);
CREATE INDEX IF NOT EXISTS idx_task_states_priority ON task_states(priority);
CREATE INDEX IF NOT EXISTS idx_task_states_created_at ON task_states(created_at);
CREATE INDEX IF NOT EXISTS idx_task_states_session_id ON task_states(session_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_timestamp ON task_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_protocol_violations_timestamp ON protocol_violations(timestamp);
CREATE INDEX IF NOT EXISTS idx_escalated_tasks_task_id ON escalated_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_escalated_tasks_resolved ON escalated_tasks(resolved);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_task_states_agent_state ON task_states(agent, state);
CREATE INDEX IF NOT EXISTS idx_task_states_priority_created ON task_states(priority, created_at);

-- Updated_at trigger for task_states
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1; -- Increment version for optimistic locking
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_states_updated_at 
    BEFORE UPDATE ON task_states 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) for multi-tenant isolation if needed
-- ALTER TABLE task_states ENABLE ROW LEVEL SECURITY;

-- Health check function for monitoring
CREATE OR REPLACE FUNCTION check_orchestrator_health()
RETURNS TABLE (
    metric VARCHAR(50),
    value BIGINT,
    status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_tasks'::VARCHAR(50), COUNT(*)::BIGINT, 
           CASE WHEN COUNT(*) < 10000 THEN 'HEALTHY' ELSE 'WARNING' END::VARCHAR(20)
    FROM task_states
    UNION ALL
    SELECT 'active_tasks'::VARCHAR(50), COUNT(*)::BIGINT,
           CASE WHEN COUNT(*) < 1000 THEN 'HEALTHY' ELSE 'WARNING' END::VARCHAR(20)
    FROM task_states WHERE state IN ('DEFINED', 'DELEGATED', 'ACCEPTED', 'IN_PROGRESS')
    UNION ALL
    SELECT 'failed_tasks_last_hour'::VARCHAR(50), COUNT(*)::BIGINT,
           CASE WHEN COUNT(*) < 10 THEN 'HEALTHY' ELSE 'CRITICAL' END::VARCHAR(20)
    FROM task_states WHERE state = 'ERROR' AND created_at > NOW() - INTERVAL '1 hour'
    UNION ALL
    SELECT 'protocol_violations_last_hour'::VARCHAR(50), COUNT(*)::BIGINT,
           CASE WHEN COUNT(*) = 0 THEN 'HEALTHY' ELSE 'CRITICAL' END::VARCHAR(20)
    FROM protocol_violations WHERE timestamp > NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Emergency response time monitoring view
CREATE OR REPLACE VIEW emergency_response_metrics AS
SELECT 
    t.task_id,
    t.priority,
    t.created_at,
    t.state,
    EXTRACT(EPOCH FROM (COALESCE(t.updated_at, NOW()) - t.created_at)) as response_time_seconds,
    CASE 
        WHEN t.priority = 'CRITICAL' AND EXTRACT(EPOCH FROM (COALESCE(t.updated_at, NOW()) - t.created_at)) <= 300 
        THEN 'SLA_MET'
        WHEN t.priority = 'CRITICAL' 
        THEN 'SLA_VIOLATED'
        ELSE 'NON_CRITICAL'
    END as sla_status
FROM task_states t
WHERE t.priority = 'CRITICAL'
ORDER BY t.created_at DESC;

-- Concurrent load testing support function
CREATE OR REPLACE FUNCTION stress_test_task_creation(
    task_id_prefix VARCHAR(50),
    num_tasks INTEGER,
    test_agent VARCHAR(100) DEFAULT 'ai-ml-specialist'
)
RETURNS TABLE (
    task_id VARCHAR(255),
    success BOOLEAN,
    error_message TEXT,
    execution_time_ms BIGINT
) AS $$
DECLARE
    i INTEGER;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    current_task_id VARCHAR(255);
BEGIN
    FOR i IN 1..num_tasks LOOP
        current_task_id := task_id_prefix || '-' || i::TEXT;
        start_time := clock_timestamp();
        
        BEGIN
            INSERT INTO task_states (
                task_id, state, agent, task_file, priority, session_id
            ) VALUES (
                current_task_id, 'DEFINED', test_agent, 
                '/test/stress-' || current_task_id || '.md', 
                'HIGH', 'stress-test-session'
            );
            
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                current_task_id, 
                TRUE, 
                NULL::TEXT,
                EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;
                
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                current_task_id, 
                FALSE, 
                SQLERRM,
                EXTRACT(MILLISECONDS FROM (end_time - start_time))::BIGINT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Analytics view for production monitoring
CREATE OR REPLACE VIEW task_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    state,
    priority,
    agent,
    COUNT(*) as task_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds,
    MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_processing_time_seconds
FROM task_states
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), state, priority, agent
ORDER BY hour_bucket DESC, task_count DESC;

-- Grant permissions for application user
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO elderworld_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO elderworld_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO elderworld_app;

-- Production monitoring alerts (example usage in application)
/*
-- Query to detect system stress:
SELECT * FROM check_orchestrator_health() WHERE status IN ('WARNING', 'CRITICAL');

-- Query to monitor emergency SLA compliance:
SELECT 
    COUNT(*) as total_emergencies,
    SUM(CASE WHEN sla_status = 'SLA_MET' THEN 1 ELSE 0 END) as sla_compliant,
    ROUND(100.0 * SUM(CASE WHEN sla_status = 'SLA_MET' THEN 1 ELSE 0 END) / COUNT(*), 2) as sla_percentage
FROM emergency_response_metrics
WHERE created_at > NOW() - INTERVAL '1 hour';
*/