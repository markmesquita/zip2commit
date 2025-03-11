/**
 * Types and interfaces for the Zip2Commit extension
 */

export interface ZipOptions {
  commitHash: string;
  workspacePath: string;
  branchName: string;
  safeBranchName: string;
  zipFilePath: string;
}

export enum OperatingSystem {
  Windows = 'windows',
  Linux = 'linux',
  MacOS = 'macos'
}

export interface ScriptOptions {
  os: OperatingSystem;
  zipOptions: ZipOptions;
} 