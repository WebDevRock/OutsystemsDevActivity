## Troubleshooting

### API Connection Issues

**"Failed to load data" error:**
- Check that your API endpoint URL is correct
- Verify the API is accessible (test in browser or Postman)
- Check browser console (F12) for specific error messages
- Ensure CORS headers are configured on the API

**"No data available":**
- Verify the API is returning data in the correct format
- Check that date range contains data
- Look at the Network tab in browser developer tools
- Try using mock data first to verify dashboard works

### Browser Issues

**Charts not displaying:**
- Ensure JavaScript is enabled
- Check browser console for errors
- Try a different browser
- Clear browser cache

**Styling looks broken:**
- Verify `styles.css` loaded correctly
- Check browser console for CSS errors
- Try hard refresh (Ctrl+F5)

### Data Issues

**Incorrect statistics:**
- Verify your API is calculating totals correctly
- Check date filtering in your queries
- Ensure timezone handling is consistent

**Missing applications in dropdown:**
- Check the `/application-list` endpoint response
- Verify the JSON structure matches expected format
- Look for JavaScript errors in console

## Customization

### Modifying Colors

Edit the color palette in `js/charts.js`:

```javascript
colors: {
    primary: '#ea1d24',      // OutSystems red
    secondary: '#333333',
    accent: '#00a8e1',       // OutSystems blue
    palette: [
        '#ea1d24', '#00a8e1', '#52c41a', // Add your colors
    ]
}
```

### Adding New Charts

1. Create a new chart function in `js/charts.js`:
```javascript
createMyCustomChart(data) {
    const ctx = document.getElementById('my-chart');
    this.charts['my-chart'] = new Chart(ctx, {
        // Chart configuration
    });
}
```

2. Add the canvas to `index.html`:
```html
<div class="chart-card">
    <div class="chart-header">
        <h2>My Custom Chart</h2>
    </div>
    <div class="chart-wrapper">
        <canvas id="my-chart"></canvas>
    </div>
</div>
```

3. Call it from `js/app.js` in the `createAllCharts` method:
```javascript
ChartManager.createMyCustomChart(myData);
```

### Adding New API Endpoints

Add new methods to `js/api-service.js`:

```javascript
async getMyCustomData() {
    if (this.config.useMockData) {
        return this.fetchData(`${this.config.mockDataPath}my-data.json`);
    }
    const url = `${this.config.apiEndpoint}/my-endpoint`;
    return this.fetchData(url);
}
```

### Modifying the Layout

Edit `index.html` and `styles.css` to change:
- Grid layout (`.charts-container`)
- Card sizes (`.chart-card`, `.chart-card-wide`)
- Colors (CSS variables in `:root`)
- Responsive breakpoints (`@media` queries)

## Mock Data Customization

Edit files in the `mock-data/` directory to test different scenarios:

- `mock-data/publish-activity.json` - Add more publish records
- `mock-data/application-list.json` - Add more applications
- `mock-data/daily-summary.json` - Modify daily statistics

## Performance Tips

- Use appropriate date ranges (30-90 days for most cases)
- Implement pagination on API endpoints for large datasets
- Enable browser caching for static assets
- Consider server-side aggregation for large data volumes
- Add loading states for better UX
- Implement data refresh intervals instead of constant polling

## Security Considerations

- **Never** embed credentials in the JavaScript code
- Use authentication tokens for API access
- Implement proper CORS configuration
- Validate and sanitize all input data
- Use HTTPS for all API communications
- Consider implementing rate limiting on APIs

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

Requires:
- ES6 JavaScript support
- CSS Grid support
- Fetch API support

## Future Enhancements

Potential features to add:
- Real-time updates via WebSocket
- More chart types (pie, radar, etc.)
- Advanced filtering options
- User preferences/settings storage
- Print/PDF export functionality
- Integration with OutSystems notifications
- Historical comparison (month-over-month, year-over-year)
- Drill-down capabilities
- Custom date range picker

## License

This tool is provided as-is for analyzing OutSystems publish activity.
