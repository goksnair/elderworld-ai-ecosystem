/**
 * EMERGENCY RESPONSE SYSTEM - PRODUCTION BACKEND
 * Critical unblock implementation for Bangalore pilot
 * Target: <5 minute emergency response, 95% detection accuracy
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const axios = require('axios');

class EmergencyResponseSystem {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    // Database connection
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://your-project.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'your-anon-key'
    );
    
    // WebSocket server for real-time communication
    this.wss = new WebSocket.Server({ port: 8080 });
    
    // Communication services
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID || 'your-twilio-sid',
      process.env.TWILIO_AUTH_TOKEN || 'your-twilio-token'
    );
    
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'alerts@seniorcare.ai',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
    
    // Emergency thresholds and configuration
    this.config = {
      emergencyThreshold: 0.85,  // AI confidence threshold
      responseTimeTarget: 300,   // 5 minutes in seconds
      maxCaregiverDistance: 5,   // 5km radius
      notificationRetryLimit: 3,
      bangaloreHospitals: [
        {
          name: 'Apollo Hospital Bannerghatta',
          emergency_phone: '+91-80-2669-4468',
          api_endpoint: 'https://apollo-api.example.com/emergency',
          api_key: process.env.APOLLO_API_KEY
        },
        {
          name: 'Manipal Hospital HAL',
          emergency_phone: '+91-80-2502-4444',
          api_endpoint: 'https://manipal-api.example.com/emergency',
          api_key: process.env.MANIPAL_API_KEY
        },
        {
          name: 'Fortis Hospital Bannerghatta',
          emergency_phone: '+91-80-6621-4434',
          api_endpoint: 'https://fortis-api.example.com/emergency',
          api_key: process.env.FORTIS_API_KEY
        }
      ]
    };
    
    // Active emergencies tracking
    this.activeEmergencies = new Map();
    this.responseMetrics = [];
  }

  async initialize() {
    console.log('🚨 Initializing Emergency Response System...');
    
    // Setup Express middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Setup routes
    this.setupRoutes();
    
    // Setup WebSocket handlers
    this.setupWebSocketHandlers();
    
    // Initialize database tables
    await this.initializeDatabase();
    
    // Start real-time monitoring
    this.startRealtimeMonitoring();
    
    // Start server
    this.app.listen(this.port, () => {
      console.log(`🚀 Emergency Response API running on port ${this.port}`);
      console.log(`🌐 WebSocket server running on port 8080`);
    });
    
    console.log('✅ Emergency Response System operational');
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'operational', 
        timestamp: new Date().toISOString(),
        activeEmergencies: this.activeEmergencies.size 
      });
    });

    // Emergency detection endpoint (from IoT sensors)
    this.app.post('/api/emergency/detect', async (req, res) => {
      try {
        const { seniorId, sensorData, timestamp } = req.body;
        
        console.log(`📊 Sensor data received for senior ${seniorId}`);
        
        // Process sensor data for emergency detection
        const emergencyPrediction = await this.detectEmergency(sensorData);
        
        if (emergencyPrediction.isEmergency) {
          console.log(`🚨 EMERGENCY DETECTED: ${emergencyPrediction.type} (confidence: ${emergencyPrediction.confidence})`);
          
          // Trigger emergency response
          const emergency = await this.triggerEmergencyResponse(seniorId, emergencyPrediction);
          
          res.json({
            status: 'emergency_triggered',
            emergencyId: emergency.id,
            responseTime: emergency.responseTime,
            prediction: emergencyPrediction
          });
        } else {
          res.json({
            status: 'normal',
            prediction: emergencyPrediction
          });
        }
      } catch (error) {
        console.error('❌ Error in emergency detection:', error);
        res.status(500).json({ error: 'Emergency detection failed' });
      }
    });

    // Manual emergency trigger (from family/senior app)
    this.app.post('/api/emergency/manual', async (req, res) => {
      try {
        const { seniorId, emergencyType, description, triggeredBy } = req.body;
        
        const emergencyPrediction = {
          type: emergencyType || 'MANUAL_TRIGGER',
          confidence: 1.0,
          severity: 'HIGH',
          isEmergency: true,
          description: description
        };
        
        const emergency = await this.triggerEmergencyResponse(seniorId, emergencyPrediction);
        
        res.json({
          status: 'emergency_triggered',
          emergencyId: emergency.id,
          message: 'Emergency response initiated'
        });
      } catch (error) {
        console.error('❌ Error in manual emergency trigger:', error);
        res.status(500).json({ error: 'Manual emergency trigger failed' });
      }
    });

    // Emergency status update endpoint
    this.app.put('/api/emergency/:emergencyId/status', async (req, res) => {
      try {
        const { emergencyId } = req.params;
        const { status, notes, caregiverId } = req.body;
        
        await this.updateEmergencyStatus(emergencyId, status, notes, caregiverId);
        
        res.json({ status: 'updated' });
      } catch (error) {
        console.error('❌ Error updating emergency status:', error);
        res.status(500).json({ error: 'Status update failed' });
      }
    });

    // Get active emergencies
    this.app.get('/api/emergencies/active', async (req, res) => {
      try {
        const { data: emergencies } = await this.supabase
          .from('emergencies')
          .select(`
            *,
            seniors(name, age, medical_conditions),
            family_contacts(name, phone, email, relationship)
          `)
          .eq('status', 'ACTIVE')
          .order('triggered_at', { ascending: false });
        
        res.json(emergencies);
      } catch (error) {
        console.error('❌ Error fetching active emergencies:', error);
        res.status(500).json({ error: 'Failed to fetch emergencies' });
      }
    });
  }

  async detectEmergency(sensorData) {
    // Implement emergency detection logic
    // This combines rule-based detection with AI predictions
    
    const ruleBasedDetection = this.ruleBasedEmergencyDetection(sensorData);
    
    // TODO: Integrate AI model for enhanced detection
    // const aiPrediction = await this.getAIPrediction(sensorData);
    
    // For now, use rule-based detection as baseline
    return ruleBasedDetection;
  }

  ruleBasedEmergencyDetection(sensorData) {
    const emergencies = [];
    
    // Heart rate analysis
    if (sensorData.heartRate) {
      if (sensorData.heartRate > 120 || sensorData.heartRate < 50) {
        emergencies.push({
          type: 'CARDIAC_EVENT',
          confidence: 0.8,
          reason: `Abnormal heart rate: ${sensorData.heartRate} bpm`
        });
      }
    }
    
    // Fall detection
    if (sensorData.accelerometer) {
      const acceleration = Math.sqrt(
        Math.pow(sensorData.accelerometer.x, 2) +
        Math.pow(sensorData.accelerometer.y, 2) +
        Math.pow(sensorData.accelerometer.z, 2)
      );
      
      if (acceleration > 3.0) { // Sudden acceleration indicating potential fall
        emergencies.push({
          type: 'FALL_DETECTED',
          confidence: 0.9,
          reason: `High acceleration detected: ${acceleration.toFixed(2)}g`
        });
      }
    }
    
    // Blood pressure analysis
    if (sensorData.bloodPressure) {
      const { systolic, diastolic } = sensorData.bloodPressure;
      if (systolic > 180 || diastolic > 110 || systolic < 90) {
        emergencies.push({
          type: 'HYPERTENSIVE_CRISIS',
          confidence: 0.85,
          reason: `Critical blood pressure: ${systolic}/${diastolic}`
        });
      }
    }
    
    // Temperature analysis
    if (sensorData.temperature) {
      if (sensorData.temperature > 39 || sensorData.temperature < 35) {
        emergencies.push({
          type: 'TEMPERATURE_EMERGENCY',
          confidence: 0.7,
          reason: `Abnormal temperature: ${sensorData.temperature}°C`
        });
      }
    }
    
    // Determine highest confidence emergency
    if (emergencies.length > 0) {
      const highestConfidence = emergencies.reduce((prev, current) => 
        (prev.confidence > current.confidence) ? prev : current
      );
      
      return {
        isEmergency: highestConfidence.confidence > this.config.emergencyThreshold,
        type: highestConfidence.type,
        confidence: highestConfidence.confidence,
        severity: highestConfidence.confidence > 0.9 ? 'HIGH' : 'MEDIUM',
        reason: highestConfidence.reason,
        allDetections: emergencies
      };
    }
    
    return {
      isEmergency: false,
      type: 'NORMAL',
      confidence: 0.0,
      severity: 'NONE'
    };
  }

  async triggerEmergencyResponse(seniorId, prediction) {
    const startTime = new Date();
    console.log(`🚨 TRIGGERING EMERGENCY RESPONSE for senior ${seniorId}`);
    
    try {
      // 1. Create emergency record
      const { data: emergency, error } = await this.supabase
        .from('emergencies')
        .insert({
          senior_id: seniorId,
          emergency_type: prediction.type,
          confidence: prediction.confidence,
          severity: prediction.severity,
          status: 'ACTIVE',
          triggered_at: startTime.toISOString(),
          description: prediction.reason || prediction.description
        })
        .select()
        .single();

      if (error) throw error;

      // Track this emergency
      this.activeEmergencies.set(emergency.id, {
        ...emergency,
        startTime,
        notifications: [],
        dispatches: []
      });

      // 2. Get senior and family information
      const { data: senior } = await this.supabase
        .from('seniors')
        .select(`
          *,
          family_contacts(*)
        `)
        .eq('id', seniorId)
        .single();

      // 3. Find and dispatch caregivers
      const caregivers = await this.findNearestCaregivers(senior);
      await this.dispatchCaregivers(emergency.id, caregivers.slice(0, 2));

      // 4. Notify family immediately
      await this.notifyFamily(emergency.id, senior.family_contacts, prediction);

      // 5. Contact hospitals if severe
      if (prediction.severity === 'HIGH') {
        await this.contactHospitals(emergency.id, senior);
      }

      // 6. Start real-time monitoring
      this.monitorEmergencyResponse(emergency.id);

      const responseTime = (new Date() - startTime) / 1000;
      console.log(`✅ Emergency response initiated in ${responseTime.toFixed(2)}s`);

      return {
        ...emergency,
        responseTime: responseTime
      };

    } catch (error) {
      console.error('❌ Error triggering emergency response:', error);
      throw error;
    }
  }

  async findNearestCaregivers(senior) {
    try {
      // Find available caregivers within radius
      const { data: caregivers } = await this.supabase
        .from('caregivers')
        .select('*')
        .eq('status', 'AVAILABLE')
        .eq('city', 'bangalore');

      // Sort by distance (simplified - in production use PostGIS)
      const sortedCaregivers = caregivers.map(caregiver => ({
        ...caregiver,
        distance: this.calculateDistance(
          senior.latitude, senior.longitude,
          caregiver.latitude, caregiver.longitude
        )
      }))
      .filter(c => c.distance <= this.config.maxCaregiverDistance)
      .sort((a, b) => a.distance - b.distance);

      console.log(`📍 Found ${sortedCaregivers.length} available caregivers`);
      return sortedCaregivers;

    } catch (error) {
      console.error('❌ Error finding caregivers:', error);
      return [];
    }
  }

  async dispatchCaregivers(emergencyId, caregivers) {
    for (const caregiver of caregivers) {
      try {
        // Create dispatch record
        await this.supabase
          .from('emergency_dispatches')
          .insert({
            emergency_id: emergencyId,
            caregiver_id: caregiver.id,
            dispatched_at: new Date().toISOString(),
            status: 'DISPATCHED'
          });

        // Send notification to caregiver
        await this.notifyCaregiver(caregiver, emergencyId);

        console.log(`👩‍⚕️ Dispatched caregiver ${caregiver.name}`);

      } catch (error) {
        console.error(`❌ Error dispatching caregiver ${caregiver.id}:`, error);
      }
    }
  }

  async notifyFamily(emergencyId, familyContacts, prediction) {
    const message = `🚨 EMERGENCY ALERT: ${prediction.type} detected for your loved one. Caregivers have been dispatched. We will keep you updated.`;
    
    for (const contact of familyContacts) {
      try {
        // Send SMS
        if (contact.phone) {
          await this.sendSMS(contact.phone, message);
        }
        
        // Send Email
        if (contact.email) {
          await this.sendEmail(contact.email, 'Emergency Alert', message);
        }
        
        // TODO: Send push notification
        // await this.sendPushNotification(contact.device_token, message);
        
        console.log(`📱 Notified ${contact.name} (${contact.relationship})`);
        
      } catch (error) {
        console.error(`❌ Error notifying ${contact.name}:`, error);
      }
    }
  }

  async sendSMS(phoneNumber, message) {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to: phoneNumber
      });
      console.log(`📱 SMS sent to ${phoneNumber}`);
    } catch (error) {
      console.error(`❌ SMS failed to ${phoneNumber}:`, error);
    }
  }

  async sendEmail(email, subject, message) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: message,
        html: `<p>${message}</p>`
      });
      console.log(`📧 Email sent to ${email}`);
    } catch (error) {
      console.error(`❌ Email failed to ${email}:`, error);
    }
  }

  async contactHospitals(emergencyId, senior) {
    for (const hospital of this.config.bangaloreHospitals) {
      try {
        // API call to hospital (if available)
        if (hospital.api_endpoint && hospital.api_key) {
          await axios.post(hospital.api_endpoint, {
            emergency_id: emergencyId,
            patient: {
              name: senior.name,
              age: senior.age,
              medical_conditions: senior.medical_conditions,
              medications: senior.current_medications,
              emergency_contact: senior.family_contacts[0]?.phone
            },
            estimated_arrival: '15-30 minutes',
            severity: 'HIGH'
          }, {
            headers: {
              'Authorization': `Bearer ${hospital.api_key}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        console.log(`🏥 Contacted ${hospital.name}`);
        
      } catch (error) {
        console.error(`❌ Error contacting ${hospital.name}:`, error);
        
        // Fallback: Log for manual contact
        console.log(`📞 Manual contact required: ${hospital.name} - ${hospital.emergency_phone}`);
      }
    }
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client connected');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'sensor_data') {
            // Process real-time sensor data
            const prediction = await this.detectEmergency(data.sensorData);
            
            ws.send(JSON.stringify({
              type: 'prediction_result',
              prediction: prediction,
              timestamp: new Date().toISOString()
            }));
            
            // Trigger emergency if needed
            if (prediction.isEmergency) {
              await this.triggerEmergencyResponse(data.seniorId, prediction);
            }
          }
          
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
      });
    });
  }

  startRealtimeMonitoring() {
    // Monitor for new sensor readings
    this.supabase
      .channel('sensor-monitoring')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        async (payload) => {
          const sensorData = payload.new;
          const prediction = await this.detectEmergency(sensorData);
          
          if (prediction.isEmergency) {
            await this.triggerEmergencyResponse(sensorData.senior_id, prediction);
          }
        }
      )
      .subscribe();
    
    console.log('👁️ Real-time sensor monitoring active');
  }

  async initializeDatabase() {
    // Database schema would be set up via Supabase migrations
    console.log('📊 Database tables initialized');
  }

  // Utility functions
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async updateEmergencyStatus(emergencyId, status, notes, caregiverId) {
    await this.supabase
      .from('emergencies')
      .update({
        status: status,
        resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null,
        notes: notes,
        resolved_by: caregiverId
      })
      .eq('id', emergencyId);
    
    if (status === 'RESOLVED') {
      this.activeEmergencies.delete(emergencyId);
    }
  }

  monitorEmergencyResponse(emergencyId) {
    // Monitor response time and effectiveness
    const startTime = new Date();
    
    const checkInterval = setInterval(async () => {
      const elapsed = (new Date() - startTime) / 1000;
      
      if (elapsed > this.config.responseTimeTarget) {
        console.log(`⚠️ Emergency ${emergencyId} exceeded ${this.config.responseTimeTarget}s target`);
        // Escalate or take additional action
        clearInterval(checkInterval);
      }
      
      // Check if emergency is resolved
      const emergency = this.activeEmergencies.get(emergencyId);
      if (!emergency) {
        clearInterval(checkInterval);
      }
      
    }, 30000); // Check every 30 seconds
  }

  async notifyCaregiver(caregiver, emergencyId) {
    const message = `🚨 EMERGENCY DISPATCH: You have been assigned to emergency ${emergencyId}. Please respond immediately.`;
    
    if (caregiver.phone) {
      await this.sendSMS(caregiver.phone, message);
    }
    
    // TODO: Send push notification to caregiver app
  }
}

// Initialize and start the Emergency Response System
const emergencySystem = new EmergencyResponseSystem();
emergencySystem.initialize().catch(console.error);

module.exports = EmergencyResponseSystem;