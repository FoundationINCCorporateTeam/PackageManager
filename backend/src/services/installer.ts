export const generateInstallCommand = (
  owner: string,
  name: string,
  version: string,
  platform: string,
  arch: string,
  assetUrl: string,
  sha256: string
): string => {
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
  
  // Normalize platform/OS
  const lowerPlatform = platform.toLowerCase();
  const lowerArch = arch.toLowerCase();

  if (lowerPlatform.includes('linux')) {
    // Linux shell script installer
    return `curl -fsSL ${baseUrl}/api/v1/packages/${owner}/${name}/install/${version}/${platform}/${arch} | sh`;
  } else if (lowerPlatform.includes('windows')) {
    // Windows PowerShell installer
    return `iwr -useb ${baseUrl}/api/v1/packages/${owner}/${name}/install/${version}/${platform}/${arch} | iex`;
  } else if (lowerPlatform.includes('darwin') || lowerPlatform.includes('macos')) {
    // macOS shell script installer
    return `curl -fsSL ${baseUrl}/api/v1/packages/${owner}/${name}/install/${version}/${platform}/${arch} | sh`;
  }

  // Default to manual download with verification
  return `# Download and verify
curl -fsSL -o package ${assetUrl}
echo "${sha256}  package" | sha256sum -c -
# Install manually after verification`;
};

export const generateInstallScript = (
  owner: string,
  name: string,
  version: string,
  platform: string,
  arch: string,
  assetUrl: string,
  sha256: string,
  filename: string
): string => {
  const lowerPlatform = platform.toLowerCase();

  if (lowerPlatform.includes('linux') || lowerPlatform.includes('darwin') || lowerPlatform.includes('macos')) {
    // Bash/Shell script
    return `#!/bin/bash
set -e

echo "Installing ${owner}/${name} v${version} for ${platform}/${arch}"

# Download asset
TMPFILE=$(mktemp)
curl -fsSL -o "$TMPFILE" "${assetUrl}"

# Verify checksum
echo "${sha256}  $TMPFILE" | sha256sum -c - || {
  echo "Checksum verification failed!"
  rm "$TMPFILE"
  exit 1
}

echo "Checksum verified successfully"

# Determine installation directory
INSTALL_DIR="/usr/local/bin"
if [ ! -w "$INSTALL_DIR" ]; then
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

# Extract or move file
if [[ "$TMPFILE" == *.tar.gz ]] || [[ "$TMPFILE" == *.tgz ]]; then
  tar -xzf "$TMPFILE" -C "$INSTALL_DIR"
elif [[ "$TMPFILE" == *.zip ]]; then
  unzip -q "$TMPFILE" -d "$INSTALL_DIR"
else
  mv "$TMPFILE" "$INSTALL_DIR/${filename}"
  chmod +x "$INSTALL_DIR/${filename}"
fi

echo "✓ Successfully installed ${owner}/${name} v${version}"
echo "Location: $INSTALL_DIR"
`;
  } else if (lowerPlatform.includes('windows')) {
    // PowerShell script
    return `# PowerShell Install Script
$ErrorActionPreference = "Stop"

Write-Host "Installing ${owner}/${name} v${version} for ${platform}/${arch}"

# Download asset
$TmpFile = [System.IO.Path]::GetTempFileName()
Invoke-WebRequest -Uri "${assetUrl}" -OutFile $TmpFile

# Verify checksum
$Hash = (Get-FileHash -Path $TmpFile -Algorithm SHA256).Hash.ToLower()
if ($Hash -ne "${sha256}") {
    Remove-Item $TmpFile
    Write-Error "Checksum verification failed!"
    exit 1
}

Write-Host "Checksum verified successfully"

# Installation directory
$InstallDir = "$env:LOCALAPPDATA\\Programs\\${owner}\\${name}"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

# Extract or move file
if ($TmpFile -match '\\.zip$') {
    Expand-Archive -Path $TmpFile -DestinationPath $InstallDir -Force
} else {
    Move-Item -Path $TmpFile -Destination "$InstallDir\\${filename}" -Force
}

Write-Host "✓ Successfully installed ${owner}/${name} v${version}"
Write-Host "Location: $InstallDir"
`;
  }

  return `# Manual installation required
# Download: ${assetUrl}
# SHA256: ${sha256}
# Verify checksum after download`;
};

export const generateMnCommand = (owner: string, name: string, version: string): string => {
  return `mn add ${owner}/${name}@${version}`;
};
