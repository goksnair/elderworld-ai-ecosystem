/**
 * ElderWorld Health Data Visualizations
 * Interactive Charts for Family Care Platform
 * Phase 2 Implementation - August 6, 2025
 */

class ElderWorldCharts {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#3b82f6',
            success: '#22c55e',
            warning: '#f59e0b',
            error: '#ef4444',
            gray: '#6b7280'
        };

        this.init();
    }

    /**
     * Initialize chart system
     */
    async init() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            await this.loadChartJS();
        }

        this.setupDefaultConfig();
        this.createHealthTrendCharts();
        this.createRealTimeCharts();

        console.log('ElderWorld Charts System initialized');
    }

    /**
     * Load Chart.js library dynamically
     */
    loadChartJS() {
        return new Promise((resolve, reject) => {
            if (document.getElementById('chartjs-script')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = 'chartjs-script';
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Setup default Chart.js configuration
     */
    setupDefaultConfig() {
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#6b7280';
        Chart.defaults.borderColor = '#e5e7eb';
        Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }

    /**
     * Create health trend charts
     */
    createHealthTrendCharts() {
        // Heart Rate Trend Chart
        this.createHeartRateChart();

        // Activity Level Chart
        this.createActivityChart();

        // Sleep Pattern Chart
        this.createSleepChart();

        // Medication Adherence Chart
        this.createMedicationChart();

        // Weekly Health Summary
        this.createWeeklyHealthChart();
    }

    /**
     * Create heart rate trend chart
     */
    createHeartRateChart() {
        const canvas = document.getElementById('heartRateChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Sample data - in production, this would come from your API
        const heartRateData = this.generateHeartRateData();

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: heartRateData.labels,
                datasets: [{
                    label: 'Heart Rate (BPM)',
                    data: heartRateData.values,
                    borderColor: this.colors.error,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.error,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: '24-Hour Heart Rate Trend',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        color: '#1f2937'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.error,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (context) => `Time: ${context[0].label}`,
                            label: (context) => `Heart Rate: ${context.parsed.y} BPM`
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'BPM',
                            font: {
                                weight: '600'
                            }
                        },
                        suggestedMin: 60,
                        suggestedMax: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        });

        this.charts.set('heartRate', chart);
    }

    /**
     * Create activity level chart
     */
    createActivityChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const activityData = this.generateActivityData();

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: activityData.labels,
                datasets: [{
                    label: 'Steps',
                    data: activityData.steps,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: this.colors.success,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Weekly Activity Levels',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        color: '#1f2937'
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: (context) => `Steps: ${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Steps',
                            font: {
                                weight: '600'
                            }
                        },
                        ticks: {
                            callback: (value) => value.toLocaleString()
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutBounce'
                }
            }
        });

        this.charts.set('activity', chart);
    }

    /**
     * Create sleep pattern chart
     */
    createSleepChart() {
        const canvas = document.getElementById('sleepChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sleepData = this.generateSleepData();

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Deep Sleep', 'Light Sleep', 'REM Sleep', 'Awake'],
                datasets: [{
                    data: sleepData.values,
                    backgroundColor: [
                        '#1e3a8a',
                        '#3b82f6',
                        '#60a5fa',
                        '#e5e7eb'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    title: {
                        display: true,
                        text: 'Sleep Quality Breakdown',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        color: '#1f2937'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value}h (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });

        this.charts.set('sleep', chart);
    }

    /**
     * Create medication adherence chart
     */
    createMedicationChart() {
        const canvas = document.getElementById('medicationChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const medicationData = this.generateMedicationData();

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: medicationData.labels,
                datasets: [{
                    label: 'Adherence %',
                    data: medicationData.values,
                    borderColor: this.colors.warning,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: this.colors.warning,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Medication Adherence Trend',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        color: '#1f2937'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Adherence %',
                            font: {
                                weight: '600'
                            }
                        },
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });

        this.charts.set('medication', chart);
    }

    /**
     * Create weekly health summary chart
     */
    createWeeklyHealthChart() {
        const canvas = document.getElementById('weeklyHealthChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const weeklyData = this.generateWeeklyHealthData();

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Heart Rate', 'Sleep Quality', 'Activity Level', 'Medication', 'Mood', 'Appetite'],
                datasets: [{
                    label: 'This Week',
                    data: weeklyData.thisWeek,
                    borderColor: this.colors.primary,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    borderWidth: 2
                }, {
                    label: 'Last Week',
                    data: weeklyData.lastWeek,
                    borderColor: this.colors.gray,
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    pointBackgroundColor: this.colors.gray,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Health Overview Comparison',
                        font: {
                            size: 16,
                            weight: '600'
                        },
                        color: '#1f2937'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 2500,
                    easing: 'easeOutElastic'
                }
            }
        });

        this.charts.set('weeklyHealth', chart);
    }

    /**
     * Create real-time updating charts
     */
    createRealTimeCharts() {
        // Start real-time updates
        this.startRealTimeUpdates();
    }

    /**
     * Start real-time data updates
     */
    startRealTimeUpdates() {
        // Update every 30 seconds (in production, use WebSockets)
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000);
    }

    /**
     * Update charts with new real-time data
     */
    updateRealTimeData() {
        const heartRateChart = this.charts.get('heartRate');
        if (heartRateChart) {
            // Add new data point
            const newHeartRate = 68 + Math.random() * 16; // Simulate new reading
            const currentTime = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            heartRateChart.data.labels.push(currentTime);
            heartRateChart.data.datasets[0].data.push(Math.round(newHeartRate));

            // Keep only last 20 data points
            if (heartRateChart.data.labels.length > 20) {
                heartRateChart.data.labels.shift();
                heartRateChart.data.datasets[0].data.shift();
            }

            heartRateChart.update('none'); // No animation for real-time updates
        }
    }

    /**
     * Generate sample heart rate data
     */
    generateHeartRateData() {
        const labels = [];
        const values = [];
        const now = new Date();

        for (let i = 23; i >= 0; i--) {
            const time = new Date(now - (i * 60 * 60 * 1000));
            labels.push(time.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }));

            // Generate realistic heart rate data
            const baseRate = 72;
            const variation = Math.sin(i / 4) * 8 + Math.random() * 6 - 3;
            values.push(Math.round(baseRate + variation));
        }

        return { labels, values };
    }

    /**
     * Generate sample activity data
     */
    generateActivityData() {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const steps = [2847, 3200, 2950, 3800, 4200, 2100, 1800];

        return { labels, steps };
    }

    /**
     * Generate sample sleep data
     */
    generateSleepData() {
        return {
            values: [2.1, 3.2, 1.8, 0.3] // Deep, Light, REM, Awake (hours)
        };
    }

    /**
     * Generate sample medication data
     */
    generateMedicationData() {
        const labels = [];
        const values = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now - (i * 24 * 60 * 60 * 1000));
            labels.push(date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }));

            // Generate realistic adherence data (85-100%)
            const adherence = 85 + Math.random() * 15;
            values.push(Math.round(adherence));
        }

        return { labels, values };
    }

    /**
     * Generate sample weekly health data
     */
    generateWeeklyHealthData() {
        return {
            thisWeek: [85, 92, 78, 95, 88, 82],
            lastWeek: [82, 85, 75, 88, 90, 85]
        };
    }

    /**
     * Resize all charts (useful for responsive design)
     */
    resizeCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    /**
     * Update chart theme (for dark mode support)
     */
    updateTheme(isDark = false) {
        const textColor = isDark ? '#f9fafb' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;

        this.charts.forEach(chart => {
            chart.options.plugins.title.color = textColor;
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    const scale = chart.options.scales[scaleKey];
                    if (scale.title) scale.title.color = textColor;
                    if (scale.grid) scale.grid.color = gridColor;
                });
            }
            chart.update();
        });
    }

    /**
     * Destroy all charts
     */
    destroy() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.elderBridgeCharts = new ElderWorldCharts();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.elderBridgeCharts) {
        window.elderBridgeCharts.resizeCharts();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElderWorldCharts;
}
