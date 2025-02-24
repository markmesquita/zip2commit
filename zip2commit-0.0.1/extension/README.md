# Zip2Commit

O Zip2Commit é uma extensão para o Visual Studio Code que facilita a compactação dos arquivos modificados em um commit específico do Git. Após a instalação, a extensão é carregada automaticamente e adiciona um botão na barra de status. Basta clicar no botão, inserir o hash do commit e a extensão gera um arquivo ZIP com os arquivos alterados, nomeado de acordo com o branch correspondente.

#### Funcionalidades

- Ativação Automática: A extensão é carregada assim que o VSCode inicia, sem a necessidade de acionar manualmente nenhum comando.
- Botão na Barra de Status: Um ícone "Zip Commit" fica disponível na barra de status para acesso rápido.
- Input Interativo: Ao clicar no botão, é exibido um prompt para você informar o hash do commit.
- Integração com Git: A extensão identifica o branch que contém o commit e utiliza comandos Git para listar os arquivos modificados.
- Geração do ZIP: Compacta os arquivos alterados e gera um arquivo ZIP na raiz do workspace, com o nome do branch.

#### Instalação

##### Via VSCode Marketplace

1. Abra o VSCode e vá até a aba de Extensões (ou use Ctrl+Shift+X).
2. Pesquise por Zip2Commit.
3. Clique em Instalar.
   <i> Após a instalação, a extensão é ativada automaticamente e o botão "Zip Commit" aparece na barra de status.</i>

##### Via GitHub

1. Clone ou baixe o repositório do GitHub.
2. No terminal, instale as dependências e 3. compile a extensão:

```bash
Copy
npm install
npm run compile
```

3. Empacote a extensão usando o vsce:

```bash
Copy
vsce package
```

4. No VSCode, abra a paleta de comandos (Ctrl+Shift+P) e selecione Extensions: Install from VSIX..., escolhendo o arquivo .vsix gerado.

##### Requisitos

- Git: Certifique-se de que o Git esteja instalado e configurado corretamente no seu sistema.
- Bash: A extensão utiliza o shell Bash para execução dos comandos. No Windows, recomenda-se o uso do Git Bash.
- Workspace Git: O diretório aberto no VSCode precisa ser um repositório Git válido.

##### Como Usar

1. Abra o Projeto: Inicie o VSCode com um workspace que contenha um repositório Git.
2. Botão na Barra de Status: Assim que o VSCode carregar, a extensão ativa automaticamente e exibe o botão Zip Commit na barra de status.
3. Executar a Compactação:

   - Clique no botão.
   - Insira o hash do commit no prompt que será exibido.
   - Um terminal integrado será aberto e o comando será executado, gerando um arquivo ZIP com os arquivos modificados no commit informado.

4. Resultado: O arquivo ZIP será salvo na raiz do seu workspace, com o nome do branch correspondente ao commit.

##### Como Funciona

A extensão executa os seguintes passos:

- Identificação do Branch: Usa o comando git branch --contains para determinar o branch que contém o commit informado.
- Listagem de Arquivos: Utiliza git diff-tree --no-commit-id --name-only -r -m para listar os arquivos modificados no commit.
- Geração do ZIP: Remove eventuais arquivos ZIP existentes com o mesmo nome e compacta os arquivos listados, gerando o ZIP na raiz do repositório.

##### Contribuição

Contribuições, sugestões e correções são bem-vindas!
Sinta-se à vontade para abrir issues ou enviar pull requests no repositório GitHub.

##### Licença

Este projeto está licenciado sob a MIT License.
