// Multi-Step Customer Onboarding React Component
// HIPAA-compliant data collection with secure Supabase storage

import React, { useState, useEffect } from 'react';
import { onboardingService, authService } from '../src/services/supabaseService';
import { apiUtils } from '../src/api/apiClient';
import './OnboardingFlow.css';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to SeniorCare AI',
        description: 'Let\'s set up your family\'s care monitoring system',
        component: 'WelcomeStep'
    },
    {
        id: 'account_setup',
        title: 'Account Setup',
        description: 'Create your secure account',
        component: 'AccountSetupStep'
    },
    {
        id: 'family_details',
        title: 'Family Information',
        description: 'Tell us about your family',
        component: 'FamilyDetailsStep'
    },
    {
        id: 'parent_details',
        title: 'Parent Information',
        description: 'Provide your parent\'s details for monitoring',
        component: 'ParentDetailsStep'
    },
    {
        id: 'medical_information',
        title: 'Medical Information',
        description: 'Share relevant medical history (HIPAA protected)',
        component: 'MedicalInformationStep'
    },
    {
        id: 'emergency_contacts',
        title: 'Emergency Contacts',
        description: 'Set up your emergency notification network',
        component: 'EmergencyContactsStep'
    },
    {
        id: 'preferences',
        title: 'Preferences',
        description: 'Customize your monitoring and notification settings',
        component: 'PreferencesStep'
    },
    {
        id: 'completion',
        title: 'Setup Complete!',
        description: 'Your SeniorCare AI system is ready',
        component: 'CompletionStep'
    }
];

// Progress indicator component
const ProgressIndicator = ({ currentStep, totalSteps }) => {
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="progress-container">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <div className="progress-text">
                Step {currentStep + 1} of {totalSteps}
            </div>
        </div>
    );
};

// Welcome Step Component
const WelcomeStep = ({ onNext }) => (
    <div className="onboarding-step welcome-step">
        <div className="step-icon">👨‍👩‍👧‍👦</div>
        <h2>Welcome to SeniorCare AI</h2>
        <p>
            We help NRI families stay connected with their parents in India through
            AI-powered monitoring and emergency response systems.
        </p>
        <div className="benefits-list">
            <div className="benefit-item">
                <span className="benefit-icon">🔒</span>
                <span>HIPAA Compliant & Secure</span>
            </div>
            <div className="benefit-item">
                <span className="benefit-icon">🚨</span>
                <span>24/7 Emergency Monitoring</span>
            </div>
            <div className="benefit-item">
                <span className="benefit-icon">📱</span>
                <span>Real-time Family Updates</span>
            </div>
            <div className="benefit-item">
                <span className="benefit-icon">🏥</span>
                <span>Local Healthcare Coordination</span>
            </div>
        </div>
        <button onClick={onNext} className="next-button">
            Get Started
        </button>
    </div>
);

// Account Setup Step Component
const AccountSetupStep = ({ onNext, onBack, data, updateData }) => {
    const [formData, setFormData] = useState({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false,
        hipaaConsent: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
        if (!formData.hipaaConsent) newErrors.hipaaConsent = 'HIPAA consent is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Create user account
            const { user } = await authService.signUp({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
                role: 'family_member'
            });

            // Save account data
            updateData({
                ...formData,
                userId: user.id
            });

            onNext();
        } catch (error) {
            setErrors({ general: apiUtils.formatErrorMessage(error) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-step account-setup-step">
            <h2>Create Your Account</h2>
            <form onSubmit={handleSubmit} className="onboarding-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className={errors.firstName ? 'error' : ''}
                            required
                        />
                        {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className={errors.lastName ? 'error' : ''}
                            required
                        />
                        {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>Email Address *</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'error' : ''}
                        required
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className={errors.phoneNumber ? 'error' : ''}
                        placeholder="+1 (555) 123-4567"
                        required
                    />
                    {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Password *</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={errors.password ? 'error' : ''}
                            required
                        />
                        {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>
                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={errors.confirmPassword ? 'error' : ''}
                            required
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                    </div>
                </div>

                <div className="consent-section">
                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            checked={formData.agreeToTerms}
                            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                        />
                        <label htmlFor="agreeToTerms">
                            I agree to the <a href="/terms" target="_blank">Terms of Service</a> and{' '}
                            <a href="/privacy" target="_blank">Privacy Policy</a>
                        </label>
                        {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
                    </div>

                    <div className="checkbox-group">
                        <input
                            type="checkbox"
                            id="hipaaConsent"
                            checked={formData.hipaaConsent}
                            onChange={(e) => setFormData({ ...formData, hipaaConsent: e.target.checked })}
                        />
                        <label htmlFor="hipaaConsent">
                            I consent to HIPAA-compliant processing of medical information for care coordination
                        </label>
                        {errors.hipaaConsent && <span className="error-text">{errors.hipaaConsent}</span>}
                    </div>
                </div>

                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <div className="button-group">
                    <button type="button" onClick={onBack} className="back-button">
                        Back
                    </button>
                    <button type="submit" disabled={loading} className="next-button">
                        {loading ? 'Creating Account...' : 'Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Family Details Step Component
const FamilyDetailsStep = ({ onNext, onBack, data, updateData }) => {
    const [formData, setFormData] = useState({
        familyName: data.familyName || '',
        relationshipToParent: data.relationshipToParent || '',
        currentLocation: data.currentLocation || '',
        parentLocation: data.parentLocation || '',
        timezoneDifference: data.timezoneDifference || ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.familyName.trim()) newErrors.familyName = 'Family name is required';
        if (!formData.relationshipToParent) newErrors.relationshipToParent = 'Please select relationship';
        if (!formData.currentLocation.trim()) newErrors.currentLocation = 'Current location is required';
        if (!formData.parentLocation.trim()) newErrors.parentLocation = 'Parent location is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Save family details
        try {
            await onboardingService.saveOnboardingStep(data.userId, 'family_details', formData);
            updateData(formData);
            onNext();
        } catch (error) {
            setErrors({ general: 'Failed to save family details. Please try again.' });
        }
    };

    return (
        <div className="onboarding-step family-details-step">
            <h2>Tell Us About Your Family</h2>
            <form onSubmit={handleSubmit} className="onboarding-form">
                <div className="form-group">
                    <label>Family Name *</label>
                    <input
                        type="text"
                        value={formData.familyName}
                        onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                        placeholder="e.g., The Sharma Family"
                        className={errors.familyName ? 'error' : ''}
                        required
                    />
                    {errors.familyName && <span className="error-text">{errors.familyName}</span>}
                </div>

                <div className="form-group">
                    <label>Your Relationship to Parent *</label>
                    <select
                        value={formData.relationshipToParent}
                        onChange={(e) => setFormData({ ...formData, relationshipToParent: e.target.value })}
                        className={errors.relationshipToParent ? 'error' : ''}
                        required
                    >
                        <option value="">Select relationship</option>
                        <option value="son">Son</option>
                        <option value="daughter">Daughter</option>
                        <option value="son-in-law">Son-in-law</option>
                        <option value="daughter-in-law">Daughter-in-law</option>
                        <option value="grandchild">Grandchild</option>
                        <option value="other">Other</option>
                    </select>
                    {errors.relationshipToParent && <span className="error-text">{errors.relationshipToParent}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Your Current Location *</label>
                        <input
                            type="text"
                            value={formData.currentLocation}
                            onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                            placeholder="e.g., San Francisco, USA"
                            className={errors.currentLocation ? 'error' : ''}
                            required
                        />
                        {errors.currentLocation && <span className="error-text">{errors.currentLocation}</span>}
                    </div>

                    <div className="form-group">
                        <label>Parent's Location *</label>
                        <input
                            type="text"
                            value={formData.parentLocation}
                            onChange={(e) => setFormData({ ...formData, parentLocation: e.target.value })}
                            placeholder="e.g., Mumbai, India"
                            className={errors.parentLocation ? 'error' : ''}
                            required
                        />
                        {errors.parentLocation && <span className="error-text">{errors.parentLocation}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>Time Zone Difference (Optional)</label>
                    <select
                        value={formData.timezoneDifference}
                        onChange={(e) => setFormData({ ...formData, timezoneDifference: e.target.value })}
                    >
                        <option value="">Auto-detect</option>
                        <option value="+5:30">India Standard Time (+5:30)</option>
                        <option value="-8:00">Pacific Time (-8:00)</option>
                        <option value="-5:00">Eastern Time (-5:00)</option>
                        <option value="+0:00">GMT (+0:00)</option>
                    </select>
                </div>

                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <div className="button-group">
                    <button type="button" onClick={onBack} className="back-button">
                        Back
                    </button>
                    <button type="submit" className="next-button">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

// Parent Details Step Component  
const ParentDetailsStep = ({ onNext, onBack, data, updateData }) => {
    const [formData, setFormData] = useState({
        parentFirstName: data.parentFirstName || '',
        parentLastName: data.parentLastName || '',
        parentAge: data.parentAge || '',
        parentGender: data.parentGender || '',
        parentLanguages: data.parentLanguages || [],
        livingArrangement: data.livingArrangement || '',
        mobilityLevel: data.mobilityLevel || '',
        techComfort: data.techComfort || ''
    });

    const [errors, setErrors] = useState({});

    const languageOptions = [
        'Hindi', 'English', 'Tamil', 'Telugu', 'Bengali', 'Marathi',
        'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Other'
    ];

    const handleLanguageChange = (language) => {
        const updatedLanguages = formData.parentLanguages.includes(language)
            ? formData.parentLanguages.filter(lang => lang !== language)
            : [...formData.parentLanguages, language];

        setFormData({ ...formData, parentLanguages: updatedLanguages });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.parentFirstName.trim()) newErrors.parentFirstName = 'Parent first name is required';
        if (!formData.parentLastName.trim()) newErrors.parentLastName = 'Parent last name is required';
        if (!formData.parentAge || formData.parentAge < 50 || formData.parentAge > 120) {
            newErrors.parentAge = 'Please enter a valid age (50-120)';
        }
        if (!formData.parentGender) newErrors.parentGender = 'Please select gender';
        if (formData.parentLanguages.length === 0) newErrors.parentLanguages = 'Please select at least one language';
        if (!formData.livingArrangement) newErrors.livingArrangement = 'Please select living arrangement';
        if (!formData.mobilityLevel) newErrors.mobilityLevel = 'Please select mobility level';
        if (!formData.techComfort) newErrors.techComfort = 'Please select tech comfort level';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await onboardingService.saveOnboardingStep(data.userId, 'parent_details', formData);
            updateData(formData);
            onNext();
        } catch (error) {
            setErrors({ general: 'Failed to save parent details. Please try again.' });
        }
    };

    return (
        <div className="onboarding-step parent-details-step">
            <h2>Parent Information</h2>
            <p>Help us understand your parent's needs and preferences for personalized care.</p>

            <form onSubmit={handleSubmit} className="onboarding-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>First Name *</label>
                        <input
                            type="text"
                            value={formData.parentFirstName}
                            onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                            className={errors.parentFirstName ? 'error' : ''}
                            required
                        />
                        {errors.parentFirstName && <span className="error-text">{errors.parentFirstName}</span>}
                    </div>

                    <div className="form-group">
                        <label>Last Name *</label>
                        <input
                            type="text"
                            value={formData.parentLastName}
                            onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
                            className={errors.parentLastName ? 'error' : ''}
                            required
                        />
                        {errors.parentLastName && <span className="error-text">{errors.parentLastName}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Age *</label>
                        <input
                            type="number"
                            min="50"
                            max="120"
                            value={formData.parentAge}
                            onChange={(e) => setFormData({ ...formData, parentAge: e.target.value })}
                            className={errors.parentAge ? 'error' : ''}
                            required
                        />
                        {errors.parentAge && <span className="error-text">{errors.parentAge}</span>}
                    </div>

                    <div className="form-group">
                        <label>Gender *</label>
                        <select
                            value={formData.parentGender}
                            onChange={(e) => setFormData({ ...formData, parentGender: e.target.value })}
                            className={errors.parentGender ? 'error' : ''}
                            required
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.parentGender && <span className="error-text">{errors.parentGender}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>Preferred Languages * (select all that apply)</label>
                    <div className="language-grid">
                        {languageOptions.map(language => (
                            <label key={language} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.parentLanguages.includes(language)}
                                    onChange={() => handleLanguageChange(language)}
                                />
                                {language}
                            </label>
                        ))}
                    </div>
                    {errors.parentLanguages && <span className="error-text">{errors.parentLanguages}</span>}
                </div>

                <div className="form-group">
                    <label>Living Arrangement *</label>
                    <select
                        value={formData.livingArrangement}
                        onChange={(e) => setFormData({ ...formData, livingArrangement: e.target.value })}
                        className={errors.livingArrangement ? 'error' : ''}
                        required
                    >
                        <option value="">Select arrangement</option>
                        <option value="alone">Lives alone</option>
                        <option value="spouse">Lives with spouse</option>
                        <option value="family">Lives with family members</option>
                        <option value="assisted_living">Assisted living facility</option>
                        <option value="care_home">Care home</option>
                    </select>
                    {errors.livingArrangement && <span className="error-text">{errors.livingArrangement}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Mobility Level *</label>
                        <select
                            value={formData.mobilityLevel}
                            onChange={(e) => setFormData({ ...formData, mobilityLevel: e.target.value })}
                            className={errors.mobilityLevel ? 'error' : ''}
                            required
                        >
                            <option value="">Select level</option>
                            <option value="high">High - Independent movement</option>
                            <option value="medium">Medium - Some assistance needed</option>
                            <option value="low">Low - Significant assistance needed</option>
                            <option value="limited">Limited - Wheelchair/bed bound</option>
                        </select>
                        {errors.mobilityLevel && <span className="error-text">{errors.mobilityLevel}</span>}
                    </div>

                    <div className="form-group">
                        <label>Technology Comfort *</label>
                        <select
                            value={formData.techComfort}
                            onChange={(e) => setFormData({ ...formData, techComfort: e.target.value })}
                            className={errors.techComfort ? 'error' : ''}
                            required
                        >
                            <option value="">Select level</option>
                            <option value="high">High - Uses smartphones/apps</option>
                            <option value="medium">Medium - Basic phone usage</option>
                            <option value="low">Low - Minimal tech usage</option>
                            <option value="none">None - No technology use</option>
                        </select>
                        {errors.techComfort && <span className="error-text">{errors.techComfort}</span>}
                    </div>
                </div>

                {errors.general && (
                    <div className="error-message">{errors.general}</div>
                )}

                <div className="button-group">
                    <button type="button" onClick={onBack} className="back-button">
                        Back
                    </button>
                    <button type="submit" className="next-button">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

// Main Onboarding Flow Component
const OnboardingFlow = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [onboardingData, setOnboardingData] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        const checkUser = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                // Load existing onboarding progress
                const progress = await onboardingService.getOnboardingProgress(currentUser.id);
                if (progress && progress.length > 0) {
                    // Resume from last completed step
                    setCurrentStep(progress.length);
                    // Reconstruct onboarding data
                    const data = {};
                    progress.forEach(step => {
                        Object.assign(data, step.step_data);
                    });
                    setOnboardingData(data);
                }
            }
        };

        checkUser();
    }, []);

    const updateData = (newData) => {
        setOnboardingData(prev => ({ ...prev, ...newData }));
    };

    const nextStep = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        const step = ONBOARDING_STEPS[currentStep];
        const commonProps = {
            onNext: nextStep,
            onBack: prevStep,
            data: onboardingData,
            updateData,
            user
        };

        switch (step.component) {
            case 'WelcomeStep':
                return <WelcomeStep {...commonProps} />;
            case 'AccountSetupStep':
                return <AccountSetupStep {...commonProps} />;
            case 'FamilyDetailsStep':
                return <FamilyDetailsStep {...commonProps} />;
            case 'ParentDetailsStep':
                return <ParentDetailsStep {...commonProps} />;
            // Additional steps would be added here...
            default:
                return <div>Step component not found</div>;
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-header">
                <h1>SeniorCare AI Setup</h1>
                <ProgressIndicator
                    currentStep={currentStep}
                    totalSteps={ONBOARDING_STEPS.length}
                />
            </div>

            <div className="onboarding-content">
                {renderStep()}
            </div>

            <div className="onboarding-footer">
                <p>Need help? Contact our support team at support@seniorcare-ai.com</p>
            </div>
        </div>
    );
};

export default OnboardingFlow;
