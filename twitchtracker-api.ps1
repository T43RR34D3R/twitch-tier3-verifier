# TwitchTrackers API Data Gatherer
# Usage: .\twitchtracker-api.ps1 -Channel "channelname" -Category "gamename"

param(
    [string]$Channel,
    [string]$Category,
    [string]$OutputPath = ".\twitchtracker_data.json"
)

function Get-TwitchTrackerChannelSummary {
    param([string]$ChannelName)
    
    $url = "https://twitchtracker.com/api/channels/summary/$ChannelName"
    
    try {
        Write-Host "Fetching channel summary for: $ChannelName" -ForegroundColor Green
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
        return $response
    }
    catch {
        Write-Error "Failed to fetch channel summary for $ChannelName : $($_.Exception.Message)"
        return $null
    }
}

function Get-TwitchTrackerCategorySummary {
    param([string]$CategoryName)
    
    $url = "https://twitchtracker.com/api/games/summary/$CategoryName"
    
    try {
        Write-Host "Fetching category summary for: $CategoryName" -ForegroundColor Green
        $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
        return $response
    }
    catch {
        Write-Error "Failed to fetch category summary for $CategoryName : $($_.Exception.Message)"
        return $null
    }
}

function Save-DataToFile {
    param(
        [object]$Data,
        [string]$FilePath
    )
    
    try {
        $Data | ConvertTo-Json -Depth 10 | Out-File -FilePath $FilePath -Encoding UTF8
        Write-Host "Data saved to: $FilePath" -ForegroundColor Cyan
    }
    catch {
        Write-Error "Failed to save data to file: $($_.Exception.Message)"
    }
}

# Main execution
$results = @{}

if ($Channel) {
    $channelData = Get-TwitchTrackerChannelSummary -ChannelName $Channel
    if ($channelData) {
        $results["channel_$Channel"] = $channelData
        Write-Host "Successfully retrieved channel data for: $Channel" -ForegroundColor Yellow
    }
}

if ($Category) {
    $categoryData = Get-TwitchTrackerCategorySummary -CategoryName $Category
    if ($categoryData) {
        $results["category_$Category"] = $categoryData
        Write-Host "Successfully retrieved category data for: $Category" -ForegroundColor Yellow
    }
}

if ($results.Count -gt 0) {
    # Add metadata
    $results["metadata"] = @{
        "timestamp" = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        "requested_channel" = $Channel
        "requested_category" = $Category
    }
    
    Save-DataToFile -Data $results -FilePath $OutputPath
    
    Write-Host "`nSummary:" -ForegroundColor Magenta
    Write-Host "- Total datasets retrieved: $($results.Count - 1)" -ForegroundColor White
    if ($Channel) { Write-Host "- Channel: $Channel" -ForegroundColor White }
    if ($Category) { Write-Host "- Category: $Category" -ForegroundColor White }
    Write-Host "- Output file: $OutputPath" -ForegroundColor White
} else {
    Write-Host "No data was retrieved. Please check your parameters and try again." -ForegroundColor Red
}

# Examples of usage:
Write-Host "`nUsage Examples:" -ForegroundColor Cyan
Write-Host ".\twitchtracker-api.ps1 -Channel 'ninja'" -ForegroundColor Gray
Write-Host ".\twitchtracker-api.ps1 -Category 'Just Chatting'" -ForegroundColor Gray
Write-Host ".\twitchtracker-api.ps1 -Channel 'shroud' -Category 'Valorant'" -ForegroundColor Gray
Write-Host ".\twitchtracker-api.ps1 -Channel 'pokimane' -OutputPath '.\custom_output.json'" -ForegroundColor Gray
