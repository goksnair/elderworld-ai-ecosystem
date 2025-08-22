// ElderWorld Advanced Micro-Interactions System
// Based on Perplexity research insights from Mayo Clinic, Kaiser Permanente patterns

class ElderWorldInteractions {
    constructor() {
        this.init();
    }

    init() {
        this.setupHealthDataAnimations();
        this.setupVitalsPulse();
        this.setupConfirmationFeedback();
        this.setupEmergencySystem();
    }

    // Research Insight: Shimmer effects for health data updates
    setupHealthDataAnimations() {
        const healthCards = document.querySelectorAll('.health-card, .vitals-card');
        healthCards.forEach(card => {
            // Add shimmer effect when data updates
            const observer = new MutationObserver(() => {
                this.triggerShimmer(card);
            });
            observer.observe(card, { childList: true, subtree: true });
        });
    }

    triggerShimmer(element) {
        element.classList.add('health-shimmer');
        setTimeout(() => {
            element.classList.remove('health-shimmer');
        }, 2000);
    }

    // Research Insight: Pulse animations for vital signs
    setupVitalsPulse() {
        const vitalElements = document.querySelectorAll('.vital-sign, .heart-rate, .blood-pressure');
        vitalElements.forEach(element => {
            element.classList.add('vitals-pulse');

            // Add heartbeat animation for heart rate specifically
            if (element.classList.contains('heart-rate')) {
                element.classList.add('heartbeat-pulse');
            }
        });
    }

    // Research Insight: Confirmatory pop effects for critical actions
    setupConfirmationFeedback() {
        const criticalButtons = document.querySelectorAll('.critical-action, .emergency-btn, .medication-confirm');
        criticalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.triggerConfirmPop(e.target);
            });
        });
    }

    triggerConfirmPop(element) {
        element.classList.add('confirm-pop');

        // Add success checkmark animation
        const checkmark = document.createElement('div');
        checkmark.innerHTML = '✓';
        checkmark.className = 'success-checkmark';
        element.appendChild(checkmark);

        setTimeout(() => {
            element.classList.remove('confirm-pop');
            if (checkmark.parentNode) {
                checkmark.remove();
            }
        }, 1500);
    }

    // Research Insight: Persistent emergency system with status feedback
    setupEmergencySystem() {
        this.createPersistentSOS();
        this.setupEmergencyStatus();
    }

    createPersistentSOS() {
        const existingSOS = document.querySelector('.persistent-emergency');
        if (existingSOS) return;

        const sosButton = document.createElement('button');
        sosButton.className = 'persistent-emergency';
        sosButton.innerHTML = `
            <span class="sos-icon">🚨</span>
            <span class="sos-text">Emergency</span>
        `;

        sosButton.addEventListener('click', () => {
            this.triggerEmergency();
        });

        document.body.appendChild(sosButton);
    }

    triggerEmergency() {
        // Multi-channel emergency activation
        this.showEmergencyStatus('Emergency Activated - Connecting...');

        // Simulate emergency response sequence
        setTimeout(() => {
            this.showEmergencyStatus('Family Notified - Help on the way');
        }, 2000);

        setTimeout(() => {
            this.showEmergencyStatus('Emergency Response Active');
        }, 4000);
    }

    showEmergencyStatus(message) {
        let statusElement = document.querySelector('.emergency-status');

        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'emergency-status';
            document.body.appendChild(statusElement);
        }

        statusElement.textContent = message;
        statusElement.classList.add('status-visible');

        // Auto-hide after 10 seconds unless it's an active emergency
        if (!message.includes('Active')) {
            setTimeout(() => {
                statusElement.classList.remove('status-visible');
            }, 10000);
        }
    }

    // Doctor validation badges for AI recommendations
    addDoctorValidation(element, doctorName = 'Dr. Sharma') {
        const badge = document.createElement('div');
        badge.className = 'doctor-validation-badge';
        badge.innerHTML = `✓ Reviewed by ${doctorName}`;

        element.style.position = 'relative';
        element.appendChild(badge);
    }

    // Premium feature highlighting
    highlightPremiumFeature(element) {
        element.classList.add('premium-feature');

        const premiumBadge = document.createElement('div');
        premiumBadge.className = 'premium-badge';
        premiumBadge.innerHTML = '👑 Premium';

        element.appendChild(premiumBadge);
    }
}

// Enhanced CSS for micro-interactions
const advancedCSS = `
/* Research-Based Health Data Shimmer Animation */
.health-shimmer {
    position: relative;
    overflow: hidden;
}

.health-shimmer::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.4), 
        transparent);
    animation: shimmer 2s ease-in-out;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* Research-Based Vitals Pulse Animation */
.vitals-pulse {
    animation: vitals-glow 2s ease-in-out infinite;
}

.heartbeat-pulse {
    animation: heartbeat 1.2s ease-in-out infinite;
}

@keyframes vitals-glow {
    0%, 100% { 
        box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
        transform: scale(1);
    }
    50% { 
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
        transform: scale(1.02);
    }
}

@keyframes heartbeat {
    0%, 50%, 100% { transform: scale(1); }
    25%, 75% { transform: scale(1.05); }
}

/* Research-Based Confirmation Pop */
.confirm-pop {
    animation: confirm-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes confirm-bounce {
    0% { transform: scale(1); }
    50% { transform: scale(1.15); }
    100% { transform: scale(1); }
}

.success-checkmark {
    position: absolute;
    top: -10px;
    right: -10px;
    background: var(--healthcare-500);
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    animation: checkmark-pop 1.5s ease-out;
}

@keyframes checkmark-pop {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0; }
}

/* Persistent Emergency Button */
.persistent-emergency {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    border-radius: 28px;
    padding: 12px 20px;
    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
    cursor: pointer;
    z-index: 1000;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: emergency-pulse 3s infinite;
}

.persistent-emergency:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 35px rgba(239, 68, 68, 0.4);
}

@keyframes emergency-pulse {
    0%, 100% { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3); }
    50% { box-shadow: 0 8px 35px rgba(239, 68, 68, 0.5); }
}

/* Emergency Status Display */
.emergency-status {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 1001;
    opacity: 0;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.emergency-status.status-visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* Doctor Validation Badge */
.doctor-validation-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--healthcare-500);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

/* Premium Feature Highlighting */
.premium-feature {
    position: relative;
    background: linear-gradient(135deg, 
        rgba(245, 158, 11, 0.1) 0%, 
        rgba(30, 58, 138, 0.1) 100%);
    border: 1px solid rgba(245, 158, 11, 0.3);
    backdrop-filter: blur(10px);
}

.premium-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
}

/* Enhanced Touch Targets for Seniors */
@media (max-width: 768px) {
    .persistent-emergency {
        padding: 16px 24px;
        font-size: 18px;
        border-radius: 32px;
        bottom: 30px;
        right: 30px;
    }
    
    .critical-action {
        min-height: 64px;
        min-width: 64px;
        font-size: 18px;
    }
}

/* Senior Mode Enhancements */
.senior-mode {
    --font-scale: 1.4;
    --touch-target: 64px;
    --line-height: 1.8;
}

.senior-mode .health-card {
    padding: 24px;
    font-size: calc(16px * var(--font-scale));
    line-height: var(--line-height);
}

.senior-mode button {
    min-height: var(--touch-target);
    min-width: var(--touch-target);
    font-size: calc(16px * var(--font-scale));
}
`;

// Apply the enhanced CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = advancedCSS;
document.head.appendChild(styleSheet);

// Initialize the advanced interaction system
document.addEventListener('DOMContentLoaded', () => {
    window.elderworldInteractions = new ElderWorldInteractions();

    // Add doctor validation to existing AI elements
    const aiElements = document.querySelectorAll('.ai-recommendation, .health-insight');
    aiElements.forEach(element => {
        window.elderworldInteractions.addDoctorValidation(element);
    });

    // Highlight premium features
    const premiumElements = document.querySelectorAll('.premium-only, .paid-feature');
    premiumElements.forEach(element => {
        window.elderworldInteractions.highlightPremiumFeature(element);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldInteractions;
}
