"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmAnalyzer = void 0;
const ast_1 = require("../parsers/ast");
const scorer_1 = require("../ml-engine/scorer");
class AlgorithmAnalyzer {
    constructor(gemini) {
        this.gemini = gemini;
    }
    async analyzeAlgorithm(code, fileName) {
        const astMetrics = ast_1.ASTParser.analyzeTypeScript(code, fileName);
        const complexity = ast_1.ASTParser.analyzeComplexity(code);
        const prompt = `
Analyze this code snippet for algorithmic efficiency.

File: ${fileName}
Complexity: ${complexity.time} time, ${complexity.space} space

Code:
\`\`\`
${code}
\`\`\`

Return JSON:
{
  "algorithmType": "DP | Graph | Sorting | etc",
  "currentComplexity": "${complexity.time}",
  "suggestedImprovement": "...",
  "optimizedCode": "full optimized version if possible",
  "explanation": "detailed explanation",
  "confidence": 0.XX
}
`;
        try {
            const analysis = await this.gemini.generateJSON(prompt, "You are an expert in algorithms and data structures.");
            const score = await scorer_1.MLScorer.scoreCode(analysis.optimizedCode || code, "Algorithm optimization");
            return {
                astMetrics,
                complexity,
                ...analysis,
                qualityScore: score
            };
        }
        catch (e) {
            return { error: "Analysis failed", complexity };
        }
    }
}
exports.AlgorithmAnalyzer = AlgorithmAnalyzer;
//# sourceMappingURL=analyzer.js.map