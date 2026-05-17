import * as vscode from 'vscode';
import { GeminiService } from './services/gemini';
import { MemoryService } from './memory/sqlite';
import { SupervisorAgent } from './agents/supervisor';
import { AetherWebviewProvider } from './ui/webviewProvider';

export async function activate(context: vscode.ExtensionContext) {
  console.log('🚀 AetherCode is now active!');

  // Initialize core services without blocking the main thread
  const memory = new MemoryService(context.globalStorageUri.fsPath);
  memory.init().catch(console.error);

  const gemini = new GeminiService('');
  const supervisor = new SupervisorAgent(gemini, memory, context);

  // Register Webview Sidebar IMMEDIATELY
  const webviewProvider = new AetherWebviewProvider(context.extensionUri, supervisor);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aethercode.sidebar', webviewProvider)
  );

  // API Key Management (Async)
  (async () => {
    let apiKey = await context.secrets.get('geminiApiKey');
    if (!apiKey) {
      apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Google AI Studio (Gemini) API Key',
        password: true,
        ignoreFocusOut: true
      });
      if (apiKey) {
        await context.secrets.store('geminiApiKey', apiKey);
      } else {
        vscode.window.showErrorMessage('AetherCode requires Gemini API Key to function.');
        return;
      }
    }
    gemini.updateApiKey(apiKey);
  })();

  // ====================== COMMANDS ======================
  context.subscriptions.push(
    // Set / Update API Key
    vscode.commands.registerCommand('aethercode.setApiKey', async () => {
      const newKey = await vscode.window.showInputBox({
        prompt: 'Enter new Gemini API Key',
        password: true,
        ignoreFocusOut: true
      });
      if (newKey) {
        await context.secrets.store('geminiApiKey', newKey);
        vscode.window.showInformationMessage('✅ Gemini API Key updated successfully.');
      }
    }),

    // Open Chat Sidebar
    vscode.commands.registerCommand('aethercode.openChat', () => {
      vscode.commands.executeCommand('aethercode.sidebar.focus');
    }),

    // Debug Current File
    vscode.commands.registerCommand('aethercode.debugCurrentFile', async () => {
      try {
        const result = await supervisor.debugCurrentFile();
        vscode.window.showInformationMessage('🔍 Debug request sent to AetherCode');
      } catch (err: any) {
        vscode.window.showErrorMessage('Debug failed: ' + err.message);
      }
    }),

    // Refactor Current File
    vscode.commands.registerCommand('aethercode.refactorCurrentFile', async () => {
      try {
        const result = await supervisor.refactorCurrentFile();
        if (result) {
          vscode.window.showInformationMessage('♻️ Refactoring completed successfully!');
        }
      } catch (err: any) {
        vscode.window.showErrorMessage('Refactor failed: ' + err.message);
      }
    }),

    // Analyze Algorithm
    vscode.commands.registerCommand('aethercode.analyzeAlgorithm', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor');
        return;
      }

      try {
        const code = editor.document.getText();
        const fileName = editor.document.fileName;
        vscode.window.showInformationMessage(`📊 Analyzing algorithms in ${vscode.workspace.asRelativePath(fileName)}...`);
        
        // TODO: Wire AlgorithmAnalyzer here in future updates
        // const analyzer = new AlgorithmAnalyzer(gemini);
        // const result = await analyzer.analyzeAlgorithm(code, fileName);
        
      } catch (err: any) {
        vscode.window.showErrorMessage('Analysis failed: ' + err.message);
      }
    })
  );

  // Auto-detect project on activation
  vscode.window.showInformationMessage('✅ AetherCode initialized - Project memory loaded');
}

export function deactivate() {
  console.log('AetherCode deactivated');
}