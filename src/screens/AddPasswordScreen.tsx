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
import { Colors } from "../theme/colors";
import { StrengthMeter } from "../components/StrengthMeter";
import { useToast } from "../components/Toast";

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
  const toast = useToast();

  const strength = React.useMemo(() => computeStrength(form.password), [form.password]);

  useFocusEffect(
    React.useCallback(() => {
      const loadDraft = async (): Promise<void> => {
        const draft = await getSetting("draft_generated_password");
        if (draft && draft.length > 0) {
          setForm((current) => {
            if (current.password.length > 0) return current;
            return { ...current, password: draft };
          });
          await upsertSetting("draft_generated_password", "");
        }
      };
      void loadDraft();
    }, []),
  );

  const updateField = (key: keyof FormState, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const normalizeOptional = (value: string): string | null => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const onSave = async (): Promise<void> => {
    if (!form.siteName.trim() || !form.username.trim() || !form.password.trim()) {
      toast.show("Site name, username, and password are required.", "error");
      return;
    }
    try {
      if (!hasSessionKey()) {
        Alert.alert("Session locked", "Please verify your master password again.");
        navigation.replace("MasterPassword");
        return;
      }
      setIsSaving(true);
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
      toast.show("Password saved securely ✓", "success");
      navigation.replace("PasswordDetail", { id: newId });
    } catch {
      toast.show("Unable to save. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Add Password</Text>
        <Text style={styles.subtitle}>
          Encrypted on-device with AES-256-GCM before being stored.
        </Text>

        <Field label="Site Name *">
          <TextInput
            value={form.siteName}
            onChangeText={(v) => updateField("siteName", v)}
            placeholder="e.g. GitHub"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="Website URL">
          <TextInput
            value={form.url}
            onChangeText={(v) => updateField("url", v)}
            placeholder="https://github.com"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="url"
          />
        </Field>

        <Field label="Username / Email *">
          <TextInput
            value={form.username}
            onChangeText={(v) => updateField("username", v)}
            placeholder="user@example.com"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </Field>

        <Field label="Password *">
          <TextInput
            value={form.password}
            onChangeText={(v) => updateField("password", v)}
            placeholder="Enter or generate a password"
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.monoInput]}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <View style={styles.pwRow}>
            <Pressable style={styles.linkBtn} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.linkBtnText}>{showPassword ? "🙈 Hide" : "👁 Show"}</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => updateField("password", generateStrongPassword(16))}
            >
              <Text style={styles.linkBtnText}>⚡ Generate strong</Text>
            </Pressable>
          </View>
          <StrengthMeter score={strength} />
        </Field>

        <Field label="Category">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => updateField("category", opt)}
                style={[styles.catChip, form.category === opt && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, form.category === opt && styles.catChipTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Field>

        <Field label="Tags (comma separated)">
          <TextInput
            value={form.tags}
            onChangeText={(v) => updateField("tags", v)}
            placeholder="personal, work, finance"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="TOTP Secret (optional)">
          <TextInput
            value={form.totpSecret}
            onChangeText={(v) => updateField("totpSecret", v)}
            placeholder="Base32 TOTP secret"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            autoCapitalize="characters"
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={form.notes}
            onChangeText={(v) => updateField("notes", v)}
            placeholder="Additional details..."
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, styles.textArea]}
            multiline
            textAlignVertical="top"
          />
        </Field>

        <Pressable
          style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          onPress={() => void onSave()}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Saving..." : "🔐 Save Password"}
          </Text>
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
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 },
  topBar: { marginBottom: 8 },
  backText: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 12, marginBottom: 18, lineHeight: 18 },
  field: { marginBottom: 14 },
  fieldLabel: {
    color: Colors.textAccent,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  monoInput: { fontVariant: ["tabular-nums"] },
  textArea: { minHeight: 90 },
  pwRow: { flexDirection: "row", gap: 16, marginTop: 8, marginBottom: 8 },
  linkBtn: {},
  linkBtnText: { color: Colors.accent, fontSize: 12, fontWeight: "700" },
  catList: { gap: 8, paddingVertical: 4 },
  catChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  catChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: Colors.textPrimary },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  secondaryButton: { alignItems: "center", paddingVertical: 12 },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: 14 },
});
