$pattern = '--color-'
Get-ChildItem -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' } | Select-String -Pattern $pattern -SimpleMatch -ErrorAction SilentlyContinue | Select-Object -Unique Path | ForEach-Object { $_.Path }
