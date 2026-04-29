if (-not (Test-Path .git)) { Write-Output "NO_GIT_REPO"; exit }
git ls-files | Where-Object { $_ -match '(^theme/generated/|^lh-.*\.json$|^_lh_tmp/|^apps/web/\.next/|^\.cursor/)' } | ForEach-Object { Write-Output $_ }
