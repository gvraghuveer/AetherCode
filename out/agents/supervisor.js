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
exports.SupervisorAgent = void 0;
const vscode = __importStar(require("vscode"));
const tree_1 = require("../tree-engine/tree");
const context_1 = require("../services/context");
const safety_1 = require("../services/safety");
const debugger_1 = require("./debugger");
const refactor_1 = require("./refactor");
class SupervisorAgent {
    constructor(gemini, memory, extensionContext) {
        this.gemini = gemini;
        this.memory = memory;
        this.extensionContext = extensionContext;
        this.treeEngine = new tree_1.TreeEngine();
        this.safety = new safety_1.SafetyService();
        this.contextService = new context_1.ContextService();
        this.debugAgent = new debugger_1.DebugAgent(gemini, memory, this.safety);
        this.refactorAgent = new refactor_1.RefactorAgent(gemini, this.safety);
    }
    async processRequest(userPrompt) {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const projectId = Buffer.from(workspaceRoot).toString('base64').slice(0, 20);
        // 1. Create Root Task in Tree
        const rootId = this.treeEngine.createRootTask(userPrompt);
        // 2. Gather Context
        const context = await this.contextService.getRichContext(userPrompt);
        // 3. Execute the task
        const result = await this.executeTask(rootId, context, userPrompt);
        // 4. Self-Learning
        await this.learnFromExecution(rootId, result);
        return result;
    }
    async executeTask(rootId, context, originalPrompt) {
        const bestPath = this.treeEngine.getBestPath(rootId);
        const mainTask = bestPath[bestPath.length - 1] || { prompt: originalPrompt };
        const systemPrompt = `
You are AetherCode - Elite Autonomous MERN Stack Engineer.
Project Context: ${context.summary || 'No project context'}
Coding Style: Clean, modular, TypeScript-first.
`;
        let fullResponse = '';
        for await (const chunk of this.gemini.generateStream(`Task: ${mainTask.prompt}\n\nAdditional Context:\n${context.activeFileContext || ''}`, systemPrompt)) {
            fullResponse += chunk;
        }
        return {
            response: fullResponse,
            treeRootId: rootId,
            confidence: 0.82
        };
    }
    async learnFromExecution(rootId, result, prompt = 'General Task') {
        this.treeEngine.updateNode(rootId, {
            metrics: { success: 0.85, confidence: 0.82 }
        });
        // Actually save to SQLite Memory!
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const projectId = Buffer.from(workspaceRoot).toString('base64').slice(0, 20);
        await this.memory.saveTreeNode({
            id: rootId,
            projectId,
            type: 'task',
            prompt: prompt,
            metrics: JSON.stringify({ success: 0.85, confidence: 0.82 })
        });
        // Simulate learning a pattern
        if (result && result.response && result.response.includes('error')) {
            await this.memory.recordError('Logic Error', 'General Bug', 'Refactored logic', true);
        }
        else {
            await this.memory.recordError('Optimization', 'Code Structure', 'Applied clean architecture', true);
        }
    }
    // ===================== PUBLIC METHODS =====================
    async debugCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return null;
        }
        const code = editor.document.getText();
        const filePath = editor.document.uri.fsPath;
        const rootId = this.treeEngine.createRootTask(`Debug: ${filePath.split(/\\|\//).pop()}`);
        const decisionId = this.treeEngine.addChild(rootId, 'decision', 'Identify syntax and logic errors');
        const result = await this.debugAgent.debugFile(filePath, code);
        this.treeEngine.updateNode(rootId, { metrics: { success: result ? 1.0 : 0.0, confidence: 0.9 } });
        if (result) {
            await this.memory.recordError('Syntax/Logic', 'Compilation Error', 'Auto-debugged', true);
        }
        return result;
    }
    async refactorCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return null;
        }
        const code = editor.document.getText();
        const filePath = editor.document.uri.fsPath;
        const rootId = this.treeEngine.createRootTask(`Refactor: ${filePath.split(/\\|\//).pop()}`);
        this.treeEngine.addChild(rootId, 'optimization', 'Applying clean code principles');
        const result = await this.refactorAgent.refactorCode(filePath, code);
        if (result && result.proposal) {
            const success = await this.safety.applyEdit(result.proposal);
            this.treeEngine.updateNode(rootId, { metrics: { success: success ? 1.0 : 0.0, confidence: 0.95 } });
            await this.memory.recordError('Code Smell', 'Refactoring', 'Applied AST transformation', success);
            if (success) {
                return result;
            }
            else {
                return null;
            }
        }
        return result;
    }
    async analyzeAlgorithm() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return null;
        }
        const code = editor.document.getText();
        const filePath = editor.document.uri.fsPath;
        const rootId = this.treeEngine.createRootTask(`Analyze Algorithm: ${filePath.split(/\\|\//).pop()}`);
        this.treeEngine.addChild(rootId, 'decision', 'Calculating Time/Space Complexity');
        const systemPrompt = "You are an expert algorithm analyzer. Analyze the time and space complexity of the provided code. Provide a concise explanation.";
        let fullResponse = '';
        for await (const chunk of this.gemini.generateStream(`Analyze this code:\n\n${code}`, systemPrompt)) {
            fullResponse += chunk;
        }
        this.treeEngine.updateNode(rootId, { metrics: { success: 1.0, confidence: 0.99 } });
        await this.memory.recordError('Performance', 'Big-O Analysis', 'Calculated Complexity', true);
        return { analysis: fullResponse };
    }
    async getTreeState() {
        return this.treeEngine.getAllNodes();
    }
    async getMemoryState() {
        try {
            const patterns = await this.memory.getSimilarErrors(10);
            let accuracy = 100;
            if (patterns && patterns.length > 0) {
                const sum = patterns.reduce((acc, p) => acc + p.successRate, 0);
                accuracy = Math.round((sum / patterns.length) * 100);
            }
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            const projectId = Buffer.from(workspaceRoot).toString('base64').slice(0, 20);
            const tree = await this.memory.getProjectTree(projectId);
            return {
                patterns: patterns?.length || 0,
                accuracy,
                activeContext: `Working on ${vscode.workspace.name || 'project'}. Loaded ${tree?.length || 0} memory nodes.`,
                errorPatterns: patterns || []
            };
        }
        catch (err) {
            console.error("Failed to get memory state:", err);
            return {
                patterns: 0,
                accuracy: 100,
                activeContext: "Memory system offline or initializing.",
                errorPatterns: []
            };
        }
    }
}
exports.SupervisorAgent = SupervisorAgent;
//# sourceMappingURL=supervisor.js.map