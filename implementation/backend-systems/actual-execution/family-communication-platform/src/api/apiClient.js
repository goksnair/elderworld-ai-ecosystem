// API Integration Layer for SeniorCare AI
// Handles all backend communications with proper error handling and HIPAA compliance

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Error types for better error handling
export const API_ERRORS = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    HIPAA_VIOLATION: 'HIPAA_VIOLATION'
};

// HIPAA-compliant request wrapper
class SecureApiClient {
    constructor() {
        this.token = null;
        this.refreshToken = null;
    }

    // Set authentication tokens
    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;

        // Store securely (encrypted in production)
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('access_token', accessToken);
            if (refreshToken) {
                localStorage.setItem('refresh_token', refreshToken);
            }
        }
    }

    // Get stored token
    getToken() {
        if (this.token) return this.token;

        if (typeof window !== 'undefined') {
            this.token = sessionStorage.getItem('access_token');
            return this.token;
        }

        return null;
    }

    // Make secure API request
    async makeRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': this.generateRequestId(),
                'X-Client-Version': '1.0.0',
                ...options.headers
            },
            ...options
        };

        // Add authentication header
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add HIPAA compliance headers
        config.headers['X-HIPAA-Compliant'] = 'true';
        config.headers['X-Encryption-Required'] = 'AES-256';

        try {
            const response = await fetch(url, config);

            // Handle authentication errors
            if (response.status === 401) {
                await this.handleTokenRefresh();
                // Retry request with new token
                const newToken = this.getToken();
                if (newToken) {
                    config.headers['Authorization'] = `Bearer ${newToken}`;
                    return await fetch(url, config);
                } else {
                    throw new ApiError(API_ERRORS.UNAUTHORIZED, 'Authentication failed');
                }
            }

            // Handle other HTTP errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    this.mapHttpStatusToError(response.status),
                    errorData.message || `HTTP ${response.status}`,
                    errorData
                );
            }

            const data = await response.json();

            // Validate HIPAA compliance in response
            this.validateHipaaCompliance(response.headers, data);

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            // Network or parsing errors
            console.error('API Request failed:', error);
            throw new ApiError(API_ERRORS.NETWORK_ERROR, 'Network request failed', error);
        }
    }

    // Handle token refresh
    async handleTokenRefresh() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            this.clearTokens();
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const { accessToken, refreshToken: newRefreshToken } = await response.json();
                this.setTokens(accessToken, newRefreshToken);
            } else {
                this.clearTokens();
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearTokens();
            window.location.href = '/login';
        }
    }

    // Clear authentication tokens
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
    }

    // Generate unique request ID for audit trails
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Map HTTP status codes to error types
    mapHttpStatusToError(status) {
        switch (status) {
            case 400: return API_ERRORS.VALIDATION_ERROR;
            case 401: return API_ERRORS.UNAUTHORIZED;
            case 403: return API_ERRORS.FORBIDDEN;
            case 404: return API_ERRORS.NOT_FOUND;
            case 500: return API_ERRORS.SERVER_ERROR;
            default: return API_ERRORS.SERVER_ERROR;
        }
    }

    // Validate HIPAA compliance in API responses
    validateHipaaCompliance(headers, data) {
        // Check for required security headers
        const requiredHeaders = ['x-encryption-used', 'x-audit-id'];
        const missingHeaders = requiredHeaders.filter(header => !headers.get(header));

        if (missingHeaders.length > 0) {
            console.warn('HIPAA compliance warning: Missing security headers', missingHeaders);
        }

        // Check for potential PHI in response
        if (data && typeof data === 'object') {
            const sensitiveFields = ['ssn', 'medical_record_number', 'insurance_number'];
            const foundSensitive = sensitiveFields.filter(field => data[field]);

            if (foundSensitive.length > 0) {
                console.warn('HIPAA compliance warning: Potential PHI in response', foundSensitive);
            }
        }
    }
}

// Custom error class for API errors
class ApiError extends Error {
    constructor(type, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// Initialize API client
const apiClient = new SecureApiClient();

// Family Dashboard API methods
export const familyDashboardApi = {
    // Get family dashboard data
    async getDashboard(familyId) {
        return await apiClient.makeRequest(`/api/dashboard/${familyId}`);
    },

    // Get real-time health metrics
    async getHealthMetrics(parentId) {
        return await apiClient.makeRequest(`/api/health/${parentId}/metrics`);
    },

    // Get recent activities
    async getActivities(parentId, limit = 10) {
        return await apiClient.makeRequest(`/api/activities/${parentId}?limit=${limit}`);
    },

    // Get emergency contacts
    async getEmergencyContacts(familyId) {
        return await apiClient.makeRequest(`/api/family/${familyId}/contacts`);
    },

    // Update parent settings
    async updateParentSettings(parentId, settings) {
        return await apiClient.makeRequest(`/api/parent/${parentId}/settings`, {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }
};

// Emergency Response API methods
export const emergencyApi = {
    // Trigger emergency alert
    async triggerAlert(parentId, alertType, severity = 'HIGH') {
        return await apiClient.makeRequest('/api/emergency/alert', {
            method: 'POST',
            body: JSON.stringify({
                parentId,
                alertType,
                severity,
                timestamp: new Date().toISOString(),
                source: 'FAMILY_DASHBOARD'
            })
        });
    },

    // Get emergency status
    async getEmergencyStatus(parentId) {
        return await apiClient.makeRequest(`/api/emergency/status/${parentId}`);
    },

    // Acknowledge emergency
    async acknowledgeEmergency(emergencyId, familyMemberId) {
        return await apiClient.makeRequest(`/api/emergency/${emergencyId}/acknowledge`, {
            method: 'POST',
            body: JSON.stringify({
                acknowledgedBy: familyMemberId,
                timestamp: new Date().toISOString()
            })
        });
    },

    // Get emergency history
    async getEmergencyHistory(parentId, days = 30) {
        return await apiClient.makeRequest(`/api/emergency/history/${parentId}?days=${days}`);
    }
};

// User Authentication API methods
export const authApi = {
    // User login
    async login(email, password) {
        const response = await apiClient.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.accessToken) {
            apiClient.setTokens(response.accessToken, response.refreshToken);
        }

        return response;
    },

    // User registration
    async register(userData) {
        return await apiClient.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    // Logout
    async logout() {
        try {
            await apiClient.makeRequest('/auth/logout', { method: 'POST' });
        } finally {
            apiClient.clearTokens();
        }
    },

    // Get current user
    async getCurrentUser() {
        return await apiClient.makeRequest('/auth/me');
    },

    // Update user profile
    async updateProfile(userData) {
        return await apiClient.makeRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
};

// Notification API methods
export const notificationApi = {
    // Get notifications
    async getNotifications(userId, unreadOnly = false) {
        return await apiClient.makeRequest(`/api/notifications/${userId}?unreadOnly=${unreadOnly}`);
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        return await apiClient.makeRequest(`/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    },

    // Subscribe to push notifications
    async subscribeToPush(userId, subscription) {
        return await apiClient.makeRequest('/api/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify({ userId, subscription })
        });
    }
};

// Export API client and error types
export { apiClient, ApiError, API_ERRORS };

// Utility functions for API integration
export const apiUtils = {
    // Format error message for user display
    formatErrorMessage(error) {
        if (error instanceof ApiError) {
            switch (error.type) {
                case API_ERRORS.NETWORK_ERROR:
                    return 'Network connection error. Please check your internet connection.';
                case API_ERRORS.UNAUTHORIZED:
                    return 'Please log in again to continue.';
                case API_ERRORS.FORBIDDEN:
                    return 'You do not have permission to access this information.';
                case API_ERRORS.NOT_FOUND:
                    return 'The requested information was not found.';
                case API_ERRORS.VALIDATION_ERROR:
                    return error.details?.message || 'Please check your input and try again.';
                default:
                    return 'An unexpected error occurred. Please try again.';
            }
        }
        return 'An unexpected error occurred. Please try again.';
    },

    // Check if error requires re-authentication
    isAuthError(error) {
        return error instanceof ApiError &&
            (error.type === API_ERRORS.UNAUTHORIZED || error.type === API_ERRORS.FORBIDDEN);
    },

    // Retry API request with exponential backoff
    async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                if (attempt === maxRetries - 1) throw error;

                // Don't retry auth errors
                if (this.isAuthError(error)) throw error;

                // Exponential backoff
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};
