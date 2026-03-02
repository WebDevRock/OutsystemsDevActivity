# OutSystems Activity Dashboard

A web-based dashboard to visualize publish activity for OutSystems applications. Works with REST API endpoints from your OutSystems environment or mock data for testing.

## Features

- **Interactive Dashboard** - Real-time activity visualization in your browser
- **Daily Activity Trends** - Line chart showing publish patterns over time
- **Application Overview** - Compare applications by publish count
- **Developer Activity** - Track which developers are most active
- **Activity Heatmap** - Visualize when publishes occur by day and hour
- **Timeline Comparison** - Compare multiple applications side-by-side
- **Data Table** - Searchable, filterable table of recent publishes
- **CSV Export** - Export all data for further analysis
- **Mock Data Mode** - Test with sample data before connecting to APIs

## Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Web server (for production) or local development server
- OutSystems REST API endpoints (optional - can use mock data)

## Quick Start

### Option 1: Using Mock Data (No Setup Required)

1. **Open the dashboard:**
   ```powershell
   # Simply open index.html in your browser
   start index.html
   ```

2. **Or use a local web server:**
   ```powershell
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   
   # Then open: http://localhost:8000
   ```

3. **Click "Use Mock Data"** and then **"Load Data"** to see sample visualizations

### Option 2: Connecting to OutSystems REST APIs

1. **Create REST API endpoints in OutSystems** (see API Requirements section below)

2. **Enter your API endpoint** in the dashboard:
   ```
   https://your-server/YourApp/rest/ActivityAPI/v1
   ```

3. **Click "Load Data"** to fetch real data from your environment

## API Requirements

Create the following REST endpoints in your OutSystems application:

### 1. GET /publish-activity
Returns all publish records.

**Query Parameters:**
- `daysBack` (optional): Number of days to look back (default: 30)
- `application` (optional): Filter by application name

**Response Format:**
```json
{
  "data": [
    {
      "ApplicationName": "string",
      "VersionID": "string",
      "Version": "string",
      "PublishDate": "ISO8601 datetime",
      "PublishedBy": "string",
      "IsActive": boolean,
      "Solution": "string"
    }
  ],
  "totalRecords": number,
  "dateRange": {
    "start": "ISO8601 datetime",
    "end": "ISO8601 datetime"
  }
}
```

### 2. GET /application-list
Returns list of all applications with statistics.

**Response Format:**
```json
{
  "data": [
    {
      "ID": "string",
      "ApplicationName": "string",
      "IsActive": boolean,
      "TotalPublishes": number,
      "LastPublish": "ISO8601 datetime",
      "FirstPublish": "ISO8601 datetime"
    }
  ],
  "totalApplications": number
}
```

### 3. GET /daily-summary
Returns daily publish counts.

**Query Parameters:**
- `daysBack` (optional): Number of days to look back (default: 30)

**Response Format:**
```json
{
  "data": [
    {
      "PublishDate": "YYYY-MM-DD",
      "PublishCount": number,
      "UniqueApplications": number,
      "UniqueDevelopers": number
    }
  ]
}
```

## OutSystems API Implementation Guide

### Sample Server Action Queries

**GetPublishActivity:**
```sql
SELECT 
    e.Name AS ApplicationName,
    mv.VERSION_ID AS VersionID,
    mv.VERSION AS Version,
    mv.UPLOADED_DATE AS PublishDate,
    mv.UPLOADED_BY AS PublishedBy,
    e.IS_ACTIVE AS IsActive,
    ss.NAME AS Solution
FROM 
    ossys_Module_Version mv
INNER JOIN 
    ossys_Espace e ON mv.ESPACE_ID = e.ID
LEFT JOIN
    ossys_Solution_Espace se ON e.ID = se.ESPACE_ID
LEFT JOIN
    ossys_Solution ss ON se.SOLUTION_ID = ss.ID
WHERE 
    mv.UPLOADED_DATE >= DATEADD(day, -@DaysBack, GETDATE())
    AND (@Application = '' OR e.Name = @Application)
ORDER BY 
    mv.UPLOADED_DATE DESC
```

**GetApplicationList:**
```sql
SELECT 
    e.ID,
    e.Name AS ApplicationName,
    e.IS_ACTIVE AS IsActive,
    COUNT(mv.VERSION_ID) AS TotalPublishes,
    MAX(mv.UPLOADED_DATE) AS LastPublish,
    MIN(mv.UPLOADED_DATE) AS FirstPublish
FROM 
    ossys_Espace e
LEFT JOIN 
    ossys_Module_Version mv ON e.ID = mv.ESPACE_ID
GROUP BY 
    e.ID, e.Name, e.IS_ACTIVE
ORDER BY 
    e.Name
```

**GetDailySummary:**
```sql
SELECT 
    CAST(mv.UPLOADED_DATE AS DATE) AS PublishDate,
    COUNT(*) AS PublishCount,
    COUNT(DISTINCT mv.ESPACE_ID) AS UniqueApplications,
    COUNT(DISTINCT mv.UPLOADED_BY) AS UniqueDevelopers
FROM 
    ossys_Module_Version mv
WHERE 
    mv.UPLOADED_DATE >= DATEADD(day, -@DaysBack, GETDATE())
GROUP BY 
    CAST(mv.UPLOADED_DATE AS DATE)
ORDER BY 
    PublishDate ASC
```

## Project Structure

```
OutsystemsActivity/
├── index.html              # Main dashboard HTML
├── styles.css              # Dashboard styling
├── js/
│   ├── app.js             # Main application logic
│   ├── api-service.js     # API calls and data processing
│   └── charts.js          # Chart.js visualization logic
├── mock-data/
│   ├── publish-activity.json
│   ├── application-list.json
│   └── daily-summary.json
└── README.md
```

## Usage

### Dashboard Controls

1. **API Endpoint** - Enter your OutSystems REST API base URL
2. **Use Mock Data** - Switch to using sample data for testing
3. **Days Back** - Select how far back to analyze (7, 30, 90, 180, or 365 days)
4. **Application Filter** - Filter views to a specific application
5. **Load Data** - Fetch and display data
6. **Export CSV** - Download current data as CSV file

### Viewing Data

1. **Statistics Cards** - Quick overview of total publishes, applications, developers, and averages
2. **Daily Activity Chart** - Line chart showing publish count per day
3. **Application Overview** - Horizontal bar chart of top 10 applications
4. **Developer Activity** - Horizontal bar chart of top 10 developers
5. **Activity Heatmap** - Scatter plot showing publish frequency by day/hour
6. **Timeline Comparison** - Multi-line chart comparing top 5 applications weekly
7. **Data Table** - Searchable table with ability to show 10, 25, 50, or 100 records

### Filtering and Searching

- Use the **Application dropdown** to filter all views to a specific app
- Use the **Search box** in the data table to filter by application name, version, developer, or solution
- Click **column headers** to sort the table (coming soon)

## Deployment

### Development

For local testing, use any of these options:

```powershell
# Python simple HTTP server
python -m http.server 8000

# Node.js http-server
npx http-server -p 8000

# PHP built-in server
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

### Production

1. **Deploy to IIS:**
   - Copy all files to `C:\inetpub\wwwroot\outsystems-activity\`
   - Create a new application in IIS Manager
   - Set the physical path to your directory
   - Browse to `http://your-server/outsystems-activity/`

2. **Deploy to OutSystems:**
   - Create a new Traditional Web Application
   - Upload all files as resources
   - Create a web screen that iframe's your index.html
   - Publish and access through OutSystems

3. **Deploy to any web server:**
   - Copy all files to your web server directory
   - Ensure proper CORS headers if API is on different domain
   - Access via your web server URL

### CORS Configuration

If your OutSystems API is on a different domain, you'll need to configure CORS:

In your OutSystems REST API, add the following response headers:
- `Access-Control-Allow-Origin: *` (or specify your dashboard domain)
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
