/**
 * ElderWorld Animation Controller
 * Healthcare-Grade Micro-interactions and Transitions
 * Phase 2 Implementation - August 6, 2025
 */

class ElderWorldAnimations {
    constructor() {
        this.isReducedMotion = this.checkReducedMotion();
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.init();
    }

    /**
     * Initialize all animation systems
     */
    init() {
        this.setupScrollAnimations();
        this.setupCardAnimations();
        this.setupFormAnimations();
        this.setupNotificationSystem();
        this.setupHealthMetricsAnimations();
        this.setupLoadingStates();

        console.log('ElderWorld Animation System initialized');
    }

    /**
     * Check for reduced motion preference
     */
    checkReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Setup scroll-triggered animations
     */
    setupScrollAnimations() {
        if (this.isReducedMotion) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, this.observerOptions);

        // Observe all elements with animate-on-scroll class
        const animateElements = document.querySelectorAll('.animate-on-scroll');
        animateElements.forEach(el => observer.observe(el));

        // Staggered animations for lists
        this.setupStaggeredAnimations();
    }

    /**
     * Setup staggered animations for card lists
     */
    setupStaggeredAnimations() {
        const cardContainers = document.querySelectorAll('.cards-grid, .health-metrics-grid');

        cardContainers.forEach(container => {
            const cards = container.querySelectorAll('.card, .health-card');
            cards.forEach((card, index) => {
                card.classList.add('stagger-item');
                card.style.animationDelay = `${index * 50}ms`;
            });
        });
    }

    /**
     * Enhanced card interactions
     */
    setupCardAnimations() {
        const cards = document.querySelectorAll('.card, .health-card');

        cards.forEach(card => {
            // Add GPU acceleration
            card.classList.add('gpu-accelerated');

            // Enhanced hover effects
            card.addEventListener('mouseenter', (e) => {
                if (this.isReducedMotion) return;

                this.animateCardHover(e.target, true);
            });

            card.addEventListener('mouseleave', (e) => {
                if (this.isReducedMotion) return;

                this.animateCardHover(e.target, false);
            });

            // Click animations
            card.addEventListener('click', (e) => {
                if (this.isReducedMotion) return;

                this.animateCardClick(e.target);
            });
        });
    }

    /**
     * Animate card hover states
     */
    animateCardHover(card, isHovering) {
        const timeline = [
            {
                transform: isHovering
                    ? 'translateY(-4px) scale(1.02)'
                    : 'translateY(0) scale(1)',
                boxShadow: isHovering
                    ? '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.08)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)'
            }
        ];

        const options = {
            duration: 300,
            easing: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
            fill: 'forwards'
        };

        card.animate(timeline, options);
    }

    /**
     * Animate card click feedback
     */
    animateCardClick(card) {
        const timeline = [
            { transform: 'scale(1.02)' },
            { transform: 'scale(0.98)' },
            { transform: 'scale(1)' }
        ];

        const options = {
            duration: 200,
            easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
        };

        card.animate(timeline, options);
    }

    /**
     * Form field animations
     */
    setupFormAnimations() {
        const formFields = document.querySelectorAll('.form-field');

        formFields.forEach(field => {
            field.addEventListener('focus', (e) => {
                this.animateFormFocus(e.target, true);
            });

            field.addEventListener('blur', (e) => {
                this.animateFormFocus(e.target, false);
            });
        });
    }

    /**
     * Animate form field focus states
     */
    animateFormFocus(field, isFocused) {
        if (this.isReducedMotion) return;

        const label = field.nextElementSibling;

        if (isFocused) {
            field.style.transform = 'translateY(-2px)';
            field.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';

            if (label) {
                label.style.transform = 'translateY(-20px) scale(0.85)';
                label.style.color = 'var(--primary-500)';
            }
        } else if (!field.value) {
            field.style.transform = '';
            field.style.boxShadow = '';

            if (label) {
                label.style.transform = '';
                label.style.color = '';
            }
        }
    }

    /**
     * Notification system animations
     */
    setupNotificationSystem() {
        this.notificationContainer = this.createNotificationContainer();
    }

    /**
     * Create notification container
     */
    createNotificationContainer() {
        let container = document.getElementById('notification-container');

        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        return container;
    }

    /**
     * Show animated notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: white;
            padding: 16px 24px;
            margin-bottom: 12px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            pointer-events: auto;
            cursor: pointer;
            max-width: 400px;
            border-left: 4px solid var(--${type === 'error' ? 'error' : type === 'success' ? 'success' : 'primary'}-500);
        `;
        notification.textContent = message;

        // Add click to dismiss
        notification.addEventListener('click', () => {
            this.hideNotification(notification);
        });

        // Add to container
        this.notificationContainer.appendChild(notification);

        // Auto-hide after duration
        setTimeout(() => {
            if (notification.parentNode) {
                this.hideNotification(notification);
            }
        }, duration);

        return notification;
    }

    /**
     * Hide notification with animation
     */
    hideNotification(notification) {
        notification.classList.add('notification-exit');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Health metrics animations
     */
    setupHealthMetricsAnimations() {
        this.animateProgressBars();
        this.setupHeartRateAnimation();
        this.setupRealTimeUpdates();
    }

    /**
     * Animate progress bars
     */
    animateProgressBars() {
        const progressBars = document.querySelectorAll('.health-progress-bar');

        progressBars.forEach(bar => {
            const fill = bar.querySelector('.health-progress-fill');
            const targetWidth = fill.dataset.progress || '0';

            // Start from 0 and animate to target
            fill.style.width = '0%';

            setTimeout(() => {
                fill.style.width = `${targetWidth}%`;
            }, 500);
        });
    }

    /**
     * Setup heart rate animation
     */
    setupHeartRateAnimation() {
        const heartRateElements = document.querySelectorAll('.heart-rate-indicator');

        heartRateElements.forEach(element => {
            const heartRate = parseInt(element.dataset.heartRate) || 72;
            const interval = 60000 / heartRate; // Convert BPM to milliseconds

            element.style.animationDuration = `${interval * 2}ms`;
        });
    }

    /**
     * Setup real-time data updates with animations
     */
    setupRealTimeUpdates() {
        // This would integrate with your real-time data system
        const updateElements = document.querySelectorAll('.real-time-data');

        updateElements.forEach(element => {
            // Add observer for data changes
            this.observeDataChanges(element);
        });
    }

    /**
     * Observe data changes and animate updates
     */
    observeDataChanges(element) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    this.animateDataUpdate(element);
                }
            });
        });

        observer.observe(element, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    /**
     * Animate data updates
     */
    animateDataUpdate(element) {
        if (this.isReducedMotion) return;

        element.classList.add('success-state');

        setTimeout(() => {
            element.classList.remove('success-state');
        }, 300);
    }

    /**
     * Loading states management
     */
    setupLoadingStates() {
        this.loadingStates = new Map();
    }

    /**
     * Show loading state for element
     */
    showLoading(elementId, type = 'skeleton') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const originalContent = element.innerHTML;
        this.loadingStates.set(elementId, originalContent);

        if (type === 'skeleton') {
            this.createSkeletonLoading(element);
        } else if (type === 'pulse') {
            element.classList.add('pulse-loading');
        }
    }

    /**
     * Create skeleton loading
     */
    createSkeletonLoading(element) {
        const rect = element.getBoundingClientRect();
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        skeleton.style.width = '100%';
        skeleton.style.height = `${rect.height}px`;

        element.innerHTML = '';
        element.appendChild(skeleton);
    }

    /**
     * Hide loading state
     */
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const originalContent = this.loadingStates.get(elementId);
        if (originalContent) {
            element.innerHTML = originalContent;
            element.classList.remove('pulse-loading');
            this.loadingStates.delete(elementId);
        }
    }

    /**
     * Animate page transitions
     */
    animatePageTransition(direction = 'right') {
        const main = document.querySelector('main');
        if (!main || this.isReducedMotion) return;

        main.classList.add(`slide-in-${direction}`);

        setTimeout(() => {
            main.classList.remove(`slide-in-${direction}`);
        }, 800);
    }

    /**
     * Emergency alert animation
     */
    showEmergencyAlert() {
        const alert = document.createElement('div');
        alert.className = 'emergency-modal modal-overlay';
        alert.innerHTML = `
            <div class="modal-content emergency-modal">
                <div class="emergency-content">
                    <i class="fas fa-exclamation-triangle" style="color: var(--error-500); font-size: 48px;"></i>
                    <h2>Emergency Alert</h2>
                    <p>Your loved one needs immediate attention.</p>
                    <button class="btn btn-emergency" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Acknowledge
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(alert);

        // Auto-remove after acknowledgment or timeout
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 30000);
    }

    /**
     * Utility method to add animation class with auto-removal
     */
    addTempAnimation(element, className, duration = 1000) {
        element.classList.add(className);

        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.elderBridgeAnimations = new ElderWorldAnimations();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldAnimations;
}
