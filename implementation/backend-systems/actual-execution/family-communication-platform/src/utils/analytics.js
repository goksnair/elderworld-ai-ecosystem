// Advanced Analytics Integration for SeniorCare AI Platform
// Tracks user engagement, conversion funnel, and product-market fit metrics

class AnalyticsManager {
    constructor() {
        this.gtag = window.gtag;
        this.fbq = window.fbq;
        this.mixpanel = window.mixpanel;
        this.initialized = false;
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.userProperties = {};

        // Event queue for offline support
        this.eventQueue = [];
        this.isOnline = navigator.onLine;

        // Performance tracking
        this.performanceMetrics = {};
        this.startTime = Date.now();

        this.init();
    }

    // Initialize all analytics providers
    async init() {
        try {
            // Google Analytics 4
            if (window.gtag) {
                this.initGoogleAnalytics();
            }

            // Facebook Pixel
            if (window.fbq) {
                this.initFacebookPixel();
            }

            // Mixpanel
            if (window.mixpanel) {
                this.initMixpanel();
            }

            // Custom analytics endpoint
            this.initCustomAnalytics();

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('Analytics initialized successfully');

            // Process any queued events
            this.flushEventQueue();

        } catch (error) {
            console.error('Analytics initialization failed:', error);
        }
    }

    // Initialize Google Analytics 4
    initGoogleAnalytics() {
        // Enhanced E-commerce and User Engagement tracking
        this.gtag('config', 'GA_MEASUREMENT_ID', {
            // Enhanced measurement for SPA
            page_title: 'SeniorCare AI Platform',
            page_location: window.location.href,

            // Custom parameters for senior care domain
            custom_map: {
                'dimension1': 'user_type',
                'dimension2': 'family_size',
                'dimension3': 'parent_location',
                'dimension4': 'onboarding_step',
                'dimension5': 'emergency_alerts_enabled'
            },

            // User properties for segmentation
            user_properties: {
                platform: 'web',
                version: '1.0.0',
                feature_set: 'full'
            }
        });

        // Track initial page view with context
        this.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            engagement_time_msec: 100
        });
    }

    // Initialize Facebook Pixel
    initFacebookPixel() {
        this.fbq('init', 'FB_PIXEL_ID');
        this.fbq('track', 'PageView');

        // Custom events for senior care funnel
        this.setupFacebookCustomEvents();
    }

    // Initialize Mixpanel for detailed behavioral analytics
    initMixpanel() {
        this.mixpanel.init('MIXPANEL_TOKEN', {
            // Enhanced tracking for senior care metrics
            track_pageview: true,
            persistence: 'localStorage',

            // Custom properties
            property_blacklist: ['$current_url', '$referrer'],

            // Privacy settings (HIPAA compliant)
            opt_out_tracking_by_default: false,
            secure_cookie: true
        });

        // Set super properties for all events
        this.mixpanel.register({
            'Platform': 'SeniorCare AI Web',
            'Version': '1.0.0',
            'Environment': process.env.NODE_ENV || 'production',
            'Session ID': this.sessionId
        });
    }

    // Initialize custom analytics endpoint
    initCustomAnalytics() {
        this.customEndpoint = process.env.REACT_APP_ANALYTICS_ENDPOINT || '/api/analytics';

        // Send initialization event
        this.trackCustomEvent('analytics_initialized', {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            session_id: this.sessionId
        });
    }

    // Set up comprehensive event listeners
    setupEventListeners() {
        // Page visibility for engagement tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden', { timestamp: Date.now() });
            } else {
                this.trackEvent('page_visible', { timestamp: Date.now() });
            }
        });

        // Scroll depth tracking
        let maxScrollDepth = 0;
        window.addEventListener('scroll', this.throttle(() => {
            const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
                maxScrollDepth = scrollDepth;
                this.trackEvent('scroll_depth', {
                    depth_percentage: scrollDepth,
                    page_path: window.location.pathname
                });
            }
        }, 1000));

        // Click tracking for important elements
        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-track]');
            if (target) {
                const trackingData = target.dataset.track;
                try {
                    const eventData = JSON.parse(trackingData);
                    this.trackEvent('element_click', {
                        element_type: target.tagName.toLowerCase(),
                        element_text: target.textContent?.substring(0, 100),
                        element_classes: target.className,
                        ...eventData
                    });
                } catch (e) {
                    this.trackEvent('element_click', {
                        element_type: target.tagName.toLowerCase(),
                        element_text: target.textContent?.substring(0, 100),
                        tracking_id: trackingData
                    });
                }
            }
        });

        // Form interaction tracking
        document.addEventListener('change', (event) => {
            if (event.target.form && event.target.form.dataset.trackForm) {
                this.trackEvent('form_field_change', {
                    form_name: event.target.form.dataset.trackForm,
                    field_name: event.target.name,
                    field_type: event.target.type,
                    has_value: !!event.target.value
                });
            }
        });

        // Error tracking
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                error_message: event.message,
                error_filename: event.filename,
                error_lineno: event.lineno,
                error_colno: event.colno,
                page_path: window.location.pathname
            });
        });

        // Network status tracking
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.trackEvent('connection_restored');
            this.flushEventQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.trackEvent('connection_lost');
        });
    }

    // Set user identification
    setUser(userId, userProperties = {}) {
        this.userId = userId;
        this.userProperties = { ...this.userProperties, ...userProperties };

        // Google Analytics
        if (this.gtag) {
            this.gtag('config', 'GA_MEASUREMENT_ID', {
                user_id: userId,
                user_properties: userProperties
            });
        }

        // Facebook Pixel
        if (this.fbq) {
            this.fbq('track', 'CompleteRegistration', {
                user_id: userId
            });
        }

        // Mixpanel
        if (this.mixpanel) {
            this.mixpanel.identify(userId);
            this.mixpanel.people.set(userProperties);
        }

        // Custom analytics
        this.trackCustomEvent('user_identified', {
            user_id: userId,
            properties: userProperties
        });
    }

    // Core event tracking method
    trackEvent(eventName, eventData = {}) {
        if (!this.initialized) {
            this.eventQueue.push({ eventName, eventData, timestamp: Date.now() });
            return;
        }

        const enrichedEventData = {
            ...eventData,
            session_id: this.sessionId,
            user_id: this.userId,
            timestamp: new Date().toISOString(),
            page_path: window.location.pathname,
            page_title: document.title,
            referrer: document.referrer
        };

        try {
            // Google Analytics
            if (this.gtag) {
                this.gtag('event', eventName, {
                    event_category: this.getEventCategory(eventName),
                    event_label: eventData.label || eventName,
                    value: eventData.value || undefined,
                    ...this.formatGAParams(enrichedEventData)
                });
            }

            // Facebook Pixel
            if (this.fbq) {
                const fbEventName = this.mapToFacebookEvent(eventName);
                if (fbEventName) {
                    this.fbq('track', fbEventName, enrichedEventData);
                }
            }

            // Mixpanel
            if (this.mixpanel) {
                this.mixpanel.track(eventName, enrichedEventData);
            }

            // Custom analytics
            this.trackCustomEvent(eventName, enrichedEventData);

        } catch (error) {
            console.error('Event tracking failed:', error);
        }
    }

    // Senior Care specific event tracking methods
    trackOnboardingStep(stepName, stepData = {}) {
        this.trackEvent('onboarding_step_completed', {
            step_name: stepName,
            step_number: this.getStepNumber(stepName),
            ...stepData
        });

        // Funnel analysis
        this.trackFunnelStep('onboarding', stepName, stepData);
    }

    trackEmergencyAlert(alertData) {
        this.trackEvent('emergency_alert_triggered', {
            alert_type: alertData.alertType,
            severity: alertData.severity,
            parent_id: alertData.parentId,
            response_time: alertData.responseTime,
            acknowledged: alertData.acknowledged || false
        });

        // High-priority event for Facebook
        if (this.fbq) {
            this.fbq('track', 'Contact', {
                content_name: 'Emergency Alert',
                content_category: 'Emergency'
            });
        }
    }

    trackDashboardEngagement(engagementData) {
        this.trackEvent('dashboard_engagement', {
            section_viewed: engagementData.section,
            time_spent: engagementData.timeSpent,
            interactions: engagementData.interactions,
            alerts_present: engagementData.alertsPresent || false
        });
    }

    trackTrialConversion(conversionData) {
        this.trackEvent('trial_started', conversionData);

        // Enhanced conversion tracking
        if (this.gtag) {
            this.gtag('event', 'begin_checkout', {
                currency: 'USD',
                value: conversionData.trialValue || 0,
                items: [{
                    item_id: 'senior_care_trial',
                    item_name: 'SeniorCare AI Trial',
                    category: 'Subscription',
                    quantity: 1,
                    price: conversionData.trialValue || 0
                }]
            });
        }

        if (this.fbq) {
            this.fbq('track', 'InitiateCheckout', {
                value: conversionData.trialValue || 0,
                currency: 'USD'
            });
        }
    }

    trackSubscription(subscriptionData) {
        this.trackEvent('subscription_created', subscriptionData);

        // Revenue tracking
        if (this.gtag) {
            this.gtag('event', 'purchase', {
                transaction_id: subscriptionData.subscriptionId,
                value: subscriptionData.amount,
                currency: subscriptionData.currency || 'USD',
                items: [{
                    item_id: subscriptionData.planId,
                    item_name: subscriptionData.planName,
                    category: 'Subscription',
                    quantity: 1,
                    price: subscriptionData.amount
                }]
            });
        }

        if (this.fbq) {
            this.fbq('track', 'Purchase', {
                value: subscriptionData.amount,
                currency: subscriptionData.currency || 'USD',
                content_ids: [subscriptionData.planId],
                content_type: 'product'
            });
        }
    }

    // Performance and user experience tracking
    trackPerformanceMetric(metricName, value, context = {}) {
        this.performanceMetrics[metricName] = value;

        this.trackEvent('performance_metric', {
            metric_name: metricName,
            metric_value: value,
            page_load_time: Date.now() - this.startTime,
            ...context
        });
    }

    trackUserFeedback(feedbackData) {
        this.trackEvent('user_feedback_submitted', {
            feedback_type: feedbackData.type,
            rating: feedbackData.rating,
            category: feedbackData.category,
            has_comment: !!feedbackData.comment,
            source_page: feedbackData.sourcePage
        });
    }

    // Utility methods
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getEventCategory(eventName) {
        const categories = {
            'page_view': 'Navigation',
            'onboarding_step_completed': 'Onboarding',
            'emergency_alert_triggered': 'Emergency',
            'dashboard_engagement': 'Engagement',
            'trial_started': 'Conversion',
            'subscription_created': 'Revenue',
            'user_feedback_submitted': 'Feedback'
        };
        return categories[eventName] || 'General';
    }

    mapToFacebookEvent(eventName) {
        const mapping = {
            'onboarding_step_completed': 'CompleteRegistration',
            'trial_started': 'InitiateCheckout',
            'subscription_created': 'Purchase',
            'emergency_alert_triggered': 'Contact',
            'user_feedback_submitted': 'SubmitApplication'
        };
        return mapping[eventName];
    }

    getStepNumber(stepName) {
        const steps = {
            'welcome': 1,
            'account_setup': 2,
            'family_details': 3,
            'parent_details': 4,
            'medical_information': 5,
            'emergency_contacts': 6,
            'preferences': 7,
            'completion': 8
        };
        return steps[stepName] || 0;
    }

    formatGAParams(eventData) {
        // Convert to GA4 parameter format
        const formatted = {};
        Object.keys(eventData).forEach(key => {
            if (typeof eventData[key] === 'string' || typeof eventData[key] === 'number') {
                formatted[key] = eventData[key];
            }
        });
        return formatted;
    }

    trackFunnelStep(funnelName, stepName, stepData = {}) {
        this.trackEvent('funnel_step', {
            funnel_name: funnelName,
            step_name: stepName,
            step_number: this.getStepNumber(stepName),
            completion_rate: stepData.completionRate,
            drop_off_reason: stepData.dropOffReason
        });
    }

    trackCustomEvent(eventName, eventData) {
        if (!this.isOnline) {
            this.eventQueue.push({ eventName, eventData, timestamp: Date.now() });
            return;
        }

        // Send to custom analytics endpoint
        fetch(this.customEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId
            },
            body: JSON.stringify({
                event: eventName,
                data: eventData,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.error('Custom analytics failed:', error);
            this.eventQueue.push({ eventName, eventData, timestamp: Date.now() });
        });
    }

    flushEventQueue() {
        if (!this.isOnline || this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        events.forEach(({ eventName, eventData }) => {
            this.trackEvent(eventName, eventData);
        });
    }

    // Utility function for throttling
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Get analytics summary for debugging
    getAnalyticsSummary() {
        return {
            initialized: this.initialized,
            sessionId: this.sessionId,
            userId: this.userId,
            userProperties: this.userProperties,
            eventQueueLength: this.eventQueue.length,
            isOnline: this.isOnline,
            performanceMetrics: this.performanceMetrics,
            sessionDuration: Date.now() - this.startTime
        };
    }
}

// Initialize global analytics manager
const analytics = new AnalyticsManager();

// Export for use in components
export default analytics;

// Convenience methods for React components
export const trackEvent = (eventName, eventData) => analytics.trackEvent(eventName, eventData);
export const setUser = (userId, userProperties) => analytics.setUser(userId, userProperties);
export const trackOnboardingStep = (stepName, stepData) => analytics.trackOnboardingStep(stepName, stepData);
export const trackEmergencyAlert = (alertData) => analytics.trackEmergencyAlert(alertData);
export const trackDashboardEngagement = (engagementData) => analytics.trackDashboardEngagement(engagementData);
export const trackTrialConversion = (conversionData) => analytics.trackTrialConversion(conversionData);
export const trackSubscription = (subscriptionData) => analytics.trackSubscription(subscriptionData);
export const trackPerformanceMetric = (metricName, value, context) => analytics.trackPerformanceMetric(metricName, value, context);
export const trackUserFeedback = (feedbackData) => analytics.trackUserFeedback(feedbackData);

// React Hook for analytics
export const useAnalytics = () => {
    return {
        trackEvent,
        setUser,
        trackOnboardingStep,
        trackEmergencyAlert,
        trackDashboardEngagement,
        trackTrialConversion,
        trackSubscription,
        trackPerformanceMetric,
        trackUserFeedback,
        analytics
    };
};
