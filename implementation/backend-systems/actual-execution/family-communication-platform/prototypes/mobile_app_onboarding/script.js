// Enhanced SeniorCare AI Mobile App Onboarding with Analytics

// Global state management
let currentScreen = 'welcome-screen';
let onboardingData = {
    user: {},
    parent: {},
    permissions: {},
    preferences: {}
};

// Screen flow configuration
const screenFlow = [
    'welcome-screen',
    'signup-screen',
    'connect-parent-screen',
    'permissions-screen',
    'complete-screen'
];

// Analytics helper
const trackOnboardingEvent = (eventName, eventData = {}) => {
    if (window.mobileOnboardingAnalytics) {
        window.mobileOnboardingAnalytics.track(eventName, {
            ...eventData,
            screen: currentScreen,
            onboarding_data: Object.keys(onboardingData.user).length
        });
    }
    console.log(`Analytics: ${eventName}`, eventData);
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    trackOnboardingEvent('onboarding_started', {
        timestamp: new Date().toISOString(),
        device_type: 'mobile',
        screen_size: `${window.innerWidth}x${window.innerHeight}`
    });
});

// Initialize the application
function initializeApp() {
    // Show welcome screen by default
    showScreen('welcome-screen');
    updateNavigationDots();

    // Initialize form validation
    initializeFormValidation();

    // Setup permission toggles
    initializePermissionToggles();

    // Setup country/phone number formatting
    initializePhoneFormatting();

    // Track welcome screen view
    trackOnboardingEvent('welcome_screen_viewed');

    console.log('SeniorCare AI Onboarding initialized');
}

// Setup all event listeners
function setupEventListeners() {
    // Handle back button navigation
    document.addEventListener('click', function (e) {
        if (e.target.matches('.back-btn') || e.target.closest('.back-btn')) {
            handleBackNavigation();
        }
    });

    // Handle form submissions
    document.addEventListener('submit', function (e) {
        e.preventDefault();
        handleFormSubmission(e.target);
    });

    // Handle permission toggles
    document.addEventListener('change', function (e) {
        if (e.target.matches('.permission-toggle input')) {
            handlePermissionToggle(e.target);
        }
    });

    // Handle phone number formatting
    document.addEventListener('input', function (e) {
        if (e.target.matches('input[type="tel"]')) {
            formatPhoneNumber(e.target);
        }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.matches('.btn-primary')) {
            e.target.click();
        }
    });
}

// Screen navigation functions
function showScreen(screenId) {
    // Hide current screen
    const currentScreenElement = document.querySelector('.screen.active');
    if (currentScreenElement) {
        currentScreenElement.classList.remove('active');
        currentScreenElement.classList.add('prev');

        // Remove prev class after animation
        setTimeout(() => {
            currentScreenElement.classList.remove('prev');
        }, 300);
    }

    // Show new screen
    const newScreen = document.getElementById(screenId);
    if (newScreen) {
        newScreen.classList.add('active');
        currentScreen = screenId;
        updateNavigationDots();
        updateProgressBar();

        // Track screen view
        trackEvent('screen_viewed', {
            screen: screenId,
            timestamp: new Date().toISOString()
        });

        // Trigger screen-specific initialization
        initializeScreenSpecific(screenId);
    }
}

function nextScreen() {
    const currentIndex = screenFlow.indexOf(currentScreen);

    // Validate current screen before proceeding
    if (!validateCurrentScreen()) {
        return;
    }

    // Save current screen data
    saveCurrentScreenData();

    if (currentIndex < screenFlow.length - 1) {
        const nextScreenId = screenFlow[currentIndex + 1];
        showScreen(nextScreenId);

        trackEvent('screen_advanced', {
            from: currentScreen,
            to: nextScreenId,
            method: 'next_button'
        });
    }
}

function handleBackNavigation() {
    const currentIndex = screenFlow.indexOf(currentScreen);

    if (currentIndex > 0) {
        const previousScreenId = screenFlow[currentIndex - 1];
        showScreen(previousScreenId);

        trackEvent('screen_back', {
            from: currentScreen,
            to: previousScreenId
        });
    }
}

// Update navigation dots
function updateNavigationDots() {
    const dots = document.querySelectorAll('.navigation-dots .dot');
    const currentIndex = screenFlow.indexOf(currentScreen);

    dots.forEach((dot, index) => {
        if (index === currentIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Update progress bar
function updateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const currentIndex = screenFlow.indexOf(currentScreen);

    if (progressFill && progressText) {
        const progress = ((currentIndex + 1) / screenFlow.length) * 100;
        progressFill.style.width = `${progress}%`;

        if (currentIndex === screenFlow.length - 1) {
            progressText.textContent = 'Setup Complete!';
        } else {
            progressText.textContent = `Step ${currentIndex + 1} of ${screenFlow.length}`;
        }
    }
}

// Screen-specific initialization
function initializeScreenSpecific(screenId) {
    switch (screenId) {
        case 'welcome-screen':
            animateWelcomeElements();
            break;
        case 'signup-screen':
            focusFirstInput();
            break;
        case 'connect-parent-screen':
            initializeLocationData();
            break;
        case 'permissions-screen':
            initializePermissionExplanations();
            break;
        case 'complete-screen':
            initializeCompletionAnimations();
            showOnboardingSummary();
            break;
    }
}

// Form validation
function validateCurrentScreen() {
    const currentScreenElement = document.getElementById(currentScreen);
    const form = currentScreenElement.querySelector('form');

    if (!form) return true; // No form to validate

    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    // Screen-specific validation
    switch (currentScreen) {
        case 'signup-screen':
            isValid = validateSignupForm(form) && isValid;
            break;
        case 'connect-parent-screen':
            isValid = validateParentForm(form) && isValid;
            break;
    }

    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;

    // Clear previous error state
    clearFieldError(field);

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        isValid = false;
    }

    // Type-specific validation
    if (value) {
        switch (field.type) {
            case 'email':
                if (!isValidEmail(value)) {
                    showFieldError(field, 'Please enter a valid email address');
                    isValid = false;
                }
                break;
            case 'tel':
                if (!isValidPhone(value)) {
                    showFieldError(field, 'Please enter a valid phone number');
                    isValid = false;
                }
                break;
        }
    }

    return isValid;
}

function validateSignupForm(form) {
    const password = form.querySelector('#password');
    const confirmPassword = form.querySelector('#confirmPassword');
    const termsCheckbox = form.querySelector('#terms');

    let isValid = true;

    // Password validation (if password fields exist)
    if (password && password.value) {
        if (password.value.length < 8) {
            showFieldError(password, 'Password must be at least 8 characters');
            isValid = false;
        }
    }

    // Confirm password validation
    if (confirmPassword && password && confirmPassword.value !== password.value) {
        showFieldError(confirmPassword, 'Passwords do not match');
        isValid = false;
    }

    // Terms acceptance validation
    if (termsCheckbox && !termsCheckbox.checked) {
        showFieldError(termsCheckbox, 'You must accept the terms and privacy policy');
        isValid = false;
    }

    return isValid;
}

function validateParentForm(form) {
    const parentPhone = form.querySelector('#parentPhone');
    const contactMethod = form.querySelector('input[name="contactMethod"]:checked');

    let isValid = true;

    // Ensure contact method is selected
    if (!contactMethod) {
        showFormError(form, 'Please select a contact method');
        isValid = false;
    }

    return isValid;
}

// Field error handling
function showFieldError(field, message) {
    field.style.borderColor = '#f56565';

    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#f56565';
    errorDiv.style.fontSize = '12px';
    errorDiv.style.marginTop = '4px';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.style.borderColor = '#e0e0e0';

    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function showFormError(form, message) {
    // Show general form error
    let errorContainer = form.querySelector('.form-error');

    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'form-error';
        errorContainer.style.background = '#fed7d7';
        errorContainer.style.color = '#c53030';
        errorContainer.style.padding = '12px';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.marginBottom = '16px';
        errorContainer.style.fontSize = '14px';

        form.insertBefore(errorContainer, form.firstChild);
    }

    errorContainer.textContent = message;
}

// Validation helpers
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Data management
function saveCurrentScreenData() {
    const form = document.querySelector(`#${currentScreen} form`);
    if (!form) return;

    const formData = new FormData(form);

    switch (currentScreen) {
        case 'signup-screen':
            onboardingData.user = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                termsAccepted: formData.get('terms') === 'on'
            };
            break;
        case 'connect-parent-screen':
            onboardingData.parent = {
                name: formData.get('parentName'),
                phone: formData.get('parentPhone'),
                location: formData.get('parentLocation'),
                contactMethod: formData.get('contactMethod')
            };
            break;
    }

    // Save to localStorage for persistence
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData));
}

// Permission handling
function initializePermissionToggles() {
    const toggles = document.querySelectorAll('.permission-toggle .switch input');

    toggles.forEach(toggle => {
        toggle.addEventListener('change', function () {
            const status = this.closest('.permission-toggle').querySelector('.toggle-status');
            if (status) {
                status.textContent = this.checked ? 'Enabled' : 'Disabled';
            }
        });
    });
}

function handlePermissionToggle(toggle) {
    const permissionItem = toggle.closest('.permission-item');
    const permissionName = permissionItem.querySelector('h5').textContent.toLowerCase();

    onboardingData.permissions[permissionName] = toggle.checked;

    trackEvent('permission_toggled', {
        permission: permissionName,
        enabled: toggle.checked,
        timestamp: new Date().toISOString()
    });

    // Provide feedback for critical permissions
    if (['notifications', 'microphone'].includes(permissionName) && !toggle.checked) {
        showPermissionWarning(permissionName);
    }
}

function showPermissionWarning(permissionName) {
    const warning = document.createElement('div');
    warning.className = 'permission-warning';
    warning.style.background = '#fff3cd';
    warning.style.color = '#856404';
    warning.style.border = '1px solid #ffeaa7';
    warning.style.borderRadius = '8px';
    warning.style.padding = '12px';
    warning.style.margin = '16px 0';
    warning.style.fontSize = '14px';

    const messages = {
        'notifications': 'Without notifications, you may miss important emergency alerts from your parent.',
        'microphone': 'Voice calls will not be available without microphone access.'
    };

    warning.textContent = `⚠️ ${messages[permissionName]}`;

    const permissionsContent = document.querySelector('.permissions-content');
    const existingWarning = permissionsContent.querySelector('.permission-warning');

    if (existingWarning) {
        existingWarning.remove();
    }

    permissionsContent.appendChild(warning);

    // Auto-remove warning after 5 seconds
    setTimeout(() => warning.remove(), 5000);
}

// Phone number formatting
function initializePhoneFormatting() {
    // Auto-format phone numbers as user types
    const phoneInputs = document.querySelectorAll('input[type="tel"]');

    phoneInputs.forEach(input => {
        input.addEventListener('input', function () {
            formatPhoneNumber(this);
        });
    });
}

function formatPhoneNumber(input) {
    // Remove all non-numeric characters
    let value = input.value.replace(/\D/g, '');

    // Format based on length (US format as example)
    if (value.length >= 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length >= 3) {
        value = value.replace(/(\d{3})(\d{3})/, '$1-$2');
    }

    input.value = value;
}

// Animation functions
function animateWelcomeElements() {
    const elements = document.querySelectorAll('.welcome-content > *');

    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';

        setTimeout(() => {
            el.style.transition = 'all 0.6s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function focusFirstInput() {
    const firstInput = document.querySelector(`#${currentScreen} input:not([type="hidden"])`);
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }
}

function initializeLocationData() {
    // Pre-populate location data if available from geolocation
    if (navigator.geolocation && !onboardingData.user.location) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Could use reverse geocoding here to set location
                console.log('Location detected:', position.coords);
            },
            (error) => {
                console.log('Location detection failed:', error);
            }
        );
    }
}

function initializePermissionExplanations() {
    // Add interactive explanations for each permission
    const permissionItems = document.querySelectorAll('.permission-item');

    permissionItems.forEach(item => {
        const icon = item.querySelector('.permission-icon');
        const details = item.querySelector('.permission-details');

        icon.addEventListener('click', function () {
            // Toggle expanded explanation
            const expanded = details.querySelector('.expanded-explanation');

            if (expanded) {
                expanded.remove();
            } else {
                showExpandedPermissionExplanation(details, icon);
            }
        });
    });
}

function showExpandedPermissionExplanation(details, icon) {
    const permissionName = details.querySelector('h5').textContent.toLowerCase();

    const explanations = {
        'notifications': 'Push notifications will alert you immediately when your parent needs help, when medication reminders are due, or during routine check-ins.',
        'microphone': 'Voice calls allow you to speak with your parent directly through the app, and enable voice-activated emergency commands.',
        'camera': 'Video calls provide visual confirmation of your parent\'s wellbeing and allow healthcare providers to conduct remote consultations.',
        'location': 'Location services help emergency responders find your parent quickly and suggest the nearest hospitals or pharmacies.',
        'contacts': 'Contact access allows the app to quickly reach family members and emergency contacts during critical situations.'
    };

    const expandedDiv = document.createElement('div');
    expandedDiv.className = 'expanded-explanation';
    expandedDiv.style.background = '#f8f9ff';
    expandedDiv.style.padding = '12px';
    expandedDiv.style.borderRadius = '8px';
    expandedDiv.style.marginTop = '8px';
    expandedDiv.style.fontSize = '13px';
    expandedDiv.style.lineHeight = '1.4';
    expandedDiv.style.color = '#4a5568';
    expandedDiv.textContent = explanations[permissionName] || 'This permission enhances your parent\'s safety and your peace of mind.';

    details.appendChild(expandedDiv);
}

function initializeCompletionAnimations() {
    // Animate success elements
    setTimeout(() => {
        const successIcon = document.querySelector('.success-icon');
        const particles = document.querySelectorAll('.particle');

        if (successIcon) {
            successIcon.style.animation = 'successPulse 2s ease-in-out infinite';
        }

        particles.forEach((particle, index) => {
            particle.style.animationDelay = `${index * 0.5}s`;
        });
    }, 500);
}

function showOnboardingSummary() {
    // Display summary of user selections
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'onboarding-summary';
    summaryContainer.style.background = '#f8f9ff';
    summaryContainer.style.padding = '16px';
    summaryContainer.style.borderRadius = '12px';
    summaryContainer.style.margin = '20px 0';
    summaryContainer.style.fontSize = '14px';

    const summaryHTML = `
        <h5 style="margin-bottom: 12px; color: #333;">Setup Summary:</h5>
        <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;">👤 Account: ${onboardingData.user?.fullName || 'Set up'}</li>
            <li style="margin-bottom: 8px;">👥 Parent: ${onboardingData.parent?.name || 'Connected'}</li>
            <li style="margin-bottom: 8px;">🔔 Permissions: ${Object.values(onboardingData.permissions).filter(p => p).length} enabled</li>
            <li>📱 Device: Ready for monitoring</li>
        </ul>
    `;

    summaryContainer.innerHTML = summaryHTML;

    const completeContent = document.querySelector('.complete-content');
    const nextSteps = completeContent.querySelector('.next-steps');

    if (nextSteps) {
        completeContent.insertBefore(summaryContainer, nextSteps);
    }
}

// Action handlers
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

function showDashboard() {
    // Simulate navigation to main app dashboard
    trackEvent('onboarding_completed', {
        completion_time: Date.now(),
        user_data: onboardingData,
        timestamp: new Date().toISOString()
    });

    // In a real app, this would navigate to the dashboard
    alert('🎉 Onboarding complete! Redirecting to your dashboard...');

    // Could implement actual navigation here
    // window.location.href = '/dashboard';
}

function scheduleCall() {
    trackEvent('setup_call_requested', {
        user_data: onboardingData,
        timestamp: new Date().toISOString()
    });

    // In a real app, this would open a calendar booking widget
    alert('📞 Our team will call you within 24 hours to schedule the home setup visit!');
}

// Handle form submission
function handleFormSubmission(form) {
    if (validateCurrentScreen()) {
        saveCurrentScreenData();
        nextScreen();
    }
}

// Analytics and tracking
function trackEvent(eventName, eventData) {
    // Log to console for debugging
    console.log('Event tracked:', eventName, eventData);

    // In production, send to analytics service
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventData);
    }

    // Store in localStorage for demo purposes
    const events = JSON.parse(localStorage.getItem('onboardingEvents') || '[]');
    events.push({ name: eventName, data: eventData, timestamp: new Date().toISOString() });
    localStorage.setItem('onboardingEvents', JSON.stringify(events));
}

// Utility functions
function debounce(func, wait) {
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

// Error handling
window.addEventListener('error', function (e) {
    console.error('JavaScript error in onboarding:', e.error);
    trackEvent('onboarding_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        screen: currentScreen
    });
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showScreen,
        nextScreen,
        validateCurrentScreen,
        isValidEmail,
        isValidPhone,
        trackEvent
    };
}
