import { GoogleGenAI } from "@google/genai";
import { toSDKError } from "./errors";

/**
 * Validates a Gemini API key by making a minimal call to a cheap model.
 * Returns true if valid, false if invalid. Throws for other unexpected errors (e.g. network).
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey || apiKey.trim() === "") {
    return false;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Ping with a tiny content request and minimal output tokens
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "ping",
      config: {
        maxOutputTokens: 1,
      },
    });
    return true;
  } catch (err) {
    const sdkErr = toSDKError(err);
    if (sdkErr.kind === "bad_key") {
      return false;
    }
    // For rate limit or network issues, we throw so the caller knows the check couldn't be performed,
    // rather than falsely asserting that the key itself is invalid.
    throw sdkErr;
  }
}
