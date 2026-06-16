$workDir = "c:\Users\esson\OneDrive\Documents\Edutrack"
$nodeVersion = "v20.19.0"
$zipUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = Join-Path $workDir "node.zip"
$extractDir = Join-Path $workDir "node-temp"
$binDir = Join-Path $workDir "node-bin"

# Clean previous files
if (Test-Path $binDir) { Remove-Item -Recurse -Force $binDir }
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

Write-Host "Downloading Node.js $nodeVersion..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $extractDir

# Move the extracted folder to node-bin
Move-Item -Path (Join-Path $extractDir "node-$nodeVersion-win-x64") -Destination $binDir

# Cleanup
Remove-Item -Recurse -Force $extractDir
Remove-Item -Force $zipPath

Write-Host "Node.js $nodeVersion installed at $binDir"
