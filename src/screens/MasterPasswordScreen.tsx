import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSetting, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { createMasterMeta, setSessionFromMaster, verifyMasterPassword } from "../security/crypto";

type MasterPasswordScreenProps = StackScreenProps<RootStackParamList, "MasterPassword">;

const MASTER_PASSWORD_KEY = "master_password";
const MASTER_PASSWORD_META_KEY = "master_password_meta";

export default function MasterPasswordScreen({
  navigation,
}: MasterPasswordScreenProps): React.JSX.Element {
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [isSetupMode, setIsSetupMode] = React.useState<boolean>(false);
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [masterMeta, setMasterMeta] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    const loadMode = async (): Promise<void> => {
      const existingMeta = await getSetting(MASTER_PASSWORD_META_KEY);
      const existingLegacy = await getSetting(MASTER_PASSWORD_KEY);
      if (!isMounted) {
        return;
      }
      setMasterMeta(existingMeta);
      setIsSetupMode(!existingMeta && !existingLegacy);
      setIsReady(true);
    };
    void loadMode();
    return () => {
      isMounted = false;
    };
  }, []);

  const strength = React.useMemo(() => {
    if (!password) {
      return { label: "Very Weak", color: "#EF4444", score: 0 };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (hasUpper && hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;
    if (score <= 1) return { label: "Weak", color: "#F97316", score };
    if (score === 2) return { label: "Fair", color: "#EAB308", score };
    if (score === 3) return { label: "Good", color: "#84CC16", score };
    if (score === 4) return { label: "Strong", color: "#22C55E", score };
    return { label: "Very Strong", color: "#16A34A", score };
  }, [password]);

  const onContinue = async (): Promise<void> => {
    if (!password.trim()) {
      setError("Enter a master password.");
      return;
    }

    if (isSetupMode) {
      if (password.length < 8) {
        setError("Master password must be at least 8 characters.");
        return;
      }
      if (confirmPassword !== password) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");
      if (isSetupMode) {
        const meta = createMasterMeta(password);
        await upsertSetting(MASTER_PASSWORD_META_KEY, meta);
        await upsertSetting(MASTER_PASSWORD_KEY, "");
        setSessionFromMaster(password, meta);
      } else {
        const existingMeta = masterMeta ?? (await getSetting(MASTER_PASSWORD_META_KEY));
        const existingLegacy = await getSetting(MASTER_PASSWORD_KEY);
        const matchesMeta = !!existingMeta && verifyMasterPassword(password, existingMeta);
        const matchesLegacy = !!existingLegacy && existingLegacy === password;

        if (!matchesMeta && !matchesLegacy) {
          setError("Incorrect master password. Try again.");
          return;
        }

        if (matchesLegacy && !existingMeta) {
          const migrated = createMasterMeta(password);
          await upsertSetting(MASTER_PASSWORD_META_KEY, migrated);
          await upsertSetting(MASTER_PASSWORD_KEY, "");
          setMasterMeta(migrated);
          setSessionFromMaster(password, migrated);
        } else if (existingMeta) {
          setSessionFromMaster(password, existingMeta);
        }
      }
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch {
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#5B8DEF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{isSetupMode ? "Create Master Password" : "Verify Identity"}</Text>
        <Text style={styles.subtitle}>
          {isSetupMode
            ? "Set a strong master password to secure your vault."
            : "Enter your master password to unlock your vault."}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder={isSetupMode ? "Create master password" : "Enter master password"}
            placeholderTextColor="#8B94A8"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          {isSetupMode ? (
            <TextInput
              placeholder="Confirm master password"
              placeholderTextColor="#8B94A8"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
          ) : null}
        </View>

        <Pressable style={styles.showToggle} onPress={() => setShowPassword((value) => !value)}>
          <Text style={styles.showToggleText}>{showPassword ? "Hide password" : "Show password"}</Text>
        </Pressable>

        {password.length > 0 ? (
          <View style={styles.strengthBox}>
            <View style={styles.strengthBars}>
              {[0, 1, 2, 3, 4].map((item) => (
                <View
                  key={item}
                  style={[
                    styles.strengthBar,
                    { backgroundColor: item < strength.score ? strength.color : "#1B2D4D" },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={() => void onContinue()} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Please wait..." : isSetupMode ? "Save & Continue" : "Unlock Vault"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Back to Lock</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#8B94A8",
    textAlign: "center",
    marginBottom: 28,
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  showToggle: {
    marginTop: 10,
    marginBottom: 14,
  },
  showToggleText: {
    color: "#5B8DEF",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
  },
  strengthBox: {
    marginBottom: 10,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    color: "#F87171",
    fontSize: 13,
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#5B8DEF",
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#8B94A8",
    fontSize: 14,
  },
});
