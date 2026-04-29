$patterns = @('console.log','debugger')
foreach ($p in $patterns) {
  Write-Output "\n=== $p ==="
  Select-String -Path **\* -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue | Select-Object -Unique Path | ForEach-Object { Write-Output $_.Path }
}
