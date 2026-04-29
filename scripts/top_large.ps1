Get-ChildItem -Recurse -Force -File -ErrorAction SilentlyContinue |
  Select-Object FullName,Length |
  Sort-Object Length -Descending |
  Select-Object -First 50 |
  ForEach-Object { "{0:N0} bytes`t{1}" -f $_.Length, $_.FullName }
