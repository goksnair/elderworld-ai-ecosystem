ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_recipient_check;
ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_recipient_check CHECK (recipient IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All', 'Chief Orchestrator (Gemini)', 'ai-ml-specialist', 'mobile-product-head'));

ALTER TABLE public.agent_messages DROP CONSTRAINT IF EXISTS agent_messages_sender_check;
ALTER TABLE public.agent_messages ADD CONSTRAINT agent_messages_sender_check CHECK (sender IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'Chief Orchestrator (Gemini)', 'ai-ml-specialist', 'mobile-product-head'));
