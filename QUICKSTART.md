# Quick Start Guide

Get your OutSystems Activity Dashboard up and running in minutes!

## ⚡ 5-Minute Setup (Mock Data)

Perfect for testing and seeing what the dashboard can do.

### Step 1: Open the Dashboard

Simply open `index.html` in your web browser:

```powershell
# From the project directory
start index.html
```

Or start a local web server:

```powershell
# Using Python (if installed)
python -m http.server 8000

# Then open: http://localhost:8000
```

### Step 2: Load Sample Data

1. Click the **"Use Mock Data"** button
2. Click **"Load Data"**
3. Explore the visualizations!

That's it! 🎉

---

## 🚀 Production Setup (Real Data)

Connect to your OutSystems environment for real publish data.

### Step 1: Create OutSystems REST APIs

Follow the guide in [OUTSYSTEMS_API_GUIDE.md](OUTSYSTEMS_API_GUIDE.md) to create two REST endpoints:

1. `/publish-activity` - Returns publish records
2. `/application-list` - Returns application list

**Quick SQL Reference:**

```sql
-- 1. Publish Activity
SELECT e.Name, mv.VERSION, mv.UPLOADED_DATE, mv.UPLOADED_BY
FROM ossys_Module_Version mv
INNER JOIN ossys_Espace e ON mv.ESPACE_ID = e.ID
WHERE mv.UPLOADED_DATE >= DATEADD(day, -30, GETDATE())
ORDER BY mv.UPLOADED_DATE DESC

-- 2. Application List
SELECT e.Name, COUNT(*) AS TotalPublishes
FROM ossys_Espace e
LEFT JOIN ossys_Module_Version mv ON e.ID = mv.ESPACE_ID
GROUP BY e.Name
```

### Step 2: Configure CORS (if needed)

If your dashboard is hosted separately:

In OutSystems REST API OnRequest callback:
```
SetHTTPHeader("Access-Control-Allow-Origin", "*")
SetHTTPHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
```

### Step 3: Connect Dashboard to API

1. Open the dashboard in your browser
2. Enter your API endpoint:
   ```
   https://your-server/YourApp/rest/ActivityAPI/v1
   ```
3. Click **"Load Data"**

Done! You're now viewing real data! 🎊

---

## 📊 What You'll See

### Statistics Cards
- **Total Publishes** - Number of publishes in selected period
- **Active Applications** - Number of unique applications
- **Active Developers** - Number of developers publishing
- **Average Daily** - Average publishes per day

### Charts
1. **Daily Activity** - Line chart of daily publish counts
2. **Top Applications** - Bar chart of most active apps
3. **Developer Activity** - Bar chart of most active developers
4. **Activity Heatmap** - When publishes occur (day/hour)
5. **Timeline Comparison** - Weekly trends for top 5 apps

### Data Table
- Searchable list of recent publishes
- Sort and filter by application
- Export to CSV

---

## 🎯 Common Use Cases

### View Last Week's Activity

1. Select **"Days Back"** mode
2. Choose **"Last 7 Days"** from dropdown
3. Click **"Load Data"**
4. Review activity charts

### Analyze a Specific Time Period

1. Select **"Date Range"** mode from the filter dropdown
2. Choose your **Start Date** and **End Date**
3. Click **"Load Data"**
4. Review statistics for that exact period

### Focus on One Application

1. Select application from **"Application Filter"**
2. All charts update to show only that app
3. Data table filters automatically

### Export Data for Reporting

1. Load the data you want
2. Click **"Export CSV"**
3. Open in Excel/Power BI for further analysis

### Monitor Developer Productivity

1. Load data for desired period
2. Check **"Developer Activity"** chart
3. Review data table for detailed information

---

## 🔧 Troubleshooting

### Dashboard won't load
- **Solution:** Use a web server instead of opening the file directly
- Try: `python -m http.server 8000`

### "Failed to load data"
- **Solution:** Check browser console (F12) for errors
- Verify API endpoint URL is correct
- Test API directly in browser or Postman

### Charts not showing
- **Solution:** Click F12, check Console tab for JavaScript errors
- Try different browser
- Clear cache and reload (Ctrl+F5)

### No data in specific date range
- **Solution:** Verify there are publishes in that period in OutSystems
- Try expanding date range
- Check API is returning data

### API CORS errors
- **Solution:** Add CORS headers to OutSystems REST API (see setup)
- Or host dashboard on same domain as OutSystems

---

## 📚 Next Steps

### Customize the Dashboard

- Edit colors in `js/charts.js`
- Modify layout in `index.html` and `styles.css`
- Add new charts (see [TROUBLESHOOTING.md](TROUBLESHOOTING.md))

### Deploy to Production

Choose your deployment method:

**Option A: IIS**
- Copy files to `C:\inetpub\wwwroot\activity-dashboard\`
- Create IIS application

**Option B: OutSystems**
- Create Traditional Web app
- Upload files as resources
- Create screen with iframe

**Option C: Any Web Server**
- Copy files to web server directory
- Configure virtual directory

### Enhance the APIs

- Add authentication
- Implement caching
- Add pagination for large datasets
- Create background timers for pre-aggregation

---

## 🎓 Learning Resources

### Files to Review

1. **[README.md](README.md)** - Complete documentation
2. **[OUTSYSTEMS_API_GUIDE.md](OUTSYSTEMS_API_GUIDE.md)** - API implementation details
3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Tips and customization

### Key Files to Understand

- `js/app.js` - Main application logic
- `js/api-service.js` - API integration
- `js/charts.js` - Chart visualizations
- `mock-data/*.json` - Sample data format

### Browser Developer Tools

Press **F12** to open:
- **Console** - JavaScript errors and logs
- **Network** - API requests and responses
- **Elements** - HTML/CSS inspection

---

## 💡 Tips

✅ **Start with mock data** to verify everything works  
✅ **Test APIs separately** before connecting dashboard  
✅ **Use 30-day range** for best performance  
✅ **Export data** for deeper analysis in Excel  
✅ **Check browser console** if something isn't working  
✅ **Keep mock data** for testing future changes  

---

## 🆘 Need Help?

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review browser console (F12) for errors
3. Test with mock data first
4. Verify API responses in Network tab
5. Check OutSystems database access

---

## 🎉 You're Ready!

The dashboard is flexible and powerful. Start simple, then customize as needed.

**Happy monitoring!** 📈
