/**
 * Main Application Module
 * Handles UI interactions and coordinates data loading and visualization
 */

class OutSystemsActivityApp {
    constructor() {
        this.currentData = null;
        this.filteredData = null;
        this.selectedTimelineApps = null; // null means use default top 5
        this.modalSelectedApps = []; // Currently selected apps in modal
        this.allApps = []; // All available apps with counts
        this.currentFilteredApps = null; // Filtered apps based on search
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadApplicationList();
        this.initializeDateInputs();
        
        // Load mock data by default
        APIService.useMockData();
        this.showInfo('Using mock data. Click "Load Data" to view charts.');
    }

    /**
     * Initialize date inputs with default values
     */
    initializeDateInputs() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        // Set default date range (last 30 days)
        document.getElementById('end-date').valueAsDate = today;
        document.getElementById('start-date').valueAsDate = thirtyDaysAgo;
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

        // Date mode selector
        document.getElementById('date-mode').addEventListener('change', (e) => {
            this.toggleDateMode(e.target.value);
        });

        // Timeline configuration modal
        document.getElementById('timeline-config-btn').addEventListener('click', () => {
            this.showTimelineConfigModal();
        });

        document.getElementById('timeline-modal-close').addEventListener('click', () => {
            this.hideTimelineConfigModal();
        });

        document.getElementById('timeline-config-modal').addEventListener('click', (e) => {
            if (e.target.id === 'timeline-config-modal') {
                this.hideTimelineConfigModal();
            }
        });

        document.getElementById('timeline-apply-btn').addEventListener('click', () => {
            this.applyTimelineSelection();
        });

        document.getElementById('timeline-reset-btn').addEventListener('click', () => {
            this.resetTimelineSelection();
        });

        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('timeline-config-modal');
            const isModalOpen = modal.style.display === 'flex';
            
            if (!isModalOpen) return;
            
            if (e.key === 'Escape') {
                this.hideTimelineConfigModal();
            } else if (e.key === 'Enter' && e.target.id !== 'timeline-app-search') {
                // Apply selection on Enter (unless typing in search box)
                this.applyTimelineSelection();
            }
        });
    }

    /**
     * Toggle between days back and date range modes
     */
    toggleDateMode(mode) {
        const daysBackSection = document.getElementById('days-back-section');
        const dateRangeSection = document.getElementById('date-range-section');
        const endDateSection = document.getElementById('end-date-section');
        
        if (mode === 'dateRange') {
            daysBackSection.style.display = 'none';
            dateRangeSection.style.display = 'flex';
            endDateSection.style.display = 'flex';
        } else {
            daysBackSection.style.display = 'flex';
            dateRangeSection.style.display = 'none';
            endDateSection.style.display = 'none';
        }
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
            const dateMode = document.getElementById('date-mode').value;
            const application = document.getElementById('app-filter').value;
            
            // Prepare API options based on date mode
            const options = { application };
            
            if (dateMode === 'dateRange') {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                
                if (!startDate || !endDate) {
                    throw new Error('Please select both start and end dates');
                }
                
                if (new Date(startDate) > new Date(endDate)) {
                    throw new Error('Start date must be before end date');
                }
                
                options.startDate = startDate;
                options.endDate = endDate;
            } else {
                const daysBack = parseInt(document.getElementById('days-back').value);
                options.daysBack = daysBack;
            }
            
            // Fetch data
            const activityResult = await APIService.getPublishActivity(options);

            if (!activityResult.success) {
                throw new Error(activityResult.error);
            }

            this.currentData = activityResult.data.data;
            this.filteredData = this.currentData;

            // Update statistics
            this.updateStats();

            // Create all charts
            this.createAllCharts();

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
    createAllCharts() {
        if (!this.currentData || this.currentData.length === 0) {
            this.showError('No data available to display charts.');
            return;
        }

        // Application overview
        const byApp = APIService.processData.byApplication(this.currentData);
        ChartManager.createApplicationOverviewChart(byApp, 10);

        // Developer activity
        const byDev = APIService.processData.byDeveloper(this.currentData);
        ChartManager.createDeveloperChart(byDev, 10);

        // Heatmap
        const heatmapData = APIService.processData.byDayAndHour(this.currentData);
        ChartManager.createHeatmapChart(heatmapData);

        // Timeline comparison - use selected apps or default top 5
        const weeklyData = APIService.processData.byWeek(this.currentData);
        if (this.selectedTimelineApps) {
            ChartManager.createTimelineChart(weeklyData, this.selectedTimelineApps);
        } else {
            ChartManager.createTimelineChart(weeklyData, 5);
        }
    }

    /**
     * Update statistics cards
     */
    updateStats() {
        if (!this.currentData) return;

        const dateMode = document.getElementById('date-mode').value;
        let daysBack = 30;
        
        if (dateMode === 'dateRange') {
            const startDate = new Date(document.getElementById('start-date').value);
            const endDate = new Date(document.getElementById('end-date').value);
            daysBack = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        } else {
            daysBack = parseInt(document.getElementById('days-back').value);
        }

        const stats = APIService.processData.calculateStats(this.currentData, daysBack);

        document.getElementById('stat-total').textContent = stats.totalPublishes;
        document.getElementById('stat-apps').textContent = stats.uniqueApplications;
        document.getElementById('stat-devs').textContent = stats.uniqueDevelopers;
        document.getElementById('stat-avg').textContent = stats.averageDaily;
        document.getElementById('stat-days').textContent = daysBack;
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
     * Show timeline configuration modal
     */
    showTimelineConfigModal() {
        if (!this.currentData) {
            this.showError('Please load data first.');
            return;
        }

        // Get all applications with their publish counts
        const appData = APIService.processData.byApplication(this.currentData);
        // appData is an array of { name, count, publishes } objects
        this.allApps = appData.map(item => ({ app: item.name, count: item.count }));

        // Get top 5 for default
        const top5Apps = this.allApps.slice(0, 5).map(item => item.app);
        const currentSelection = this.selectedTimelineApps || top5Apps;
        
        // Store current selection for the modal
        this.modalSelectedApps = [...currentSelection];

        // Render the modal content
        this.renderTimelineAppList();

        // Add search listener
        const searchInput = document.getElementById('timeline-app-search');
        searchInput.value = '';
        searchInput.addEventListener('input', (e) => {
            this.filterTimelineApps(e.target.value);
        });

        // Show modal
        document.getElementById('timeline-config-modal').style.display = 'flex';
        
        // Focus search input
        setTimeout(() => searchInput.focus(), 100);
    }

    /**
     * Render the timeline app list with current filters
     */
    renderTimelineAppList(filteredApps = null) {
        const appsToShow = filteredApps || this.allApps;
        const appListContainer = document.getElementById('timeline-app-list');
        const selectedSection = document.getElementById('selected-apps-section');
        const selectedListContainer = document.getElementById('selected-apps-list');
        const noResultsMessage = document.getElementById('no-results-message');
        const searchResultsCount = document.getElementById('search-results-count');

        // Update counter
        this.updateSelectionCounter();

        // Render selected apps badges
        if (this.modalSelectedApps.length > 0) {
            selectedSection.style.display = 'block';
            selectedListContainer.innerHTML = '';
            
            this.modalSelectedApps.forEach(app => {
                const appName = String(app || '');
                const badge = document.createElement('div');
                badge.className = 'selected-app-badge';
                badge.innerHTML = `
                    ${this.escapeHtml(appName)}
                    <button data-app="${this.escapeHtml(appName)}" title="Remove">&times;</button>
                `;
                
                // Remove button handler
                badge.querySelector('button').addEventListener('click', (e) => {
                    this.toggleAppSelection(e.target.dataset.app, false);
                });
                
                selectedListContainer.appendChild(badge);
            });
        } else {
            selectedSection.style.display = 'none';
        }

        // Clear and populate available apps list
        appListContainer.innerHTML = '';

        if (appsToShow.length === 0) {
            noResultsMessage.style.display = 'block';
            appListContainer.style.display = 'none';
            searchResultsCount.textContent = '';
        } else {
            noResultsMessage.style.display = 'none';
            appListContainer.style.display = 'flex';
            
            if (filteredApps) {
                searchResultsCount.textContent = `Showing ${appsToShow.length} of ${this.allApps.length} applications`;
            } else {
                searchResultsCount.textContent = '';
            }

            appsToShow.forEach(({ app, count }) => {
                // Ensure app is a string
                const appName = String(app || '');
                const isSelected = this.modalSelectedApps.includes(appName);
                const div = document.createElement('div');
                div.className = `app-selection-item ${isSelected ? 'selected' : ''}`;
                div.dataset.app = appName;
                
                div.innerHTML = `
                    <input type="checkbox" id="app-${this.escapeHtml(appName)}" ${isSelected ? 'checked' : ''} data-app="${this.escapeHtml(appName)}">
                    <label for="app-${this.escapeHtml(appName)}">
                        <span class="app-selection-name">${this.escapeHtml(appName)}</span>
                        <span class="app-selection-count">${count} publishes</span>
                    </label>
                `;

                // Add change listener
                const checkbox = div.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    this.toggleAppSelection(e.target.dataset.app, e.target.checked);
                });

                appListContainer.appendChild(div);
            });
        }
    }

    /**
     * Toggle app selection
     */
    toggleAppSelection(app, isSelected) {
        if (isSelected) {
            if (this.modalSelectedApps.length >= 5) {
                this.showError('You can select a maximum of 5 applications.');
                this.renderTimelineAppList(this.currentFilteredApps);
                return;
            }
            this.modalSelectedApps.push(app);
        } else {
            this.modalSelectedApps = this.modalSelectedApps.filter(a => a !== app);
        }
        
        this.renderTimelineAppList(this.currentFilteredApps);
    }

    /**
     * Update selection counter
     */
    updateSelectionCounter() {
        const counter = document.getElementById('selection-count');
        const count = this.modalSelectedApps.length;
        counter.textContent = `${count} of 5`;
        counter.parentElement.style.borderColor = count === 5 ? 'var(--warning-color)' : 'var(--border-color)';
    }

    /**
     * Filter timeline apps by search term
     */
    filterTimelineApps(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.currentFilteredApps = null;
            this.renderTimelineAppList();
            return;
        }

        const filtered = this.allApps.filter(({ app }) => 
            app.toLowerCase().includes(term)
        );
        
        this.currentFilteredApps = filtered;
        this.renderTimelineAppList(filtered);
    }

    /**
     * Hide timeline configuration modal
     */
    hideTimelineConfigModal() {
        document.getElementById('timeline-config-modal').style.display = 'none';
        
        // Clean up
        const searchInput = document.getElementById('timeline-app-search');
        searchInput.value = '';
        this.currentFilteredApps = null;
        
        // Remove event listener by cloning the element
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    }

    /**
     * Apply timeline app selection
     */
    applyTimelineSelection() {
        if (this.modalSelectedApps.length === 0) {
            this.showError('Please select at least one application.');
            return;
        }

        this.selectedTimelineApps = [...this.modalSelectedApps];
        this.hideTimelineConfigModal();

        // Refresh the timeline chart
        if (this.currentData) {
            const weeklyData = APIService.processData.byWeek(this.currentData);
            ChartManager.createTimelineChart(weeklyData, this.selectedTimelineApps);
        }

        this.showInfo(`Timeline updated with ${this.selectedTimelineApps.length} application(s).`);
    }

    /**
     * Reset timeline selection to top 5
     */
    resetTimelineSelection() {
        this.selectedTimelineApps = null;
        this.hideTimelineConfigModal();

        // Refresh the timeline chart with default top 5
        if (this.currentData) {
            const weeklyData = APIService.processData.byWeek(this.currentData);
            ChartManager.createTimelineChart(weeklyData, 5);
        }

        this.showInfo('Timeline reset to top 5 applications.');
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
        if (text === null || text === undefined) {
            return '';
        }
        // Convert to string if not already
        const str = String(text);
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OutSystemsActivityApp();
});
