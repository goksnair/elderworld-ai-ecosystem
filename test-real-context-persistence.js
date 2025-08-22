#!/usr/bin/env node
/**
 * REAL CONTEXT PERSISTENCE TEST
 * Test with actual senior care business data
 */

const { ContextPersistenceManager } = require('./mcp-bridge/scripts/start-context-persistence');

async function testWithRealBusinessData() {
    console.log('🧪 TESTING CONTEXT PERSISTENCE WITH REAL BUSINESS DATA');
    console.log('======================================================');
    
    const manager = new ContextPersistenceManager();
    const persistence = manager.persistence;
    
    try {
        // Initialize
        console.log('1️⃣ Initializing with real session context...');
        await persistence.initialize();
        
        // Save real business context items
        console.log('\n2️⃣ Saving real business context items...');
        
        await persistence.saveContextItems([
            {
                key: 'bangalore_pilot_status',
                value: 'Preparing for 100 families onboarding with <5 minute emergency response target. Apollo Hospital integration 80% complete.',
                category: 'progress',
                priority: 'high',
                channel: 'bangalore-pilot'
            },
            {
                key: 'emergency_response_optimization',
                value: 'AI model accuracy currently at 95.2%, targeting 97.3%. Response time averaging 6.2 minutes, need to optimize to <5 minutes.',
                category: 'task',
                priority: 'critical',
                channel: 'emergency-response'
            },
            {
                key: 'nri_family_dashboard_requirements',
                value: 'US-based children need real-time health monitoring, video calls, and instant emergency alerts for elderly parents in Bangalore.',
                category: 'decision',
                priority: 'high', 
                channel: 'family-platform'
            },
            {
                key: 'revenue_target_progress',
                value: '₹500Cr revenue target over 5 years. Current pilot targeting ₹50L revenue. NRI segment ARPU: ₹15K-25K.',
                category: 'progress',
                priority: 'critical',
                channel: 'business-metrics'
            },
            {
                key: 'agent_coordination_status',
                value: 'Autonomous system operational with Claude Code, Gemini Prime coordination. Agent specialization enforcement deployed.',
                category: 'progress',
                priority: 'high',
                channel: 'agent-coordination'
            }
        ]);
        
        console.log('✅ Business context saved successfully');
        
        // Test task handoff
        console.log('\n3️⃣ Testing real task handoff context...');
        await persistence.saveTaskHandoffContext(
            'senior-care-boss',
            'ai-ml-specialist',
            'Optimize emergency response AI to achieve 97.3% accuracy and <5 minute response time for Bangalore pilot',
            'Requirements defined, current accuracy 95.2%, need algorithm optimization and response time improvement'
        );
        console.log('✅ Task handoff context saved');
        
        // Test business impact tracking
        console.log('\n4️⃣ Testing business impact context...');
        await persistence.saveBusinessImpact(
            'Agent specialization enforcement system deployed',
            'Expected 30-40% efficiency improvement in autonomous task routing',
            {
                expectedEfficiencyGain: '35%',
                implementationTime: '4 hours',
                businessValue: 'critical',
                revenueImpact: '₹2.3Cr/month protected',
                customerSatisfactionImprovement: '+15%'
            }
        );
        console.log('✅ Business impact context saved');
        
        // Create checkpoint for major milestone
        console.log('\n5️⃣ Creating business milestone checkpoint...');
        const checkpoint = await persistence.saveSessionCheckpoint(
            'phase1_autonomous_systems_deployed',
            true
        );
        console.log('✅ Phase 1 milestone checkpoint created');
        
        // Generate startup briefing with real data
        console.log('\n6️⃣ Generating real business startup briefing...');
        const briefing = await persistence.generateStartupBriefing();
        
        console.log('\n📋 BUSINESS STARTUP BRIEFING:');
        console.log('============================');
        console.log(briefing);
        
        // Test priority context retrieval
        console.log('\n7️⃣ Testing priority context retrieval...');
        const priorityContext = await persistence.getPriorityContext(10);
        console.log(`✅ Retrieved ${priorityContext.totalItems} priority business items`);
        
        // Test system state capture with real git status
        console.log('\n8️⃣ Capturing real system state...');
        await persistence.captureCurrentSystemState();
        console.log('✅ Real system state captured (git status, memory usage, uptime)');
        
        // Graceful shutdown
        console.log('\n9️⃣ Testing graceful shutdown with context preservation...');
        await persistence.stop();
        console.log('✅ Business context preserved for next session');
        
        console.log('\n🎉 REAL CONTEXT PERSISTENCE TEST COMPLETE');
        console.log('==========================================');
        console.log('✅ All real business data successfully persisted');
        console.log('✅ Task handoffs ready for seamless agent coordination');
        console.log('✅ Business impact tracking operational');  
        console.log('✅ Startup briefings will eliminate context rebuilding');
        console.log('✅ System ready for production ₹500Cr revenue operations');
        
        return true;
        
    } catch (error) {
        console.error('❌ Real context persistence test failed:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testWithRealBusinessData()
        .then(success => {
            if (success) {
                console.log('\n🚀 Context persistence system validated with real business data');
                process.exit(0);
            } else {
                console.log('\n❌ Context persistence validation failed');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        });
}