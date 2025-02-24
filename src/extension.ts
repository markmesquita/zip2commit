import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// Cria um item na barra de status
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	statusBarItem.text = '$(archive) Zip Commit'; // Ícone + texto
	statusBarItem.command = 'extension.zipCommitFiles';
	statusBarItem.tooltip = 'Zip arquivos do commit';
	statusBarItem.show();

	context.subscriptions.push(statusBarItem);

	// Registra o comando que será executado ao clicar no botão
	let disposable = vscode.commands.registerCommand('extension.zipCommitFiles', async () => {
		// Solicita o hash do commit ao usuário
		const commitHash = await vscode.window.showInputBox({
			prompt: 'Digite o hash do commit:'
		});
		if (!commitHash) {
			vscode.window.showErrorMessage('Você precisa informar o hash do commit.');
			return;
		}

		// Monta o comando usando o commit informado
		const command = [
			// Obtém o nome do branch que contém o commit
			`branch=$(git branch --contains ${commitHash} --format='%(refname:short)' | head -n 1)`,
			// Remove o zip existente, se houver
			`rm -f "$branch.zip"`,
			// Gera o zip com os arquivos modificados no commit
			`git diff-tree --no-commit-id --name-only -r -m ${commitHash} | xargs zip "$branch.zip"`
		].join(' && ');

		// Obtém o caminho do workspace (raiz do repositório)
		const workspaceFolders = vscode.workspace.workspaceFolders;
		let workspacePath = '';
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspacePath = workspaceFolders[0].uri.fsPath;
		}

		// Cria e mostra um terminal, definindo o cwd para a raiz do workspace
		const terminal = vscode.window.createTerminal({ name: 'Zip Commit', shellPath: '/bin/bash', cwd: workspacePath });
		terminal.show();
		terminal.sendText(command);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
