import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);

/**
 * Sanitiza o nome do branch para ser usado como nome de arquivo
 * Substitui caracteres inválidos por underscores
 */
function sanitizeFileName(branchName: string): string {
	console.log(`sanitizeFileName input: "${branchName}"`);
	// Caracteres inválidos em nomes de arquivos na maioria dos sistemas operacionais
	const sanitized = branchName.replace(/[\\/:*?"<>|]/g, '_');
	console.log(`sanitizeFileName output: "${sanitized}"`);
	return sanitized;
}

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

		// Obtém o nome do branch usando child_process
		let branchName = '';
		try {
			// Primeiro, verifica se o commit existe
			await execAsync(`git cat-file -e ${commitHash}`, { cwd: workspacePath });

			// Obtém o nome do branch
			const gitCommand = `git branch --contains ${commitHash} --format="%(refname:short)"`;
			console.log(`Executing git command: ${gitCommand}`);

			const { stdout } = await execAsync(gitCommand, { cwd: workspacePath });

			// Pode retornar múltiplos branches, pega o primeiro
			const branches = stdout.trim().split('\n').filter(Boolean);
			console.log(`All branches containing commit: ${JSON.stringify(branches)}`);

			if (branches.length === 0) {
				throw new Error('No branches found containing this commit');
			}

			branchName = branches[0];
			console.log(`Selected branch name: "${branchName}"`);

			if (!branchName) {
				throw new Error('Branch name is empty');
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Não foi possível obter o nome do branch: ${error}`);
			return;
		}

		// Sanitiza o nome do branch
		const safeBranchName = sanitizeFileName(branchName);
		console.log(`Original branch name: "${branchName}"`);
		console.log(`Sanitized branch name: "${safeBranchName}"`);

		// Escapa as strings para uso em scripts
		const escapedBranchName = branchName.replace(/'/g, "'\\''").replace(/"/g, '\\"');
		const escapedSafeBranchName = safeBranchName.replace(/'/g, "'\\''").replace(/"/g, '\\"');
		console.log(`Escaped original branch name: "${escapedBranchName}"`);
		console.log(`Escaped sanitized branch name: "${escapedSafeBranchName}"`);

		// Cria o caminho completo para o arquivo ZIP
		const zipFilePath = path.join(workspacePath, `${safeBranchName}.zip`);
		console.log(`Full ZIP file path: "${zipFilePath}"`);

		// Mostra informações no console de saída
		const outputChannel = vscode.window.createOutputChannel('Zip2Commit');
		outputChannel.appendLine(`Branch original: ${branchName}`);
		outputChannel.appendLine(`Nome do arquivo: ${safeBranchName}.zip`);
		outputChannel.appendLine(`Caminho completo: ${zipFilePath}`);
		outputChannel.show();

		let command: string;
		let shellPath: string;

		if (process.platform === 'win32') {
			// Utiliza o PowerShell nativo para Windows e preserva a estrutura de pastas.
			shellPath = "powershell.exe"; // Ou "pwsh.exe", se preferir o PowerShell Core.
			command = `
# Valores passados do TypeScript
$commitHash = "${commitHash}"
$branch = "${escapedBranchName}"
$safeBranch = "${escapedSafeBranchName}"
$zipFilePath = "${zipFilePath.replace(/\\/g, '\\\\')}"

# Logs para depuração
Write-Output "DEBUG: Commit hash: $commitHash"
Write-Output "DEBUG: Branch original (do TypeScript): $branch"
Write-Output "DEBUG: Nome sanitizado (do TypeScript): $safeBranch"
Write-Output "DEBUG: Caminho completo do arquivo ZIP: $zipFilePath"

# Verifica se o branch foi obtido corretamente
if ([string]::IsNullOrEmpty($branch)) {
    Write-Output "ERRO: Nome do branch está vazio!"
    exit 1
}

# Verifica se o nome sanitizado foi obtido corretamente
if ([string]::IsNullOrEmpty($safeBranch)) {
    Write-Output "ERRO: Nome sanitizado está vazio, usando o nome original"
    $safeBranch = $branch
}

Write-Output "Branch original: $branch"
Write-Output "Nome do arquivo: $safeBranch.zip"
Write-Output "Caminho completo: $zipFilePath"

# Remove arquivo existente e prepara para criar o novo
Remove-Item -ErrorAction SilentlyContinue "$zipFilePath"
$tempDir = Join-Path $env:TEMP ("zip2commit_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Salva a branch atual para voltar depois
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Output "Branch atual: $currentBranch"

try {
    # Checkout na branch que contém o commit
    Write-Output "Fazendo checkout na branch: $branch"
    git checkout $branch

    # Obtém os arquivos do commit
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
                Write-Output "Copiado: $file"
            } else {
                Write-Output "AVISO: Arquivo não encontrado: $file"
            }
        }
        
        # Cria o arquivo ZIP
        Write-Output "Criando arquivo ZIP: $zipFilePath"
        Compress-Archive -Path (Join-Path $tempDir "*") -DestinationPath "$zipFilePath" -Force
        
        # Verifica se o arquivo foi criado
        if (Test-Path "$zipFilePath") {
            Write-Output "Arquivo ZIP criado com sucesso: $zipFilePath"
            Write-Output "Tamanho do arquivo: $((Get-Item "$zipFilePath").Length) bytes"
        } else {
            Write-Output "ERRO: Falha ao criar o arquivo ZIP em $zipFilePath"
        }
    } else {
        Write-Output "No files to compress"
    }
}
finally {
    # Volta para a branch original
    Write-Output "Voltando para a branch original: $currentBranch"
    git checkout $currentBranch
    
    # Limpa o diretório temporário
    Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
}
`;
		} else {
			// Em Linux/macOS, utiliza o comando em Bash.
			shellPath = "/bin/bash";
			command = `
# Valores passados do TypeScript
branch="${escapedBranchName}"
safe_branch="${escapedSafeBranchName}"
zip_file_path="${zipFilePath.replace(/"/g, '\\"')}"

# Logs para depuração
echo "DEBUG: Commit hash: ${commitHash}"
echo "DEBUG: Branch original (do TypeScript): $branch"
echo "DEBUG: Nome sanitizado (do TypeScript): $safe_branch"
echo "DEBUG: Caminho completo do arquivo ZIP: $zip_file_path"

# Verifica se o branch foi obtido corretamente
if [ -z "$branch" ]; then
  echo "ERRO: Nome do branch está vazio!"
  exit 1
fi

# Verifica se o nome sanitizado foi obtido corretamente
if [ -z "$safe_branch" ]; then
  echo "ERRO: Nome sanitizado está vazio, usando o nome original"
  safe_branch="$branch"
fi

echo "Branch original: $branch"
echo "Nome do arquivo: $safe_branch.zip"
echo "Caminho completo: $zip_file_path"

# Remove arquivo existente
rm -f "$zip_file_path" 

# Salva a branch atual para voltar depois
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Branch atual: $current_branch"

# Cria diretório temporário
temp_dir=$(mktemp -d)
echo "Diretório temporário: $temp_dir"

# Usa um bloco try-finally para garantir que voltamos para a branch original
{
  # Checkout na branch que contém o commit
  echo "Fazendo checkout na branch: $branch"
  git checkout "$branch"
  
  # Obtém os arquivos do commit e copia para o diretório temporário
  echo "Executando: git diff-tree --no-commit-id --name-only -r -m ${commitHash}"
  files=$(git diff-tree --no-commit-id --name-only -r -m ${commitHash})
  
  if [ -n "$files" ]; then
    # Cria a estrutura de diretórios e copia os arquivos
    for file in $files; do
      if [ -f "$file" ]; then
        mkdir -p "$temp_dir/$(dirname "$file")"
        cp "$file" "$temp_dir/$file"
        echo "Copiado: $file"
      else
        echo "AVISO: Arquivo não encontrado: $file"
      fi
    done
    
    # Cria o arquivo ZIP a partir do diretório temporário
    echo "Criando arquivo ZIP: $zip_file_path"
    (cd "$temp_dir" && zip -r "$zip_file_path" .)
    
    # Verifica se o arquivo foi criado
    if [ -f "$zip_file_path" ]; then
      echo "Arquivo ZIP criado com sucesso: $zip_file_path"
      echo "Tamanho do arquivo: $(stat -c%s "$zip_file_path") bytes"
    else
      echo "ERRO: Falha ao criar o arquivo ZIP em $zip_file_path"
      # Tenta criar o arquivo ZIP diretamente
      echo "Tentando método alternativo..."
      (cd "$temp_dir" && zip -r "$safe_branch.zip" .)
      if [ -f "$safe_branch.zip" ]; then
        mv "$safe_branch.zip" "$zip_file_path"
        echo "Arquivo ZIP criado com sucesso (método alternativo): $zip_file_path"
      else
        echo "ERRO: Falha ao criar o arquivo ZIP (método alternativo)"
      fi
    fi
  else
    echo "Nenhum arquivo para compactar"
  fi
} || {
  echo "Ocorreu um erro durante o processo"
}

# Volta para a branch original
echo "Voltando para a branch original: $current_branch"
git checkout "$current_branch"

# Limpa o diretório temporário
rm -rf "$temp_dir"

# Verifica novamente se o arquivo foi criado
if [ -f "$zip_file_path" ]; then
  echo "Verificação final: Arquivo ZIP existe em $zip_file_path"
  echo "Tamanho do arquivo: $(stat -c%s "$zip_file_path") bytes"
else
  echo "Verificação final: Arquivo ZIP NÃO existe em $zip_file_path"
  echo "Diretório atual: $(pwd)"
  echo "Listando arquivos ZIP no diretório atual:"
  find . -name "*.zip" -type f -maxdepth 1
fi
`;
		}

		const terminal = vscode.window.createTerminal({ name: 'Zip Commit', shellPath, cwd: workspacePath });
		terminal.show();
		terminal.sendText(command);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
