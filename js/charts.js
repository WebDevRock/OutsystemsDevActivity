/**
 * Charts Module
 * Handles all chart creation and updates using Chart.js
 */

const ChartManager = {
    // Store chart instances
    charts: {},
    
    // Color palette
    colors: {
        primary: '#ea1d24',
        secondary: '#333333',
        accent: '#00a8e1',
        success: '#52c41a',
        warning: '#faad14',
        palette: [
            '#ea1d24', '#00a8e1', '#52c41a', '#faad14', '#722ed1',
            '#eb2f96', '#13c2c2', '#fa8c16', '#a0d911', '#2f54eb'
        ]
    },

    /**
     * Get color from palette
     */
    getColor(index) {
        return this.colors.palette[index % this.colors.palette.length];
    },

    /**
     * Destroy a chart if it exists
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    },

    /**
     * Create daily activity chart
     */
    createDailyActivityChart(data) {
        this.destroyChart('daily-activity');
        
        const ctx = document.getElementById('daily-activity-chart');
        if (!ctx) return;

        const labels = data.map(item => item.PublishDate);
        const counts = data.map(item => item.PublishCount);

        this.charts['daily-activity'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Publishes',
                    data: counts,
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                return new Date(context[0].label).toLocaleDateString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    /**
     * Create application overview chart
     */
    createApplicationOverviewChart(data, limit = 10) {
        this.destroyChart('app-overview');
        
        const ctx = document.getElementById('app-overview-chart');
        if (!ctx) return;

        const topApps = data.slice(0, limit);
        const labels = topApps.map(item => item.name);
        const counts = topApps.map(item => item.count);
        const colors = topApps.map((_, index) => this.getColor(index));

        this.charts['app-overview'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Publishes',
                    data: counts,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    /**
     * Create developer activity chart
     */
    createDeveloperChart(data, limit = 10) {
        this.destroyChart('developer');
        
        const ctx = document.getElementById('developer-chart');
        if (!ctx) return;

        const topDevs = data.slice(0, limit);
        const labels = topDevs.map(item => item.name);
        const counts = topDevs.map(item => item.count);

        this.charts['developer'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Publishes',
                    data: counts,
                    backgroundColor: this.colors.accent,
                    borderColor: this.colors.accent,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    },

    /**
     * Create activity heatmap
     */
    createHeatmapChart(heatmapData) {
        this.destroyChart('heatmap');
        
        const ctx = document.getElementById('heatmap-chart');
        if (!ctx) return;

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        
        // Convert heatmap data to matrix format
        const data = [];
        days.forEach((day, dayIndex) => {
            hours.forEach((hour, hourIndex) => {
                const value = heatmapData[day] ? heatmapData[day][hourIndex] || 0 : 0;
                data.push({
                    x: hourIndex,
                    y: dayIndex,
                    v: value
                });
            });
        });

        // Find max value for color scaling
        const maxValue = Math.max(...data.map(d => d.v), 1);

        this.charts['heatmap'] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Publishes',
                    data: data.map(d => ({x: d.x, y: d.y, r: d.v > 0 ? (d.v / maxValue) * 20 + 5 : 0})),
                    backgroundColor: data.map(d => {
                        if (d.v === 0) return 'rgba(0,0,0,0.05)';
                        const intensity = d.v / maxValue;
                        return `rgba(234, 29, 36, ${0.3 + intensity * 0.7})`;
                    }),
                    borderWidth: 1,
                    borderColor: '#ccc'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const point = data[context[0].dataIndex];
                                return `${days[point.y]} ${hours[point.x]}`;
                            },
                            label: (context) => {
                                const point = data[context.dataIndex];
                                return `Publishes: ${point.v}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: 23.5,
                        ticks: {
                            stepSize: 2,
                            callback: (value) => `${Math.round(value)}:00`
                        },
                        title: {
                            display: true,
                            text: 'Hour of Day'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: 6.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => days[Math.round(value)] || ''
                        },
                        title: {
                            display: true,
                            text: 'Day of Week'
                        }
                    }
                }
            }
        });
    },

    /**
     * Create timeline comparison chart
     */
    createTimelineChart(weeklyData, topN = 5) {
        this.destroyChart('timeline');
        
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) return;

        // Get all weeks and sort
        const weeks = Object.keys(weeklyData).sort();
        
        // Get top N applications by total publishes
        const appTotals = {};
        Object.values(weeklyData).forEach(week => {
            Object.entries(week).forEach(([app, count]) => {
                appTotals[app] = (appTotals[app] || 0) + count;
            });
        });
        
        const topApps = Object.entries(appTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([app]) => app);

        // Create datasets
        const datasets = topApps.map((app, index) => ({
            label: app,
            data: weeks.map(week => weeklyData[week][app] || 0),
            borderColor: this.getColor(index),
            backgroundColor: this.getColor(index) + '20',
            tension: 0.4,
            fill: false,
            pointRadius: 3,
            pointHoverRadius: 5
        }));

        this.charts['timeline'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeks,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    /**
     * Destroy all charts
     */
    destroyAll() {
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
}
