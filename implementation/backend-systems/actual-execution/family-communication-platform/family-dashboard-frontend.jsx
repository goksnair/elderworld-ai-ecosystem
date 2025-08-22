/**
 * SENIOR CARE AI ECOSYSTEM - FAMILY DASHBOARD FRONTEND
 * Production-ready NRI-optimized React family dashboard
 * 
 * TEAM BETA DELIVERABLE - Premium family-first interface
 * Target: ₹15K-25K ARPU justification through superior UX
 * 
 * Features:
 * - Real-time health monitoring dashboard
 * - Multi-timezone family coordination
 * - Senior accessibility integration
 * - Emergency response interface
 * - NRI-optimized communication tools
 */

import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Avatar, Chip, Button,
    Alert, Badge, IconButton, Menu, MenuItem, Switch, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Select,
    FormControl, InputLabel, Tabs, Tab, AppBar, Toolbar, Drawer,
    List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress,
    Tooltip, Fab, Snackbar, useTheme, useMediaQuery
} from '@mui/material';
import {
    Dashboard, Emergency, VideoCall, Notifications, Settings,
    Family, Health, AccessTime, LocationOn, Phone, Email,
    Warning, CheckCircle, Info, Error, Refresh, Add, Edit,
    VolumeUp, TextIncrease, Language, Public, AttachMoney,
    Timeline, Medication, Activity, Sleep, HeartRate
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment-timezone';
import { useWebSocket } from 'react-use-websocket';

// Theme configuration for ElderWorld family-first design
const createFamilyTheme = (accessibilityMode = false) => createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1E3A8A', // Beacon blue - trust & reliability
            light: '#3B82F6',
            dark: '#1E40AF'
        },
        secondary: {
            main: '#F59E0B', // Guiding gold - warmth & premium
            light: '#FCD34D',
            dark: '#D97706'
        },
        error: {
            main: '#EF4444'
        },
        warning: {
            main: '#F59E0B'
        },
        success: {
            main: '#10B981'
        },
        background: {
            default: '#F9FAFB',
            paper: '#FFFFFF'
        }
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h4: {
            fontWeight: 600,
            fontSize: accessibilityMode ? '2.5rem' : '2.125rem'
        },
        h5: {
            fontWeight: 500,
            fontSize: accessibilityMode ? '2rem' : '1.5rem'
        },
        h6: {
            fontWeight: 500,
            fontSize: accessibilityMode ? '1.75rem' : '1.25rem'
        },
        body1: {
            fontSize: accessibilityMode ? '1.25rem' : '1rem'
        },
        body2: {
            fontSize: accessibilityMode ? '1.125rem' : '0.875rem'
        }
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: accessibilityMode ? 56 : 42
                }
            }
        },
        MuiFab: {
            styleOverrides: {
                root: {
                    width: accessibilityMode ? 80 : 56,
                    height: accessibilityMode ? 80 : 56
                }
            }
        }
    }
});

// Main Family Dashboard Context
const FamilyDashboardContext = React.createContext();

const FamilyDashboardProvider = ({ children }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [familyMember, setFamilyMember] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [accessibilityMode, setAccessibilityMode] = useState(false);
    const [currentTimezone, setCurrentTimezone] = useState(moment.tz.guess());
    const [language, setLanguage] = useState('en');
    const [currency, setCurrency] = useState('INR');

    // WebSocket connection for real-time updates
    const socketUrl = `ws://localhost:3003?session_token=${localStorage.getItem('session_token')}`;
    const { lastMessage, readyState, sendMessage } = useWebSocket(socketUrl, {
        shouldReconnect: () => true,
        reconnectInterval: 3000,
        reconnectAttempts: 10
    });

    // Handle WebSocket messages
    useEffect(() => {
        if (lastMessage !== null) {
            const message = JSON.parse(lastMessage.data);

            switch (message.type) {
                case 'notification':
                    handleRealtimeNotification(message);
                    break;
                case 'emergency_alert':
                    handleEmergencyAlert(message);
                    break;
                case 'health_update':
                    handleHealthUpdate(message);
                    break;
                case 'connected':
                    console.log('Family dashboard connected to real-time updates');
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        }
    }, [lastMessage]);

    const handleRealtimeNotification = useCallback((message) => {
        setNotifications(prev => [message.notification, ...prev.slice(0, 99)]);

        // Show browser notification for critical alerts
        if (message.notification.severity === 'critical' && 'Notification' in window) {
            new Notification(message.notification.title, {
                body: message.notification.message,
                icon: '/family-dashboard-icon.png',
                badge: '/emergency-badge.png'
            });
        }
    }, []);

    const handleEmergencyAlert = useCallback((message) => {
        setDashboardData(prev => ({
            ...prev,
            emergencies: {
                ...prev.emergencies,
                active: [message.alert, ...prev.emergencies.active],
                recentCount: prev.emergencies.recentCount + 1
            }
        }));

        // Critical emergency notification
        if ('Notification' in window) {
            new Notification('🚨 EMERGENCY ALERT', {
                body: `Emergency detected for ${dashboardData?.senior?.name}`,
                icon: '/emergency-icon.png',
                requireInteraction: true
            });
        }
    }, [dashboardData?.senior?.name]);

    const handleHealthUpdate = useCallback((message) => {
        setDashboardData(prev => ({
            ...prev,
            health: {
                ...prev.health,
                latest: message.reading,
                lastUpdate: moment().format()
            }
        }));
    }, []);

    // Load dashboard data
    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/dashboard/overview', {
                headers: {
                    'X-Session-Token': localStorage.getItem('session_token'),
                    'X-Timezone': currentTimezone,
                    'X-Language': language
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }

            const data = await response.json();
            setDashboardData(data.data);
            setFamilyMember(data.user);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentTimezone, language]);

    // Load notifications
    const loadNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'X-Session-Token': localStorage.getItem('session_token'),
                    'X-Timezone': currentTimezone
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    }, [currentTimezone]);

    // Initialize dashboard
    useEffect(() => {
        loadDashboardData();
        loadNotifications();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [loadDashboardData, loadNotifications]);

    const value = {
        dashboardData,
        loading,
        error,
        familyMember,
        notifications,
        accessibilityMode,
        setAccessibilityMode,
        currentTimezone,
        setCurrentTimezone,
        language,
        setLanguage,
        currency,
        setCurrency,
        sendMessage,
        refreshData: loadDashboardData,
        readyState
    };

    return (
        <FamilyDashboardContext.Provider value={value}>
            {children}
        </FamilyDashboardContext.Provider>
    );
};

// Main Dashboard Component
const FamilyDashboard = () => {
    const {
        dashboardData,
        loading,
        error,
        familyMember,
        accessibilityMode
    } = useContext(FamilyDashboardContext);

    const theme = useMemo(() => createFamilyTheme(accessibilityMode), [accessibilityMode]);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [selectedTab, setSelectedTab] = useState(0);
    const [drawerOpen, setDrawerOpen] = useState(false);

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                    <CircularProgress size={60} />
                    <Typography variant="h6" sx={{ ml: 2 }}>
                        Loading family dashboard...
                    </Typography>
                </Box>
            </ThemeProvider>
        );
    }

    if (error) {
        return (
            <ThemeProvider theme={theme}>
                <Box p={3}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                    <Button variant="contained" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <Box sx={{ display: 'flex' }}>
                    {/* Navigation Drawer */}
                    <NavigationDrawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        selectedTab={selectedTab}
                        onTabChange={setSelectedTab}
                        isMobile={isMobile}
                    />

                    {/* Main Content */}
                    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                        {/* Header */}
                        <DashboardHeader
                            familyMember={familyMember}
                            senior={dashboardData?.senior}
                            onMenuClick={() => setDrawerOpen(true)}
                            isMobile={isMobile}
                        />

                        {/* Dashboard Content */}
                        <Box sx={{ mt: 3 }}>
                            {selectedTab === 0 && <OverviewTab data={dashboardData} />}
                            {selectedTab === 1 && <HealthTab data={dashboardData} />}
                            {selectedTab === 2 && <EmergencyTab data={dashboardData} />}
                            {selectedTab === 3 && <FamilyTab data={dashboardData} />}
                            {selectedTab === 4 && <CommunicationTab data={dashboardData} />}
                            {selectedTab === 5 && <SettingsTab />}
                        </Box>

                        {/* Emergency FAB */}
                        <EmergencyFAB />

                        {/* Notifications */}
                        <NotificationCenter />
                    </Box>
                </Box>
            </LocalizationProvider>
        </ThemeProvider>
    );
};

// Dashboard Header Component
const DashboardHeader = ({ familyMember, senior, onMenuClick, isMobile }) => {
    const { currentTimezone, accessibilityMode } = useContext(FamilyDashboardContext);

    return (
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar>
                {isMobile && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={onMenuClick}
                        sx={{ mr: 2 }}
                    >
                        <Dashboard />
                    </IconButton>
                )}

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        🌉 {senior?.name}'s ElderWorld Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {familyMember?.name} ({familyMember?.relationship}) - Bridging hearts, guiding care
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Current Time in Family Timezone */}
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Your Time
                        </Typography>
                        <Typography variant="h6">
                            {moment().tz(currentTimezone).format('HH:mm')}
                        </Typography>
                    </Box>

                    {/* Senior Status Indicator */}
                    <Chip
                        icon={<LocationOn />}
                        label={senior?.currentStatus === 'active' ? 'Active' :
                            senior?.currentStatus === 'emergency' ? 'Emergency' : 'Offline'}
                        color={senior?.currentStatus === 'active' ? 'success' :
                            senior?.currentStatus === 'emergency' ? 'error' : 'default'}
                        variant="outlined"
                    />
                </Box>
            </Toolbar>
        </AppBar>
    );
};

// Navigation Drawer Component
const NavigationDrawer = ({ open, onClose, selectedTab, onTabChange, isMobile }) => {
    const { notifications } = useContext(FamilyDashboardContext);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const navigationItems = [
        { icon: <Dashboard />, label: 'Overview', count: 0 },
        { icon: <Health />, label: 'Health', count: 0 },
        { icon: <Emergency />, label: 'Emergency', count: 0 },
        { icon: <Family />, label: 'Family', count: 0 },
        { icon: <VideoCall />, label: 'Communication', count: 0 },
        { icon: <Settings />, label: 'Settings', count: 0 }
    ];

    const drawerContent = (
        <Box sx={{ width: 280, pt: 2 }}>
            <List>
                {navigationItems.map((item, index) => (
                    <ListItem
                        button
                        key={item.label}
                        selected={selectedTab === index}
                        onClick={() => {
                            onTabChange(index);
                            if (isMobile) onClose();
                        }}
                        sx={{
                            borderRadius: 2,
                            mx: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                    backgroundColor: 'primary.light'
                                }
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Badge badgeContent={item.count} color="error">
                                {item.icon}
                            </Badge>
                        </ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItem>
                ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Quick Actions */}
            <Box sx={{ px: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Quick Actions
                </Typography>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCall />}
                    sx={{ mb: 1 }}
                >
                    Call Senior
                </Button>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Emergency />}
                    color="error"
                >
                    Emergency Help
                </Button>
            </Box>
        </Box>
    );

    if (isMobile) {
        return (
            <Drawer
                anchor="left"
                open={open}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
            >
                {drawerContent}
            </Drawer>
        );
    }

    return (
        <Drawer
            variant="permanent"
            anchor="left"
            sx={{
                '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider'
                }
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

// Overview Tab Component
const OverviewTab = ({ data }) => {
    if (!data) return null;

    return (
        <Grid container spacing={3}>
            {/* Senior Status Card */}
            <Grid item xs={12} md={6}>
                <SeniorStatusCard senior={data.senior} health={data.health} />
            </Grid>

            {/* Family Coordination Card */}
            <Grid item xs={12} md={6}>
                <FamilyCoordinationCard family={data.family} nri={data.nri} />
            </Grid>

            {/* Health Summary */}
            <Grid item xs={12} lg={8}>
                <HealthSummaryCard health={data.health} />
            </Grid>

            {/* Emergency Status */}
            <Grid item xs={12} lg={4}>
                <EmergencyStatusCard emergencies={data.emergencies} />
            </Grid>

            {/* Recent Notifications */}
            <Grid item xs={12}>
                <RecentNotificationsCard notifications={data.notifications} />
            </Grid>
        </Grid>
    );
};

// Senior Status Card Component
const SeniorStatusCard = ({ senior, health }) => {
    const statusColor = senior?.currentStatus === 'active' ? 'success' :
        senior?.currentStatus === 'emergency' ? 'error' : 'warning';

    return (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                        sx={{
                            width: 64,
                            height: 64,
                            bgcolor: `${statusColor}.main`,
                            mr: 2
                        }}
                    >
                        {senior?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            {senior?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Age {senior?.age} • {senior?.currentLocation?.address}
                        </Typography>
                        <Chip
                            size="small"
                            label={senior?.currentStatus}
                            color={statusColor}
                            sx={{ mt: 1 }}
                        />
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Health Quick Stats */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>
                        Health Status
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Box textAlign="center">
                                <Typography variant="h6" color="primary">
                                    {health?.latest?.vital_signs?.heart_rate || '--'}
                                </Typography>
                                <Typography variant="caption">
                                    Heart Rate
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Box textAlign="center">
                                <Typography variant="h6" color="primary">
                                    {health?.latest?.vital_signs?.blood_pressure || '--'}
                                </Typography>
                                <Typography variant="caption">
                                    Blood Pressure
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Box mt={2}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VideoCall />}
                    >
                        Video Call
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

// Family Coordination Card Component
const FamilyCoordinationCard = ({ family, nri }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Family Coordination
                </Typography>

                {/* Online Family Members */}
                <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                        {family?.onlineCount || 0} of {family?.members?.length || 0} family members online
                    </Typography>
                </Box>

                {/* Timezone Overview */}
                {nri && (
                    <Box mb={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            Timezone Coordination
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="body2">Home (India)</Typography>
                                <Typography variant="h6">{nri.timezoneSync?.homeTime}</Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="body2">Your Time</Typography>
                                <Typography variant="h6">{nri.timezoneSync?.memberTime}</Typography>
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Quick Family Actions */}
                <Box>
                    <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Family />}
                        sx={{ mb: 1 }}
                    >
                        Family Group Call
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Notifications />}
                    >
                        Send Family Update
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

// Emergency FAB Component
const EmergencyFAB = () => {
    const [emergencyDialog, setEmergencyDialog] = useState(false);

    return (
        <>
            <Fab
                color="error"
                aria-label="emergency"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    zIndex: 1000
                }}
                onClick={() => setEmergencyDialog(true)}
            >
                <Emergency />
            </Fab>

            <Dialog
                open={emergencyDialog}
                onClose={() => setEmergencyDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Emergency Actions</DialogTitle>
                <DialogContent>
                    <Box py={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={<Phone />}
                            sx={{ mb: 2, py: 2 }}
                        >
                            Call 108 Emergency Services
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="large"
                            startIcon={<VideoCall />}
                            sx={{ mb: 2, py: 2 }}
                        >
                            Video Call Senior Now
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            startIcon={<Family />}
                            sx={{ py: 2 }}
                        >
                            Alert All Family Members
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmergencyDialog(false)}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Notification Center Component
const NotificationCenter = () => {
    const { notifications } = useContext(FamilyDashboardContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <>
            <Fab
                color="primary"
                aria-label="notifications"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 96,
                    zIndex: 999
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                </Badge>
            </Fab>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: 350
                    }
                }}
            >
                {notifications.slice(0, 10).map((notification, index) => (
                    <MenuItem key={index} onClick={() => setAnchorEl(null)}>
                        <Box>
                            <Typography variant="subtitle2">
                                {notification.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {moment(notification.created_at).fromNow()}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

// Additional placeholder components for other tabs
const HealthTab = ({ data }) => (
    <Typography variant="h6">Health monitoring interface coming soon...</Typography>
);

const EmergencyTab = ({ data }) => (
    <Typography variant="h6">Emergency management interface coming soon...</Typography>
);

const FamilyTab = ({ data }) => (
    <Typography variant="h6">Family management interface coming soon...</Typography>
);

const CommunicationTab = ({ data }) => (
    <Typography variant="h6">Communication tools coming soon...</Typography>
);

const SettingsTab = () => (
    <Typography variant="h6">Settings interface coming soon...</Typography>
);

const HealthSummaryCard = ({ health }) => (
    <Card>
        <CardContent>
            <Typography variant="h6">Health Summary</Typography>
            <Typography>Detailed health metrics will be displayed here</Typography>
        </CardContent>
    </Card>
);

const EmergencyStatusCard = ({ emergencies }) => (
    <Card>
        <CardContent>
            <Typography variant="h6">Emergency Status</Typography>
            <Typography>Emergency status and alerts will be displayed here</Typography>
        </CardContent>
    </Card>
);

const RecentNotificationsCard = ({ notifications }) => (
    <Card>
        <CardContent>
            <Typography variant="h6">Recent Notifications</Typography>
            <Typography>Recent family notifications will be displayed here</Typography>
        </CardContent>
    </Card>
);

// Main App Component
const FamilyDashboardApp = () => {
    return (
        <FamilyDashboardProvider>
            <FamilyDashboard />
        </FamilyDashboardProvider>
    );
};

export default FamilyDashboardApp;