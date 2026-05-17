import * as vscode from 'vscode';

export class TerminalService {
  async suggestCommands(task: string): Promise<string[]> {
    // Can be powered by Gemini for smart suggestions
    const commonCommands = [
      "npm run dev",
      "npm install",
      "npm test",
      "npx prisma migrate dev",
      "npm run build"
    ];

    return commonCommands;
  }

  executeCommand(command: string) {
    const terminal = vscode.window.createTerminal('AetherCode Terminal');
    terminal.show();
    terminal.sendText(command);
  }
}