"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLScorer = void 0;
class MLScorer {
    static calculateMSE(expected, actual) {
        const eTokens = expected.trim().split(/\s+/);
        const aTokens = actual.trim().split(/\s+/);
        const maxLen = Math.max(eTokens.length, aTokens.length);
        let sumSquaredError = 0;
        for (let i = 0; i < maxLen; i++) {
            const e = eTokens[i] || '';
            const a = aTokens[i] || '';
            sumSquaredError += (e === a ? 0 : 1) ** 2;
        }
        return sumSquaredError / maxLen;
    }
    static async scoreCode(code, task, testOutput) {
        // Basic static scoring (expand with AST + LLM critique later)
        let score = {
            overall: 75,
            correctness: 80,
            efficiency: 70,
            readability: 85,
            security: 75,
            mse: 0.15,
            reward: 0
        };
        if (testOutput) {
            score.mse = this.calculateMSE("expected success", testOutput);
        }
        // Reward formula
        score.reward = (score.overall / 100) * 0.6 + (1 - score.mse) * 0.4;
        return score;
    }
    static async selfCritique(code, task) {
        // Can be called via Gemini for deeper analysis
        return "Self-critique: Looks good but can be more modular.";
    }
}
exports.MLScorer = MLScorer;
//# sourceMappingURL=scorer.js.map