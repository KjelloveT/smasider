# Regenerate rarity-byer.json based on actual IDs in byer_skandinavia.csv
# Using same distribution as other categories: vanleg(65%), sjeldgjevt(25%), segngjeten(7%), gudebore(3%)

# Read all city IDs from CSV
$csv = Get-Content "kort\byer_skandinavia.csv"
$ids = @()
for ($i = 1; $i -lt $csv.Count; $i++) {
    $line = $csv[$i]
    if ($line -match '"(http://www\.wikidata\.org/entity/Q[^"]+)"') {
        $fullId = $matches[1]
        $id = $fullId -replace "http://www.wikidata.org/entity/", ""
        $ids += $id
    }
}

Write-Host "Found $($ids.Count) cities in CSV"

# Shuffle with seed 42 for consistency
$rng = [System.Random]::new(42)
$shuffledIds = $ids | Sort-Object { $rng.Next() }

# Calculate counts
$total = $shuffledIds.Count
$vanleg = [math]::Floor($total * 0.65)
$sjeldgjevt = [math]::Floor($total * 0.25)
$segngjeten = [math]::Floor($total * 0.07)
$gudebore = $total - $vanleg - $sjeldgjevt - $segngjeten

Write-Host "Distribution: vanleg=$vanleg, sjeldgjevt=$sjeldgjevt, segngjeten=$segngjeten, gudebore=$gudebore"

# Create rarity object
$rarity = @{}

# Assign rarities
for ($i = 0; $i -lt $vanleg; $i++) {
    $rarity[$shuffledIds[$i]] = "vanleg"
}
for ($i = $vanleg; $i -lt ($vanleg + $sjeldgjevt); $i++) {
    $rarity[$shuffledIds[$i]] = "sjeldgjevt"
}
for ($i = ($vanleg + $sjeldgjevt); $i -lt ($vanleg + $sjeldgjevt + $segngjeten); $i++) {
    $rarity[$shuffledIds[$i]] = "segngjeten"
}
for ($i = ($vanleg + $sjeldgjevt + $segngjeten); $i -lt $total; $i++) {
    $rarity[$shuffledIds[$i]] = "gudebore"
}

# Convert to JSON and save
$rarity | ConvertTo-Json -Depth 10 | Out-File "kort\rarity-byer.json" -Encoding UTF8

Write-Host "rarity-byer.json regenerated with $($rarity.Count) cities"
Write-Host "Gudebore cities:"
$rarity.GetEnumerator() | Where-Object { $_.Value -eq "gudebore" } | ForEach-Object { Write-Host "  $($_.Key)" }
