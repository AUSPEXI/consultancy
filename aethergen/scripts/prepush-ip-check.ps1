Param(
    [switch]$StagedOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Fail($msg) {
    Write-Error $msg
    exit 1
}

# 1) Ensure critical .gitignore entries exist
$gitignorePath = Join-Path (Get-Location) '.gitignore'
if (-not (Test-Path $gitignorePath)) { Fail 'IP check: .gitignore missing at repo root' }
$gi = Get-Content $gitignorePath -Raw
$required = @('.agekey', '.passphrase', 'unlocked/', 'secure/*.dec', 'docs/ip_manifest.json')
foreach ($r in $required) {
    if ($gi -notmatch [regex]::Escape($r)) { Fail "IP check: .gitignore missing required entry: $r" }
}

# 2) Determine file set (staged vs working tree)
if ($StagedOnly) {
    $files = (git diff --cached --name-only --diff-filter=ACM) -split "`n" | Where-Object { $_ }
} else {
    $files = (git ls-files) -split "`n" | Where-Object { $_ }
}

# 3) Block plaintext-sensitive file types outside unlocked/
$plaintextPatterns = @('\.pem$', '\.key$', '(^|/)secure/')
foreach ($f in $files) {
    if ($f -match '^unlocked/') { continue }
    foreach ($re in $plaintextPatterns) {
        if ($f -match $re) { Fail ("IP check: refusing to push plaintext-sensitive file: {0}" -f $f) }
    }
}

# 4) Secret-like content scan (skip known safe paths)
$ignoreContentScan = @('^scripts/prepush-ip-check\.mjs$', '^\.husky/', '^public/circuits/verification_key\.json$')
$secretRegexes = @(
    '(API_KEY|SECRET|PRIVATE_KEY|SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY)'
)
foreach ($f in $files) {
    $skip = $false
    foreach ($re in $ignoreContentScan) { if ($f -match $re) { $skip = $true; break } }
    if ($skip) { continue }
    if (-not (Test-Path $f)) { continue }
    try {
        $content = Get-Content $f -Raw -ErrorAction Stop
        foreach ($re in $secretRegexes) {
            if ($content -match $re) { Fail ("IP check: secret-like token found in {0}" -f $f) }
        }
    } catch {}
}

# 5) Block new public circuit artifacts from repo
$blockedPublicCircuit = '(^|/)public/circuits/.*\.(zkey|wasm)$'
foreach ($f in $files) {
    if ($f -match $blockedPublicCircuit) {
        Fail ("IP check: refusing to push circuit artifact in repo: {0}. Serve via CDN/secure storage or gate by env." -f $f)
    }
}

# 6) Ensure SOPS config exists
if (-not (Test-Path '.sops.yaml')) { Fail 'IP check: missing .sops.yaml at repo root' }

Write-Output 'IP pre-push (PowerShell) check: OK'


