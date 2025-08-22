/**
 * Emergency Response Database Setup
 * Creates the emergency_alerts table for the Bangalore pilot
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function setupEmergencyTables() {
    console.log('🚨 Setting up Emergency Response Database Tables...');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Create emergency_alerts table if it doesn't exist
    const createEmergencyAlertsSQL = `
    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id TEXT PRIMARY KEY,
      senior_id UUID,
      alert_type TEXT NOT NULL,
      vital_signs JSONB,
      analysis_result JSONB,
      location JSONB,
      status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED')),
      response_time_target INTEGER DEFAULT 300,
      actual_response_time INTEGER,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT now()
    );
  `;

    try {
        console.log('📊 Creating emergency_alerts table...');

        // For now, let's test if we can insert directly
        // First, let's try to select from the table to see if it exists
        const { data, error } = await supabase.from('emergency_alerts').select('*').limit(1);

        if (error) {
            console.log('❌ Table access error:', error.message);
            console.log('🔨 The emergency_alerts table may not exist or needs to be created via Supabase dashboard');
            console.log('📋 Please run the following SQL in your Supabase dashboard:');
            console.log(createEmergencyAlertsSQL);
            return false;
        } else {
            console.log('✅ emergency_alerts table is accessible');
            console.log(`📊 Current table has ${data.length} records`);
            return true;
        }

    } catch (err) {
        console.error('🔥 Setup failed:', err.message);
        return false;
    }
}

// Run setup
setupEmergencyTables()
    .then((success) => {
        if (success) {
            console.log('🎉 Emergency response database ready for testing!');
            console.log('🧪 Now you can run: node actual-execution/test-emergency-core.js');
        } else {
            console.log('⚠️  Manual table creation required in Supabase dashboard');
        }
    })
    .catch(console.error);
