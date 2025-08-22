# 🚀 MCP Bridge Server Setup Instructions

## Critical: Database Table Creation Required

Our A2A communication system needs the `agent_messages` table in Supabase. **This must be done manually via the Supabase Dashboard.**

### STEP 1: Create Database Table (REQUIRED)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: Senior Care AI Ecosystem

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Table Creation SQL**
   
   Copy and paste this SQL into the editor and click "RUN":

```sql
-- Agent Messages Table for A2A Communication
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id VARCHAR(50) PRIMARY KEY,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User')),
    recipient VARCHAR(50) NOT NULL CHECK (recipient IN ('Claude Code', 'Gemini Prime', 'GitHub Copilot', 'User', 'All')),
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'TASK_DELEGATION', 'TASK_ACCEPTED', 'PROGRESS_UPDATE', 'TASK_COMPLETED',
        'BLOCKER_REPORT', 'REQUEST_FOR_INFO', 'STRATEGIC_QUERY', 
        'BUSINESS_IMPACT_REPORT', 'ERROR_NOTIFICATION'
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON public.agent_messages(recipient);
CREATE INDEX IF NOT EXISTS idx_agent_messages_sender ON public.agent_messages(sender);  
CREATE INDEX IF NOT EXISTS idx_agent_messages_type ON public.agent_messages(type);
CREATE INDEX IF NOT EXISTS idx_agent_messages_context_id ON public.agent_messages(context_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_messages_status ON public.agent_messages(status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient_status_created ON public.agent_messages(recipient, status, created_at DESC);

-- Enable Row Level Security for HIPAA compliance
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- Allow service role access (required for server-side operations)
CREATE POLICY "Allow all operations for service role" ON public.agent_messages
    FOR ALL USING (true);

-- Test data insertion
INSERT INTO public.agent_messages (
    id, sender, recipient, type, payload, context_id
) VALUES 
(
    'msg_init_' || extract(epoch from now())::bigint,
    'Claude Code',
    'Gemini Prime', 
    'TASK_DELEGATION',
    jsonb_build_object(
        'task_id', 'a2a_system_initialization',
        'objective', 'Initialize autonomous agent communication',
        'description', 'Database table created and ready for Prime Agent coordination',
        'business_impact', 'Enables real-time autonomous task execution',
        'setup_complete', true
    ),
    'ctx_initialization'
) ON CONFLICT (id) DO NOTHING;

-- Confirm success
SELECT 'agent_messages table created successfully!' as status,
       COUNT(*) as initial_message_count 
FROM public.agent_messages;
```

4. **Verify Success**
   
   You should see output like:
   ```
   status: "agent_messages table created successfully!"
   initial_message_count: 1
   ```

### STEP 2: Test A2A Communication System

Once the table is created, run these tests:

```bash
# Test basic connectivity and messaging
node scripts/quick-a2a-test.js

# Run comprehensive test suite (optional)
node tests/test-a2a-messaging.js
```

### Expected Test Output:

```
🚀 Quick A2A System Test

✅ Environment variables found
✅ Health check passed
✅ Message sent successfully
✅ Messages retrieved: X messages
✅ Unread count: X messages

🎉 A2A COMMUNICATION SYSTEM IS OPERATIONAL!
```

### STEP 3: Verify MCP Bridge Server

Start the full MCP Bridge Server:

```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm start

# Or in development mode
npm run dev
```

Server should start on port 3050 with endpoints:
- `GET /health` - System health check
- `POST /a2a/message` - Send agent messages
- `GET /a2a/messages/:agentId` - Retrieve messages

### Troubleshooting:

❌ **"Could not find 'context_id' column"**
- Solution: The table hasn't been created yet. Complete Step 1.

❌ **"Invalid API key"**  
- Solution: Check your `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

❌ **Connection refused**
- Solution: Check internet connection and Supabase service status

### Next Steps After Setup:

1. ✅ **A2A Communication**: Test agent-to-agent messaging  
2. 🔧 **MCP Tools**: Implement GitHub, Vercel, Railway, Supabase integrations
3. 🤖 **Prime Agent Coordination**: Enable autonomous task handoff between agents

---

**⚡ Quick Status Check:**

Run this command anytime to verify system status:
```bash
node scripts/quick-a2a-test.js
```

**🎯 Business Impact:**

This setup enables our **Autonomous System** to:
- Coordinate tasks between Claude Code, Gemini Prime, and GitHub Copilot
- Track progress in real-time  
- Handle blockers and escalations automatically
- Maintain context across agent handoffs
- Support the ₹500Cr revenue target through automated execution

**Ready to go autonomous! 🚀**