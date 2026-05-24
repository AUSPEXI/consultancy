Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg){ Write-Host $msg }
function Write-Find($line){ Write-Output $line }

# Patterns (broad but curated)
$pattern = 'AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN (EC|RSA|OPENSSH) PRIVATE KEY-----|xox[baprs]-[0-9a-zA-Z-]{10,}|ghp_[0-9A-Za-z]{36}|AIza[0-9A-Za-z\-_]{35}|(api|secret|token|password)[ _-]*[:=][ _-]*[A-Za-z0-9+/=]{10,}'

# HEAD quick scan
Write-Info 'Scanning HEAD for secret-like patterns...'
git grep -n --full-name -I -E $pattern HEAD | ForEach-Object { Write-Find $_ }

# Full history scan (may be slow)
Write-Info 'Scanning full git history (this may take time)...'
$commits = git rev-list --all
foreach ($c in $commits) {
    git grep -n --full-name -I -E $pattern $c | ForEach-Object { Write-Find $_ }
}

Write-Info 'Scan complete.'


