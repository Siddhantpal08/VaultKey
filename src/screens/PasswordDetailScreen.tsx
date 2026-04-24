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
import { deleteVault, getSetting, getVaultById, updateVault } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { decryptWithSession, encryptWithSession, hasSessionKey } from "../security/crypto";

type PasswordDetailScreenProps = StackScreenProps<RootStackParamList, "PasswordDetail">;

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
      Alert.alert("Session locked", "Please verify your master password to access vault details.", [
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

  const copyToClipboard = async (value: string, label: string): Promise<void> => {
    await Clipboard.setStringAsync(value);
    const ttl = Number((await getSetting("clipboard_clear_seconds")) ?? "30");
    const clearAfterMs = (Number.isFinite(ttl) ? Math.max(5, ttl) : 30) * 1000;
    setTimeout(() => {
      void Clipboard.setStringAsync("");
    }, clearAfterMs);
    Alert.alert("Copied", `${label} copied. Clipboard clears in ${Math.round(clearAfterMs / 1000)}s.`);
  };

  const updateField = (key: keyof NonNullable<typeof entry>, value: string): void => {
    setEntry((current) => (current ? { ...current, [key]: value } : current));
  };

  const onSave = async (): Promise<void> => {
    if (!entry) return;
    if (!entry.siteName.trim() || !entry.username.trim() || !entry.password.trim()) {
      Alert.alert("Missing required fields", "Site name, username, and password are required.");
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
      Alert.alert("Saved", "Password entry updated.");
    } catch {
      Alert.alert("Unable to save", "Please try again.");
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
            navigation.replace("Home");
          } catch {
            Alert.alert("Delete failed", "Please try again.");
          }
        },
      },
    ]);
  };

  if (isLoading || !entry) {
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
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.topAction}>Back</Text>
          </Pressable>
          <Pressable onPress={() => setIsEditing((current) => !current)}>
            <Text style={styles.topAction}>{isEditing ? "Cancel Edit" : "Edit"}</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{entry.siteName}</Text>
        <Text style={styles.subtitle}>Updated {new Date(entry.updatedAt).toLocaleString()}</Text>

        <Field label="Site Name">
          <EditableText value={entry.siteName} editable={isEditing} onChangeText={(v) => updateField("siteName", v)} />
        </Field>
        <Field label="URL">
          <EditableText value={entry.url} editable={isEditing} onChangeText={(v) => updateField("url", v)} />
        </Field>
        <Field label="Username">
          <EditableText value={entry.username} editable={isEditing} onChangeText={(v) => updateField("username", v)} />
          <Pressable onPress={() => void copyToClipboard(entry.username, "Username")} style={styles.inlineCopy}>
            <Text style={styles.inlineCopyText}>Copy Username</Text>
          </Pressable>
        </Field>
        <Field label="Password">
          <EditableText
            value={entry.password}
            editable={isEditing}
            secureTextEntry={!showPassword}
            onChangeText={(v) => updateField("password", v)}
          />
          <View style={styles.inlineActions}>
            <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.inlineActionBtn}>
              <Text style={styles.inlineCopyText}>{showPassword ? "Hide" : "Reveal"} Password</Text>
            </Pressable>
            <Pressable onPress={() => void copyToClipboard(entry.password, "Password")} style={styles.inlineActionBtn}>
              <Text style={styles.inlineCopyText}>Copy Password</Text>
            </Pressable>
          </View>
          <Text style={styles.metaText}>Strength score: {computeStrength(entry.password)}/5</Text>
        </Field>
        <Field label="Category">
          <EditableText value={entry.category} editable={isEditing} onChangeText={(v) => updateField("category", v)} />
        </Field>
        <Field label="Tags">
          <EditableText value={entry.tags} editable={isEditing} onChangeText={(v) => updateField("tags", v)} />
        </Field>
        <Field label="TOTP Secret">
          <EditableText value={entry.totpSecret} editable={isEditing} onChangeText={(v) => updateField("totpSecret", v)} />
          {entry.totpSecret ? (
            <Pressable onPress={() => void copyToClipboard(entry.totpSecret, "TOTP secret")} style={styles.inlineCopy}>
              <Text style={styles.inlineCopyText}>Copy TOTP Secret</Text>
            </Pressable>
          ) : null}
        </Field>
        <Field label="Notes">
          <EditableText
            value={entry.notes}
            editable={isEditing}
            multiline
            onChangeText={(v) => updateField("notes", v)}
          />
        </Field>

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Created: {new Date(entry.createdAt).toLocaleString()}</Text>
          <Text style={styles.metaText}>Last Updated: {new Date(entry.updatedAt).toLocaleString()}</Text>
        </View>

        {isEditing ? (
          <Pressable style={styles.primaryButton} onPress={() => void onSave()} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete Password</Text>
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
}: {
  value: string;
  editable: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onChangeText: (value: string) => void;
}): React.JSX.Element {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={[styles.input, !editable ? styles.readonlyInput : null, multiline ? styles.textArea : null]}
      placeholderTextColor="#7B859B"
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B1020" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  topAction: { color: "#5B8DEF", fontWeight: "700", fontSize: 13 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", marginBottom: 2 },
  subtitle: { color: "#8B94A8", fontSize: 12, marginBottom: 14 },
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
  readonlyInput: { opacity: 0.9 },
  textArea: { minHeight: 90 },
  inlineCopy: { marginTop: 7, alignSelf: "flex-start" },
  inlineActions: { marginTop: 8, flexDirection: "row", gap: 12 },
  inlineActionBtn: { alignSelf: "flex-start" },
  inlineCopyText: { color: "#5B8DEF", fontSize: 12, fontWeight: "700" },
  metaBox: {
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    gap: 4,
  },
  metaText: { color: "#8B94A8", fontSize: 12 },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: "#5B8DEF",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.7)",
    backgroundColor: "rgba(248,113,113,0.14)",
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: { color: "#FCA5A5", fontSize: 14, fontWeight: "700" },
});
