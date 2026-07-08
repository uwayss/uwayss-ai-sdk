# Client API Reference

The `GeminiClient` class handles all interactions with the Gemini API.

```typescript
import { GeminiClient } from 'uwayss-ai-sdk';

const client = new GeminiClient(apiKey);
```

---

## `ask`

Sends a standard text prompt and returns the generated text response.

### Signature

```typescript
async ask(prompt: string, options?: AskOptions): Promise<string>
```

### Options (`AskOptions`)

- `model` (string, default: `"gemini-2.5-flash"`): The Gemini model to query.
- `temperature` (number, optional): Generation temperature.
- `maxOutputTokens` (number, optional): Maximum tokens to generate.
- `systemInstruction` (string, optional): Guide the system behavior.

### Example

```typescript
const reply = await client.ask('What is 2+2?', {
  model: 'gemini-2.5-flash',
  temperature: 0.1,
});
```

---

## `askJSON`

A hardened utility to request and validate structured JSON outputs using a Zod schema. It strips markdown blocks, parses the JSON, and validates it. If validation or parsing fails, it retries once, providing Gemini with the parsing error context for self-correction.

### Signature

```typescript
async askJSON<T>(prompt: string, schema: z.ZodSchema<T>, options?: AskOptions): Promise<T>
```

### Example

```typescript
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  task: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
});

type Task = z.infer<typeof TaskSchema>;

const task = await client.askJSON<Task>('Generate a mock TODO task for coding.', TaskSchema);

console.log(task.priority); // Type-safe and validated
```

---

## `askStream`

Streams response text chunks from the model. Returns an async generator.

### Signature

```typescript
async *askStream(prompt: string, options?: AskOptions): AsyncGenerator<string, void, unknown>
```

### Example

```typescript
const stream = client.askStream('Tell me a story.');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

---

## `listModels`

Lists available models in the Gemini developer API. Useful for letting users select their preferred active model in your UI.

### Signature

```typescript
async listModels(): Promise<Array<{
  name: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}>>
```

### Example

```typescript
const models = await client.listModels();
console.log(models[0].name); // e.g. "models/gemini-2.5-flash"
```

---

## `getModelLimits`

Returns typical rate limits (Requests Per Minute, Requests Per Day, Tokens Per Minute) and estimated tier for a given model. (Gemini does not provide a live remaining quota API for developer keys).

### Signature

```typescript
async getModelLimits(model?: string): Promise<{
  requestsPerMinute: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
  estimatedTier: "free" | "paid" | "unknown";
}>
```

### Example

```typescript
const limits = await client.getModelLimits('gemini-2.5-flash');
console.log(limits.requestsPerMinute); // 15
```
