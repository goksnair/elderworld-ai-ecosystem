#!/usr/bin/env node
/**
 * TEST TASK DELEGATION - Verify constraint fix works
 */

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testTaskDelegation() {
    console.log('🧪 TESTING TASK DELEGATION');
    console.log('==========================');
    
    try {
        console.log('1️⃣ Testing with Chief Orchestrator (Gemini)...');
        
        const command = `node mcp-bridge/send_task.js "Chief Orchestrator (Gemini)" "Claude Code" "test_task" "test_script"`;
        
        const { stdout, stderr } = await execAsync(command, { timeout: 10000 });
        
        if (stderr && stderr.includes('check constraint')) {
            console.log('❌ CONSTRAINT STILL BLOCKING');
            console.log('💡 You need to run the SQL fix in Supabase dashboard first');
            return false;
        } else if (stderr && !stderr.includes('A2A Client initialized')) {
            console.log('❌ Other error:', stderr);
            return false;
        } else {
            console.log('✅ TASK DELEGATION SUCCESSFUL!');
            console.log('📊 Output:', stdout);
            return true;
        }
        
    } catch (error) {
        if (error.message.includes('check constraint')) {
            console.log('❌ DATABASE CONSTRAINT ERROR DETECTED');
            console.log('🛠️ NEXT STEPS:');
            console.log('   1. Go to https://supabase.com/dashboard');
            console.log('   2. Run the SQL constraint fix provided above');
            console.log('   3. Re-run this test');
        } else {
            console.log('❌ Test failed:', error.message);
        }
        return false;
    }
}

if (require.main === module) {
    testTaskDelegation()
        .then(success => {
            console.log(success ? '\n🎉 ALL SYSTEMS OPERATIONAL!' : '\n⚠️ Fix required before proceeding');
            process.exit(success ? 0 : 1);
        });
}

module.exports = { testTaskDelegation };