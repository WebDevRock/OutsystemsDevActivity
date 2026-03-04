# Generate Mock Data for OutSystems Activity Dashboard
# 90 days of data, ~20 publishes per developer per day

$endDate = Get-Date "2026-03-04"
$startDate = $endDate.AddDays(-90)

# Define developers and their assigned applications
$developers = @(
    @{ Name = "Cactus.Jack"; App = "CustomerPortal"; Solution = "Customer Suite" }
    @{ Name = "jane.smith"; App = "OrderManagement"; Solution = "Order Processing" }
    @{ Name = "mike.johnson"; App = "InventorySystem"; Solution = "Inventory Suite" }
    @{ Name = "sarah.williams"; App = "ReportingEngine"; Solution = "Analytics Suite" }
    @{ Name = "david.brown"; App = "PaymentGateway"; Solution = "Financial Suite" }
    @{ Name = "emily.davis"; App = "UserManagement"; Solution = "Security Suite" }
    @{ Name = "robert.miller"; App = "NotificationService"; Solution = "Communication Suite" }
    @{ Name = "lisa.anderson"; App = "DataIntegration"; Solution = "Integration Suite" }
)

$publishRecords = @()
$versionCounter = @{}

# Initialize version counters for each app
foreach ($dev in $developers) {
    $versionCounter[$dev.App] = 100
}

# Generate data for each day
for ($date = $startDate; $date -le $endDate; $date = $date.AddDays(1)) {
    # Skip weekends (more realistic)
    if ($date.DayOfWeek -eq 'Saturday' -or $date.DayOfWeek -eq 'Sunday') {
        continue
    }
    
    foreach ($dev in $developers) {
        # Random variation: 15-25 publishes per developer per day
        $publishCount = Get-Random -Minimum 1 -Maximum 50
        
        for ($i = 0; $i -lt $publishCount; $i++) {
            # Random time during business hours (8 AM - 6 PM)
            $hour = Get-Random -Minimum 8 -Maximum 18
            $minute = Get-Random -Minimum 0 -Maximum 60
            $publishTime = $date.AddHours($hour).AddMinutes($minute)
            
            # Increment version
            $versionCounter[$dev.App]++
            $versionNum = $versionCounter[$dev.App]
            $majorVer = [Math]::Floor($versionNum / 100)
            $minorVer = [Math]::Floor(($versionNum % 100) / 10)
            $patchVer = $versionNum % 10
            
            $record = [PSCustomObject]@{
                ApplicationName = $dev.App
                VersionID = [string]$versionNum
                Version = "$majorVer.$minorVer.$patchVer"
                PublishDate = $publishTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
                PublishedBy = $dev.Name
                IsActive = $true
                Solution = $dev.Solution
            }
            
            $publishRecords += $record
        }
    }
}

# Sort by date descending
$publishRecords = $publishRecords | Sort-Object { [DateTime]$_.PublishDate } -Descending

# Create the JSON structure
$output = @{
    data = $publishRecords
    totalRecords = $publishRecords.Count
    dateRange = @{
        start = $startDate.ToString("yyyy-MM-ddTHH:mm:ssZ")
        end = $endDate.ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
}

# Export to JSON
$jsonOutput = $output | ConvertTo-Json -Depth 10
Set-Content -Path "mock-data\publish-activity.json" -Value $jsonOutput -Encoding UTF8

Write-Host "Generated $($publishRecords.Count) publish records" -ForegroundColor Green
Write-Host "Date range: $($startDate.ToString('yyyy-MM-dd')) to $($endDate.ToString('yyyy-MM-dd'))" -ForegroundColor Green
Write-Host "Developers: $($developers.Count)" -ForegroundColor Green
Write-Host "Average per developer per day: ~20" -ForegroundColor Green
