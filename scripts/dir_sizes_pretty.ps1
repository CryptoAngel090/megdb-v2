$dirs = @('node_modules','theme/generated','apps/web/.next','_lh_tmp','.cursor')
foreach ($d in $dirs) {
  if (Test-Path $d) {
    $sum = (Get-ChildItem -Path $d -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Measure-Object -Property Length -Sum).Sum
    $mb = [math]::Round($sum/1MB,2)
    Write-Output "$d => $mb MB ($sum bytes)"
  } else {
    Write-Output "$d => NOT FOUND"
  }
}
