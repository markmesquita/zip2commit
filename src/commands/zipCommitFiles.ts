import * as vscode from 'vscode';
import * as path from 'path';
import { sanitizeFileName, escapeString, createZipFilePath } from '../utils/fileUtils';
import { getBranchContainingCommit, commitExists, getCurrentBranch } from '../utils/gitUtils';
import { ScriptGeneratorService } from '../services/scriptGeneratorService';
import { OperatingSystem, ZipOptions } from '../models/types';

/**
 * Command to compress files from a commit
 */
export async function zipCommitFiles(): Promise<void> {
  try {
    // Request the commit hash
    const commitHash = await vscode.window.showInputBox({
      prompt: 'Enter the commit hash:'
    });

    if (!commitHash) {
      vscode.window.showErrorMessage('You need to provide a commit hash.');
      return;
    }

    // Get the workspace path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let workspacePath = '';
    if (workspaceFolders && workspaceFolders.length > 0) {
      workspacePath = workspaceFolders[0].uri.fsPath;
    } else {
      vscode.window.showErrorMessage('No workspace open.');
      return;
    }

    // Check if the commit exists
    if (!(await commitExists(commitHash, workspacePath))) {
      vscode.window.showErrorMessage(`The commit ${commitHash} does not exist.`);
      return;
    }

    // Get the current branch name
    const currentBranch = await getCurrentBranch(workspacePath);
    console.log(`Current branch: "${currentBranch}"`);

    // Get the branch name containing the commit
    let branchName = '';
    try {
      branchName = await getBranchContainingCommit(commitHash, workspacePath);
    } catch (error) {
      vscode.window.showErrorMessage(`Could not get the branch name: ${error}`);
      return;
    }

    // Sanitize the branch name
    const safeBranchName = sanitizeFileName(branchName);
    console.log(`Original branch name: "${branchName}"`);
    console.log(`Sanitized branch name: "${safeBranchName}"`);

    // Escape strings for use in scripts
    const escapedBranchName = escapeString(branchName);
    const escapedSafeBranchName = escapeString(safeBranchName);
    console.log(`Escaped original branch name: "${escapedBranchName}"`);
    console.log(`Escaped sanitized branch name: "${escapedSafeBranchName}"`);

    // Create the full path for the ZIP file
    const zipFilePath = createZipFilePath(workspacePath, safeBranchName);
    console.log(`Full ZIP file path: "${zipFilePath}"`);

    // Show information in the output console
    const outputChannel = vscode.window.createOutputChannel('Zip2Commit');
    outputChannel.appendLine(`Current branch: ${currentBranch}`);
    outputChannel.appendLine(`Commit branch: ${branchName}`);
    outputChannel.appendLine(`File name: ${safeBranchName}.zip`);
    outputChannel.appendLine(`Full path: ${zipFilePath}`);
    outputChannel.show();

    // Determine the operating system
    const os = process.platform === 'win32'
      ? OperatingSystem.Windows
      : (process.platform === 'darwin' ? OperatingSystem.MacOS : OperatingSystem.Linux);

    // Create options for the script
    const zipOptions: ZipOptions = {
      commitHash,
      workspacePath,
      branchName: escapedBranchName,
      safeBranchName: escapedSafeBranchName,
      zipFilePath
    };

    // Generate the script
    const scriptGenerator = new ScriptGeneratorService();
    const script = scriptGenerator.generateScript({ os, zipOptions });

    // Determine the shell to use
    let shellPath: string;
    if (os === OperatingSystem.Windows) {
      shellPath = "powershell.exe";
    } else {
      shellPath = "/bin/bash";
    }

    // Execute the script
    const terminal = vscode.window.createTerminal({
      name: 'Zip Commit',
      shellPath,
      cwd: workspacePath
    });

    terminal.show();
    terminal.sendText(script);
  } catch (error) {
    vscode.window.showErrorMessage(`Error compressing files: ${error}`);
  }
} 