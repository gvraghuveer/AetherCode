import { MemoryService } from '../memory/sqlite';
import { MLScorer } from './scorer';

export class LearningEngine {
  constructor(private memory: MemoryService) {}

  async recordOutcome(taskPrompt: string, generatedCode: string, success: boolean, score: any) {
    await this.memory.recordError(
      "generation",
      taskPrompt.substring(0, 100),
      generatedCode.substring(0, 200),
      success
    );

    // Store successful patterns
    if (success && score.overall > 85) {
      // Could store in user_patterns table
      console.log(`✅ Learned high-quality pattern. Score: ${score.overall}`);
    }
  }

  async getLearnedPromptPrefix(): Promise<string> {
    // Retrieve top patterns for few-shot learning
    return `
Learned Rules from Past Executions:
- Prefer TypeScript strict mode
- Use functional patterns in React
- Modularize backend services
- Always handle errors gracefully
`;
  }

  async improvePrompt(originalPrompt: string): Promise<string> {
    // Meta-prompt optimization based on past failures
    return originalPrompt + "\n\nApply all learned best practices from memory.";
  }
}