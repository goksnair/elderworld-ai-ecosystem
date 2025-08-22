#!/usr/bin/env node
/**
 * CHIEF ORCHESTRATOR PROTOCOL ENFORCEMENT CHECKER
 * Validates task lifecycle gates and prevents protocol violations
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class ProtocolChecker {
    constructor() {
        this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        this.sharedWorkspace = '/Users/gokulnair/senior-care-startup/ai-ecosystem/shared-workspace';
        this.systemActivityLog = '/Users/gokulnair/senior-care-startup/ai-ecosystem/SYSTEM_ACTIVITY_LOG.md';
    }

    /**
     * GATE 1: Check if task is properly defined
     */
    async checkGate1_Definition(taskId) {
        try {
            const taskFiles = fs.readdirSync(this.sharedWorkspace)
                .filter(file => file.includes(taskId) && file.endsWith('.md'));
            
            if (taskFiles.length === 0) {
                return { passed: false, gate: 1, reason: 'Task file not found' };
            }

            const taskFile = path.join(this.sharedWorkspace, taskFiles[0]);
            const content = fs.readFileSync(taskFile, 'utf8');

            // Check required sections
            const requiredSections = ['**Agent:**', 'DELIVERABLES', 'SUCCESS METRICS'];
            const missingSections = requiredSections.filter(section => !content.includes(section));

            if (missingSections.length > 0) {
                return { 
                    passed: false, 
                    gate: 1, 
                    reason: `Missing sections: ${missingSections.join(', ')}`,
                    file: taskFiles[0]
                };
            }

            return { 
                passed: true, 
                gate: 1, 
                reason: 'Task properly defined',
                file: taskFiles[0]
            };

        } catch (error) {
            return { passed: false, gate: 1, reason: `Error checking definition: ${error.message}` };
        }
    }

    /**
     * GATE 2: Check if task has been delegated via A2A
     */
    async checkGate2_Delegation(taskId) {
        try {
            const { data: delegationMessages, error } = await this.supabase
                .from('agent_messages')
                .select('*')
                .eq('sender', 'Chief Orchestrator (Gemini)')
                .eq('type', 'TASK_DELEGATION')
                .ilike('payload->>"task_name"', `%${taskId}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (delegationMessages.length === 0) {
                return { 
                    passed: false, 
                    gate: 2, 
                    reason: 'No delegation message found in A2A system' 
                };
            }

            const latestDelegation = delegationMessages[0];
            return { 
                passed: true, 
                gate: 2, 
                reason: 'Task properly delegated via A2A',
                messageId: latestDelegation.id,
                delegatedAt: latestDelegation.created_at,
                recipient: latestDelegation.recipient
            };

        } catch (error) {
            return { passed: false, gate: 2, reason: `Error checking delegation: ${error.message}` };
        }
    }

    /**
     * GATE 3: Check if task is being monitored (agent acknowledged)
     */
    async checkGate3_Monitoring(taskId, agentName = null) {
        try {
            const agentFilter = agentName ? 
                { eq: ['sender', agentName] } : 
                { in: ['sender', ['Claude Code', 'ai-ml-specialist', 'operations-excellence', 'product-innovation']] };

            const { data: responseMessages, error } = await this.supabase
                .from('agent_messages')
                .select('*')
                .eq('recipient', 'Chief Orchestrator (Gemini)')
                .in('type', ['TASK_ACCEPTED', 'PROGRESS_UPDATE'])
                .ilike('payload->>"task_id"', `%${taskId}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (responseMessages.length === 0) {
                return { 
                    passed: false, 
                    gate: 3, 
                    reason: 'No TASK_ACCEPTED or PROGRESS_UPDATE received from agent' 
                };
            }

            const latestResponse = responseMessages[0];
            return { 
                passed: true, 
                gate: 3, 
                reason: `Task acknowledged by agent: ${latestResponse.type}`,
                messageId: latestResponse.id,
                acknowledgedAt: latestResponse.created_at,
                agent: latestResponse.sender
            };

        } catch (error) {
            return { passed: false, gate: 3, reason: `Error checking monitoring: ${error.message}` };
        }
    }

    /**
     * GATE 4: Check if task completion has been verified
     */
    async checkGate4_Verification(taskId, agentName = null) {
        try {
            const { data: completionMessages, error } = await this.supabase
                .from('agent_messages')
                .select('*')
                .eq('recipient', 'Chief Orchestrator (Gemini)')
                .eq('type', 'TASK_COMPLETED')
                .ilike('payload->>"task_id"', `%${taskId}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (completionMessages.length === 0) {
                return { 
                    passed: false, 
                    gate: 4, 
                    reason: 'No TASK_COMPLETED message received from agent' 
                };
            }

            const latestCompletion = completionMessages[0];
            return { 
                passed: true, 
                gate: 4, 
                reason: 'Task completion verified via TASK_COMPLETED message',
                messageId: latestCompletion.id,
                completedAt: latestCompletion.created_at,
                agent: latestCompletion.sender,
                completionData: latestCompletion.payload
            };

        } catch (error) {
            return { passed: false, gate: 4, reason: `Error checking verification: ${error.message}` };
        }
    }

    /**
     * Check all gates for a specific task
     */
    async validateTask(taskId) {
        console.log(`🔍 VALIDATING TASK: ${taskId}`);
        console.log('================================');

        const gates = [
            await this.checkGate1_Definition(taskId),
            await this.checkGate2_Delegation(taskId),
            await this.checkGate3_Monitoring(taskId),
            await this.checkGate4_Verification(taskId)
        ];

        let currentGate = 0;
        for (let i = 0; i < gates.length; i++) {
            const gate = gates[i];
            console.log(`GATE ${gate.gate}: ${gate.passed ? '✅' : '❌'} ${gate.reason}`);
            
            if (gate.passed) {
                currentGate = gate.gate;
                if (gate.file) console.log(`   📁 File: ${gate.file}`);
                if (gate.messageId) console.log(`   📧 Message: ${gate.messageId.substring(0, 8)}...`);
                if (gate.delegatedAt) console.log(`   📅 Delegated: ${gate.delegatedAt}`);
                if (gate.recipient) console.log(`   👤 Agent: ${gate.recipient}`);
            } else {
                break; // Stop at first failed gate
            }
        }

        const canMarkCompleted = gates.every(gate => gate.passed);
        
        console.log(`\n📊 TASK STATUS SUMMARY:`);
        console.log(`   Current Gate: ${currentGate}/4`);
        console.log(`   Can Mark COMPLETED: ${canMarkCompleted ? 'YES ✅' : 'NO ❌'}`);
        console.log(`   Actual Status: ${this.getTaskStatus(currentGate)}`);

        return {
            taskId,
            currentGate,
            canMarkCompleted,
            status: this.getTaskStatus(currentGate),
            gates,
            violations: gates.filter(gate => !gate.passed)
        };
    }

    getTaskStatus(gateLevel) {
        const statuses = {
            0: 'NOT_STARTED',
            1: 'DEFINED',
            2: 'DELEGATED', 
            3: 'IN_PROGRESS',
            4: 'COMPLETED'
        };
        return statuses[gateLevel] || 'UNKNOWN';
    }

    /**
     * Validate all tasks in shared workspace
     */
    async validateAllTasks() {
        console.log('🔍 BULK TASK VALIDATION');
        console.log('========================');

        const taskFiles = fs.readdirSync(this.sharedWorkspace)
            .filter(file => file.endsWith('-task.md'))
            .map(file => file.replace('-task.md', '').replace(/-/g, '-'));

        const results = [];
        
        for (const taskId of taskFiles) {
            const result = await this.validateTask(taskId);
            results.push(result);
            console.log(''); // Add spacing between tasks
        }

        // Summary
        console.log('📈 VALIDATION SUMMARY');
        console.log('=====================');
        
        const violations = results.filter(r => r.violations.length > 0);
        const completed = results.filter(r => r.canMarkCompleted);
        
        console.log(`Total Tasks: ${results.length}`);
        console.log(`✅ Fully Validated: ${completed.length}`);
        console.log(`❌ Protocol Violations: ${violations.length}`);

        if (violations.length > 0) {
            console.log('\n🚨 TASKS WITH VIOLATIONS:');
            violations.forEach(task => {
                console.log(`   • ${task.taskId}: Gate ${task.currentGate}/4 (${task.status})`);
            });
        }

        return results;
    }

    /**
     * Check for communication loops
     */
    async checkCommunicationLoops(agentName = 'Chief Orchestrator (Gemini)') {
        console.log(`🔄 CHECKING COMMUNICATION LOOPS: ${agentName}`);
        console.log('===============================================');

        try {
            // Get messages from the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            
            const { data: recentMessages, error } = await this.supabase
                .from('agent_messages')
                .select('*')
                .eq('sender', agentName)
                .gte('created_at', oneHourAgo)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by recipient and type
            const messageGroups = {};
            
            recentMessages.forEach(msg => {
                const key = `${msg.recipient}-${msg.type}`;
                if (!messageGroups[key]) {
                    messageGroups[key] = [];
                }
                messageGroups[key].push(msg);
            });

            // Check for potential loops (>3 identical messages)
            const loops = Object.entries(messageGroups)
                .filter(([key, messages]) => messages.length > 3)
                .map(([key, messages]) => ({
                    target: key,
                    count: messages.length,
                    lastSent: messages[0].created_at,
                    payloadSimilarity: this.checkPayloadSimilarity(messages)
                }));

            if (loops.length === 0) {
                console.log('✅ No communication loops detected');
                return { loopsDetected: false, loops: [] };
            } else {
                console.log(`🚨 ${loops.length} potential loops detected:`);
                loops.forEach(loop => {
                    console.log(`   • ${loop.target}: ${loop.count} messages`);
                    console.log(`     Last sent: ${loop.lastSent}`);
                    console.log(`     Payload similarity: ${loop.payloadSimilarity}%`);
                });
                return { loopsDetected: true, loops };
            }

        } catch (error) {
            console.error('❌ Error checking communication loops:', error.message);
            return { error: error.message };
        }
    }

    checkPayloadSimilarity(messages) {
        if (messages.length < 2) return 0;
        
        const payloads = messages.map(msg => JSON.stringify(msg.payload));
        const uniquePayloads = new Set(payloads);
        
        return Math.round((1 - (uniquePayloads.size / payloads.length)) * 100);
    }

    /**
     * Fix violations by correcting the system activity log
     */
    async fixViolations() {
        console.log('🔧 FIXING PROTOCOL VIOLATIONS');
        console.log('==============================');

        // Check current system activity log
        if (!fs.existsSync(this.systemActivityLog)) {
            console.log('❌ SYSTEM_ACTIVITY_LOG.md not found');
            return;
        }

        let logContent = fs.readFileSync(this.systemActivityLog, 'utf8');
        const originalContent = logContent;

        // Find lines 78-81 that need correction (the premature COMPLETED entries)
        const lines = logContent.split('\n');
        
        // Look for the problematic entries
        let correctionsMade = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Find entries from Chief Orchestrator that are marked as COMPLETED
            if (line.includes('**Agent:** Chief Orchestrator (Gemini)') ||
                line.includes('**Agent:** Claude Code')) {
                
                // Check if the next few lines contain COMPLETED status for tasks that shouldn't be
                const nextLines = lines.slice(i, i + 5).join('\n');
                
                if (nextLines.includes('**Status:** COMPLETED') && 
                    (nextLines.includes('Aura™') || nextLines.includes('Bridge™'))) {
                    
                    // Replace COMPLETED with DEFINED and add correction note
                    for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                        if (lines[j].includes('**Status:** COMPLETED')) {
                            lines[j] = '**Status:** DEFINED';
                            lines.splice(j + 1, 0, `**Correction:** Status corrected from COMPLETED to DEFINED - tasks were only defined, not executed (${new Date().toISOString()})`);
                            correctionsMade = true;
                            break;
                        }
                    }
                }
            }
        }

        if (correctionsMade) {
            // Add correction log entry at the end
            const correctionEntry = `
**Timestamp:** ${new Date().toISOString()}
**Agent:** Claude Code (Protocol Checker)
**Action:** Corrected protocol violations in SYSTEM_ACTIVITY_LOG.md - reset prematurely marked COMPLETED tasks to DEFINED status
**Status:** CORRECTION_APPLIED
**Reason:** Tasks were marked COMPLETED before proper delegation and agent confirmation per Chief Orchestrator Protocol Enforcement Framework
`;

            const correctedContent = lines.join('\n') + correctionEntry;
            
            // Backup original and write corrected version
            fs.writeFileSync(`${this.systemActivityLog}.backup`, originalContent);
            fs.writeFileSync(this.systemActivityLog, correctedContent);
            
            console.log('✅ Protocol violations corrected');
            console.log('📁 Original backed up to SYSTEM_ACTIVITY_LOG.md.backup');
            console.log('📝 Correction entry added to log');
            
        } else {
            console.log('✅ No protocol violations found in system activity log');
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const checker = new ProtocolChecker();
    
    console.log('🛡️ CHIEF ORCHESTRATOR PROTOCOL CHECKER');
    console.log('=======================================');
    
    switch (command) {
        case '--task':
            const taskId = args[1];
            if (!taskId) {
                console.error('❌ Task ID required: --task <task_id>');
                process.exit(1);
            }
            await checker.validateTask(taskId);
            break;
            
        case '--validate-all':
            const results = await checker.validateAllTasks();
            if (args.includes('--fix-violations')) {
                await checker.fixViolations();
            }
            break;
            
        case '--check-loops':
            const agent = args.find(arg => arg.startsWith('--agent='))?.split('=')[1] || 'Chief Orchestrator (Gemini)';
            await checker.checkCommunicationLoops(agent);
            break;
            
        case '--fix-violations':
            await checker.fixViolations();
            break;
            
        default:
            console.log('📖 USAGE:');
            console.log('  --task <task_id>              Validate specific task');
            console.log('  --validate-all                Validate all tasks');
            console.log('  --validate-all --fix-violations  Validate and fix violations');
            console.log('  --check-loops --agent=<name>  Check for communication loops');
            console.log('  --fix-violations              Fix protocol violations in activity log');
            console.log('');
            console.log('💡 EXAMPLES:');
            console.log('  node protocol-checker.js --task aura-holistic-well-being-integration');
            console.log('  node protocol-checker.js --validate-all --fix-violations');
            console.log('  node protocol-checker.js --check-loops --agent="Chief Orchestrator (Gemini)"');
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Protocol checker error:', error.message);
        process.exit(1);
    });
}

module.exports = ProtocolChecker;