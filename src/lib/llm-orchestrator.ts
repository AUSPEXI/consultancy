import { GoogleGenAI } from "@google/genai";

class LLMOrchestrator {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will fail.");
    }
    this.ai = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  async executeCall<T>(params: {
    userId: string;
    provider: string;
    model: string;
    prompt: string;
    schema?: any;
  }): Promise<{ success: boolean; data?: T; error?: string; rawOutput?: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: params.model.includes('gemini') ? params.model : 'gemini-3-flash-preview',
        contents: params.prompt,
        config: params.schema ? { responseMimeType: 'application/json' } : undefined
      });
      
      const text = response.text || "";

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
