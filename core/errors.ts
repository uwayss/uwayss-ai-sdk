export type ErrorKind =
  | "bad_key"
  | "rate_limited"
  | "quota_exhausted"
  | "network"
  | "unknown";

export class GeminiSDKError extends Error {
  public readonly kind: ErrorKind;
  public readonly originalError: unknown;

  constructor(kind: ErrorKind, message: string, originalError: unknown) {
    super(message);
    this.name = "GeminiSDKError";
    this.kind = kind;
    this.originalError = originalError;
    Object.setPrototypeOf(this, GeminiSDKError.prototype);
  }
}

/**
 * Normalizes raw errors from the @google/genai SDK (or fetch) into typed GeminiSDKErrors.
 */
export function toSDKError(error: unknown): GeminiSDKError {
  if (error instanceof GeminiSDKError) {
    return error;
  }

  const err = error as any;
  const message = err?.message || String(error);
  const status = err?.status || err?.statusCode || err?.statusLines || err?.response?.status;

  // Try to inspect status code or message content to classify the error kind.
  if (
    status === 400 &&
    (message.includes("API_KEY_INVALID") || message.includes("invalid key") || message.includes("not valid"))
  ) {
    return new GeminiSDKError(
      "bad_key",
      "The provided Gemini API key is invalid or unauthorized.",
      error
    );
  }

  if (status === 429) {
    if (message.toLowerCase().includes("quota")) {
      return new GeminiSDKError(
        "quota_exhausted",
        "Your Google AI Studio quota has been exhausted.",
        error
      );
    }
    return new GeminiSDKError(
      "rate_limited",
      "Rate limit exceeded. Please slow down your requests.",
      error
    );
  }

  // Network/Connection issues
  if (
    err?.code === "ENOTFOUND" ||
    err?.code === "ECONNREFUSED" ||
    err?.code === "ETIMEDOUT" ||
    message.includes("fetch failed") ||
    message.includes("network error")
  ) {
    return new GeminiSDKError(
      "network",
      "A network or connection error occurred while contacting the Gemini API.",
      error
    );
  }

  // Fallback pattern matching on the message
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("api key") && (lowerMessage.includes("invalid") || lowerMessage.includes("expired"))) {
    return new GeminiSDKError("bad_key", "The provided Gemini API key is invalid.", error);
  }
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("429")) {
    return new GeminiSDKError("rate_limited", "Rate limit exceeded.", error);
  }
  if (lowerMessage.includes("quota")) {
    return new GeminiSDKError("quota_exhausted", "Quota exhausted.", error);
  }

  return new GeminiSDKError(
    "unknown",
    `An unknown Gemini SDK error occurred: ${message}`,
    error
  );
}
