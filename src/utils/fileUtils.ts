import * as path from 'path';
import * as fs from 'fs';

/**
 * Sanitizes a branch name to be used as a filename
 * Replaces invalid characters with underscores
 */
export function sanitizeFileName(branchName: string): string {
  console.log(`sanitizeFileName input: "${branchName}"`);
  // Invalid characters in filenames on most operating systems
  const sanitized = branchName.replace(/[\\/:*?"<>|]/g, '_');
  console.log(`sanitizeFileName output: "${sanitized}"`);
  return sanitized;
}

/**
 * Escapes strings for use in scripts
 */
export function escapeString(str: string): string {
  return str.replace(/'/g, "'\\''").replace(/"/g, '\\"');
}

/**
 * Creates the full path for the ZIP file
 */
export function createZipFilePath(workspacePath: string, safeBranchName: string): string {
  return path.join(workspacePath, `${safeBranchName}.zip`);
} 