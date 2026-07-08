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

The project contains two distinct layers to keep dependencies light:

- **`core/`** (Imported via `uwayss-ai-sdk`): Zero React Native or Expo dependencies. Can be used in plain Node scripts, Telegram bots, etc.
- **`expo/`** (Imported via `uwayss-ai-sdk/expo`): Layers on `expo-secure-store` to manage key persistence, exposes a `useAI` React hook, and offers a premium drop-in "Enter API Key" onboarding screen.

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

---

## Expo/React Native Usage Example

First, install peers in your Expo app:

```bash
npx expo install expo-secure-store react-native
```

### 1. hook & Storage

```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAI } from 'uwayss-ai-sdk/expo';

export default function App() {
  const { client, hasKey, isLoading, clearKey } = useAI();

  if (isLoading) return <Text>Loading key...</Text>;
  if (!hasKey) return <OnboardingScreen />;

  const handlePress = async () => {
    const res = await client?.ask('Name a color');
    alert(res);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Ask Gemini" onPress={handlePress} />
      <Button title="Log Out / Clear Key" onPress={clearKey} />
    </View>
  );
}
```

### 2. Drop-in Onboarding Screen

```tsx
import React from 'react';
import { useAI, KeyOnboarding } from 'uwayss-ai-sdk/expo';

function OnboardingScreen() {
  const { setKey } = useAI();

  return (
    <KeyOnboarding
      onSaveKey={setKey}
      onSuccess={() => console.log('Key set successfully! Refreshing UI...')}
    />
  );
}
```

---

## License

MIT (c) 2026 uwayss.
