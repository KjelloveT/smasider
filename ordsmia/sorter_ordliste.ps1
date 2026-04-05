# Genererer sortert ordliste for raskt oppslag av lengste ord
$json = Get-Content 'countdown/norsk_ordliste.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$sorted = $json.ord | Sort-Object { $_.Length } -Descending
$out = @{ meta = $json.meta; ord = @($sorted) } | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText('countdown/ordliste_sorted.json', $out, [System.Text.Encoding]::UTF8)
Write-Host "Sortert ordliste lagret: $($sorted.Count) ord"
Write-Host "Lengste ord: $($sorted | Select-Object -First 5)"
