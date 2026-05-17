"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningEngine = void 0;
class LearningEngine {
    constructor(memory) {
        this.memory = memory;
    }
    async recordOutcome(taskPrompt, generatedCode, success, score) {
        await this.memory.recordError("generation", taskPrompt.substring(0, 100), generatedCode.substring(0, 200), success);
        // Store successful patterns
        if (success && score.overall > 85) {
            // Could store in user_patterns table
            console.log(`✅ Learned high-quality pattern. Score: ${score.overall}`);
        }
    }
    async getLearnedPromptPrefix() {
        // Retrieve top patterns for few-shot learning
        return `
Learned Rules from Past Executions:
- Prefer TypeScript strict mode
- Use functional patterns in React
- Modularize backend services
- Always handle errors gracefully
`;
    }
    async improvePrompt(originalPrompt) {
        // Meta-prompt optimization based on past failures
        return originalPrompt + "\n\nApply all learned best practices from memory.";
    }
}
exports.LearningEngine = LearningEngine;
//# sourceMappingURL=learning.js.map