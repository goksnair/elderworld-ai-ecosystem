import React, { useState, useEffect } from 'react';
import './FamilyDashboard.css';

const FamilyDashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [parentStatus, setParentStatus] = useState({
        name: 'Papa (Rajesh Kumar)',
        status: 'safe',
        lastSeen: '2 mins ago',
        vitals: {
            heartRate: 72,
            oxygenLevel: 98,
            sleepHours: 7.2,
            stepsToday: 2300
        }
    });

    const [activityFeed] = useState([
        {
            id: 1,
            type: 'positive',
            icon: '✅',
            title: 'Morning medication taken',
            time: '9:15 AM IST',
            description: 'Confirmed by caregiver'
        },
        {
            id: 2,
            type: 'positive',
            icon: '🚶',
            title: 'Completed morning walk',
            time: '7:30 AM IST',
            description: '25 minutes in park'
        },
        {
            id: 3,
            type: 'medical',
            icon: '🩺',
            title: 'Blood pressure check',
            time: '8:00 AM IST',
            description: '125/80 (Normal)'
        },
        {
            id: 4,
            type: 'neutral',
            icon: '📞',
            title: 'Called Priya (daughter)',
            time: 'Yesterday',
            description: '15 minute video call'
        }
    ]);

    const [emergencyAlert, setEmergencyAlert] = useState(false);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format time for different timezones
    const formatTime = (timezone, label) => {
        const time = new Date().toLocaleString("en-US", {
            timeZone: timezone,
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${label}: ${time}`;
    };

    const handleEmergencyClick = () => {
        if (window.confirm('This will trigger an immediate emergency response. Continue?')) {
            setEmergencyAlert(true);
            // In production, trigger actual emergency response
            setTimeout(() => {
                alert('🚨 Emergency alert sent! Response team activated.\n\nFamily notified, caregiver alerted, hospital contacted.');
                setEmergencyAlert(false);
            }, 3000);
        }
    };

    const handleActionClick = (action) => {
        alert(`${action} feature would launch here. Integration with WhatsApp, Zoom, etc.`);
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="header">
                <h1>� ElderWorld Dashboard</h1>
                <div className="family-info">
                    <div className="timezone-display">
                        🌍 {formatTime("Asia/Kolkata", "IST")} |
                        🇺🇸 Your Time: {currentTime.toLocaleTimeString('en-US', {
                            hour12: true,
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="main-grid">
                {/* Parent Status Card */}
                <div className="parent-status-card">
                    <div className="parent-header">
                        <div className="parent-photo">👨‍🦳</div>
                        <div className="parent-info">
                            <h2>{parentStatus.name}</h2>
                            <div className={`status-indicator ${parentStatus.status === 'safe' ? 'status-safe' : ''}`}>
                                <div className="online-status"></div>
                                All Good • Last seen {parentStatus.lastSeen}
                            </div>
                        </div>
                    </div>

                    <div className="vital-stats">
                        <div className="vital-item">
                            <div className="vital-value">{parentStatus.vitals.heartRate}</div>
                            <div className="vital-label">Heart Rate</div>
                        </div>
                        <div className="vital-item">
                            <div className="vital-value">{parentStatus.vitals.oxygenLevel}%</div>
                            <div className="vital-label">Oxygen Level</div>
                        </div>
                        <div className="vital-item">
                            <div className="vital-value">{parentStatus.vitals.sleepHours}h</div>
                            <div className="vital-label">Sleep Last Night</div>
                        </div>
                        <div className="vital-item">
                            <div className="vital-value">{parentStatus.vitals.stepsToday.toLocaleString()}</div>
                            <div className="vital-label">Steps Today</div>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <button className="action-btn btn-primary" onClick={() => handleActionClick('📹 Video Call')}>
                            📹 Video Call
                        </button>
                        <button className="action-btn btn-secondary" onClick={() => handleActionClick('📞 Voice Call')}>
                            📞 Voice Call
                        </button>
                        <button className="action-btn btn-secondary" onClick={() => handleActionClick('💬 Message')}>
                            💬 Message
                        </button>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="activity-feed">
                    <div className="activity-header">
                        <h3>📋 Today's Activity</h3>
                    </div>

                    {activityFeed.map(activity => (
                        <div key={activity.id} className="activity-item">
                            <div className={`activity-icon activity-${activity.type}`}>
                                {activity.icon}
                            </div>
                            <div>
                                <strong>{activity.title}</strong><br />
                                <small>{activity.time} • {activity.description}</small>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Communication Panel */}
                <div className="communication-panel">
                    <h3>👥 Care Team</h3>

                    <div className="caregiver-info">
                        <div className="caregiver-header">
                            <div className="caregiver-avatar">S</div>
                            <div>
                                <strong>Sunita Devi</strong><br />
                                <small>Primary Caregiver</small>
                            </div>
                            <div className="online-status"></div>
                        </div>
                        <p><small>On duty • Available 24/7 • Hindi, English</small></p>
                        <button
                            className="action-btn btn-secondary"
                            style={{ marginTop: '10px' }}
                            onClick={() => handleActionClick('📞 Call Caregiver')}
                        >
                            📞 Call Caregiver
                        </button>
                    </div>

                    <div style={{ background: '#F0F7FF', padding: '15px', borderRadius: '12px', margin: '15px 0' }}>
                        <h4>🏥 Hospital Partners</h4>
                        <p><small>Apollo Hospitals Bangalore</small><br />
                            <small>📞 Emergency: +91-80-2692-2222</small></p>
                    </div>

                    <div className="emergency-contact">
                        <h4 style={{ color: '#F44336', marginBottom: '10px' }}>🚨 Emergency Response</h4>
                        <p><small>Average response time: &lt; 3 minutes</small></p>
                        <button
                            className={`emergency-btn ${emergencyAlert ? 'pulsing' : ''}`}
                            onClick={handleEmergencyClick}
                            disabled={emergencyAlert}
                        >
                            {emergencyAlert ? '🚨 ACTIVATING...' : '🚨 EMERGENCY ALERT'}
                        </button>
                    </div>

                    <div className="currency-converter">
                        <h4>💱 Today's Costs</h4>
                        <p><small>Daily care: ₹850 ≈ $10.20 USD</small></p>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="bottom-grid">
                {/* Health Trends */}
                <div className="health-trends">
                    <h3>📈 Health Trends (Last 7 Days)</h3>
                    <div className="trend-chart">
                        <div style={{ textAlign: 'center' }}>
                            <p>📊 Interactive health charts would display here</p>
                            <p><small>Heart rate, activity, sleep patterns, medication adherence</small></p>
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="ai-insights">
                    <h3>🤖 AI Health Insights</h3>

                    <div className="insight-item">
                        <strong>💪 Activity Level: Excellent</strong><br />
                        <small>Papa's daily walks are consistent and improving cardiovascular health.</small>
                    </div>

                    <div className="insight-item">
                        <strong>😴 Sleep Quality: Good</strong><br />
                        <small>7+ hours of deep sleep. Consider reducing evening screen time.</small>
                    </div>

                    <div className="insight-item">
                        <strong>💊 Medication: On Track</strong><br />
                        <small>100% adherence this week. No missed doses detected.</small>
                    </div>

                    <div className="insight-item">
                        <strong>🎯 Health Score: 92/100</strong><br />
                        <small>Overall health trending positive. Keep up the great care!</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyDashboard;
