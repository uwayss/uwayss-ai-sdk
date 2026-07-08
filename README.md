# uwayss-ai-sdk

A private-use utility for talking directly to Google's Gemini API with a Bring-Your-Own-Key (BYOK) model. Built specifically for scaffolding light, backendless personal apps.

This repo is public but not published to npm. It is installed directly via git:

```bash
npm i github:uwayss/uwayss-ai-sdk
```

---

## Why this exists (BYOK)

Most wrappers or standard setups assume server-side orchestration and shared credentials. This SDK is designed for clients/apps where every end-user brings their own free Gemini API key from Google AI Studio.

The library manages:

1. **Key validation & lifecycle**: Proves a pasted key is active using a cheap ping to `gemini-2.5-flash` before saving, with a clear "no key set" state.
2. **Hardened structured JSON**: Strips markdown fences, parses, and validates output against your custom `zod` schemas. Retries once with error context on failure.
3. **Typed error taxonomy**: Maps raw Google errors to a simple union (`bad_key`, `rate_limited`, `quota_exhausted`, `network`, `unknown`) for straightforward switch-casing.

---

## Architecture

The project is structured as a pure TypeScript module (`core/`), completely free of third-party framework or runtime dependencies. It can be used anywhere: in Node.js scripts, Telegram bots, frontend web apps, etc.

---

## Core Usage Example

```typescript
import { GeminiClient } from 'uwayss-ai-sdk';
import { z } from 'zod';

// Initialize client with key (e.g. from env, database, input)
const client = new GeminiClient(process.env.GEMINI_API_KEY);

// 1. Standard ask
const text = await client.ask('Why is the sky blue?');

// 2. Schema-validated askJSON
const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  cookTimeMinutes: z.number(),
});

try {
  const recipe = await client.askJSON('Suggest a simple pasta recipe', RecipeSchema);
  console.log(recipe.name, recipe.ingredients);
} catch (err: any) {
  if (err.kind === 'bad_key') {
    // Prompt key update
  } else if (err.kind === 'rate_limited') {
    // Show back-off indicator
  }
}

// 3. List available models
const models = await client.listModels();
console.log(models); // Array of available model metadata

// 4. Fetch static model limits
// Note: The Gemini API does not expose a live "remaining quota" endpoint.
// This utility retrieves estimated limits based on your model/tier.
const limits = await client.getModelLimits('gemini-2.5-flash');
console.log(limits); // { requestsPerMinute: 15, requestsPerDay: 1500, tokensPerMinute: 1000000, estimatedTier: "free" }
```

## License

MIT (c) 2026 uwayss.
