import { GeminiService } from '../services/gemini';
import { MemoryService } from '../memory/sqlite';
import { SafetyService } from '../services/safety';

export class DebugAgent {
  constructor(
    private gemini: GeminiService,
    private memory: MemoryService,
    private safety: SafetyService
  ) {}

  async debugFile(filePath: string, code: string, errorMessage?: string) {
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
      const result = await this.gemini.generateJSON<any>(prompt, 
        "You are an elite debugging agent specialized in MERN stack.");
      
      const proposal = await this.safety.createDiffProposal(filePath, result.fixedCode);

      return {
        analysis: result.analysis,
        rootCause: result.rootCause,
        proposal,
        confidence: result.confidence
      };
    } catch (error: any) {
      console.error('Debug failed:', error);
      throw error;
    }
  }
}