"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const gemini_1 = require("./services/gemini");
const sqlite_1 = require("./memory/sqlite");
const supervisor_1 = require("./agents/supervisor");
const webviewProvider_1 = require("./ui/webviewProvider");
async function activate(context) {
    console.log('🚀 AetherCode is now active!');
    // Initialize core services without blocking the main thread
    const memory = new sqlite_1.MemoryService(context.globalStorageUri.fsPath);
    memory.init().catch(console.error);
    const gemini = new gemini_1.GeminiService('');
    const supervisor = new supervisor_1.SupervisorAgent(gemini, memory, context);
    // Register Webview Sidebar IMMEDIATELY
    const webviewProvider = new webviewProvider_1.AetherWebviewProvider(context.extensionUri, supervisor);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('aethercode.sidebar', webviewProvider));
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
            }
            else {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
            vscode.window.showErrorMessage('Analysis failed: ' + err.message);
        }
    }));
    // Auto-detect project on activation
    vscode.window.showInformationMessage('✅ AetherCode initialized - Project memory loaded');
}
function deactivate() {
    console.log('AetherCode deactivated');
}
//# sourceMappingURL=extension.js.map