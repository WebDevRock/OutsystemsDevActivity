/**
 * Main Application Module
 * Handles UI interactions and coordinates data loading and visualization
 */

class OutSystemsActivityApp {
    constructor() {
        this.currentData = null;
        this.filteredData = null;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadApplicationList();
        
        // Load mock data by default
        APIService.useMockData();
        this.showInfo('Using mock data. Click "Load Data" to view charts.');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Load data button
        document.getElementById('load-data').addEventListener('click', () => {
            this.loadData();
        });

        // Use mock data button
        document.getElementById('use-mock-data').addEventListener('click', () => {
            APIService.useMockData();
            document.getElementById('api-endpoint').value = '';
            this.showInfo('Switched to mock data mode. Click "Load Data" to refresh.');
        });

        // Export data button
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportToCSV();
        });

        // API endpoint input - switch to API mode when changed
        document.getElementById('api-endpoint').addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                APIService.setEndpoint(e.target.value.trim());
            }
        });

        // Application filter
        document.getElementById('app-filter').addEventListener('change', (e) => {
            this.filterData(e.target.value);
        });

        // Table search
        document.getElementById('table-search').addEventListener('input', (e) => {
            this.filterTable(e.target.value);
        });

        // Table limit
        document.getElementById('table-limit').addEventListener('change', () => {
            this.updateTable();
        });

        // Days back selector
        document.getElementById('days-back').addEventListener('change', (e) => {
            document.getElementById('stat-days').textContent = e.target.value;
        });
    }

    /**
     * Load application list for filter dropdown
     */
    async loadApplicationList() {
        const result = await APIService.getApplicationList();
        
        if (result.success) {
            const select = document.getElementById('app-filter');
            select.innerHTML = '<option value="">All Applications</option>';
            
            result.data.data.forEach(app => {
                const option = document.createElement('option');
                option.value = app.ApplicationName;
                option.textContent = app.ApplicationName;
                select.appendChild(option);
            });
        }
    }

    /**
     * Load all data and update visualizations
     */
    async loadData() {
        this.showLoading(true);
        this.hideError();
        
        try {
            const daysBack = parseInt(document.getElementById('days-back').value);
            const application = document.getElementById('app-filter').value;
            
            // Fetch all data
            const [activityResult, summaryResult] = await Promise.all([
                APIService.getPublishActivity(daysBack, application),
                APIService.getDailySummary(daysBack)
            ]);

            if (!activityResult.success) {
                throw new Error(activityResult.error);
            }

            if (!summaryResult.success) {
                throw new Error(summaryResult.error);
            }

            this.currentData = activityResult.data.data;
            this.filteredData = this.currentData;
            const dailySummary = summaryResult.data.data;

            // Update statistics
            this.updateStats(daysBack);

            // Create all charts
            this.createAllCharts(dailySummary);

            // Update table
            this.updateTable();

            // Update last update time
            document.getElementById('last-update').textContent = new Date().toLocaleString();

            this.showInfo('Data loaded successfully!');
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(`Failed to load data: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Create all charts
     */
    createAllCharts(dailySummary) {
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('No data available to display charts.');
            return;
        }

        // Daily activity chart
        ChartManager.createDailyActivityChart(dailySummary);

        // Application overview
        const byApp = APIService.processData.byApplication(this.currentData);
        ChartManager.createApplicationOverviewChart(byApp, 10);

        // Developer activity
        const byDev = APIService.processData.byDeveloper(this.currentData);
        ChartManager.createDeveloperChart(byDev, 10);

        // Heatmap
        const heatmapData = APIService.processData.byDayAndHour(this.currentData);
        ChartManager.createHeatmapChart(heatmapData);

        // Timeline comparison
        const weeklyData = APIService.processData.byWeek(this.currentData);
        ChartManager.createTimelineChart(weeklyData, 5);
    }

    /**
     * Update statistics cards
     */
    updateStats(daysBack) {
        if (!this.currentData) return;

        const stats = APIService.processData.calculateStats(this.currentData, daysBack);

        document.getElementById('stat-total').textContent = stats.totalPublishes;
        document.getElementById('stat-apps').textContent = stats.uniqueApplications;
        document.getElementById('stat-devs').textContent = stats.uniqueDevelopers;
        document.getElementById('stat-avg').textContent = stats.averageDaily;
    }

    /**
     * Filter data by application
     */
    filterData(applicationName) {
        if (!this.currentData) return;

        if (applicationName) {
            this.filteredData = this.currentData.filter(
                item => item.ApplicationName === applicationName
            );
        } else {
            this.filteredData = this.currentData;
        }

        this.updateTable();
    }

    /**
     * Update the data table
     */
    updateTable() {
        if (!this.filteredData) return;

        const tbody = document.getElementById('table-body');
        const limit = parseInt(document.getElementById('table-limit').value);
        const searchTerm = document.getElementById('table-search').value.toLowerCase();

        // Filter by search term
        let displayData = this.filteredData;
        if (searchTerm) {
            displayData = displayData.filter(item =>
                item.ApplicationName.toLowerCase().includes(searchTerm) ||
                item.Version.toLowerCase().includes(searchTerm) ||
                item.PublishedBy.toLowerCase().includes(searchTerm) ||
                (item.Solution && item.Solution.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by date descending
        displayData = [...displayData].sort((a, b) => 
            new Date(b.PublishDate) - new Date(a.PublishDate)
        );

        // Apply limit
        const limitedData = displayData.slice(0, limit);

        // Clear table
        tbody.innerHTML = '';

        // Populate table
        if (limitedData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        No records found.
                    </td>
                </tr>
            `;
        } else {
            limitedData.forEach(item => {
                const row = document.createElement('tr');
                const date = new Date(item.PublishDate);
                
                row.innerHTML = `
                    <td><strong>${this.escapeHtml(item.ApplicationName)}</strong></td>
                    <td>${this.escapeHtml(item.Version)}</td>
                    <td>${this.escapeHtml(item.PublishedBy)}</td>
                    <td>${date.toLocaleString()}</td>
                    <td>${item.Solution ? this.escapeHtml(item.Solution) : '-'}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // Update table info
        document.getElementById('table-info').textContent = 
            `Showing ${limitedData.length} of ${displayData.length} records`;
    }

    /**
     * Filter table by search term
     */
    filterTable(searchTerm) {
        this.updateTable();
    }

    /**
     * Export data to CSV
     */
    exportToCSV() {
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('No data to export.');
            return;
        }

        const headers = ['Application', 'Version', 'Published By', 'Publish Date', 'Solution'];
        const rows = this.currentData.map(item => [
            item.ApplicationName,
            item.Version,
            item.PublishedBy,
            new Date(item.PublishDate).toISOString(),
            item.Solution || ''
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `outsystems-activity-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showInfo('Data exported successfully!');
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.style.display = show ? 'block' : 'none';
        document.getElementById('load-data').disabled = show;
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    /**
     * Hide error message
     */
    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    /**
     * Show info message (using error div with different styling)
     */
    showInfo(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.backgroundColor = '#e6f7ff';
        errorDiv.style.borderColor = '#00a8e1';
        errorDiv.style.color = '#00a8e1';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
            errorDiv.style.backgroundColor = '#fff1f0';
            errorDiv.style.borderColor = 'var(--error-color)';
            errorDiv.style.color = 'var(--error-color)';
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OutSystemsActivityApp();
});
