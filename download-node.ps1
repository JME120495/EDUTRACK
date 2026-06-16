$workDir = "c:\Users\esson\OneDrive\Documents\Edutrack"
$binDir = Join-Path $workDir "node-bin"
$zipPath = Join-Path $workDir "node.zip"
$tempDir = Join-Path $workDir "node-temp"

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Force -Path $binDir | Out-Null
}

Write-Host "Downloading Node.js v20.12.2 portable..."
Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip" -OutFile $zipPath

Write-Host "Extracting zip..."
Expand-Archive -Path $zipPath -DestinationPath $tempDir

Write-Host "Moving files..."
$extractedDir = Get-ChildItem -Path $tempDir | Select-Object -First 1
Move-Item -Path (Join-Path $extractedDir.FullName "*") -Destination $binDir -Force

Write-Host "Cleaning up temp files..."
Remove-Item -Path $zipPath -Force
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "Verifying Node installation..."
& (Join-Path $binDir "node.exe") -v
