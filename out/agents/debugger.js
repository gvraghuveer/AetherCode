"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugAgent = void 0;
class DebugAgent {
    constructor(gemini, memory, safety) {
        this.gemini = gemini;
        this.memory = memory;
        this.safety = safety;
    }
    async debugFile(filePath, code, errorMessage) {
        const prompt = `
Analyze and fix the following code.

File: ${filePath}
${errorMessage ? `Error: ${errorMessage}` : ''}

Code:
\`\`\`
${code}
\`\`\`

Return your response in this exact JSON format:
{
  "analysis": "brief explanation",
  "fixedCode": "complete corrected code",
  "rootCause": "...",
  "confidence": 0.XX
}
`;
        try {
            const result = await this.gemini.generateJSON(prompt, "You are an elite debugging agent specialized in MERN stack.");
            const proposal = await this.safety.createDiffProposal(filePath, result.fixedCode);
            return {
                analysis: result.analysis,
                rootCause: result.rootCause,
                proposal,
                confidence: result.confidence
            };
        }
        catch (error) {
            console.error('Debug failed:', error);
            throw error;
        }
    }
}
exports.DebugAgent = DebugAgent;
//# sourceMappingURL=debugger.js.map