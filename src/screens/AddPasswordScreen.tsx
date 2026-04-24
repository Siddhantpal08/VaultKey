import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getSetting, insertVault, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { encryptWithSession, hasSessionKey } from "../security/crypto";

type AddPasswordScreenProps = StackScreenProps<RootStackParamList, "AddPassword">;

type FormState = {
  siteName: string;
  url: string;
  username: string;
  password: string;
  category: string;
  tags: string;
  notes: string;
  totpSecret: string;
};

const CATEGORY_OPTIONS = ["General", "Work", "Social", "Finance", "Shopping", "DevOps"];

function computeStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(5, score);
}

function generateStrongPassword(length = 16): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+";
  let value = "";
  for (let i = 0; i < length; i += 1) {
    value += charset[Math.floor(Math.random() * charset.length)];
  }
  return value;
}

export default function AddPasswordScreen({ navigation }: AddPasswordScreenProps): React.JSX.Element {
  const [form, setForm] = React.useState<FormState>({
    siteName: "",
    url: "",
    username: "",
    password: "",
    category: "General",
    tags: "",
    notes: "",
    totpSecret: "",
  });
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");

  const strength = React.useMemo(() => computeStrength(form.password), [form.password]);

  useFocusEffect(
    React.useCallback(() => {
      const loadDraft = async (): Promise<void> => {
        const draft = await getSetting("draft_generated_password");
        if (draft && draft.length > 0) {
          setForm((current) => {
            if (current.password.length > 0) {
              return current;
            }
            return { ...current, password: draft };
          });
          await upsertSetting("draft_generated_password", "");
        }
      };
      void loadDraft();
    }, []),
  );

  const strengthLabel = React.useMemo(() => {
    if (strength <= 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    if (strength === 4) return "Strong";
    return "Very Strong";
  }, [strength]);

  const updateField = (key: keyof FormState, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const normalizeOptional = (value: string): string | null => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const onSave = async (): Promise<void> => {
    if (!form.siteName.trim() || !form.username.trim() || !form.password.trim()) {
      setError("Site name, username, and password are required.");
      return;
    }
    try {
      if (!hasSessionKey()) {
        Alert.alert("Session locked", "Please verify your master password again.");
        navigation.replace("MasterPassword");
        return;
      }
      setIsSaving(true);
      setError("");
      const newId = await insertVault({
        siteName: form.siteName.trim(),
        url: normalizeOptional(form.url),
        username: form.username.trim(),
        encryptedPassword: encryptWithSession(form.password),
        category: normalizeOptional(form.category),
        notes: normalizeOptional(form.notes),
        tags: normalizeOptional(form.tags),
        strengthScore: computeStrength(form.password),
        totpSecret: normalizeOptional(form.totpSecret),
      });
      navigation.replace("PasswordDetail", { id: newId });
    } catch {
      Alert.alert("Unable to save", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add Password</Text>
        <Text style={styles.subtitle}>Create a secure vault entry with tags, notes, and optional 2FA secret.</Text>

        <Field label="Site Name *">
          <TextInput
            value={form.siteName}
            onChangeText={(value) => updateField("siteName", value)}
            placeholder="e.g. GitHub"
            placeholderTextColor="#7B859B"
            style={styles.input}
          />
        </Field>

        <Field label="Website URL">
          <TextInput
            value={form.url}
            onChangeText={(value) => updateField("url", value)}
            placeholder="https://example.com"
            placeholderTextColor="#7B859B"
            style={styles.input}
            autoCapitalize="none"
          />
        </Field>

        <Field label="Username / Email *">
          <TextInput
            value={form.username}
            onChangeText={(value) => updateField("username", value)}
            placeholder="username@example.com"
            placeholderTextColor="#7B859B"
            style={styles.input}
            autoCapitalize="none"
          />
        </Field>

        <Field label="Password *">
          <TextInput
            value={form.password}
            onChangeText={(value) => updateField("password", value)}
            placeholder="Enter password"
            placeholderTextColor="#7B859B"
            style={styles.input}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <View style={styles.row}>
            <Pressable style={styles.linkButton} onPress={() => setShowPassword((current) => !current)}>
              <Text style={styles.linkButtonText}>{showPassword ? "Hide" : "Show"} password</Text>
            </Pressable>
            <Pressable
              style={styles.linkButton}
              onPress={() => updateField("password", generateStrongPassword(16))}
            >
              <Text style={styles.linkButtonText}>Generate strong</Text>
            </Pressable>
          </View>
          <View style={styles.strengthRow}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthBar,
                  { backgroundColor: index < strength ? "#5B8DEF" : "#1B2D4D" },
                ]}
              />
            ))}
          </View>
          <Text style={styles.metaText}>Strength: {strengthLabel}</Text>
        </Field>

        <Field label="Category">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {CATEGORY_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => updateField("category", option)}
                style={[styles.categoryChip, form.category === option ? styles.categoryChipActive : null]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    form.category === option ? styles.categoryChipTextActive : null,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Field>

        <Field label="Tags (comma separated)">
          <TextInput
            value={form.tags}
            onChangeText={(value) => updateField("tags", value)}
            placeholder="personal, urgent, shared"
            placeholderTextColor="#7B859B"
            style={styles.input}
          />
        </Field>

        <Field label="TOTP Secret (optional)">
          <TextInput
            value={form.totpSecret}
            onChangeText={(value) => updateField("totpSecret", value)}
            placeholder="Base32 secret"
            placeholderTextColor="#7B859B"
            style={styles.input}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={form.notes}
            onChangeText={(value) => updateField("notes", value)}
            placeholder="Additional details"
            placeholderTextColor="#7B859B"
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
          />
        </Field>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={() => void onSave()} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Save Password"}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B1020" },
  container: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#8B94A8", marginBottom: 18 },
  field: { marginBottom: 14 },
  fieldLabel: { color: "#D2DCF0", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#FFFFFF",
  },
  textArea: { minHeight: 90 },
  row: { flexDirection: "row", gap: 14, marginTop: 8 },
  linkButton: { paddingVertical: 4 },
  linkButtonText: { color: "#5B8DEF", fontSize: 12, fontWeight: "700" },
  strengthRow: { flexDirection: "row", gap: 6, marginTop: 10, marginBottom: 4 },
  strengthBar: { flex: 1, height: 5, borderRadius: 999 },
  metaText: { color: "#8B94A8", fontSize: 12 },
  categoryList: { gap: 8, paddingVertical: 4 },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipActive: { backgroundColor: "#5B8DEF", borderColor: "#5B8DEF" },
  categoryChipText: { color: "#8B94A8", fontSize: 12, fontWeight: "600" },
  categoryChipTextActive: { color: "#FFFFFF" },
  errorText: { color: "#F87171", marginBottom: 8, fontSize: 13 },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: "#5B8DEF",
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: { marginTop: 10, alignItems: "center", paddingVertical: 10 },
  secondaryButtonText: { color: "#8B94A8", fontSize: 14 },
});
