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
exports.SafetyService = void 0;
const vscode = __importStar(require("vscode"));
const diff = __importStar(require("diff")); // npm install diff @types/diff
class SafetyService {
    async createDiffProposal(filePath, newContent) {
        try {
            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            const oldContent = document.getText();
            if (oldContent === newContent) {
                return null;
            }
            const changes = diff.createPatch(filePath, oldContent, newContent, '', '', { context: 3 });
            return {
                filePath,
                oldContent,
                newContent,
                diff: changes,
                confidence: 0.85
            };
        }
        catch (error) {
            console.error('SafetyService error:', error);
            return null;
        }
    }
    async applyEdit(proposal) {
        const userChoice = await vscode.window.showInformationMessage(`Apply changes to ${vscode.workspace.asRelativePath(proposal.filePath)}?`, { modal: true, detail: 'Review the diff in the chat panel' }, 'Apply', 'Cancel');
        if (userChoice !== 'Apply')
            return false;
        try {
            const uri = vscode.Uri.file(proposal.filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
            edit.replace(uri, fullRange, proposal.newContent);
            const success = await vscode.workspace.applyEdit(edit);
            if (success) {
                vscode.window.showInformationMessage('✅ Changes applied successfully');
            }
            return success;
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to apply edit: ' + err);
            return false;
        }
    }
    async createRollbackSnapshot(filePath) {
        try {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            // In production, save to .aethercode/snapshots/
            return content.toString();
        }
        catch {
            return null;
        }
    }
}
exports.SafetyService = SafetyService;
//# sourceMappingURL=safety.js.map