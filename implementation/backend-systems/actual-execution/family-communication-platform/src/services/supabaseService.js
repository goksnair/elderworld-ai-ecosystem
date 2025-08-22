// Supabase Integration for SeniorCare AI Platform
// HIPAA-compliant database operations with Row Level Security (RLS)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Please check environment variables.');
}

// Initialize Supabase client with security configurations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // HIPAA compliance: Enhanced security settings
        storageKey: 'senior-care-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : null,
    },
    global: {
        headers: {
            'X-HIPAA-Compliant': 'true',
            'X-App-Version': '1.0.0'
        }
    }
});

// Database table definitions (for reference)
export const TABLES = {
    FAMILIES: 'families',
    PARENTS: 'parents',
    FAMILY_MEMBERS: 'family_members',
    HEALTH_METRICS: 'health_metrics',
    ACTIVITIES: 'activities',
    EMERGENCY_ALERTS: 'emergency_alerts',
    NOTIFICATIONS: 'notifications',
    EMERGENCY_CONTACTS: 'emergency_contacts',
    USER_PROFILES: 'user_profiles',
    ONBOARDING_DATA: 'onboarding_data'
};

// Authentication service
export const authService = {
    // Sign up new user with HIPAA compliance
    async signUp({ email, password, firstName, lastName, phoneNumber, role = 'family_member' }) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        phone_number: phoneNumber,
                        role,
                        terms_accepted: true,
                        hipaa_consent: true,
                        created_at: new Date().toISOString()
                    }
                }
            });

            if (error) throw error;

            // Create user profile in database
            if (data.user) {
                await this.createUserProfile(data.user.id, {
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    role
                });
            }

            return { user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign up error:', error);
            throw new Error(this.getAuthErrorMessage(error));
        }
    },

    // Sign in user
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Update last login timestamp
            if (data.user) {
                await this.updateLastLogin(data.user.id);
            }

            return { user: data.user, session: data.session };
        } catch (error) {
            console.error('Sign in error:', error);
            throw new Error(this.getAuthErrorMessage(error));
        }
    },

    // Sign out user
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Clear any cached data
            this.clearLocalCache();
        } catch (error) {
            console.error('Sign out error:', error);
            throw new Error('Failed to sign out');
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    // Create user profile
    async createUserProfile(userId, profileData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.USER_PROFILES)
                .insert({
                    id: userId,
                    email: profileData.email,
                    first_name: profileData.firstName,
                    last_name: profileData.lastName,
                    phone_number: profileData.phoneNumber,
                    role: profileData.role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create profile error:', error);
            throw error;
        }
    },

    // Update last login
    async updateLastLogin(userId) {
        try {
            await supabase
                .from(TABLES.USER_PROFILES)
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', userId);
        } catch (error) {
            console.error('Update last login error:', error);
        }
    },

    // Clear local cache
    clearLocalCache() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('family-dashboard-cache');
            sessionStorage.clear();
        }
    },

    // Get user-friendly error message
    getAuthErrorMessage(error) {
        switch (error?.message) {
            case 'Invalid login credentials':
                return 'Invalid email or password. Please try again.';
            case 'Email not confirmed':
                return 'Please confirm your email address before signing in.';
            case 'User already registered':
                return 'An account with this email already exists. Please sign in instead.';
            case 'Password should be at least 6 characters':
                return 'Password must be at least 6 characters long.';
            default:
                return error?.message || 'Authentication failed. Please try again.';
        }
    }
};

// Family data service
export const familyService = {
    // Get family dashboard data
    async getFamilyDashboard(familyId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FAMILIES)
                .select(`
          *,
          parents:${TABLES.PARENTS}(*),
          family_members:${TABLES.FAMILY_MEMBERS}(*),
          emergency_contacts:${TABLES.EMERGENCY_CONTACTS}(*)
        `)
                .eq('id', familyId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get family dashboard error:', error);
            throw error;
        }
    },

    // Get parent health metrics
    async getParentHealthMetrics(parentId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data, error } = await supabase
                .from(TABLES.HEALTH_METRICS)
                .select('*')
                .eq('parent_id', parentId)
                .gte('recorded_at', startDate.toISOString())
                .order('recorded_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get health metrics error:', error);
            throw error;
        }
    },

    // Get recent activities
    async getRecentActivities(parentId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ACTIVITIES)
                .select('*')
                .eq('parent_id', parentId)
                .order('timestamp', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get activities error:', error);
            throw error;
        }
    },

    // Create new family
    async createFamily(familyData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.FAMILIES)
                .insert({
                    name: familyData.familyName,
                    primary_contact_id: familyData.primaryContactId,
                    address: familyData.address,
                    timezone: familyData.timezone || 'Asia/Kolkata',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create family error:', error);
            throw error;
        }
    },

    // Add parent to family
    async addParent(parentData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.PARENTS)
                .insert({
                    family_id: parentData.familyId,
                    first_name: parentData.firstName,
                    last_name: parentData.lastName,
                    age: parentData.age,
                    medical_conditions: parentData.medicalConditions,
                    medications: parentData.medications,
                    emergency_contact_preference: parentData.emergencyPreference,
                    monitoring_enabled: true,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Add parent error:', error);
            throw error;
        }
    }
};

// Emergency service
export const emergencyService = {
    // Create emergency alert
    async createEmergencyAlert(alertData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.EMERGENCY_ALERTS)
                .insert({
                    parent_id: alertData.parentId,
                    alert_type: alertData.alertType,
                    severity: alertData.severity,
                    description: alertData.description,
                    location: alertData.location,
                    status: 'ACTIVE',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Trigger real-time notifications
            await this.notifyFamilyMembers(alertData.parentId, data.id);

            return data;
        } catch (error) {
            console.error('Create emergency alert error:', error);
            throw error;
        }
    },

    // Get emergency status
    async getEmergencyStatus(parentId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.EMERGENCY_ALERTS)
                .select('*')
                .eq('parent_id', parentId)
                .eq('status', 'ACTIVE')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get emergency status error:', error);
            throw error;
        }
    },

    // Acknowledge emergency
    async acknowledgeEmergency(alertId, acknowledgerId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.EMERGENCY_ALERTS)
                .update({
                    status: 'ACKNOWLEDGED',
                    acknowledged_by: acknowledgerId,
                    acknowledged_at: new Date().toISOString()
                })
                .eq('id', alertId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Acknowledge emergency error:', error);
            throw error;
        }
    },

    // Notify family members
    async notifyFamilyMembers(parentId, alertId) {
        try {
            // Get family members for this parent
            const { data: parent } = await supabase
                .from(TABLES.PARENTS)
                .select('family_id')
                .eq('id', parentId)
                .single();

            if (parent) {
                const { data: familyMembers } = await supabase
                    .from(TABLES.FAMILY_MEMBERS)
                    .select('user_id, notification_preferences')
                    .eq('family_id', parent.family_id);

                // Create notifications for each family member
                const notifications = familyMembers.map(member => ({
                    user_id: member.user_id,
                    alert_id: alertId,
                    type: 'EMERGENCY_ALERT',
                    title: 'Emergency Alert',
                    message: 'An emergency alert has been triggered for your parent.',
                    read: false,
                    created_at: new Date().toISOString()
                }));

                await supabase
                    .from(TABLES.NOTIFICATIONS)
                    .insert(notifications);
            }
        } catch (error) {
            console.error('Notify family members error:', error);
        }
    }
};

// Real-time subscriptions
export const realtimeService = {
    // Subscribe to emergency alerts
    subscribeToEmergencyAlerts(parentId, callback) {
        return supabase
            .channel(`emergency_alerts_${parentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.EMERGENCY_ALERTS,
                filter: `parent_id=eq.${parentId}`
            }, callback)
            .subscribe();
    },

    // Subscribe to health metrics updates
    subscribeToHealthMetrics(parentId, callback) {
        return supabase
            .channel(`health_metrics_${parentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.HEALTH_METRICS,
                filter: `parent_id=eq.${parentId}`
            }, callback)
            .subscribe();
    },

    // Subscribe to activity updates
    subscribeToActivities(parentId, callback) {
        return supabase
            .channel(`activities_${parentId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: TABLES.ACTIVITIES,
                filter: `parent_id=eq.${parentId}`
            }, callback)
            .subscribe();
    },

    // Unsubscribe from channel
    unsubscribe(subscription) {
        if (subscription) {
            supabase.removeChannel(subscription);
        }
    }
};

// Onboarding service
export const onboardingService = {
    // Save onboarding step data
    async saveOnboardingStep(userId, stepName, stepData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ONBOARDING_DATA)
                .upsert({
                    user_id: userId,
                    step_name: stepName,
                    step_data: stepData,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Save onboarding step error:', error);
            throw error;
        }
    },

    // Get onboarding progress
    async getOnboardingProgress(userId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.ONBOARDING_DATA)
                .select('*')
                .eq('user_id', userId)
                .order('completed_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get onboarding progress error:', error);
            throw error;
        }
    },

    // Complete onboarding
    async completeOnboarding(userId) {
        try {
            // Mark user profile as onboarded
            const { data, error } = await supabase
                .from(TABLES.USER_PROFILES)
                .update({
                    onboarding_completed: true,
                    onboarding_completed_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Complete onboarding error:', error);
            throw error;
        }
    }
};

// Notification service
export const notificationService = {
    // Get user notifications
    async getUserNotifications(userId, unreadOnly = false) {
        try {
            let query = supabase
                .from(TABLES.NOTIFICATIONS)
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (unreadOnly) {
                query = query.eq('read', false);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .update({ read: true, read_at: new Date().toISOString() })
                .eq('id', notificationId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Mark notification read error:', error);
            throw error;
        }
    },

    // Create notification
    async createNotification(notificationData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.NOTIFICATIONS)
                .insert({
                    user_id: notificationData.userId,
                    type: notificationData.type,
                    title: notificationData.title,
                    message: notificationData.message,
                    data: notificationData.data || {},
                    read: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    }
};

// Export all services
export default {
    supabase,
    authService,
    familyService,
    emergencyService,
    realtimeService,
    onboardingService,
    notificationService,
    TABLES
};
