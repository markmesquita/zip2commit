import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function getBashPath(): string {
	// Verifica se o usuário definiu um caminho na configuração
	const configBashPath = vscode.workspace.getConfiguration("zip2commit").get<string>("bashPath");
	if (configBashPath && fs.existsSync(configBashPath)) {
		return configBashPath;
	}

	// Lista de caminhos candidatos onde o Git Bash pode estar instalado
	const candidatePaths = [
		"C:\\Program Files\\Git\\bin\\bash.exe",
		path.join(process.env.USERPROFILE || "", "AppData", "Local", "Programs", "Git", "bin", "bash.exe")
	];

	for (const candidate of candidatePaths) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	// Se não encontrar, retorne o primeiro caminho padrão (pode ser necessário notificar o usuário)
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

		// Monta o comando a ser executado
		const command = [
			`branch=$(git branch --contains ${commitHash} --format='%(refname:short)' | head -n 1)`,
			`rm -f "$branch.zip"`,
			`git diff-tree --no-commit-id --name-only -r -m ${commitHash} | xargs zip "$branch.zip"`
		].join(' && ');

		// Define o diretório do workspace
		const workspaceFolders = vscode.workspace.workspaceFolders;
		let workspacePath = '';
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspacePath = workspaceFolders[0].uri.fsPath;
		}

		// Detecta a plataforma e define o shell adequado
		const isWindows = process.platform === 'win32';
		const shellPath = isWindows ? getBashPath() : "/bin/bash";

		const terminal = vscode.window.createTerminal({ name: 'Zip Commit', shellPath: shellPath, cwd: workspacePath });
		terminal.show();
		terminal.sendText(command);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
