import * as vscode from 'vscode';
import * as diff from 'diff'; // npm install diff @types/diff

export interface EditProposal {
  filePath: string;
  oldContent: string;
  newContent: string;
  diff: string;
  confidence: number;
}

export class SafetyService {
  async createDiffProposal(filePath: string, newContent: string): Promise<EditProposal | null> {
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
    } catch (error) {
      console.error('SafetyService error:', error);
      return null;
    }
  }

  async applyEdit(proposal: EditProposal): Promise<boolean> {
    const userChoice = await vscode.window.showInformationMessage(
      `Apply changes to ${vscode.workspace.asRelativePath(proposal.filePath)}?`,
      { modal: true, detail: 'Review the diff in the chat panel' },
      'Apply', 'Cancel'
    );

    if (userChoice !== 'Apply') return false;

    try {
      const uri = vscode.Uri.file(proposal.filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const edit = new vscode.WorkspaceEdit();

      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      edit.replace(uri, fullRange, proposal.newContent);

      const success = await vscode.workspace.applyEdit(edit);
      
      if (success) {
        vscode.window.showInformationMessage('✅ Changes applied successfully');
      }
      return success;
    } catch (err) {
      vscode.window.showErrorMessage('Failed to apply edit: ' + err);
      return false;
    }
  }

  async createRollbackSnapshot(filePath: string): Promise<string | null> {
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      // In production, save to .aethercode/snapshots/
      return content.toString();
    } catch {
      return null;
    }
  }
}