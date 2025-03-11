import { OperatingSystem, ScriptOptions } from '../models/types';

/**
 * Generates scripts for different operating systems
 */
export class ScriptGeneratorService {
  /**
   * Generates a script for the specified operating system
   */
  public generateScript(options: ScriptOptions): string {
    switch (options.os) {
      case OperatingSystem.Windows:
        return this.generateWindowsScript(options);
      case OperatingSystem.Linux:
      case OperatingSystem.MacOS:
        return this.generateUnixScript(options);
      default:
        throw new Error(`Unsupported operating system: ${options.os}`);
    }
  }

  /**
   * Generates a script for Windows (PowerShell)
   */
  private generateWindowsScript(options: ScriptOptions): string {
    const { commitHash, workspacePath, branchName, safeBranchName, zipFilePath } = options.zipOptions;

    return `
# Values passed from TypeScript
$commitHash = "${commitHash}"
$branch = "${branchName}"
$safeBranch = "${safeBranchName}"
$zipFilePath = "${zipFilePath.replace(/\\/g, '\\\\')}"

# Debug logs
Write-Output "DEBUG: Commit hash: $commitHash"
Write-Output "DEBUG: Original branch (from TypeScript): $branch"
Write-Output "DEBUG: Sanitized name (from TypeScript): $safeBranch"
Write-Output "DEBUG: Full path to ZIP file: $zipFilePath"

# Check if the branch was obtained correctly
if ([string]::IsNullOrEmpty($branch)) {
    Write-Output "ERROR: Branch name is empty!"
    exit 1
}

# Check if the sanitized name was obtained correctly
if ([string]::IsNullOrEmpty($safeBranch)) {
    Write-Output "ERROR: Sanitized name is empty, using the original name"
    $safeBranch = $branch
}

Write-Output "Original branch: $branch"
Write-Output "File name: $safeBranch.zip"
Write-Output "Full path: $zipFilePath"

# Remove existing file and prepare to create a new one
Remove-Item -ErrorAction SilentlyContinue "$zipFilePath"
$tempDir = Join-Path $env:TEMP ("zip2commit_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Save the current branch to return later
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Output "Current branch: $currentBranch"

try {
    # Checkout to the branch containing the commit
    Write-Output "Checking out to branch: $branch"
    git checkout $branch

    # Get the files from the commit
    $files = git diff-tree --no-commit-id --name-only -r -m $commitHash
    if ($files.Trim()) {
        $fileList = $files -split "\r?\n" | ForEach-Object { $_.Trim() }
        foreach ($file in $fileList) {
            if (Test-Path $file) {
                $source = Resolve-Path $file
                $dest = Join-Path $tempDir $file
                $destDir = Split-Path $dest -Parent
                if (!(Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $source -Destination $dest -Force
                Write-Output "Copied: $file"
            } else {
                Write-Output "WARNING: File not found: $file"
            }
        }
        
        # Create the ZIP file
        Write-Output "Creating ZIP file: $zipFilePath"
        Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath "$zipFilePath" -Force
        
        # Check if the file was created
        if (Test-Path "$zipFilePath") {
            Write-Output "ZIP file created successfully: $zipFilePath"
            Write-Output "File size: $((Get-Item "$zipFilePath").Length) bytes"
        } else {
            Write-Output "ERROR: Failed to create ZIP file at $zipFilePath"
        }
    } else {
        Write-Output "No files to compress"
    }
}
finally {
    # Return to the original branch
    Write-Output "Returning to original branch: $currentBranch"
    git checkout $currentBranch
    
    # Clean up the temporary directory
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}
`;
  }

  /**
   * Generates a script for Unix (Linux/macOS)
   */
  private generateUnixScript(options: ScriptOptions): string {
    const { commitHash, workspacePath, branchName, safeBranchName, zipFilePath } = options.zipOptions;

    return `
# Values passed from TypeScript
branch="${branchName}"
safe_branch="${safeBranchName}"
zip_file_path="${zipFilePath}"

# Debug logs
echo "DEBUG: Commit hash: ${commitHash}"
echo "DEBUG: Original branch (from TypeScript): $branch"
echo "DEBUG: Sanitized name (from TypeScript): $safe_branch"
echo "DEBUG: Full path to ZIP file: $zip_file_path"

# Check if the branch was obtained correctly
if [ -z "$branch" ]; then
  echo "ERROR: Branch name is empty!"
  exit 1
fi

# Check if the sanitized name was obtained correctly
if [ -z "$safe_branch" ]; then
  echo "ERROR: Sanitized name is empty, using the original name"
  safe_branch="$branch"
fi

echo "Original branch: $branch"
echo "File name: $safe_branch.zip"
echo "Full path: $zip_file_path"

# Remove existing file
rm -f "$zip_file_path" 

# Save the current branch to return later
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"

# Create temporary directory
temp_dir=$(mktemp -d)
echo "Temporary directory: $temp_dir"

# Use a try-finally block to ensure we return to the original branch
{
  # Checkout to the branch containing the commit
  echo "Checking out to branch: $branch"
  git checkout "$branch"
  
  # Get the files from the commit and copy to the temporary directory
  echo "Executing: git diff-tree --no-commit-id --name-only -r -m ${commitHash}"
  files=$(git diff-tree --no-commit-id --name-only -r -m ${commitHash})
  
  if [ -n "$files" ]; then
    # Create the directory structure and copy the files
    for file in $files; do
      if [ -f "$file" ]; then
        mkdir -p "$temp_dir/$(dirname "$file")"
        cp "$file" "$temp_dir/$file"
        echo "Copied: $file"
      else
        echo "WARNING: File not found: $file"
      fi
    done
    
    # Create the ZIP file from the temporary directory
    echo "Creating ZIP file: $zip_file_path"
    (cd "$temp_dir" && zip -r "$zip_file_path" .)
    
    # Check if the file was created
    if [ -f "$zip_file_path" ]; then
      echo "ZIP file created successfully: $zip_file_path"
      echo "File size: $(stat -c%s "$zip_file_path") bytes"
    else
      echo "ERROR: Failed to create ZIP file at $zip_file_path"
      # Try an alternative method
      echo "Trying alternative method..."
      (cd "$temp_dir" && zip -r "$safe_branch.zip" .)
      if [ -f "$safe_branch.zip" ]; then
        mv "$safe_branch.zip" "$zip_file_path"
        echo "ZIP file created successfully (alternative method): $zip_file_path"
      else
        echo "ERROR: Failed to create ZIP file (alternative method)"
      fi
    fi
  else
    echo "No files to compress"
  fi
} || {
  echo "An error occurred during the process"
}

# Return to the original branch
echo "Returning to original branch: $current_branch"
git checkout "$current_branch"

# Clean up the temporary directory
rm -rf "$temp_dir"

# Check again if the file was created
if [ -f "$zip_file_path" ]; then
  echo "Final check: ZIP file exists at $zip_file_path"
  echo "File size: $(stat -c%s "$zip_file_path") bytes"
else
  echo "Final check: ZIP file DOES NOT exist at $zip_file_path"
  echo "Current directory: $(pwd)"
  echo "Listing ZIP files in current directory:"
  find . -name "*.zip" -type f -maxdepth 1
fi
`;
  }
} 