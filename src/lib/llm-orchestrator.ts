import { GoogleGenAI } from "@google/generative-ai";

class LLMOrchestrator {
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will fail.");
    }
    this.genAI = new GoogleGenAI(apiKey || "");
  }

  async executeCall<T>(params: {
    userId: string;
    provider: string;
    model: string;
    prompt: string;
    schema?: any;
  }): Promise<{ success: boolean; data?: T; error?: string; rawOutput?: string }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: params.model });
      
      const result = await model.generateContent(params.prompt);
      const response = await result.response;
      const text = response.text();

      // Simple parsing - usually we want Zod/Validation here but keeping it lean for restoration
      if (params.schema) {
        try {
          // Find JSON in text
          const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]), rawOutput: text };
          }
        } catch (e) {
          return { success: false, error: "Failed to parse JSON schema", rawOutput: text };
        }
      }

      return { success: true, rawOutput: text };
    } catch (error: any) {
      console.error("LLM Execution error:", error);
      return { success: false, error: error.message };
    }
  }
}

export const llmOrchestrator = new LLMOrchestrator();
