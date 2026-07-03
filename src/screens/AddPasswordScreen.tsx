import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSetting, insertVault, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { encryptWithSession, hasSessionKey } from "../security/crypto";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { StrengthMeter } from "../components/StrengthMeter";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";

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

export default function AddPasswordScreen({ navigation, route }: AddPasswordScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const prefillUrl = route.params?.prefillUrl ?? "";
  const prefillSiteName = route.params?.prefillSiteName ?? "";
  const prefillTotpSecret = route.params?.prefillTotpSecret ?? "";

  const [form, setForm] = React.useState<FormState>({
    siteName: prefillSiteName,
    url: prefillUrl,
    username: "",
    password: "",
    category: "General",
    tags: "",
    notes: "",
    totpSecret: prefillTotpSecret,
  });
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [genLength, setGenLength] = React.useState<number>(16);
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
          <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={16} color={Colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Add Password</Text>
        <Text style={styles.subtitle}>
          Encrypted on-device with AES-256-GCM before being stored.
        </Text>

        {prefillUrl ? (
          <View style={styles.sharedBanner}>
            <Ionicons name="link" size={13} color={Colors.accent} />
            <Text style={styles.sharedBannerText}>Pre-filled from shared URL</Text>
          </View>
        ) : null}

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
              <View style={styles.linkBtnInner}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.accent} />
                <Text style={styles.linkBtnText}>{showPassword ? "Hide" : "Show"}</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => updateField("password", generateStrongPassword(genLength))}
            >
              <View style={styles.linkBtnInner}>
                <Ionicons name="flash" size={18} color={Colors.accent} />
                <Text style={styles.linkBtnText}>Generate strong</Text>
              </View>
            </Pressable>
          </View>
          <View style={styles.lenRow}>
            <Text style={styles.lenLabel}>Length:</Text>
            {[8, 12, 16, 24].map((len) => (
              <Pressable 
                key={len} 
                style={[styles.lenChip, genLength === len && styles.lenChipActive]} 
                onPress={() => setGenLength(len)}
              >
                <Text style={[styles.lenChipText, genLength === len && styles.lenChipTextActive]}>{len}</Text>
              </Pressable>
            ))}
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
          {isSaving ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.primaryButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>
              <Ionicons name="save" size={16} /> Save Password
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 },
  topBar: { marginBottom: 8 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 12, marginBottom: 18, lineHeight: 18 },
  sharedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  sharedBannerText: { color: Colors.textAccent, fontSize: 12, fontWeight: "600" },
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
  pwRow: { flexDirection: "row", gap: 16, marginTop: 10, marginBottom: 8 },
  linkBtn: {},
  linkBtnInner: { flexDirection: "row", alignItems: "center", gap: 5 },
  linkBtnText: { color: Colors.accent, fontSize: 14, fontWeight: "700" },
  lenRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  lenLabel: { color: Colors.textMuted, fontSize: 12, marginRight: 4 },
  lenChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.borderInput },
  lenChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  lenChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  lenChipTextActive: { color: Colors.textPrimary },
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
