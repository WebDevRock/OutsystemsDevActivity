# Update application list based on generated publish data

$publishData = Get-Content "mock-data\publish-activity.json" -Raw | ConvertFrom-Json

# Group by application and calculate statistics
$appStats = $publishData.data | Group-Object ApplicationName | ForEach-Object {
    $appRecords = $_.Group
    $sortedRecords = $appRecords | Sort-Object { [DateTime]$_.PublishDate }
    
    [PSCustomObject]@{
        ID = ([array]::IndexOf(($publishData.data | Group-Object ApplicationName).Name, $_.Name) + 1).ToString()
        ApplicationName = $_.Name
        IsActive = $true
        TotalPublishes = $_.Count
        LastPublish = ($sortedRecords | Select-Object -Last 1).PublishDate
        FirstPublish = ($sortedRecords | Select-Object -First 1).PublishDate
    }
} | Sort-Object { -$_.TotalPublishes }

# Create output structure
$output = @{
    data = $appStats
    totalApplications = $appStats.Count
}

# Export to JSON
$jsonOutput = $output | ConvertTo-Json -Depth 10
Set-Content -Path "mock-data\application-list.json" -Value $jsonOutput -Encoding UTF8

Write-Host "Updated application list with $($appStats.Count) applications" -ForegroundColor Green
$appStats | Format-Table ApplicationName, TotalPublishes, @{Name="LastPublish";Expression={([DateTime]$_.LastPublish).ToString("yyyy-MM-dd")}} -AutoSize
