// Enhanced SeniorCare AI Landing Page with Comprehensive Analytics
// Tracks user engagement, conversion funnel, and product-market fit metrics

document.addEventListener('DOMContentLoaded', function () {
    // Initialize existing functionality
    initializeNavigation();
    initializePricing();
    initializeAnimations();
    initializeCounters();
    initializeTestimonialCarousel();
    initializeForm();

    // Initialize comprehensive analytics
    initializeAnalytics();
});

// Analytics initialization and tracking
function initializeAnalytics() {
    // Analytics helper functions
    const analytics = window.seniorCareAnalytics || {
        track: function (eventName, data) {
            console.log('Analytics:', eventName, data);
        }
    };

    // Track initial page view with visitor classification
    const classifyVisitor = () => {
        const referrer = document.referrer.toLowerCase();
        const url = window.location.href.toLowerCase();

        let visitorType = 'direct';
        let traffic_source = 'direct';

        if (referrer.includes('google')) {
            traffic_source = 'google_search';
            visitorType = 'search';
        } else if (referrer.includes('facebook') || referrer.includes('fb')) {
            traffic_source = 'facebook';
            visitorType = 'social';
        } else if (referrer.includes('linkedin')) {
            traffic_source = 'linkedin';
            visitorType = 'social';
        } else if (url.includes('utm_source')) {
            const urlParams = new URLSearchParams(window.location.search);
            traffic_source = urlParams.get('utm_source') || 'campaign';
            visitorType = 'campaign';
        } else if (referrer) {
            traffic_source = 'referral';
            visitorType = 'referral';
        }

        return { visitorType, traffic_source };
    };

    const visitorData = classifyVisitor();
    analytics.track('landing_page_view', {
        ...visitorData,
        page_title: document.title,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        device_type: window.innerWidth > 768 ? 'desktop' : 'mobile',
        fbEvent: 'ViewContent'
    });

    // Enhanced scroll depth tracking
    let maxScrollDepth = 0;
    let scrollMilestones = [25, 50, 75, 90, 100];
    let reachedMilestones = new Set();

    const trackScrollDepth = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;

            // Track milestone achievements
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !reachedMilestones.has(milestone)) {
                    reachedMilestones.add(milestone);
                    analytics.track('scroll_depth', {
                        depth_percentage: milestone,
                        visitor_type: visitorData.visitorType,
                        time_to_scroll: Date.now() - analytics.startTime
                    });
                }
            });
        }
    };

    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(trackScrollDepth, 100);
    });

    // Enhanced CTA tracking with context
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .btn, .cta-button, a[href*="trial"], a[href*="demo"], a[href*="contact"]');
        if (target) {
            const ctaText = target.textContent.toLowerCase().trim();
            const sectionContext = target.closest('section')?.id || target.closest('.section')?.className || 'unknown';

            let ctaType = 'generic_button';
            if (ctaText.includes('free trial') || ctaText.includes('get started') || ctaText.includes('start now')) {
                ctaType = 'start_free_trial';
            } else if (ctaText.includes('demo') || ctaText.includes('schedule')) {
                ctaType = 'schedule_demo';
            } else if (ctaText.includes('learn more')) {
                ctaType = 'learn_more';
            } else if (ctaText.includes('contact')) {
                ctaType = 'contact_us';
            }

            analytics.track('cta_clicked', {
                cta_type: ctaType,
                cta_text: target.textContent.trim(),
                section_context: sectionContext,
                visitor_type: visitorData.visitorType,
                time_on_page: Date.now() - analytics.startTime,
                scroll_depth: maxScrollDepth,
                fbEvent: 'InitiateCheckout'
            });

            // Facebook tracking for high-intent actions
            if (window.fbq && ctaType === 'start_free_trial') {
                fbq('track', 'StartTrial', {
                    content_name: 'SeniorCare AI Free Trial',
                    value: 0,
                    currency: 'USD'
                });
            }
        }
    });

    console.log('SeniorCare AI Analytics initialized');
    console.log('Visitor classification:', visitorData);
}

// Currency toggle functionality
function showINR() {
    document.querySelector('.price-inr').style.display = 'inline';
    document.querySelector('.price-usd').style.display = 'none';
    document.querySelectorAll('.currency-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.currency-btn:first-child').classList.add('active');
}

function showUSD() {
    document.querySelector('.price-inr').style.display = 'none';
    document.querySelector('.price-usd').style.display = 'inline';
    document.querySelectorAll('.currency-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.currency-btn:last-child').classList.add('active');
}

// Modal functionality
function openEarlyAccess() {
    const modal = document.getElementById('early-access-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Track conversion event
    trackEvent('early_access_opened', {
        source: 'landing_page',
        timestamp: new Date().toISOString()
    });
}

function closeEarlyAccess() {
    const modal = document.getElementById('early-access-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('early-access-modal');
    if (event.target === modal) {
        closeEarlyAccess();
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.early-access-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            handleFormSubmission(this);
        });
    }
});

function handleFormSubmission(form) {
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    // Collect form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name') || form.querySelector('input[type="text"]').value,
        email: formData.get('email') || form.querySelector('input[type="email"]').value,
        phone: formData.get('phone') || form.querySelector('input[type="tel"]').value,
        country: formData.get('country') || form.querySelector('select:nth-of-type(1)').value,
        parentLocation: formData.get('parentLocation') || form.querySelector('select:nth-of-type(2)').value,
        consultationTime: formData.get('consultationTime') || form.querySelector('select:nth-of-type(3)').value,
        timestamp: new Date().toISOString(),
        source: 'landing_page_modal'
    };

    // Simulate API call (replace with actual endpoint)
    setTimeout(() => {
        // Mock successful submission
        console.log('Form submitted:', data);

        // Track conversion
        trackEvent('form_submitted', data);

        // Show success message
        showSuccessMessage(form);

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        // Close modal after 2 seconds
        setTimeout(() => {
            closeEarlyAccess();
            form.reset();
        }, 2000);

    }, 1500);
}

function showSuccessMessage(form) {
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
        <div style="background: #D4EDDA; color: #155724; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <i class="fas fa-check-circle"></i>
            <strong>Thank you!</strong> We'll contact you within 24 hours to schedule your free consultation.
        </div>
    `;
    form.insertBefore(successDiv, form.firstChild);
}

// Scroll to demo functionality
function scrollToDemo() {
    const howItWorksSection = document.querySelector('#how-it-works');
    if (howItWorksSection) {
        howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }

    trackEvent('demo_scroll_clicked', {
        section: 'hero',
        timestamp: new Date().toISOString()
    });
}

// Schedule consultation
function scheduleConsultation() {
    // Track event
    trackEvent('schedule_consultation_clicked', {
        source: 'cta_section',
        timestamp: new Date().toISOString()
    });

    // Open calendar scheduling (mock)
    alert('Calendar scheduling will open here. For now, please click "Start Free Trial" to get started.');
    openEarlyAccess();
}

// Animation and scroll effects
function initializeAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.benefit-card, .step, .testimonial-card').forEach(el => {
        observer.observe(el);
    });
}

// Counter animation for stats
function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number, .proof-metric');

    const animateCounter = (counter) => {
        const target = counter.textContent;
        const numericValue = parseFloat(target.replace(/[^\d.]/g, ''));

        if (!isNaN(numericValue) && numericValue > 0) {
            let current = 0;
            const increment = numericValue / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                    current = numericValue;
                    clearInterval(timer);
                }

                if (target.includes('%')) {
                    counter.textContent = current.toFixed(1) + '%';
                } else if (target.includes('min')) {
                    counter.textContent = '<' + Math.ceil(current) + ' min';
                } else {
                    counter.textContent = current.toFixed(1);
                }
            }, 50);
        }
    };

    // Animate counters when they come into view
    const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Testimonial carousel (basic functionality)
function initializeTestimonialCarousel() {
    // Add any testimonial rotation logic here if needed
    // For now, testimonials are static
}

// Analytics and tracking
function trackEvent(eventName, eventData) {
    // Integration with analytics platforms
    console.log('Event tracked:', eventName, eventData);

    // Google Analytics 4 example
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }

    // Facebook Pixel example
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, eventData);
    }

    // Custom analytics endpoint
    // fetch('/api/analytics/track', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ event: eventName, data: eventData })
    // });
}

// Phone mock-up interactions
document.addEventListener('DOMContentLoaded', function () {
    const quickCallBtn = document.querySelector('.quick-call');
    if (quickCallBtn) {
        quickCallBtn.addEventListener('click', function () {
            // Simulate video call initiation
            this.innerHTML = '<i class="fas fa-video"></i> Connecting...';
            this.style.background = '#FF9800';

            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-video"></i> In Call (2:34)';
                this.style.background = '#4CAF50';

                // Add some visual feedback to show "in call"
                const statusBar = document.querySelector('.status-bar');
                if (statusBar) {
                    statusBar.innerHTML = '<span class="status-healthy">📹 Video call active</span><span class="time">In call: 2:34</span>';
                }
            }, 2000);

            trackEvent('demo_video_call_clicked', {
                source: 'phone_mockup',
                timestamp: new Date().toISOString()
            });
        });
    }
});

// Floating alerts animation
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.floating-alerts .alert');

    // Cycle through alerts
    let currentAlert = 0;
    setInterval(() => {
        if (alerts.length > 0) {
            alerts.forEach(alert => alert.style.opacity = '0.3');
            alerts[currentAlert].style.opacity = '1';
            alerts[currentAlert].style.transform = 'scale(1.05)';

            setTimeout(() => {
                alerts[currentAlert].style.transform = 'scale(1)';
            }, 300);

            currentAlert = (currentAlert + 1) % alerts.length;
        }
    }, 3000);
});

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#F56565';
            field.addEventListener('input', function () {
                this.style.borderColor = '#E2E8F0';
            }, { once: true });
        }
    });

    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
            isValid = false;
            emailField.style.borderColor = '#F56565';
        }
    }

    // Phone validation
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value) {
        const phonePattern = /^[\+]?[1-9][\d]{7,14}$/;
        if (!phonePattern.test(phoneField.value.replace(/[\s\-\(\)]/g, ''))) {
            isValid = false;
            phoneField.style.borderColor = '#F56565';
        }
    }

    return isValid;
}

// Lazy loading for images (if needed)
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Performance monitoring
function monitorPerformance() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
        // Implementation would go here
    }

    // Track page load time
    window.addEventListener('load', function () {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        trackEvent('page_load_time', {
            loadTime: loadTime,
            page: 'landing_page'
        });
    });
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', monitorPerformance);

// Error handling
window.addEventListener('error', function (e) {
    console.error('JavaScript error:', e.error);
    trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Service worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(function (registration) {
            console.log('ServiceWorker registration successful');
        }, function (err) {
            console.log('ServiceWorker registration failed');
        });
    });
}
