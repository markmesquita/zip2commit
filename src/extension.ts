import * as vscode from 'vscode';
import { zipCommitFiles } from './commands/zipCommitFiles';

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = '$(archive) Zip Commit';
	statusBarItem.command = 'extension.zipCommitFiles';
	statusBarItem.tooltip = 'Zip files from a commit';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Register command
	let disposable = vscode.commands.registerCommand('extension.zipCommitFiles', zipCommitFiles);
	context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate() { }
