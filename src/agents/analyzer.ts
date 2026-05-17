import { GeminiService } from '../services/gemini';
import { ASTParser } from '../parsers/ast';
import { MLScorer } from '../ml-engine/scorer';

export class AlgorithmAnalyzer {
  constructor(private gemini: GeminiService) {}

  async analyzeAlgorithm(code: string, fileName: string) {
    const astMetrics = ASTParser.analyzeTypeScript(code, fileName);
    const complexity = ASTParser.analyzeComplexity(code);

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
      const analysis = await this.gemini.generateJSON<any>(prompt,
        "You are an expert in algorithms and data structures.");

      const score = await MLScorer.scoreCode(analysis.optimizedCode || code, "Algorithm optimization");

      return {
        astMetrics,
        complexity,
        ...analysis,
        qualityScore: score
      };
    } catch (e) {
      return { error: "Analysis failed", complexity };
    }
  }
}