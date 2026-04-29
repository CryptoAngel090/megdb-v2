$path = 'apps/web/src/components/MovieDetailPage/MovieDetailPage.module.css'
$content = Get-Content $path -ErrorAction SilentlyContinue | Out-String
$matches = [regex]::Matches($content,'\.page')
Write-Output ("Matches: {0}" -f $matches.Count)
