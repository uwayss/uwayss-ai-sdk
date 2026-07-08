# Getting Started

`uwayss-ai-sdk` is a lightweight, BYOK (Bring-Your-Own-Key) TypeScript SDK wrapper around Google's official `@google/genai` library. It contains zero external framework dependencies and can run in any modern Node.js, browser, or React Native runtime environment.

## Installation

Install the package directly from the public GitHub repository:

```bash
npm install github:uwayss/uwayss-ai-sdk
```

---

## Basic Lifecycle

Because it uses a **BYOK** model, your app is responsible for asking the user for their Gemini API key (from Google AI Studio) and passing it to the client.

### 1. Verification

Before storing the key, check if it works:

```typescript
import { validateApiKey } from 'uwayss-ai-sdk';

const isValid = await validateApiKey(userInputKey);
if (isValid) {
  // Key is functional. Safe to store in local storage / DB.
}
```

### 2. Client Initialization

Create a client instance:

```typescript
import { GeminiClient } from 'uwayss-ai-sdk';

const client = new GeminiClient(storedApiKey);
```

If you initialize the client with `null`, `undefined`, or an empty string, calling client methods will throw a `GeminiSDKError` with the `bad_key` error kind.

---

## Next Steps

- Consult the [Client API Reference](client.md) for details on making requests, streaming, and structured JSON parsing.
- See [Error Handling](errors.md) to learn about the taxonomic error wrapper.
