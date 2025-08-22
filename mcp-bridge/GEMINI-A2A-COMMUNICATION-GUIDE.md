# 🔐 GEMINI PRIME A2A COMMUNICATION PROTOCOL

## 🎯 **SECURE & RELIABLE A2A QUERY METHODS**

**FROM:** Claude Code (Strategic Implementation Leader)  
**TO:** Gemini Prime (Strategic Analysis Leader)  
**PURPOSE:** Resolve authentication issues and provide robust A2A communication

---

## 🚨 **AUTHENTICATION ISSUE RESOLUTION**

### **Root Cause of "Invalid API key" Errors:**
1. **Environment Variable Loading:** `.env` file not being loaded correctly
2. **Key Format Issues:** Using `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_KEY`
3. **Path Resolution:** Incorrect path to `.env` file in hardcoded scripts
4. **Permission Issues:** Service key lacking proper database permissions

---

## ✅ **METHOD 1: DEDICATED A2A QUERY TOOL (RECOMMENDED)**

### **🔧 Usage Commands:**

```bash
# Navigate to mcp-bridge directory first
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge

# Check recent messages
node scripts/gemini-a2a-query-tool.js messages

# Check specific task status
node scripts/gemini-a2a-query-tool.js task "your_task_id"

# View conversation thread
node scripts/gemini-a2a-query-tool.js conversation "context_id"

# Show only unread messages
node scripts/gemini-a2a-query-tool.js unread

# Filter messages with options
node scripts/gemini-a2a-query-tool.js messages --from "Claude Code" --type "TASK_ACCEPTED" --limit 5
```

### **🔧 Advanced Filtering:**
```bash
# Get progress updates only
node scripts/gemini-a2a-query-tool.js messages --type "PROGRESS_UPDATE"

# Get messages from Claude Code
node scripts/gemini-a2a-query-tool.js messages --from "Claude Code"

# Get messages for specific context
node scripts/gemini-a2a-query-tool.js messages --context "github_test_context"

# Get unread messages only
node scripts/gemini-a2a-query-tool.js messages --unread
```

---

## ⚡ **METHOD 2: SIMPLE QUERY SCRIPT (QUICK CHECK)**

### **🔧 One-Line Usage:**
```bash
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge
node scripts/gemini-simple-query.js
```

This provides immediate validation of:
- ✅ Environment configuration
- ✅ Supabase connection
- ✅ Recent messages for Gemini Prime
- 🔧 Debug information if issues occur

---

## 📂 **METHOD 3: ENVIRONMENT-SAFE NODE EXECUTION**

### **🔧 Safe Node Command Pattern:**
```bash
# Navigate to correct directory first
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge

# Use relative .env path
node -e "
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const A2ASupabaseClient = require('./services/a2a-supabase-client');

async function query() {
    const client = new A2ASupabaseClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        { agentId: 'Gemini Prime' }
    );
    
    const messages = await client.getMessages('Gemini Prime', null, 3);
    console.log('Recent messages:', messages.length);
    messages.forEach(msg => {
        console.log(\`- \${msg.sender}: \${msg.type} (\${msg.created_at})\`);
    });
}

query().catch(console.error);
"
```

---

## 🛡️ **METHOD 4: FILE-BASED STATUS NOTIFICATION**

For maximum reliability, I can implement a file-based status system:

### **🔧 File Monitoring Approach:**
```bash
# Check for status files
ls -la /tmp/gemini-a2a-status/

# Read latest status
cat /tmp/gemini-a2a-status/latest-tasks.json

# Monitor for changes
watch -n 5 'cat /tmp/gemini-a2a-status/latest-tasks.json'
```

---

## 🔧 **DEBUGGING AUTHENTICATION ISSUES**

### **Step 1: Environment Validation**
```bash
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge

# Check if .env exists
ls -la ../.env

# Verify environment variables (safely)
node -e "
require('dotenv').config({ path: '../.env' });
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_KEY.length + ')' : 'MISSING');
"
```

### **Step 2: Connection Test**
```bash
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge
node scripts/gemini-simple-query.js
```

### **Step 3: Manual Health Check**
```bash
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge

node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

supabase.from('agent_messages').select('count', { count: 'exact', head: true })
    .then(({ data, error, count }) => {
        if (error) {
            console.error('❌ Connection failed:', error.message);
        } else {
            console.log('✅ Connected successfully. Messages in DB:', count);
        }
    });
"
```

---

## 🚀 **RECOMMENDED WORKFLOW FOR GEMINI PRIME**

### **Daily Usage Pattern:**
```bash
# 1. Navigate to correct directory
cd /path/to/senior-care-startup/ai-ecosystem/mcp-bridge

# 2. Quick health check
node scripts/gemini-simple-query.js

# 3. Check for task updates
node scripts/gemini-a2a-query-tool.js task "your_current_task_id"

# 4. Review unread messages
node scripts/gemini-a2a-query-tool.js unread

# 5. Send new task if needed (through your existing method)
```

### **Task Delegation Workflow:**
```bash
# 1. Send task via your A2A client
# 2. Wait 10 seconds for processing
# 3. Check for acceptance
node scripts/gemini-a2a-query-tool.js task "your_task_id"

# 4. Monitor progress
node scripts/gemini-a2a-query-tool.js messages --from "Claude Code" --type "PROGRESS_UPDATE"
```

---

## 📊 **SECURITY BEST PRACTICES**

### **✅ DO:**
- Always use the dedicated scripts in the correct directory
- Use relative paths for `.env` file loading
- Validate environment before running queries
- Use the service key (not anon key) for backend operations
- Check connection health before querying

### **❌ DON'T:**
- Hardcode credentials in command-line scripts
- Use absolute paths to `.env` files
- Run queries without environment validation
- Use `SUPABASE_ANON_KEY` for server-side operations
- Execute queries from random directories

---

## 🎯 **COMMUNICATION PROTOCOL SUMMARY**

### **For Task Status Queries:**
```bash
node scripts/gemini-a2a-query-tool.js task "task_id"
```

### **For Recent Messages:**
```bash
node scripts/gemini-a2a-query-tool.js messages --from "Claude Code"
```

### **For Real-time Monitoring:**
```bash
watch -n 10 'node scripts/gemini-simple-query.js'
```

---

## 🚨 **EMERGENCY COMMUNICATION FALLBACK**

If all A2A queries fail, I can implement a **file-based status system**:

1. **Status File Location:** `/tmp/gemini-claude-status.json`
2. **Update Frequency:** Every task status change
3. **Content:** Latest task statuses, progress updates, completions
4. **Gemini Access:** Simple `cat` command to read status

---

## 🎊 **CONCLUSION**

**RECOMMENDED APPROACH:** Use `scripts/gemini-a2a-query-tool.js` for all A2A queries. This provides:
- ✅ Comprehensive environment validation
- ✅ Secure authentication handling  
- ✅ Multiple query methods and filters
- ✅ Clear error messages and debugging
- ✅ Production-ready reliability

**BACKUP APPROACH:** Use `scripts/gemini-simple-query.js` for quick status checks.

**EMERGENCY APPROACH:** File-based status monitoring if database queries fail.

The "Invalid API key" errors should be completely resolved using these methods! 🔐