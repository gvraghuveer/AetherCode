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
exports.ContextService = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ContextService {
    async getRichContext(userPrompt) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return { summary: "No workspace open" };
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
    async readPackageJson(root) {
        try {
            const content = await fs.readFile(path.join(root, 'package.json'), 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return {};
        }
    }
    async getRelevantFiles(root, prompt) {
        // Simple implementation - expand with ignore patterns
        try {
            const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', '**/node_modules/**', 15);
            let context = '';
            for (const file of files.slice(0, 5)) {
                try {
                    const content = await fs.readFile(file.fsPath, 'utf-8');
                    context += `\n--- ${file.fsPath} ---\n${content.slice(0, 800)}\n`;
                }
                catch (e) { }
            }
            return context;
        }
        catch (e) {
            return "Could not read files";
        }
    }
}
exports.ContextService = ContextService;
//# sourceMappingURL=context.js.map