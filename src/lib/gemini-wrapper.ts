import { GoogleGenAI } from '@google/genai';

interface WrapperOptions {
    model?: string;
    isJson?: boolean;
    schema?: any;
    maxRetries?: number;
}

export async function generateContentWithRetry(ai: GoogleGenAI, prompt: string, options: WrapperOptions = {}) {
    const {
        model = "gemini-2.5-flash",
        isJson = false,
        schema,
        maxRetries = 6
    } = options;

    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            const reqConfig: any = {};
            if (isJson) {
               reqConfig.responseMimeType = "application/json";
               if (schema) reqConfig.responseSchema = schema;
            }

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                ...(Object.keys(reqConfig).length > 0 && { config: reqConfig })
            });

            return response.text;
        } catch (error: any) {
            // Determine if it is a rate limit error (429)
            const isRateLimit = error?.status === 429 || 
                                error?.status === 'RESOURCE_EXHAUSTED' ||
                                (error?.message && error.message.includes('429')) ||
                                (error?.message && error.message.includes('quota'));

            const isUnavailable = error?.status === 503 ||
                                  error?.status === 'UNAVAILABLE' ||
                                  (error?.message && error.message.includes('503')) ||
                                  (error?.message && error.message.includes('high demand'));
                                
            if (isRateLimit || isUnavailable) {
                attempts++;
                if (attempts >= maxRetries) {
                    if (isRateLimit) {
                         const customError = new Error(`You have hit your daily Google API limits for this model. Please wait until tomorrow or upgrade your Firebase billing account.`);
                         (customError as any).isRateLimit = true;
                         throw customError;
                    }
                    throw error;
                }
                
                // 62s for 429 quota exhaustion, or exponential backoff for 503 (15s, 30s, 45s, 60s...)
                const waitTime = isRateLimit ? 15000 : (15000 * attempts); 
                console.warn(`API Exception (${isRateLimit ? '429 Quota' : '503 High Demand'}). Retrying attempt ${attempts} of ${maxRetries}... waiting ${waitTime / 1000} seconds.`);
                await new Promise(res => setTimeout(res, waitTime));
            } else {
                throw error; // Throw other errors immediately (e.g. 400 Bad Request)
            }
        }
    }
    throw new Error("Max retries exceeded for Gemini API");
}
