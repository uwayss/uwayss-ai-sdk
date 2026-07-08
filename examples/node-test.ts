import { z } from "zod";
import { GeminiClient } from "../core/index";

// To run this script:
// 1. Ensure you have a GEMINI_API_KEY environment variable set.
// 2. Run: npx ts-node examples/node-test.ts

async function runDemo() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
    console.log(
      "Please set it with: export GEMINI_API_KEY='your_api_key_here'",
    );
    process.exit(1);
  }

  console.log("🚀 Initializing GeminiClient...");
  const client = new GeminiClient(apiKey);

  try {
    // 1. Basic text prompt example
    console.log("\n💬 1. Testing ask() with basic prompt...");
    const textResponse = await client.ask(
      "Explain the Bring-Your-Own-Key model in one short sentence.",
    );
    console.log(`Response:\n"${textResponse.trim()}"`);

    // 2. Zod-validated structured JSON output example
    console.log("\n📦 2. Testing askJSON() with Zod schema validation...");

    const UserProfileSchema = z.object({
      name: z.string(),
      role: z.string(),
      skills: z.array(z.string()),
      isAvailable: z.boolean(),
    });

    type UserProfile = z.infer<typeof UserProfileSchema>;

    const prompt =
      "Generate a mock user profile for a software engineer who is looking for work. Make it realistic.";

    const profile = await client.askJSON<UserProfile>(
      prompt,
      UserProfileSchema,
    );

    console.log("Validated JSON Response:", JSON.stringify(profile, null, 2));
    console.log(`Name: ${profile.name}`);
    console.log(`Role: ${profile.role}`);
    console.log(`Skills: ${profile.skills.join(", ")}`);
    console.log(`Available: ${profile.isAvailable ? "Yes" : "No"}`);

    // 3. List available models
    console.log("\n📋 3. Listing available models...");
    const models = await client.listModels();
    console.log(`Found ${models.length} models. Sample:`);
    console.log(models.slice(0, 3));

    // 4. Get model limits / quota info
    console.log("\n📊 4. Fetching model limits & quota metadata...");
    const limits = await client.getModelLimits("gemini-2.5-flash");
    console.log("gemini-2.5-flash limits:", limits);

    console.log("\n✅ All core functions executed successfully!");
  } catch (error: any) {
    console.error("\n❌ Execution failed!");
    console.error(`Error Kind: ${error.kind || "unknown"}`);
    console.error(`Message: ${error.message}`);
    if (error.originalError) {
      console.error("Original Error:", error.originalError);
    }
  }
}

runDemo();
