$workDir = "c:\Users\esson\OneDrive\Documents\Edutrack"
$nodeVersion = "v20.19.0"
$zipUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = Join-Path $workDir "node.zip"
$extractDir = Join-Path $workDir "node-temp"
$binDir = Join-Path $workDir "node-bin"

# Clean previous artifacts
if (Test-Path $binDir) { Remove-Item -Recurse -Force $binDir }
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

Write-Host "Downloading Node.js $nodeVersion..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host "Extracting archive..."
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

# The extracted folder name includes the version
$extractedFolder = Join-Path $extractDir "node-$nodeVersion-win-x64"

Write-Host "Moving extracted files to node-bin..."
# Ensure target directory exists
New-Item -ItemType Directory -Force -Path $binDir | Out-Null
# Use robust copy+remove to avoid access issues
Copy-Item -Path $extractedFolder\* -Destination $binDir -Recurse -Force
# Cleanup the temp folder
Remove-Item -Recurse -Force $extractDir
Remove-Item -Force $zipPath

Write-Host "Node.js $nodeVersion installed at $binDir"
