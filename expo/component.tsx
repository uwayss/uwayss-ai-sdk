import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
} from "react-native";

export interface KeyOnboardingProps {
  /**
   * Callback invoked after successfully validating and saving the key.
   */
  onSuccess?: () => void;
  /**
   * Async function to set the key (e.g. from the useAI hook).
   */
  onSaveKey: (key: string) => Promise<boolean>;
  /**
   * Optional custom styling for the container.
   */
  containerStyle?: object;
}

/**
 * A beautiful, premium onboarding component to let users paste their own Google AI Studio API key.
 * Features built-in validation, error states, and clean design.
 */
export function KeyOnboarding({
  onSuccess,
  onSaveKey,
  containerStyle,
}: KeyOnboardingProps) {
  const [inputKey, setInputKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerifyAndSave = async () => {
    if (!inputKey.trim()) {
      setErrorMsg("Please enter an API key.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const success = await onSaveKey(inputKey.trim());
      if (success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMsg("Invalid API key. Please check and try again.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Verification failed. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetApiKey = () => {
    Linking.openURL("https://aistudio.google.com/");
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.card}>
        <Text style={styles.title}>Bring Your Own Key</Text>
        <Text style={styles.subtitle}>
          This app runs locally on your device. To get started, paste your free Google Gemini API key.
        </Text>

        <TouchableOpacity onPress={handleGetApiKey} style={styles.linkContainer}>
          <Text style={styles.linkText}>Get a free API key from Google AI Studio →</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, errorMsg ? styles.inputError : null]}
          placeholder="AIzaSy..."
          placeholderTextColor="#71717a"
          value={inputKey}
          onChangeText={(val) => {
            setInputKey(val);
            if (errorMsg) setErrorMsg(null);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <TouchableOpacity
          onPress={handleVerifyAndSave}
          disabled={loading}
          style={[styles.button, loading ? styles.buttonDisabled : null]}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify & Save Key</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#09090b", // Sleek dark zinc background
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#18181b", // Card color zinc-900
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fafafa",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  linkContainer: {
    alignSelf: "center",
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
    color: "#6366f1", // Sleek Indigo
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  input: {
    height: 48,
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#fafafa",
    marginBottom: 12,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginBottom: 16,
    textAlign: "left",
  },
  button: {
    height: 48,
    backgroundColor: "#4f46e5", // Indigo-600
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#312e81",
  },
  buttonText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
});
