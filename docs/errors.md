# Error Handling & Taxonomy

`uwayss-ai-sdk` intercepts raw API exceptions thrown by the underlying `@google/genai` client (or network layer) and wraps them into a unified, predictable structure. This allows developers to handle failures without needing to manually parse HTTP codes or JSON strings.

---

## `GeminiSDKError`

Every error thrown by the client is wrapped in the custom class `GeminiSDKError`.

### Structure

```typescript
class GeminiSDKError extends Error {
  readonly kind: ErrorKind;
  readonly originalError: unknown; // The raw error thrown by @google/genai or fetch
}
```

---

## `ErrorKind`

A union representing the classified failure type:

```typescript
type ErrorKind =
  | 'bad_key' // The key is invalid, unauthorized, or not configured
  | 'rate_limited' // Too many requests (RPM exceeded)
  | 'quota_exhausted' // Total usage limit hit (RPD or billing cap exceeded)
  | 'network' // Connection issue, timeout, DNS resolution failure
  | 'unknown'; // Any other unclassified error
```

---

## Example Usage

```typescript
import { GeminiClient, GeminiSDKError } from 'uwayss-ai-sdk';

const client = new GeminiClient(badKey);

try {
  await client.ask('Hi');
} catch (error) {
  if (error instanceof GeminiSDKError) {
    switch (error.kind) {
      case 'bad_key':
        console.error('🔑 Please check your API key in settings.');
        break;
      case 'rate_limited':
        console.error('⏳ Server rate limited. Retrying in 10s...');
        break;
      case 'quota_exhausted':
        console.error('💳 Daily quota exhausted. Upgrade or wait until midnight.');
        break;
      case 'network':
        console.error('📶 Connection issue. Please check your wifi.');
        break;
      default:
        console.error('❌ An unknown error occurred:', error.message);
    }
  }
}
```
