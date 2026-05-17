import { GeminiService } from '../services/gemini';
import { SafetyService } from '../services/safety';
import { MLScorer } from '../ml-engine/scorer';

export class RefactorAgent {
  constructor(
    private gemini: GeminiService,
    private safety: SafetyService
  ) {}

  async refactorCode(filePath: string, code: string, goal: string = "Improve maintainability, performance and readability") {
    const prompt = `
You are an expert refactoring agent for MERN stack (TypeScript/React/Node.js).

Goal: ${goal}

Original Code:
\`\`\`
${code}
\`\`\`

Return JSON only:
{
  "refactoredCode": "complete refactored code",
  "changes": ["list of improvements"],
  "complexityBefore": "O(n^2)",
  "complexityAfter": "O(n)",
  "confidence": 0.XX
}
`;

    try {
      const result = await this.gemini.generateJSON<any>(prompt,
        "You are a senior software engineer focused on clean architecture and performance.");

      const proposal = await this.safety.createDiffProposal(filePath, result.refactoredCode);

      // Score the refactoring
      const score = await MLScorer.scoreCode(result.refactoredCode, goal);

      return {
        changes: result.changes,
        proposal,
        score,
        complexityImprovement: result.complexityAfter
      };
    } catch (error: any) {
      console.error('Refactoring failed:', error);
      throw error;
    }
  }
}