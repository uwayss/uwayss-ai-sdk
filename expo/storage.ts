import * as SecureStore from "expo-secure-store";

const DEFAULT_KEY_NAME = "__uwayss_gemini_api_key__";

/**
 * Retrieves the stored Gemini API key from SecureStore.
 */
export async function getStoredApiKey(keyName: string = DEFAULT_KEY_NAME): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(keyName);
  } catch (error) {
    console.error("Failed to retrieve Gemini API key from SecureStore:", error);
    return null;
  }
}

/**
 * Saves the Gemini API key in SecureStore.
 */
export async function setStoredApiKey(
  apiKey: string,
  keyName: string = DEFAULT_KEY_NAME
): Promise<void> {
  try {
    await SecureStore.setItemAsync(keyName, apiKey.trim());
  } catch (error) {
    console.error("Failed to save Gemini API key to SecureStore:", error);
    throw error;
  }
}

/**
 * Removes the Gemini API key from SecureStore.
 */
export async function clearStoredApiKey(keyName: string = DEFAULT_KEY_NAME): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(keyName);
  } catch (error) {
    console.error("Failed to clear Gemini API key from SecureStore:", error);
    throw error;
  }
}
