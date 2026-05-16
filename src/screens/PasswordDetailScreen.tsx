import React from "react";
import * as Clipboard from "expo-clipboard";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { deleteVault, getSetting, getVaultById, toggleFavourite, updateVault } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { decryptWithSession, encryptWithSession, hasSessionKey } from "../security/crypto";
import { generateTOTP, type TOTPResult } from "../security/totp";
import { Colors } from "../theme/colors";
import { StrengthMeter } from "../components/StrengthMeter";
import { SiteIcon } from "../components/SiteIcon";
import { useToast } from "../components/Toast";

type PasswordDetailScreenProps = StackScreenProps<RootStackParamList, "PasswordDetail">;

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

export default function PasswordDetailScreen({
  route,
  navigation,
}: PasswordDetailScreenProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isFavourite, setIsFavourite] = React.useState<boolean>(false);
  const [totp, setTotp] = React.useState<TOTPResult | null>(null);
  const toast = useToast();

  const [entry, setEntry] = React.useState<{
    siteName: string;
    url: string;
    username: string;
    password: string;
    category: string;
    tags: string;
    notes: string;
    totpSecret: string;
    createdAt: string;
    updatedAt: string;
  } | null>(null);

  const load = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    if (!hasSessionKey()) {
      Alert.alert("Session locked", "Please verify your master password.", [
        { text: "OK", onPress: () => navigation.replace("MasterPassword") },
      ]);
      return;
    }
    const row = await getVaultById(route.params.id);
    if (!row) {
      Alert.alert("Not found", "Password entry no longer exists.", [
        { text: "OK", onPress: () => navigation.replace("Home") },
      ]);
      return;
    }
    setIsFavourite(row.favourite === 1);
    setEntry({
      siteName: row.site_name,
      url: row.url ?? "",
      username: row.username,
      password: decryptWithSession(row.encrypted_password),
      category: row.category ?? "",
      tags: row.tags ?? "",
      notes: row.notes ?? "",
      totpSecret: row.totp_secret ?? "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    setIsLoading(false);
  }, [navigation, route.params.id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  // Live TOTP ticker
  React.useEffect(() => {
    if (!entry?.totpSecret) return;
    const refresh = (): void => {
      setTotp(generateTOTP(entry.totpSecret));
    };
    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [entry?.totpSecret]);

  const copyToClipboard = async (value: string, label: string): Promise<void> => {
    await Clipboard.setStringAsync(value);
    const ttl = Number((await getSetting("clipboard_clear_seconds")) ?? "30");
    const clearAfterMs = (Number.isFinite(ttl) ? Math.max(5, ttl) : 30) * 1000;
    setTimeout(() => {
      void Clipboard.setStringAsync("");
    }, clearAfterMs);
    toast.show(`${label} copied — clears in ${Math.round(clearAfterMs / 1000)}s`, "success");
  };

  const updateField = (key: keyof NonNullable<typeof entry>, value: string): void => {
    setEntry((current) => (current ? { ...current, [key]: value } : current));
  };

  const onSave = async (): Promise<void> => {
    if (!entry) return;
    if (!entry.siteName.trim() || !entry.username.trim() || !entry.password.trim()) {
      toast.show("Site name, username, and password are required.", "error");
      return;
    }
    try {
      setIsSaving(true);
      await updateVault({
        id: route.params.id,
        siteName: entry.siteName.trim(),
        url: entry.url.trim() || null,
        username: entry.username.trim(),
        encryptedPassword: encryptWithSession(entry.password),
        category: entry.category.trim() || null,
        notes: entry.notes.trim() || null,
        tags: entry.tags.trim() || null,
        strengthScore: computeStrength(entry.password),
        totpSecret: entry.totpSecret.trim() || null,
      });
      setIsEditing(false);
      await load();
      toast.show("Changes saved", "success");
    } catch {
      toast.show("Unable to save. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = (): void => {
    Alert.alert("Delete Password", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteVault(route.params.id);
            toast.show("Entry deleted", "info");
            navigation.replace("Home");
          } catch {
            toast.show("Delete failed. Please try again.", "error");
          }
        },
      },
    ]);
  };

  const handleToggleFavourite = async (): Promise<void> => {
    const newVal = isFavourite ? 0 : 1;
    await toggleFavourite(route.params.id, newVal as 0 | 1);
    setIsFavourite(!!newVal);
    toast.show(newVal === 1 ? "Added to starred ⭐" : "Removed from starred", newVal === 1 ? "success" : "info");
  };

  if (isLoading || !entry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const strength = computeStrength(entry.password);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.topBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.topBtnText}>← Back</Text>
          </Pressable>
          <View style={styles.topRight}>
            <Pressable style={styles.starBtn} onPress={() => void handleToggleFavourite()}>
              <Text style={{ fontSize: 22, opacity: isFavourite ? 1 : 0.3 }}>⭐</Text>
            </Pressable>
            <Pressable
              style={styles.topBtn}
              onPress={() => setIsEditing((v) => !v)}
            >
              <Text style={styles.topBtnText}>{isEditing ? "✕ Cancel" : "✎ Edit"}</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <SiteIcon siteName={entry.siteName} size={64} fontSize={26} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{entry.siteName}</Text>
            <Text style={styles.heroSub}>Updated {new Date(entry.updatedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* TOTP live card */}
        {entry.totpSecret && totp ? (
          <View style={styles.totpCard}>
            <View style={styles.totpLeft}>
              <Text style={styles.totpLabel}>🔒 Two-Factor Code</Text>
              <Text style={styles.totpCode}>{totp.code.slice(0, 3)} {totp.code.slice(3)}</Text>
              <Text style={styles.totpTimer}>Refreshes in {totp.secondsLeft}s</Text>
            </View>
            <View style={styles.totpRight}>
              <View
                style={[
                  styles.totpProgressRing,
                  {
                    borderColor:
                      totp.secondsLeft > 10 ? Colors.success : Colors.warning,
                  },
                ]}
              >
                <Text style={styles.totpProgressText}>{totp.secondsLeft}</Text>
              </View>
            </View>
            <Pressable
              style={styles.totpCopy}
              onPress={() => void copyToClipboard(totp.code, "TOTP code")}
            >
              <Text style={styles.totpCopyText}>Copy</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Fields */}
        <Field label="Username">
          <EditableText value={entry.username} editable={isEditing} onChangeText={(v) => updateField("username", v)} />
          <Pressable onPress={() => void copyToClipboard(entry.username, "Username")} style={styles.copyBtn}>
            <Text style={styles.copyBtnText}>📋 Copy Username</Text>
          </Pressable>
        </Field>

        <Field label="Password">
          <EditableText
            value={entry.password}
            editable={isEditing}
            secureTextEntry={!showPassword}
            onChangeText={(v) => updateField("password", v)}
            mono
          />
          <View style={styles.pwActions}>
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>{showPassword ? "🙈 Hide" : "👁 Reveal"}</Text>
            </Pressable>
            <Pressable onPress={() => void copyToClipboard(entry.password, "Password")} style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>📋 Copy</Text>
            </Pressable>
          </View>
          <View style={styles.strengthWrap}>
            <StrengthMeter score={strength} />
          </View>
        </Field>

        <Field label="Site Name">
          <EditableText value={entry.siteName} editable={isEditing} onChangeText={(v) => updateField("siteName", v)} />
        </Field>

        <Field label="URL">
          <EditableText value={entry.url} editable={isEditing} onChangeText={(v) => updateField("url", v)} />
        </Field>

        {/* Category picker in edit mode */}
        {isEditing ? (
          <Field label="Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
              {CATEGORY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={[styles.catChip, entry.category === opt && styles.catChipActive]}
                  onPress={() => updateField("category", opt)}
                >
                  <Text style={[styles.catChipText, entry.category === opt && styles.catChipTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Field>
        ) : (
          <Field label="Category">
            <EditableText value={entry.category || "General"} editable={false} onChangeText={() => {}} />
          </Field>
        )}

        <Field label="Tags">
          <EditableText value={entry.tags} editable={isEditing} onChangeText={(v) => updateField("tags", v)} />
        </Field>

        <Field label="TOTP Secret">
          <EditableText
            value={entry.totpSecret}
            editable={isEditing}
            onChangeText={(v) => updateField("totpSecret", v)}
            placeholder="Base32 secret (optional)"
          />
          {entry.totpSecret && !isEditing ? (
            <Pressable
              onPress={() => void copyToClipboard(entry.totpSecret, "TOTP secret")}
              style={styles.copyBtn}
            >
              <Text style={styles.copyBtnText}>📋 Copy Secret</Text>
            </Pressable>
          ) : null}
        </Field>

        <Field label="Notes">
          <EditableText
            value={entry.notes}
            editable={isEditing}
            multiline
            onChangeText={(v) => updateField("notes", v)}
            placeholder="Additional details"
          />
        </Field>

        {/* Meta */}
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Created {new Date(entry.createdAt).toLocaleString()}</Text>
          <Text style={styles.metaText}>Updated {new Date(entry.updatedAt).toLocaleString()}</Text>
        </View>

        {/* Actions */}
        {isEditing ? (
          <Pressable
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
            onPress={() => void onSave()}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "💾 Save Changes"}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>🗑 Delete Entry</Text>
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

function EditableText({
  value,
  editable,
  secureTextEntry,
  multiline,
  onChangeText,
  mono,
  placeholder,
}: {
  value: string;
  editable: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  mono?: boolean;
  placeholder?: string;
}): React.JSX.Element {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
      textAlignVertical={multiline ? "top" : "center"}
      style={[
        styles.input,
        !editable ? styles.readonlyInput : styles.editableInput,
        multiline ? styles.textArea : null,
        mono ? styles.monoInput : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  topBtn: { paddingVertical: 6, paddingHorizontal: 2 },
  topBtnText: { color: Colors.accent, fontWeight: "700", fontSize: 13 },
  starBtn: { padding: 4 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  heroText: { flex: 1 },
  heroTitle: { color: Colors.textPrimary, fontSize: 24, fontWeight: "700" },
  heroSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  totpCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    backgroundColor: "rgba(34,197,94,0.08)",
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  totpLeft: { flex: 1 },
  totpLabel: { color: Colors.success, fontSize: 11, fontWeight: "700", marginBottom: 4 },
  totpCode: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 6,
    fontVariant: ["tabular-nums"],
  },
  totpTimer: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  totpRight: { alignItems: "center", justifyContent: "center" },
  totpProgressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  totpProgressText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  totpCopy: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 6,
  },
  totpCopyText: { color: Colors.success, fontWeight: "700", fontSize: 12 },
  field: { marginBottom: 14 },
  fieldLabel: { color: Colors.textAccent, fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  readonlyInput: {
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  editableInput: {
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.bgInput,
  },
  monoInput: { fontVariant: ["tabular-nums"] },
  textArea: { minHeight: 90 },
  copyBtn: { marginTop: 6, alignSelf: "flex-start" },
  copyBtnText: { color: Colors.accent, fontSize: 12, fontWeight: "700" },
  pwActions: { flexDirection: "row", gap: 16, marginTop: 6 },
  strengthWrap: { marginTop: 8 },
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
  metaBox: {
    marginTop: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    backgroundColor: Colors.bgCard,
    gap: 3,
  },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 15, fontWeight: "700" },
  deleteButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.6)",
    backgroundColor: Colors.errorBg,
    paddingVertical: 13,
    alignItems: "center",
  },
  deleteButtonText: { color: "#FCA5A5", fontSize: 14, fontWeight: "700" },
});
