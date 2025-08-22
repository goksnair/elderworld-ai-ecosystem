// Enhanced Family Dashboard with Full API Integration and Real-time Updates
// Connects to backend APIs and Supabase for live data

import React, { useState, useEffect, useCallback } from 'react';
import {
    familyDashboardApi,
    emergencyApi,
    apiUtils,
    API_ERRORS
} from '../api/apiClient';
import {
    familyService,
    emergencyService,
    realtimeService,
    notificationService
} from '../services/supabaseService';
import './FamilyDashboard.css';

// Loading component
const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="loading-spinner">
        <div className="spinner"></div>
        <p>{message}</p>
    </div>
);

// Error display component
const ErrorMessage = ({ error, onRetry }) => (
    <div className="error-message">
        <h3>⚠️ Something went wrong</h3>
        <p>{apiUtils.formatErrorMessage(error)}</p>
        {onRetry && (
            <button onClick={onRetry} className="retry-btn">
                Try Again
            </button>
        )}
    </div>
);

// Emergency Alert Banner
const EmergencyAlert = ({ alert, onAcknowledge }) => (
    <div className={`emergency-alert ${alert.severity.toLowerCase()}`}>
        <div className="alert-content">
            <div className="alert-icon">🚨</div>
            <div className="alert-details">
                <h3>Emergency Alert - {alert.alert_type}</h3>
                <p>{alert.description}</p>
                <span className="alert-time">
                    {new Date(alert.created_at).toLocaleString()}
                </span>
            </div>
            <button
                onClick={() => onAcknowledge(alert.id)}
                className="acknowledge-btn"
            >
                Acknowledge
            </button>
        </div>
    </div>
);

// Health Metrics Chart Component
const HealthMetricsChart = ({ metrics, metricType }) => {
    const getChartData = () => {
        if (!metrics || metrics.length === 0) return [];

        return metrics
            .filter(m => m.metric_type === metricType)
            .slice(-7) // Last 7 days
            .map(m => ({
                date: new Date(m.recorded_at).toLocaleDateString(),
                value: m.value,
                unit: m.unit
            }));
    };

    const chartData = getChartData();
    const maxValue = Math.max(...chartData.map(d => d.value), 0);

    if (chartData.length === 0) {
        return (
            <div className="no-data">
                <p>No {metricType} data available</p>
            </div>
        );
    }

    return (
        <div className="health-chart">
            <h4>{metricType} Trend</h4>
            <div className="chart-container">
                {chartData.map((point, index) => (
                    <div key={index} className="chart-bar">
                        <div
                            className="bar"
                            style={{
                                height: `${(point.value / maxValue) * 100}%`,
                                backgroundColor: metricType === 'heart_rate' ? '#e74c3c' : '#3498db'
                            }}
                        ></div>
                        <span className="bar-label">{point.date}</span>
                        <span className="bar-value">{point.value} {point.unit}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Activity Feed Component
const ActivityFeed = ({ activities, loading }) => {
    if (loading) return <LoadingSpinner message="Loading activities..." />;

    if (!activities || activities.length === 0) {
        return (
            <div className="no-activities">
                <p>No recent activities</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            <h3>Recent Activities</h3>
            <div className="activities-list">
                {activities.map((activity, index) => (
                    <div key={activity.id || index} className="activity-item">
                        <div className="activity-icon">
                            {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="activity-details">
                            <h4>{activity.description}</h4>
                            <p>{activity.location}</p>
                            <span className="activity-time">
                                {new Date(activity.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Get icon for activity type
const getActivityIcon = (activityType) => {
    const icons = {
        'medication_taken': '💊',
        'meal_eaten': '🍽️',
        'exercise': '🚶‍♂️',
        'sleep': '😴',
        'social': '👥',
        'medical_appointment': '🏥',
        'emergency': '🚨',
        'default': '📝'
    };
    return icons[activityType] || icons.default;
};

// Main Family Dashboard Component
const FamilyDashboard = ({ familyId, currentUser }) => {
    // State management
    const [dashboardData, setDashboardData] = useState(null);
    const [healthMetrics, setHealthMetrics] = useState([]);
    const [activities, setActivities] = useState([]);
    const [emergencyAlerts, setEmergencyAlerts] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activitiesLoading, setActivitiesLoading] = useState(false);

    // Real-time subscriptions
    const [subscriptions, setSubscriptions] = useState([]);

    // Load dashboard data
    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Load family dashboard data from Supabase
            const familyData = await familyService.getFamilyDashboard(familyId);
            setDashboardData(familyData);

            // Load data for each parent
            if (familyData.parents && familyData.parents.length > 0) {
                const parentId = familyData.parents[0].id; // Primary parent

                // Load health metrics, activities, and emergency status in parallel
                const [metrics, recentActivities, emergencyStatus] = await Promise.all([
                    familyService.getParentHealthMetrics(parentId, 7),
                    familyService.getRecentActivities(parentId, 10),
                    emergencyService.getEmergencyStatus(parentId)
                ]);

                setHealthMetrics(metrics);
                setActivities(recentActivities);
                setEmergencyAlerts(emergencyStatus);
            }

            // Load user notifications
            const userNotifications = await notificationService.getUserNotifications(
                currentUser.id,
                true // unread only
            );
            setNotifications(userNotifications);

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [familyId, currentUser.id]);

    // Set up real-time subscriptions
    const setupRealtimeSubscriptions = useCallback(() => {
        if (!dashboardData || !dashboardData.parents) return;

        const parentId = dashboardData.parents[0].id;
        const newSubscriptions = [];

        // Subscribe to emergency alerts
        const emergencySubscription = realtimeService.subscribeToEmergencyAlerts(
            parentId,
            (payload) => {
                console.log('New emergency alert:', payload);
                setEmergencyAlerts(prev => [payload.new, ...prev]);

                // Show browser notification
                if (Notification.permission === 'granted') {
                    new Notification('Emergency Alert', {
                        body: payload.new.description,
                        icon: '/emergency-icon.png',
                        tag: 'emergency'
                    });
                }
            }
        );
        newSubscriptions.push(emergencySubscription);

        // Subscribe to health metrics
        const healthSubscription = realtimeService.subscribeToHealthMetrics(
            parentId,
            (payload) => {
                console.log('New health metric:', payload);
                setHealthMetrics(prev => [payload.new, ...prev.slice(0, 49)]); // Keep last 50
            }
        );
        newSubscriptions.push(healthSubscription);

        // Subscribe to activities
        const activitySubscription = realtimeService.subscribeToActivities(
            parentId,
            (payload) => {
                console.log('New activity:', payload);
                setActivities(prev => [payload.new, ...prev.slice(0, 19)]); // Keep last 20
            }
        );
        newSubscriptions.push(activitySubscription);

        setSubscriptions(newSubscriptions);
    }, [dashboardData]);

    // Clean up subscriptions
    const cleanupSubscriptions = useCallback(() => {
        subscriptions.forEach(subscription => {
            realtimeService.unsubscribe(subscription);
        });
        setSubscriptions([]);
    }, [subscriptions]);

    // Handle emergency acknowledgment
    const handleAcknowledgeEmergency = async (alertId) => {
        try {
            await emergencyService.acknowledgeEmergency(alertId, currentUser.id);

            // Update local state
            setEmergencyAlerts(prev =>
                prev.map(alert =>
                    alert.id === alertId
                        ? { ...alert, status: 'ACKNOWLEDGED', acknowledged_by: currentUser.id }
                        : alert
                )
            );

            // Show success message
            alert('Emergency acknowledged successfully');
        } catch (err) {
            console.error('Failed to acknowledge emergency:', err);
            alert('Failed to acknowledge emergency. Please try again.');
        }
    };

    // Trigger manual emergency alert
    const handleTriggerEmergency = async () => {
        if (!dashboardData || !dashboardData.parents) return;

        const confirmTrigger = window.confirm(
            'Are you sure you want to trigger an emergency alert? This will notify all family members and emergency contacts.'
        );

        if (!confirmTrigger) return;

        try {
            const parentId = dashboardData.parents[0].id;

            await emergencyService.createEmergencyAlert({
                parentId,
                alertType: 'FAMILY_TRIGGERED',
                severity: 'HIGH',
                description: 'Emergency alert triggered by family member',
                location: 'Unknown'
            });

            alert('Emergency alert sent successfully');
        } catch (err) {
            console.error('Failed to trigger emergency:', err);
            alert('Failed to send emergency alert. Please try again.');
        }
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
    };

    // Initial load
    useEffect(() => {
        loadDashboardData();
        requestNotificationPermission();
    }, [loadDashboardData]);

    // Set up real-time subscriptions
    useEffect(() => {
        setupRealtimeSubscriptions();
        return cleanupSubscriptions;
    }, [setupRealtimeSubscriptions, cleanupSubscriptions]);

    // Auto-refresh data every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            loadDashboardData();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [loadDashboardData]);

    // Render loading state
    if (loading) {
        return <LoadingSpinner message="Loading your family dashboard..." />;
    }

    // Render error state
    if (error) {
        return (
            <ErrorMessage
                error={error}
                onRetry={loadDashboardData}
            />
        );
    }

    // Render dashboard
    return (
        <div className="family-dashboard">
            {/* Emergency Alerts */}
            {emergencyAlerts.filter(alert => alert.status === 'ACTIVE').map(alert => (
                <EmergencyAlert
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeEmergency}
                />
            ))}

            {/* Dashboard Header */}
            <header className="dashboard-header">
                <h1>Family Dashboard</h1>
                <div className="header-actions">
                    <button
                        className="emergency-button"
                        onClick={handleTriggerEmergency}
                    >
                        🚨 Emergency
                    </button>
                    <button
                        className="refresh-button"
                        onClick={loadDashboardData}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </header>

            {/* Dashboard Content */}
            {dashboardData && (
                <main className="dashboard-content">
                    {/* Family Overview */}
                    <section className="family-overview">
                        <h2>Family: {dashboardData.name}</h2>
                        <div className="parents-grid">
                            {dashboardData.parents.map(parent => (
                                <div key={parent.id} className="parent-card">
                                    <h3>{parent.first_name} {parent.last_name}</h3>
                                    <p>Age: {parent.age}</p>
                                    <div className="parent-status">
                                        <span className={`status-indicator ${parent.monitoring_enabled ? 'active' : 'inactive'}`}>
                                            {parent.monitoring_enabled ? '🟢 Monitoring Active' : '🔴 Monitoring Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Health Metrics */}
                    <section className="health-metrics">
                        <h2>Health Overview</h2>
                        <div className="metrics-grid">
                            <HealthMetricsChart metrics={healthMetrics} metricType="heart_rate" />
                            <HealthMetricsChart metrics={healthMetrics} metricType="blood_pressure" />
                            <HealthMetricsChart metrics={healthMetrics} metricType="temperature" />
                            <HealthMetricsChart metrics={healthMetrics} metricType="oxygen_saturation" />
                        </div>
                    </section>

                    {/* Recent Activities */}
                    <section className="recent-activities">
                        <ActivityFeed
                            activities={activities}
                            loading={activitiesLoading}
                        />
                    </section>

                    {/* Emergency Contacts */}
                    <section className="emergency-contacts">
                        <h2>Emergency Contacts</h2>
                        <div className="contacts-list">
                            {dashboardData.emergency_contacts?.map(contact => (
                                <div key={contact.id} className="contact-card">
                                    <h4>{contact.name}</h4>
                                    <p>{contact.relationship}</p>
                                    <p>📞 {contact.phone_number}</p>
                                    <p>✉️ {contact.email}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <section className="notifications">
                            <h2>Recent Notifications ({notifications.length})</h2>
                            <div className="notifications-list">
                                {notifications.slice(0, 5).map(notification => (
                                    <div key={notification.id} className="notification-item">
                                        <h4>{notification.title}</h4>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            )}
        </div>
    );
};

export default FamilyDashboard;
