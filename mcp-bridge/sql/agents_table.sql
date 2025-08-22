-- Agents Table for Task Assignment
-- Stores information about agents, including their skills, availability, and current workload

DROP TABLE IF EXISTS public.agents CASCADE;

CREATE TABLE IF NOT EXISTS public.agents (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    skills JSONB NOT NULL DEFAULT '{}',
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    current_workload INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_name ON public.agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_availability ON public.agents(availability);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_updated
CREATE TRIGGER trigger_update_agents_last_updated
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_last_updated_column();

-- Insert sample data for testing
INSERT INTO public.agents (id, name, skills, availability, current_workload)
VALUES
    ('agent_ai_ml', 'ai-ml-specialist', '{"python": true, "machine_learning": true, "data_science": true}', TRUE, 0),
    ('agent_mobile_product', 'mobile-product-head', '{"mobile_development": true, "product_management": true, "ui_ux": true}', TRUE, 0),
    ('agent_chief_orchestrator', 'Chief Orchestrator (Gemini)', '{"workflow_orchestration": true, "task_delegation": true, "system_design": true}', TRUE, 0)
ON CONFLICT (id) DO NOTHING;