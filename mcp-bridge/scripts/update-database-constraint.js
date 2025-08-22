#!/usr/bin/env node

/**
 * Update Supabase database constraint to allow all message types
 * This script updates the agent_messages_type_check constraint
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function updateConstraint() {
    console.log('🔧 SUPABASE DATABASE CONSTRAINT UPDATE');
    console.log('=====================================');
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }
    
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        }
    );
    
    try {
        console.log('🗃️  Connecting to Supabase...');
        
        // Define all valid message types
        const validTypes = [
            'TASK_DELEGATION',
            'TASK_ACCEPTED', 
            'PROGRESS_UPDATE',
            'TASK_COMPLETED',
            'TASK_DELIVERABLES',
            'BLOCKER_REPORT',
            'REQUEST_FOR_INFO',
            'STRATEGIC_QUERY',
            'BUSINESS_IMPACT_REPORT',
            'ERROR_NOTIFICATION',
            'ERROR_RESPONSE',
            'STATUS_RESPONSE',
            'EMERGENCY_ACKNOWLEDGED',
            'TASK_FAILED',
            'USAGE_LIMIT_WARNING',
            'API_QUOTA_EXCEEDED'
        ];
        
        console.log('📋 Valid message types:', validTypes.length);
        
        // Step 1: Drop existing constraint
        console.log('🔨 Dropping existing constraint...');
        const dropResult = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE agent_messages DROP CONSTRAINT IF EXISTS agent_messages_type_check;'
        });
        
        if (dropResult.error) {
            console.log('⚠️  Drop constraint result:', dropResult.error.message);
            // Continue anyway, might not exist
        } else {
            console.log('✅ Existing constraint dropped');
        }
        
        // Step 2: Create new constraint with all types
        const typeList = validTypes.map(type => `'${type}'`).join(', ');
        const addConstraintSQL = `
            ALTER TABLE agent_messages 
            ADD CONSTRAINT agent_messages_type_check 
            CHECK (type IN (${typeList}));
        `;
        
        console.log('🔧 Adding updated constraint...');
        const addResult = await supabase.rpc('exec_sql', {
            sql: addConstraintSQL
        });
        
        if (addResult.error) {
            console.error('❌ Failed to add constraint:', addResult.error.message);
            
            // Try alternative approach using direct SQL
            console.log('🔄 Trying alternative approach...');
            const { error: altError } = await supabase
                .from('agent_messages')
                .select('type')
                .limit(1);
            
            if (altError) {
                console.error('❌ Database access error:', altError.message);
            } else {
                console.log('ℹ️  Database is accessible, but constraint update requires admin privileges');
                console.log('📝 Manual SQL needed - see: mcp-bridge/sql/update_message_types_constraint.sql');
            }
        } else {
            console.log('✅ Constraint updated successfully');
        }
        
        // Step 3: Test the updated constraint
        console.log('🧪 Testing updated constraint...');
        const testResult = await supabase
            .from('agent_messages')
            .insert({
                sender: 'test-sender',
                recipient: 'test-recipient',
                type: 'ERROR_RESPONSE',
                payload: { test: true },
                status: 'SENT'
            })
            .select();
        
        if (testResult.error) {
            if (testResult.error.message.includes('agent_messages_type_check')) {
                console.log('❌ Constraint still blocking ERROR_RESPONSE');
                console.log('📋 Manual SQL execution required in Supabase dashboard');
            } else {
                console.log('⚠️  Other error:', testResult.error.message);
            }
        } else {
            console.log('✅ ERROR_RESPONSE test passed - constraint updated!');
            
            // Clean up test record
            if (testResult.data && testResult.data[0]) {
                await supabase
                    .from('agent_messages')
                    .delete()
                    .eq('id', testResult.data[0].id);
                console.log('🧹 Test record cleaned up');
            }
        }
        
    } catch (error) {
        console.error('💥 Error updating constraint:', error.message);
        console.log('📝 Please run the SQL manually in Supabase dashboard:');
        console.log('   File: mcp-bridge/sql/update_message_types_constraint.sql');
    }
}

// CLI execution
if (require.main === module) {
    updateConstraint()
        .then(() => {
            console.log('🎉 Constraint update process completed');
        })
        .catch(error => {
            console.error('💥 Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { updateConstraint };