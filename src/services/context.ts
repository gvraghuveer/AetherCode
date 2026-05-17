import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ContextService {
  async getRichContext(userPrompt: string): Promise<any> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return { summary: "No workspace open" };

    const root = workspaceFolders[0].uri.fsPath;
    const packageJson = await this.readPackageJson(root);

    // Get open file
    const activeEditor = vscode.window.activeTextEditor;
    let activeFileContext = '';
    
    if (activeEditor) {
      activeFileContext = `
Active File: ${activeEditor.document.fileName}
Content:
${activeEditor.document.getText().slice(0, 1500)}
`;
    }

    return {
      summary: `MERN Project - ${packageJson.name || 'Unnamed'}`,
      packageJson,
      activeFileContext,
      filesContext: await this.getRelevantFiles(root, userPrompt),
      userPatterns: "Modular, TypeScript, clean architecture"
    };
  }

  private async readPackageJson(root: string) {
    try {
      const content = await fs.readFile(path.join(root, 'package.json'), 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async getRelevantFiles(root: string, prompt: string): Promise<string> {
    // Simple implementation - expand with ignore patterns
    try {
      const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', '**/node_modules/**', 15);
      let context = '';

      for (const file of files.slice(0, 5)) {
        try {
          const content = await fs.readFile(file.fsPath, 'utf-8');
          context += `\n--- ${file.fsPath} ---\n${content.slice(0, 800)}\n`;
        } catch (e) {}
      }
      return context;
    } catch (e) {
      return "Could not read files";
    }
  }
}