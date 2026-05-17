/**
 * AUSPEXI LLM Orchestrator
 * 
 * Coordinates rate limiting, output validation, and exponential backoff
 * Provides a unified interface for querying multiple LLM providers
 * Guarantees reliable 10K+/day operation
 */

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  tokenBucketLimiter,
  perUserRateLimiter,
  callWithExponentialBackoff,
} from './rate-limit';
import {
  validateOutput,
  formatValidationErrors,
  performSanityChecks,
  detectLikelyHallucination,
  createRetryPrompt,
  SOVMetricsSchema,
  ContentScorerSchema,
  FactExtractionSchema,
  BrandMonitorSchema,
  SimulatorSchema,
  AnchorsSchema,
  type SOVMetrics,
  type ContentScorerResult,
  type FactExtraction,
  type BrandMonitorResult,
  type SimulatorResult,
  type AnchorsResult,
} from './output-validation';

interface LLMCallOptions {
  userId: string;
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  prompt?: string;
  contents?: any[]; // For chat history or multi-part contents
  temperature?: number;
  maxRetries?: number;
  schema?: any; // Zod schema for validation
}

interface LLMCallResult<T> {
  success: boolean;
  data?: T;
  rawOutput?: string;
  error?: string;
  retriesAttempted: number;
  validationErrors?: string[];
  hallucationDetected?: boolean;
}

/**
 * Main LLM Orchestrator
 */
export class LLMOrchestrator {
  private maxValidationRetries = 3;
  private temperatureDecrement = 0.2; // Reduce temp by 0.2 on each retry

  /**
   * Execute an LLM call with full safeguards
   */
  async executeCall<T>(options: LLMCallOptions): Promise<LLMCallResult<T>> {
    const {
      userId,
      provider,
      model,
      prompt,
      contents,
      temperature = 0.7,
      maxRetries = 3,
      schema,
    } = options;

    // ===== STEP 1: Check Rate Limits =====
    const userLimit = perUserRateLimiter.checkUserLimit(userId);
    if (!userLimit.allowed) {
      return {
        success: false,
        error: `User rate limit exceeded. Reset at ${new Date(userLimit.resetTime).toISOString()}`,
        retriesAttempted: 0,
      };
    }

    const providerLimit = tokenBucketLimiter.checkLimit(provider);
    if (!providerLimit.allowed) {
      return {
        success: false,
        error: `${provider} rate limit exceeded. Reset at ${new Date(providerLimit.resetTime).toISOString()}. Retry after ${providerLimit.retryAfterMs}ms`,
        retriesAttempted: 0,
      };
    }

    // ===== STEP 2: Call LLM with Exponential Backoff =====
    let rawOutput: string;
    let retriesAttempted = 0;

    const finalPrompt = prompt || (contents ? JSON.stringify(contents) : '');

    try {
      rawOutput = await callWithExponentialBackoff(
        async () => {
          const response = await this.callProvider(provider, model, finalPrompt, temperature, contents);
          return response;
        },
        provider,
        maxRetries,
        500
      );
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to call ${provider}: ${error.message}`,
        retriesAttempted: maxRetries,
      };
    }

    // ===== STEP 3: Validate Output Against Schema =====
    if (!schema) {
      return {
        success: true,
        data: rawOutput as T,
        rawOutput,
        retriesAttempted,
      };
    }

    // Try to validate and auto-retry if needed
    for (let validationAttempt = 0; validationAttempt < this.maxValidationRetries; validationAttempt++) {
      try {
        // Parse JSON first
        let parsedOutput: any;
        try {
          // Robustly find and extract JSON from potential markdown/text
          let cleanedOutput = rawOutput.trim();
          if (cleanedOutput.includes('```')) {
            const match = cleanedOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (match) cleanedOutput = match[1];
          }
          parsedOutput = JSON.parse(cleanedOutput);
        } catch {
          return {
            success: false,
            error: 'LLM output is not valid JSON',
            rawOutput,
            retriesAttempted,
            validationErrors: ['Output is not valid JSON'],
          };
        }

        // Validate against schema
        const validation = validateOutput(schema, parsedOutput);

        if (validation.valid) {
          // ===== STEP 4: Perform Sanity Checks (for SOV data) =====
          if (schema === SOVMetricsSchema && validation.data) {
            const sanityCheck = performSanityChecks(validation.data as SOVMetrics);
            if (!sanityCheck.valid) {
              console.warn('[Orchestrator] Sanity check failed:', sanityCheck.issues);
              // Log but don't fail - data might still be usable
            }

            // Check for hallucination patterns
            if (detectLikelyHallucination(validation.data as SOVMetrics)) {
              console.warn('[Orchestrator] Potential hallucination detected in SOV data');
              // Retry with lower temperature
              if (validationAttempt < this.maxValidationRetries - 1) {
                console.log('[Orchestrator] Retrying with reduced temperature...');
                const reducedTemp = Math.max(0, temperature - this.temperatureDecrement);
                const retryPrompt = createRetryPrompt(prompt, 'Detected hallucination patterns. Please verify all numeric values are realistic.');
                
                try {
                  rawOutput = await this.callProvider(
                    provider,
                    model,
                    retryPrompt,
                    reducedTemp
                  );
                  retriesAttempted++;
                  continue; // Retry validation
                } catch (retryError: any) {
                  console.error('[Orchestrator] Retry failed:', retryError.message);
                  // Fall through and return what we have
                }
              }
            }
          }

          return {
            success: true,
            data: validation.data as T,
            rawOutput,
            retriesAttempted,
          };
        } else {
          // Validation failed - retry with lower temperature
          if (validationAttempt < this.maxValidationRetries - 1) {
            console.warn('[Orchestrator] Validation failed. Retrying with reduced temperature...');
            console.warn('[Orchestrator] Validation errors:', formatValidationErrors(validation.errors || []));

            const reducedTemp = Math.max(0, temperature - this.temperatureDecrement);
            const errorSummary = formatValidationErrors(validation.errors || []);
            const retryPrompt = createRetryPrompt(prompt, errorSummary);

            try {
              rawOutput = await this.callProvider(
                provider,
                model,
                retryPrompt,
                reducedTemp
              );
              retriesAttempted++;
              continue; // Retry validation
            } catch (retryError: any) {
              console.error('[Orchestrator] Retry call failed:', retryError.message);
              return {
                success: false,
                error: `Validation failed and retry call failed: ${retryError.message}`,
                rawOutput,
                retriesAttempted,
                validationErrors: validation.errors?.map((e) => e.message),
              };
            }
          } else {
            return {
              success: false,
              error: 'Validation failed after max retries',
              rawOutput,
              retriesAttempted,
              validationErrors: validation.errors?.map((e) => e.message),
            };
          }
        }
      } catch (error: any) {
        return {
          success: false,
          error: `Validation error: ${error.message}`,
          rawOutput,
          retriesAttempted,
        };
      }
    }

    return {
      success: false,
      error: 'Max validation retries exceeded',
      rawOutput,
      retriesAttempted,
    };
  }

  /**
   * Provider-specific call implementations
   * This is a stub - integrate with actual SDK calls
   */
  private async callProvider(
    provider: string,
    model: string,
    prompt: string,
    temperature: number,
    contents?: any[]
  ): Promise<string> {
    // This should be implemented with actual SDK calls
    // Shown here as a template
    switch (provider) {
      case 'openai':
        return this.callOpenAI(model, prompt, temperature);
      case 'anthropic':
        return this.callAnthropic(model, prompt, temperature);
      case 'gemini':
        return this.callGemini(model, prompt, temperature, contents);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOpenAI(model: string, prompt: string, temperature: number): Promise<string> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not set');
    
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
    });
    return response.choices[0].message.content || '';
  }

  private async callAnthropic(model: string, prompt: string, temperature: number): Promise<string> {
    // Anthropic not yet in package.json, so we'll leave it as a throw for now
    // or we could install it. But let's stick to OpenAI and Gemini as per audit.
    throw new Error('Anthropic SDK not yet integrated. Please install @anthropic-ai/sdk.');
  }

  private async callGemini(modelName: string, prompt: string, temperature: number, contents?: any[]): Promise<string> {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set');

    const genAI: any = new GoogleGenAI({ apiKey: key });
    
    const isJsonRequested = prompt.toLowerCase().includes('json') || prompt.toLowerCase().includes('schema');

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: contents || prompt,
      config: { 
        generationConfig: { temperature },
        responseMimeType: isJsonRequested ? "application/json" : undefined
      }
    });
    
    return result.text || '';
  }

  /**
   * Get current rate limit status
   */
  getStatus(userId: string) {
    return {
      user: perUserRateLimiter.getUserStatus(userId),
      providers: {
        openai: tokenBucketLimiter.getStatus('openai'),
        anthropic: tokenBucketLimiter.getStatus('anthropic'),
        gemini: tokenBucketLimiter.getStatus('gemini'),
      },
    };
  }
}

/**
 * Singleton instance
 */
export const llmOrchestrator = new LLMOrchestrator();
