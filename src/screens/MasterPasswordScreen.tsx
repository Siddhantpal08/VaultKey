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
import { Colors } from "../theme/colors";
import { StrengthMeter } from "../components/StrengthMeter";

type MasterPasswordScreenProps = StackScreenProps<RootStackParamList, "MasterPassword">;

const MASTER_PASSWORD_KEY = "master_password";
const MASTER_PASSWORD_META_KEY = "master_password_meta";

function computePasswordStrength(password: string): number {
  if (!password) return 0;
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
  return Math.min(5, score);
}

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

  const score = React.useMemo(() => computePasswordStrength(password), [password]);

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
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>{isSetupMode ? "🛡️" : "🔑"}</Text>
        </View>
        <Text style={styles.title}>
          {isSetupMode ? "Create Master Password" : "Verify Identity"}
        </Text>
        <Text style={styles.subtitle}>
          {isSetupMode
            ? "This password encrypts your entire vault.\nMake it strong and memorable."
            : "Enter your master password to unlock your vault."}
        </Text>

        {/* Input card */}
        <View style={styles.card}>
          <View style={styles.inputWrap}>
            <TextInput
              placeholder={isSetupMode ? "Create master password" : "Enter master password"}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {isSetupMode ? (
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Confirm master password"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPassword}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <Pressable style={styles.showToggle} onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.showToggleText}>{showPassword ? "🙈 Hide" : "👁 Show"} password</Text>
          </Pressable>

          {password.length > 0 && isSetupMode ? (
            <View style={styles.strengthWrap}>
              <StrengthMeter score={score} />
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={() => void onContinue()}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Please wait..." : isSetupMode ? "Save & Continue" : "Unlock Vault"}
          </Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>← Back to Lock Screen</Text>
        </Pressable>

        {isSetupMode ? (
          <Text style={styles.hint}>
            ⚠️ There is no password recovery. Store it safely.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  headerEmoji: { fontSize: 30 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  inputWrap: {},
  input: {
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
    fontSize: 15,
  },
  showToggle: { alignSelf: "flex-end", paddingVertical: 2 },
  showToggleText: { color: Colors.accent, fontSize: 12, fontWeight: "600" },
  strengthWrap: { marginTop: 4 },
  errorText: { color: Colors.errorText, fontSize: 13, marginBottom: 10, textAlign: "center" },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  secondaryButton: { alignItems: "center", paddingVertical: 12 },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: 14 },
  hint: {
    marginTop: 16,
    color: Colors.warning,
    fontSize: 12,
    textAlign: "center",
    backgroundColor: Colors.warningBg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
});
