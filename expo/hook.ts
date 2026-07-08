import { useState, useEffect, useMemo } from 'react';
import { GeminiClient } from '../core/client';
import { validateApiKey } from '../core/validation';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from './storage';

export interface UseAIReturn {
  apiKey: string | null;
  isLoading: boolean;
  isValidating: boolean;
  hasKey: boolean;
  client: GeminiClient | null;
  setKey: (key: string) => Promise<boolean>;
  clearKey: () => Promise<void>;
}

/**
 * Custom React hook for managing the user's Bring-Your-Own-Key lifecycle in Expo/React Native.
 * Handles SecureStore syncing, validation, loading states, and client instantiation.
 */
export function useAI(keyName?: string): UseAIReturn {
  const [apiKey, setApiKeyLocal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // Initialize key from SecureStore on mount
  useEffect(() => {
    async function loadKey() {
      try {
        const stored = await getStoredApiKey(keyName);
        setApiKeyLocal(stored);
      } catch (err) {
        console.error('Failed to load Gemini key from SecureStore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadKey();
  }, [keyName]);

  // Memoize client instance so it only updates when apiKey changes
  const client = useMemo(() => {
    return apiKey ? new GeminiClient(apiKey) : null;
  }, [apiKey]);

  /**
   * Validates the provided API key, and if successful, stores it and updates local state.
   * Returns true if key is valid and stored. Returns false if the key is invalid.
   * Throws for other issues (e.g. rate limit, network) during validation.
   */
  const setKey = async (newKey: string): Promise<boolean> => {
    setIsValidating(true);
    try {
      const isValid = await validateApiKey(newKey);
      if (isValid) {
        await setStoredApiKey(newKey, keyName);
        setApiKeyLocal(newKey);
        return true;
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Clears the API key from both state and SecureStore.
   */
  const clearKey = async (): Promise<void> => {
    await clearStoredApiKey(keyName);
    setApiKeyLocal(null);
  };

  return {
    apiKey,
    isLoading,
    isValidating,
    hasKey: !!apiKey,
    client,
    setKey,
    clearKey,
  };
}
