import React, { useState, useEffect } from 'react';
import './EmergencyAlert.css';

const EmergencyAlert = ({
    isVisible,
    onClose,
    parentName = "Papa (Rajesh Kumar)",
    alertType = "Irregular heartbeat detected",
    location = "Home - Bedroom"
}) => {
    const [responseTimer, setResponseTimer] = useState(0);
    const [alertTime] = useState(new Date());
    const [responseStatus, setResponseStatus] = useState("Emergency Response Activated: Medical team dispatched • ETA: 3-5 minutes");

    useEffect(() => {
        if (!isVisible) return;

        const timer = setInterval(() => {
            setResponseTimer(prev => prev + 1);
        }, 1000);

        // Simulate status updates
        const statusUpdates = [
            { time: 10000, status: "🏥 Update: Caregiver reached Papa • Vitals stabilizing • Ambulance ETA: 2 minutes" },
            { time: 30000, status: "🚑 Update: Paramedics arrived on scene • Papa responsive • Vitals improving" }
        ];

        const timeouts = statusUpdates.map(update =>
            setTimeout(() => setResponseStatus(update.status), update.time)
        );

        // Accessibility: Screen reader announcement
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
                `Medical emergency alert for ${parentName}. ${alertType}. Emergency services have been notified.`
            );
            utterance.rate = 1.2;
            utterance.volume = 0.8;
            speechSynthesis.speak(utterance);
        }

        // Mobile vibration
        if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }

        return () => {
            clearInterval(timer);
            timeouts.forEach(clearTimeout);
        };
    }, [isVisible, parentName, alertType]);

    const formatTimer = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatAlertTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEmergencyCall = () => {
        if (window.confirm('This will call Karnataka 108 Emergency Services immediately. Continue?')) {
            alert('📞 Calling 108 Emergency Services...\n\nProviding patient details and location automatically.');
            // In production: window.open('tel:108');
        }
    };

    const handleCallParent = () => {
        alert('📞 Attempting to call Papa directly...\n\nIf no response in 30 seconds, emergency services will be contacted.');
        // In production: window.open('tel:+919876543210');
    };

    const handleCallCaregiver = () => {
        alert('📞 Calling caregiver Sunita Devi...\n\nShe is trained in basic medical response and can provide immediate assistance.');
        // In production: window.open('tel:+919876543211');
    };

    const handleViewLocation = () => {
        alert('📍 Opening live location tracking...\n\nReal-time GPS coordinates shared with emergency services and family members.');
        // In production: Open maps with real-time location
    };

    const handleKeyDown = (e) => {
        if (e.key === '1') handleEmergencyCall();
        else if (e.key === '2') handleCallParent();
        else if (e.key === '3') handleCallCaregiver();
        else if (e.key === 'Escape') {
            if (window.confirm('Are you sure you want to close this emergency alert? Papa may still need help.')) {
                onClose();
            }
        }
    };

    useEffect(() => {
        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className="emergency-overlay" role="alert" aria-live="assertive">
            <div className="emergency-alert">
                <div className="sound-waves">
                    <div className="sound-wave"></div>
                    <div className="sound-wave"></div>
                    <div className="sound-wave"></div>
                </div>

                <div className="emergency-icon" aria-label="Emergency alert">🚨</div>

                <h1 className="emergency-title">Medical Emergency Detected</h1>

                <div className="urgency-indicator">High Priority Alert</div>

                <p className="emergency-message">
                    <strong>{parentName}</strong> may need immediate medical attention.
                    Our AI detected unusual vital signs that require urgent response.
                </p>

                <div className="emergency-details">
                    <div className="detail-row">
                        <span className="detail-label">🕐 Alert Time:</span>
                        <span className="detail-value">{formatAlertTime(alertTime)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">📍 Location:</span>
                        <span className="detail-value">{location}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">⚡ Alert Type:</span>
                        <span className="detail-value">{alertType}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">👤 Last Contact:</span>
                        <span className="detail-value">Caregiver Sunita - 5 mins ago</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">🏥 Nearest Hospital:</span>
                        <span className="detail-value">Apollo Hospitals (8 min away)</span>
                    </div>
                </div>

                <div className="response-status">
                    <strong>🚑 {responseStatus}</strong>
                </div>

                <div className="timer-display">
                    Response Time: <span>{formatTimer(responseTimer)}</span>
                </div>

                <div className="action-buttons">
                    <button
                        className="emergency-btn btn-primary"
                        onClick={handleEmergencyCall}
                        aria-label="Call emergency services"
                    >
                        🚑 Call 108 Emergency
                    </button>
                    <button
                        className="emergency-btn btn-secondary"
                        onClick={handleCallParent}
                        aria-label="Call parent directly"
                    >
                        📞 Call Papa Now
                    </button>
                    <button
                        className="emergency-btn btn-success"
                        onClick={handleCallCaregiver}
                        aria-label="Call caregiver"
                    >
                        👩‍⚕️ Call Caregiver
                    </button>
                    <button
                        className="emergency-btn btn-secondary"
                        onClick={handleViewLocation}
                        aria-label="View live location"
                    >
                        📍 View Live Location
                    </button>
                </div>

                <div className="contact-info">
                    <h4>📞 Emergency Contacts Being Notified:</h4>
                    <div className="contact-item">
                        <div className="contact-icon">S</div>
                        <div>
                            <strong>Sunita Devi</strong> (Caregiver)<br />
                            <small>Calling now... ☎️</small>
                        </div>
                    </div>
                    <div className="contact-item">
                        <div className="contact-icon">D</div>
                        <div>
                            <strong>Dr. Mehta</strong> (Family Doctor)<br />
                            <small>SMS sent • Will call shortly</small>
                        </div>
                    </div>
                    <div className="contact-item">
                        <div className="contact-icon">🏥</div>
                        <div>
                            <strong>Apollo Emergency</strong><br />
                            <small>Ambulance dispatched • ETA 4 mins</small>
                        </div>
                    </div>
                </div>

                <div className="emergency-instructions">
                    <p><small>
                        <strong>Keyboard shortcuts:</strong> Press 1 for Emergency Services, 2 to Call Papa, 3 for Caregiver, ESC to close
                    </small></p>
                </div>
            </div>
        </div>
    );
};

// Banner notification version
export const EmergencyBanner = ({
    isVisible,
    onViewDetails,
    onDismiss,
    parentName = "Papa"
}) => {
    if (!isVisible) return null;

    return (
        <div className="notification-banner" role="alert">
            <div className="banner-content">
                <div className="banner-message">
                    <span style={{ fontSize: '1.5rem' }}>🚨</span>
                    <div>
                        <strong>MEDICAL ALERT:</strong> {parentName} needs attention - Irregular heartbeat detected
                    </div>
                </div>
                <div className="banner-actions">
                    <button className="banner-btn" onClick={onViewDetails}>
                        View Details
                    </button>
                    <button className="banner-btn" onClick={() => {
                        if (window.confirm('This will call 108 Emergency Services immediately. Continue?')) {
                            alert('📞 Calling 108...');
                        }
                    }}>
                        Call 108
                    </button>
                    <button className="banner-btn" onClick={onDismiss}>
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

// Floating emergency button
export const FloatingEmergency = ({ onClick, isVisible }) => {
    if (!isVisible) return null;

    return (
        <button
            className="floating-emergency"
            onClick={onClick}
            aria-label="View emergency alert"
        >
            🚨
        </button>
    );
};

export default EmergencyAlert;
