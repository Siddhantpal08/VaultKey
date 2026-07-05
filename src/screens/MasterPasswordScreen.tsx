import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSetting, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { createMasterMeta, persistSessionKey, setSessionFromMaster, verifyMasterPassword } from "../security/crypto";
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
        const meta = await createMasterMeta(password);
        await upsertSetting(MASTER_PASSWORD_META_KEY, meta);
        await upsertSetting(MASTER_PASSWORD_KEY, "");
        await setSessionFromMaster(password, meta);
        await persistSessionKey(); // cache for instant future unlocks
      } else {
        const existingMeta = masterMeta ?? (await getSetting(MASTER_PASSWORD_META_KEY));
        const existingLegacy = await getSetting(MASTER_PASSWORD_KEY);
        const matchesMeta = !!existingMeta && (await verifyMasterPassword(password, existingMeta));
        const matchesLegacy = !!existingLegacy && existingLegacy === password;

        if (!matchesMeta && !matchesLegacy) {
          setError("Incorrect master password. Try again.");
          return;
        }

        if (matchesLegacy && !existingMeta) {
          const migrated = await createMasterMeta(password);
          await upsertSetting(MASTER_PASSWORD_META_KEY, migrated);
          await upsertSetting(MASTER_PASSWORD_KEY, "");
          setMasterMeta(migrated);
          await setSessionFromMaster(password, migrated);
        } else if (existingMeta) {
          await setSessionFromMaster(password, existingMeta);
        }
        await persistSessionKey(); // cache for instant future unlocks
      }
      
      const pinHash = await getSetting("pin_hash");

      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "Home", params: { showPINSetup: !pinHash } } }],
      });
    } catch (e) {
      console.error("MasterPassword save error:", e);
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerIcon}>
          <Text style={styles.logoVK}>VK</Text>
          <View style={styles.logoBar} />
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
            <Text style={styles.showToggleText}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={12} /> {showPassword ? "Hide" : "Show"} password
            </Text>
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
          {isSubmitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.primaryButtonText}>Please wait...</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              {isSetupMode ? "Save & Continue" : "Unlock Vault"}
            </Text>
          )}
        </Pressable>

        {!isSetupMode && (
          <Pressable style={styles.forgotBtn} onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => navigation.replace("Lock")}>
          <Text style={styles.secondaryButtonText}>← Back to Lock Screen</Text>
        </Pressable>

        {isSetupMode ? (
          <Text style={styles.hint}>
            <Ionicons name="warning" size={12} /> There is no password recovery. Store it safely.
          </Text>
        ) : null}

        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>VaultKey</Text>
          <Text style={styles.watermarkText}>
            Created by <Text style={styles.watermarkHighlight}>Siddhant Pal</Text>
          </Text>
          <Text style={styles.watermarkSub}>Provided by Crevio Studio</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 32,
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
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  forgotBtn: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  footerLink: { color: Colors.textMuted, fontSize: 13, textDecorationLine: "underline" },
  watermarkContainer: {
    alignItems: "center",
    marginTop: 40,
    opacity: 0.6,
  },
  watermarkText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  watermarkHighlight: {
    color: Colors.accent,
    fontWeight: "700",
  },
  watermarkSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secondaryButton: { alignItems: "center", paddingVertical: 12 },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: 14 },
  logoVK: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    lineHeight: 26,
  },
  logoBar: {
    width: 20,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: Colors.accentBright,
    opacity: 0.7,
    marginTop: 2,
  },
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
