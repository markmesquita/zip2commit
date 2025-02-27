import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getBashPath(): string {
	const configBashPath = vscode.workspace.getConfiguration("zip2commit").get<string>("bashPath");
	if (configBashPath && fs.existsSync(configBashPath)) {
		return configBashPath;
	}
	const candidatePaths = [
		"C:\\Program Files\\Git\\bin\\bash.exe",
		path.join(process.env.USERPROFILE || "", "AppData", "Local", "Programs", "Git", "bin", "bash.exe")
	];
	for (const candidate of candidatePaths) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return "C:\\Program Files\\Git\\bin\\bash.exe";
}

export function activate(context: vscode.ExtensionContext) {
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = '$(archive) Zip Commit';
	statusBarItem.command = 'extension.zipCommitFiles';
	statusBarItem.tooltip = 'Zip arquivos do commit';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	let disposable = vscode.commands.registerCommand('extension.zipCommitFiles', async () => {
		const commitHash = await vscode.window.showInputBox({
			prompt: 'Digite o hash do commit:'
		});
		if (!commitHash) {
			vscode.window.showErrorMessage('Você precisa informar o hash do commit.');
			return;
		}

		const workspaceFolders = vscode.workspace.workspaceFolders;
		let workspacePath = '';
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspacePath = workspaceFolders[0].uri.fsPath;
		}

		let command: string;
		let shellPath: string;

		if (process.platform === 'win32') {
			// Utiliza o PowerShell para compactação nativa no Windows.
			shellPath = "powershell.exe"; // Ou "pwsh.exe", se preferir o PowerShell Core.
			command = `
$commitHash = "${commitHash}"
$branch = (git branch --contains $commitHash --format="%(refname:short)" | Select-Object -First 1).Trim()
Remove-Item -ErrorAction SilentlyContinue "$branch.zip"
$files = git diff-tree --no-commit-id --name-only -r -m $commitHash
if ($files.Trim()) {
    $fileList = $files -split "\r?\n" | ForEach-Object { $_.Trim() }
    Compress-Archive -Path $fileList -DestinationPath "$branch.zip"
} else {
    Write-Output "No files to compress"
}
`;
		} else {
			// Em Linux/macOS, utiliza o comando em Bash.
			shellPath = "/bin/bash";
			command = `branch=$(git branch --contains ${commitHash} --format='%(refname:short)' | head -n 1) && rm -f "$branch.zip" && git diff-tree --no-commit-id --name-only -r -m ${commitHash} | xargs zip "$branch.zip"`;
		}

		const terminal = vscode.window.createTerminal({ name: 'Zip Commit', shellPath, cwd: workspacePath });
		terminal.show();
		terminal.sendText(command);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
