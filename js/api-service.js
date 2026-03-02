/**
 * API Service Module
 * Handles all API calls and data fetching
 */

const APIService = {
    // Configuration
    config: {
        useMockData: true,
        apiEndpoint: '',
        mockDataPath: './mock-data/'
    },

    /**
     * Set API endpoint
     */
    setEndpoint(endpoint) {
        this.config.apiEndpoint = endpoint;
        this.config.useMockData = false;
    },

    /**
     * Enable mock data mode
     */
    useMockData() {
        this.config.useMockData = true;
    },

    /**
     * Generic fetch function with error handling
     */
    async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Fetch error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get publish activity data
     * @param {number} daysBack - Number of days to look back
     * @param {string} application - Optional application filter
     */
    async getPublishActivity(daysBack = 30, application = '') {
        if (this.config.useMockData) {
            return this.fetchData(`${this.config.mockDataPath}publish-activity.json`);
        }
        
        const params = new URLSearchParams({
            daysBack: daysBack.toString()
        });
        
        if (application) {
            params.append('application', application);
        }
        
        const url = `${this.config.apiEndpoint}/publish-activity?${params}`;
        return this.fetchData(url);
    },

    /**
     * Get application list with statistics
     */
    async getApplicationList() {
        if (this.config.useMockData) {
            return this.fetchData(`${this.config.mockDataPath}application-list.json`);
        }
        
        const url = `${this.config.apiEndpoint}/application-list`;
        return this.fetchData(url);
    },

    /**
     * Get daily summary statistics
     * @param {number} daysBack - Number of days to look back
     */
    async getDailySummary(daysBack = 30) {
        if (this.config.useMockData) {
            return this.fetchData(`${this.config.mockDataPath}daily-summary.json`);
        }
        
        const params = new URLSearchParams({
            daysBack: daysBack.toString()
        });
        
        const url = `${this.config.apiEndpoint}/daily-summary?${params}`;
        return this.fetchData(url);
    },

    /**
     * Get activity for a specific application
     * @param {string} applicationName - Name of the application
     * @param {number} daysBack - Number of days to look back
     */
    async getApplicationActivity(applicationName, daysBack = 30) {
        if (this.config.useMockData) {
            // Filter mock data by application
            const result = await this.fetchData(`${this.config.mockDataPath}publish-activity.json`);
            if (result.success) {
                result.data.data = result.data.data.filter(
                    item => item.ApplicationName === applicationName
                );
            }
            return result;
        }
        
        const params = new URLSearchParams({
            application: applicationName,
            daysBack: daysBack.toString()
        });
        
        const url = `${this.config.apiEndpoint}/application-activity?${params}`;
        return this.fetchData(url);
    },

    /**
     * Process and aggregate data for charts
     */
    processData: {
        /**
         * Group publishes by application
         */
        byApplication(data) {
            const grouped = {};
            
            data.forEach(item => {
                const app = item.ApplicationName;
                if (!grouped[app]) {
                    grouped[app] = {
                        name: app,
                        count: 0,
                        publishes: []
                    };
                }
                grouped[app].count++;
                grouped[app].publishes.push(item);
            });
            
            return Object.values(grouped).sort((a, b) => b.count - a.count);
        },

        /**
         * Group publishes by developer
         */
        byDeveloper(data) {
            const grouped = {};
            
            data.forEach(item => {
                const dev = item.PublishedBy;
                if (!grouped[dev]) {
                    grouped[dev] = {
                        name: dev,
                        count: 0,
                        publishes: []
                    };
                }
                grouped[dev].count++;
                grouped[dev].publishes.push(item);
            });
            
            return Object.values(grouped).sort((a, b) => b.count - a.count);
        },

        /**
         * Group publishes by date
         */
        byDate(data) {
            const grouped = {};
            
            data.forEach(item => {
                const date = new Date(item.PublishDate).toISOString().split('T')[0];
                if (!grouped[date]) {
                    grouped[date] = {
                        date,
                        count: 0,
                        publishes: []
                    };
                }
                grouped[date].count++;
                grouped[date].publishes.push(item);
            });
            
            return Object.values(grouped).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
        },

        /**
         * Group publishes by day of week and hour (for heatmap)
         */
        byDayAndHour(data) {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const heatmap = {};
            
            // Initialize structure
            days.forEach(day => {
                heatmap[day] = {};
                for (let hour = 0; hour < 24; hour++) {
                    heatmap[day][hour] = 0;
                }
            });
            
            // Count publishes
            data.forEach(item => {
                const date = new Date(item.PublishDate);
                const day = days[date.getDay()];
                const hour = date.getHours();
                heatmap[day][hour]++;
            });
            
            return heatmap;
        },

        /**
         * Group publishes by week for timeline comparison
         */
        byWeek(data) {
            const grouped = {};
            
            data.forEach(item => {
                const date = new Date(item.PublishDate);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if (!grouped[weekKey]) {
                    grouped[weekKey] = {};
                }
                
                const app = item.ApplicationName;
                if (!grouped[weekKey][app]) {
                    grouped[weekKey][app] = 0;
                }
                grouped[weekKey][app]++;
            });
            
            return grouped;
        },

        /**
         * Calculate statistics
         */
        calculateStats(data, daysBack) {
            const uniqueApps = new Set(data.map(item => item.ApplicationName));
            const uniqueDevs = new Set(data.map(item => item.PublishedBy));
            const avgDaily = (data.length / daysBack).toFixed(1);
            
            return {
                totalPublishes: data.length,
                uniqueApplications: uniqueApps.size,
                uniqueDevelopers: uniqueDevs.size,
                averageDaily: avgDaily
            };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}
