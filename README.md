<center><img src="https://github.com/markmesquita/zip2commit/blob/main/images/logo.png" alt="Zip 2 Commit" /></center>

# Zip2Commit

Zip2Commit is a Visual Studio Code extension that makes it easy to compress files modified in a specific Git commit. After installation, the extension loads automatically and adds a button to the status bar. Simply click the button, enter the commit hash, and the extension generates a ZIP file with the modified files, named according to the corresponding branch.

#### Features

- Automatic Activation: The extension loads as soon as VSCode starts, without the need to manually trigger any command.
- Status Bar Button: A "Zip Commit" icon is available in the status bar for quick access.
- Interactive Input: When you click the button, a prompt is displayed for you to enter the commit hash.
- Git Integration: The extension identifies the branch containing the commit and uses Git commands to list the modified files.
- ZIP Generation: Compresses the modified files and generates a ZIP file in the workspace root, with the branch name.

#### Installation

##### Via VSCode Marketplace

1. Open VSCode and go to the Extensions tab (or use Ctrl+Shift+X).
2. Search for Zip2Commit.
3. Click Install.
   <i>After installation, the extension is automatically activated and the "Zip Commit" button appears in the status bar.</i>

##### Via GitHub

1. Clone or download the repository from GitHub.
2. In the terminal, install the dependencies and compile the extension:

```bash
npm install
npm run compile
```

3. Package the extension using vsce:

```bash
vsce package
```

4. In VSCode, open the command palette (Ctrl+Shift+P) and select Extensions: Install from VSIX..., choosing the generated .vsix file.

##### Requirements

- Git: Make sure Git is installed and properly configured on your system.
- Bash: The extension uses the Bash shell to execute commands. On Windows, it's recommended to use Git Bash.
- Git Workspace: The directory opened in VSCode must be a valid Git repository.

##### How to Use

1. Open the Project: Start VSCode with a workspace containing a Git repository.
2. Status Bar Button: As soon as VSCode loads, the extension automatically activates and displays the Zip Commit button in the status bar.
3. Execute Compression:

   - Click the button.
   - Enter the commit hash in the prompt that will be displayed.
   - An integrated terminal will open and the command will be executed, generating a ZIP file with the files modified in the specified commit.

4. Result: The ZIP file will be saved in the root of your workspace, with the name of the branch corresponding to the commit.

##### How It Works

The extension executes the following steps:

- Branch Identification: Uses the git branch --contains command to determine the branch containing the specified commit.
- Name Sanitization: Replaces invalid characters in the branch name (such as `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) with underscores (`_`) to ensure the ZIP filename is valid on all operating systems.
- Temporary Checkout: Checks out to the branch containing the commit to ensure access to the correct files.
- File Listing: Uses git diff-tree --no-commit-id --name-only -r -m to list the files modified in the commit.
- ZIP Generation: Removes any existing ZIP files with the same name and compresses the listed files, generating the ZIP in the repository root.
- Return to Original Branch: After compression, the extension automatically returns to the branch you were working on.

##### Contributing

Contributions, suggestions, and corrections are welcome!
Feel free to open issues or send pull requests on the GitHub repository.

##### License

This project is licensed under the [MIT License](https://github.com/markmesquita/zip2commit/blob/main/LICENSE).
