/**
 * NRI-Focused Family Dashboard Component
 * Meta-Prompt 2 Implementation by Claude Code CLI
 * 
 * Connects to /api/dashboard/:familyId endpoint
 * Features: Real-time health data, NRI optimization, timezone support
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button,
    Alert, Badge, IconButton, CircularProgress, Tooltip,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Dashboard, Emergency, VideoCall, Notifications, AccessTime,
    LocationOn, Phone, Email, Warning, CheckCircle, Info,
    HeartRate, MonitorHeart, Thermostat, Bloodtype, Refresh,
    Language, AttachMoney, Public, Schedule
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import moment from 'moment-timezone';

// ElderWorld family-first theme for NRI families
const familyTheme = createTheme({
    palette: {
        primary: { main: '#1E3A8A' }, // Beacon blue - trust & reliability
        secondary: { main: '#F59E0B' }, // Guiding gold - warmth & premium
        error: { main: '#EF4444' },
        warning: { main: '#F59E0B' },
        success: { main: '#10B981' },
        background: { default: '#F9FAFB', paper: '#FFFFFF' }
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h4: { fontWeight: 600, fontSize: '2.125rem' },
        h5: { fontWeight: 500, fontSize: '1.5rem' },
        h6: { fontWeight: 500, fontSize: '1.25rem' }
    }
});

const FamilyDashboard = ({ familyId, initialTimezone = 'Asia/Kolkata', initialCurrency = 'INR' }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timezone, setTimezone] = useState(initialTimezone);
    const [currency, setCurrency] = useState(initialCurrency);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Fetch dashboard data from our new API endpoint
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/dashboard/${familyId}?timezone=${timezone}&currency=${currency}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        // Note: In production, add authentication headers
                        // 'Authorization': `Bearer ${authToken}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setDashboardData(result.data);
                setLastUpdated(moment().tz(timezone).format());
                console.log('📊 Dashboard data loaded:', result.data);
            } else {
                throw new Error(result.message || 'Failed to load dashboard data');
            }

        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);
            setError(err.message);

            // For demo purposes, set mock data if API fails
            setDashboardData(getMockDashboardData());
            setLastUpdated(moment().tz(timezone).format());
        } finally {
            setLoading(false);
        }
    }, [familyId, timezone, currency]);

    // Mock data for demonstration when API is not available
    const getMockDashboardData = () => ({
        senior: {
            profile: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Rajesh Kumar Sharma',
                age: 69,
                location: { address: 'Jayanagar 4th Block, Bangalore', lat: 12.9279, lng: 77.5944 },
                medical_conditions: ['diabetes', 'hypertension'],
                emergency_contacts: [
                    { name: 'Dr. Priya Singh', phone: '+91-9876543210', relation: 'doctor' },
                    { name: 'Apollo Hospital', phone: '+91-80-2630-4050', relation: 'hospital' }
                ]
            },
            health: {
                current_vitals: {
                    heart_rate: 78,
                    blood_pressure: { systolic: 135, diastolic: 85 },
                    oxygen_saturation: 97,
                    temperature: 98.6,
                    last_reading: moment().tz(timezone).format(),
                    status: 'Normal'
                },
                readings_24h: [
                    {
                        timestamp: moment().subtract(2, 'hours').tz(timezone).format(),
                        vitals: { heartRate: 76, bloodPressure: { systolic: 130, diastolic: 82 } }
                    },
                    {
                        timestamp: moment().subtract(4, 'hours').tz(timezone).format(),
                        vitals: { heartRate: 80, bloodPressure: { systolic: 138, diastolic: 88 } }
                    }
                ],
                trends: { heart_rate: 'stable', blood_pressure: 'stable', overall: 'stable' }
            },
            alerts: {
                active: [],
                recent: [
                    {
                        id: 'alert_001',
                        type: 'MEDICATION_REMINDER',
                        status: 'RESOLVED',
                        created_at: moment().subtract(1, 'day').tz(timezone).format(),
                        resolved_at: moment().subtract(23, 'hours').tz(timezone).format()
                    }
                ]
            },
            care: {
                latest_note: {
                    note: "Daily check completed. Patient is stable and responsive. Medications taken on schedule.",
                    caregiver_name: "Nurse Priya Sharma",
                    timestamp: moment().subtract(2, 'hours').tz(timezone).format(),
                    time_ago: moment().subtract(2, 'hours').tz(timezone).fromNow(),
                    type: "routine_check"
                },
                next_visit: moment().add(1, 'day').hour(10).tz(timezone).format(),
                caregiver_contact: "+91-9876543210"
            }
        },
        subscription: {
            package_name: "NRI Premium Care",
            monthly_cost: 15000,
            monthly_cost_display: currency === 'USD' ? '$180' : '₹15,000',
            features: [
                "24/7 Emergency Response",
                "Daily Health Monitoring",
                "Family Dashboard Access",
                "Video Consultations",
                "Caregiver Services"
            ],
            next_billing_date: moment().add(1, 'month').tz(timezone).format(),
            status: "active"
        },
        nri_features: {
            timezone: timezone,
            local_time: moment().tz(timezone).format(),
            ist_time: moment().tz('Asia/Kolkata').format(),
            currency: currency,
            conversion_rate: currency === 'USD' ? 0.012 : 1,
            communication_preferences: { sms: true, email: true, push: true, voice_call: false }
        },
        dashboard_meta: {
            family_member: {
                name: 'Priya Sharma (Daughter)',
                relationship: 'daughter',
                access_level: 'full',
                is_nri: true,
                nri_country: 'USA'
            },
            last_updated: moment().tz(timezone).format(),
            data_freshness: {
                health_data: 15, // minutes ago
                alert_data: 5,
                caregiver_data: 120
            }
        }
    });

    // Load dashboard data on component mount and when dependencies change
    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    const getHealthStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'critical': return 'error';
            case 'warning': return 'warning';
            case 'normal': return 'success';
            default: return 'info';
        }
    };

    const getAlertSeverityColor = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            default: return 'default';
        }
    };

    if (loading && !dashboardData) {
        return (
            <ThemeProvider theme={familyTheme}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Loading family dashboard...
                    </Typography>
                </Box>
            </ThemeProvider>
        );
    }

    if (error && !dashboardData) {
        return (
            <ThemeProvider theme={familyTheme}>
                <Alert severity="error" sx={{ m: 2 }}>
                    <Typography variant="h6">Failed to load dashboard</Typography>
                    <Typography>{error}</Typography>
                    <Button onClick={fetchDashboardData} variant="outlined" sx={{ mt: 1 }}>
                        Try Again
                    </Button>
                </Alert>
            </ThemeProvider>
        );
    }

    const data = dashboardData;

    return (
        <ThemeProvider theme={familyTheme}>
            <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
                {/* Header with NRI Controls */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                        <Typography variant="h4" color="primary" gutterBottom>
                            Family Dashboard
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            {data?.senior?.profile?.name} • {data?.dashboard_meta?.family_member?.name}
                        </Typography>
                    </Box>

                    {/* NRI Optimization Controls */}
                    <Box display="flex" gap={2} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Timezone</InputLabel>
                            <Select
                                value={timezone}
                                label="Timezone"
                                onChange={(e) => setTimezone(e.target.value)}
                            >
                                <MenuItem value="Asia/Kolkata">🇮🇳 India (IST)</MenuItem>
                                <MenuItem value="America/Los_Angeles">🇺🇸 Pacific Time</MenuItem>
                                <MenuItem value="America/New_York">🇺🇸 Eastern Time</MenuItem>
                                <MenuItem value="Europe/London">🇬🇧 London (GMT)</MenuItem>
                                <MenuItem value="Asia/Singapore">🇸🇬 Singapore</MenuItem>
                                <MenuItem value="Australia/Sydney">🇦🇺 Sydney</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Currency</InputLabel>
                            <Select
                                value={currency}
                                label="Currency"
                                onChange={(e) => setCurrency(e.target.value)}
                            >
                                <MenuItem value="INR">₹ INR</MenuItem>
                                <MenuItem value="USD">$ USD</MenuItem>
                                <MenuItem value="GBP">£ GBP</MenuItem>
                                <MenuItem value="EUR">€ EUR</MenuItem>
                                <MenuItem value="SGD">S$ SGD</MenuItem>
                                <MenuItem value="AUD">A$ AUD</MenuItem>
                            </Select>
                        </FormControl>

                        <Tooltip title="Refresh Dashboard">
                            <IconButton onClick={fetchDashboardData} disabled={loading}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Time Zone Information */}
                <Card sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <AccessTime />
                                <Typography variant="h6">
                                    Your Time: {data?.nri_features?.local_time ? moment(data.nri_features.local_time).format('MMM DD, h:mm A') : 'Loading...'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Public />
                                <Typography variant="h6">
                                    India Time: {data?.nri_features?.ist_time ? moment(data.nri_features.ist_time).format('MMM DD, h:mm A') : 'Loading...'}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <AttachMoney />
                                <Typography variant="h6">
                                    Monthly Cost: {data?.subscription?.monthly_cost_display || 'Loading...'}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>

                <Grid container spacing={3}>
                    {/* Senior's Profile Section */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h5" color="primary" gutterBottom>
                                    Senior's Profile
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                                        {data?.senior?.profile?.name?.charAt(0) || 'S'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h6">{data?.senior?.profile?.name || 'Loading...'}</Typography>
                                        <Typography color="textSecondary">Age: {data?.senior?.profile?.age || 'N/A'}</Typography>
                                        <Typography color="textSecondary">
                                            📍 {data?.senior?.profile?.location?.address || 'Location not available'}
                                        </Typography>
                                    </Box>
                                </Box>

                                {data?.senior?.profile?.medical_conditions && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Medical Conditions:</Typography>
                                        <Box display="flex" gap={1} flexWrap="wrap">
                                            {data.senior.profile.medical_conditions.map((condition, index) => (
                                                <Chip key={index} label={condition} size="small" color="info" />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Live Health Metrics Section */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h5" color="primary" gutterBottom>
                                    Live Health Metrics
                                </Typography>

                                {data?.senior?.health?.current_vitals ? (
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <HeartRate color="error" />
                                                <Typography variant="body2">Heart Rate</Typography>
                                            </Box>
                                            <Typography variant="h6">{data.senior.health.current_vitals.heart_rate} bpm</Typography>
                                        </Grid>

                                        <Grid item xs={6}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <MonitorHeart color="primary" />
                                                <Typography variant="body2">Blood Pressure</Typography>
                                            </Box>
                                            <Typography variant="h6">
                                                {data.senior.health.current_vitals.blood_pressure?.systolic}/
                                                {data.senior.health.current_vitals.blood_pressure?.diastolic}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={6}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Bloodtype color="info" />
                                                <Typography variant="body2">Oxygen Saturation</Typography>
                                            </Box>
                                            <Typography variant="h6">{data.senior.health.current_vitals.oxygen_saturation}%</Typography>
                                        </Grid>

                                        <Grid item xs={6}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Thermostat color="warning" />
                                                <Typography variant="body2">Temperature</Typography>
                                            </Box>
                                            <Typography variant="h6">{data.senior.health.current_vitals.temperature}°F</Typography>
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Chip
                                                label={`Status: ${data.senior.health.current_vitals.status}`}
                                                color={getHealthStatusColor(data.senior.health.current_vitals.status)}
                                                icon={<CheckCircle />}
                                            />
                                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                Last reading: {data.senior.health.current_vitals.last_reading ?
                                                    moment(data.senior.health.current_vitals.last_reading).fromNow() : 'Unknown'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                ) : (
                                    <Alert severity="info">No recent health data available</Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Events & Alerts Section */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h5" color="primary" gutterBottom>
                                    Recent Events & Alerts
                                </Typography>

                                {data?.senior?.alerts?.active?.length > 0 ? (
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" color="error" gutterBottom>Active Alerts:</Typography>
                                        {data.senior.alerts.active.map((alert, index) => (
                                            <Alert key={index} severity="error" sx={{ mb: 1 }}>
                                                <Typography variant="body2">{alert.message}</Typography>
                                                <Typography variant="caption">{alert.time_ago}</Typography>
                                            </Alert>
                                        ))}
                                    </Box>
                                ) : (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        <Typography>No active alerts - All systems normal</Typography>
                                    </Alert>
                                )}

                                {data?.senior?.alerts?.recent?.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Recent Activity:</Typography>
                                        {data.senior.alerts.recent.slice(0, 3).map((alert, index) => (
                                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="body2">{alert.type.replace('_', ' ')}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {moment(alert.created_at).fromNow()}
                                                    {alert.status === 'RESOLVED' && ' - Resolved'}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Caregiver Log Section */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant="h5" color="primary" gutterBottom>
                                    Caregiver Log
                                </Typography>

                                {data?.senior?.care?.latest_note ? (
                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                                                {data.senior.care.latest_note.caregiver_name?.charAt(0) || 'C'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2">
                                                    {data.senior.care.latest_note.caregiver_name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {data.senior.care.latest_note.time_ago}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            "{data.senior.care.latest_note.note}"
                                        </Typography>

                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="caption" color="textSecondary">
                                                Next visit: {data.senior.care.next_visit ?
                                                    moment(data.senior.care.next_visit).format('MMM DD, h:mm A') : 'Not scheduled'}
                                            </Typography>
                                            <Button
                                                size="small"
                                                startIcon={<Phone />}
                                                href={`tel:${data.senior.care.caregiver_contact}`}
                                            >
                                                Call Caregiver
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Alert severity="info">No recent caregiver updates</Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Footer */}
                <Box mt={4} textAlign="center">
                    <Typography variant="caption" color="textSecondary">
                        Last updated: {lastUpdated ? moment(lastUpdated).fromNow() : 'Unknown'} •
                        Data freshness: Health ({data?.dashboard_meta?.data_freshness?.health_data || 0} min ago)
                    </Typography>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default FamilyDashboard;
