import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { toSDKError, GeminiSDKError } from "./errors";

export interface AskOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

/**
 * Strips markdown code block fences (e.g. ```json ... ```) from a string.
 */
export function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  // Strip starting ```json or ```
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/, "");
  // Strip ending ```
  cleaned = cleaned.replace(/\s*```$/, "");
  return cleaned.trim();
}

export class GeminiClient {
  private ai: GoogleGenAI | null = null;
  private readonly apiKey: string | null = null;

  constructor(apiKey: string | null | undefined) {
    if (apiKey && apiKey.trim() !== "") {
      this.apiKey = apiKey.trim();
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Helper to ensure the client is initialized with an API key.
   */
  private getAIOrThrow(): GoogleGenAI {
    if (!this.ai || !this.apiKey) {
      throw new GeminiSDKError(
        "bad_key",
        "No Gemini API key is configured. Please provide a valid key.",
        null
      );
    }
    return this.ai;
  }

  /**
   * Sends a text prompt to Gemini and returns the full text response.
   */
  async ask(prompt: string, options?: AskOptions): Promise<string> {
    const ai = this.getAIOrThrow();
    const model = options?.model || "gemini-2.5-flash";

    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxOutputTokens,
          systemInstruction: options?.systemInstruction,
        },
      });

      return response.text || "";
    } catch (err) {
      throw toSDKError(err);
    }
  }

  /**
   * Sends a prompt and returns an async generator for streaming text chunks.
   */
  async *askStream(prompt: string, options?: AskOptions): AsyncGenerator<string, void, unknown> {
    const ai = this.getAIOrThrow();
    const model = options?.model || "gemini-2.5-flash";

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxOutputTokens,
          systemInstruction: options?.systemInstruction,
        },
      });
    } catch (err) {
      throw toSDKError(err);
    }

    try {
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (err) {
      throw toSDKError(err);
    }
  }

  /**
   * Hardened structured output helper. Strips markdown fences, parses,
   * validates against a caller-provided Zod schema, and retries once on failure.
   */
  async askJSON<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: AskOptions
  ): Promise<T> {
    const ai = this.getAIOrThrow();
    const model = options?.model || "gemini-2.5-flash";

    // Merge options to ask for application/json output if possible
    const runAttempt = async (attemptPrompt: string): Promise<string> => {
      const response = await ai.models.generateContent({
        model,
        contents: attemptPrompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxOutputTokens,
          systemInstruction: options?.systemInstruction,
          responseMimeType: "application/json",
        },
      });
      return response.text || "";
    };

    let lastText = "";
    try {
      // First attempt
      lastText = await runAttempt(prompt);
      const cleaned = stripMarkdownFences(lastText);
      const parsed = JSON.parse(cleaned);
      const validation = schema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }
      // If validation fails, throw to trigger the catch block (retry)
      throw new Error(`Schema validation failed: ${JSON.stringify(validation.error.format())}`);
    } catch (firstError: any) {
      // Retry once with an explicit instruction to fix the malformed output
      const retryPrompt = `${prompt}
      
[SYSTEM NOTE: Your previous response could not be parsed or did not match the required schema.
Error: ${firstError.message || firstError}
Previous output was:
${lastText}

Please respond with a corrected, strictly compliant JSON representation.]`;

      try {
        const retryText = await runAttempt(retryPrompt);
        const cleanedRetry = stripMarkdownFences(retryText);
        const parsedRetry = JSON.parse(cleanedRetry);
        return schema.parse(parsedRetry); // Will throw directly if it fails again
      } catch (secondError) {
        throw toSDKError(secondError);
      }
    }
  }

  /**
   * Fetches available models from Google Gemini API.
   * Returns a list of available model metadata containing name, description, etc.
   */
  async listModels(): Promise<Array<{ name: string; displayName?: string; description?: string; inputTokenLimit?: number; outputTokenLimit?: number }>> {
    const ai = this.getAIOrThrow();
    try {
      const pager = await ai.models.list();
      const modelsList: Array<{ name: string; displayName?: string; description?: string; inputTokenLimit?: number; outputTokenLimit?: number }> = [];
      for await (const model of pager) {
        modelsList.push({
          name: model.name || "",
          displayName: (model as any).displayName,
          description: (model as any).description,
          inputTokenLimit: (model as any).inputTokenLimit,
          outputTokenLimit: (model as any).outputTokenLimit,
        });
      }
      return modelsList;
    } catch (err) {
      throw toSDKError(err);
    }
  }

  /**
   * Note: The Google Gemini Developer API does not expose a direct REST endpoint 
   * to query the remaining quota or token limits programmatically for an API key. 
   * Active limits must be viewed in Google AI Studio or Google Cloud Console dashboards.
   * 
   * This method returns static metadata about typical rate limits for the specified model
   * to aid consumption strategies.
   */
  async getModelLimits(model: string = "gemini-2.5-flash"): Promise<{
    requestsPerMinute: number;
    requestsPerDay?: number;
    tokensPerMinute?: number;
    estimatedTier: "free" | "paid" | "unknown";
  }> {
    const m = model.toLowerCase();
    if (m.includes("gemini-2.5-flash") || m.includes("gemini-2.0-flash")) {
      return {
        requestsPerMinute: 15,
        requestsPerDay: 1500,
        tokensPerMinute: 1_000_000,
        estimatedTier: "free",
      };
    } else if (m.includes("gemini-2.5-pro") || m.includes("gemini-2.0-pro")) {
      return {
        requestsPerMinute: 2,
        requestsPerDay: 50,
        tokensPerMinute: 32_000,
        estimatedTier: "free",
      };
    }
    return {
      requestsPerMinute: 15,
      estimatedTier: "unknown",
    };
  }
}
