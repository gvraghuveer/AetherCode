"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefactorAgent = void 0;
const scorer_1 = require("../ml-engine/scorer");
class RefactorAgent {
    constructor(gemini, safety) {
        this.gemini = gemini;
        this.safety = safety;
    }
    async refactorCode(filePath, code, goal = "Improve maintainability, performance and readability") {
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
            const result = await this.gemini.generateJSON(prompt, "You are a senior software engineer focused on clean architecture and performance.");
            const proposal = await this.safety.createDiffProposal(filePath, result.refactoredCode);
            // Score the refactoring
            const score = await scorer_1.MLScorer.scoreCode(result.refactoredCode, goal);
            return {
                changes: result.changes,
                proposal,
                score,
                complexityImprovement: result.complexityAfter
            };
        }
        catch (error) {
            console.error('Refactoring failed:', error);
            throw error;
        }
    }
}
exports.RefactorAgent = RefactorAgent;
//# sourceMappingURL=refactor.js.map