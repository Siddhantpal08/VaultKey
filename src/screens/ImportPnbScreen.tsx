import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore expo-file-system legacy typed exports
import { readAsStringAsync } from "expo-file-system/legacy";
import { clearSettingsExcept, clearVaults, insertVault, upsertSetting } from "../database/db";

import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  decryptStandalone,
  decryptWithSession,
  encryptWithSession,
  hasSessionKey,
} from "../security/crypto";


import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";

type ImportPnbScreenProps = StackScreenProps<RootStackParamList, "ImportPnb">;

export default function ImportPnbScreen({ navigation, route }: ImportPnbScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const filePath = route.params?.filePath || "";
  const [isImporting, setIsImporting] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [v2Data, setV2Data] = useState<{ master_meta: string; data: string } | null>(null);
  const toast = useToast();



  const onImport = async () => {
    try {
      setIsImporting(true);
      const fileContent = await readAsStringAsync(filePath);
      
      let dataToDecrypt = fileContent;
      let isV2 = false;
      let masterMeta = "";

      try {
        const parsedFile = JSON.parse(fileContent);
        if (parsedFile.version === 2) {
          isV2 = true;
          dataToDecrypt = parsedFile.data;
          masterMeta = parsedFile.master_meta;
          setV2Data({ master_meta: masterMeta, data: dataToDecrypt });
        }
      } catch (e) {
        // Not JSON, assume V1 raw string
      }

      // Try decrypting with the current session key first
      try {
        const decryptedRaw = decryptWithSession(dataToDecrypt);
        processDecrypted(decryptedRaw);
      } catch (err) {
        if (isV2) {
          setNeedsPassword(true);
          toast.show("Backup is from a different installation. Please enter its master password.", "info");
        } else {
          Alert.alert(
            "V1 Backup Unrecoverable",
            "This backup was created in an older format and you have since reinstalled the app. The original encryption salt was lost during uninstall, making this backup cryptographically impossible to decrypt."
          );
        }
        setIsImporting(false);
      }
    } catch (err) {
      toast.show("Failed to read the backup file.", "error");
      setIsImporting(false);
    }
  };

  const onImportWithPassword = async () => {
    if (!v2Data || !passwordInput) return;
    setIsImporting(true);
    try {
      const decryptedRaw = await decryptStandalone(v2Data.data, passwordInput, v2Data.master_meta);
      // Pass backup credentials so processImport can re-encrypt each entry with the current session key
      processDecrypted(decryptedRaw, true, passwordInput, v2Data.master_meta);
    } catch (e) {
      toast.show("Incorrect password for this backup.", "error");
      setIsImporting(false);
    }
  };


  const processDecrypted = (
    decryptedRaw: string,
    reEncrypt = false,
    oldPassword = "",
    oldMeta = "",
  ) => {
    try {
      const parsed = JSON.parse(decryptedRaw);
      if (parsed.schema !== "vaultkey-export-v1") throw new Error("Invalid schema");
      
      // Count non-deleted entries only
      const visibleEntries = (parsed.vaults ?? []).filter(
        (v: any) => !v.deleted_at
      );

      Alert.alert(
        "Import Encrypted Backup",
        `Found ${visibleEntries.length} entries. Merge with current vault or replace everything?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsImporting(false) },
          { text: "Merge", onPress: () => void processImport(parsed, "merge", reEncrypt, oldPassword, oldMeta) },
          { text: "Replace All", style: "destructive", onPress: () => void processImport(parsed, "replace", reEncrypt, oldPassword, oldMeta) }
        ]
      );
    } catch (e) {
      toast.show("Backup is corrupted or invalid.", "error");
      setIsImporting(false);
    }
  };


  const processImport = async (
    parsed: any,
    mode: "merge" | "replace",
    reEncrypt = false,
    oldPassword = "",
    oldMeta = "",
  ) => {
    try {
      // Get current entries to check for duplicates when merging
      let currentVaults: any[] = [];
      if (mode === "merge") {
        const { getVaults, getNotes } = require("../database/db");
        const vaults = await getVaults();
        const notes = await getNotes();
        currentVaults = [...vaults, ...notes];
      }

      if (mode === "replace") {
        await clearVaults();
        await clearSettingsExcept(["master_password", "master_password_meta", "pin_hash"]);
      }

      if (parsed.settings) {
        for (const item of parsed.settings) {
          if (item.key === "master_password" || item.key === "master_password_meta" || item.key === "pin_hash") continue;
          await upsertSetting(item.key, String(item.value));
        }
      }

      let inserted = 0;
      let skipped = 0;
      if (parsed.vaults) {
        for (const row of parsed.vaults) {
          // Skip deleted entries and entries without required fields
          if (row.deleted_at) { skipped++; continue; }
          if (!row.site_name || row.username === undefined || !row.encrypted_password) { skipped++; continue; }

          // Check if this exact entry already exists to avoid duplicates
          const exists = currentVaults.some(v => v.site_name === row.site_name && v.username === row.username && v.encrypted_password === row.encrypted_password);
          if (exists) { skipped++; continue; }

          let finalEncryptedPassword = row.encrypted_password;

          if (reEncrypt && oldPassword && oldMeta && hasSessionKey()) {
            // The entry was encrypted with the backup's master key.
            // Decrypt it with the old key, then re-encrypt with the current session key.
            try {
              const plainText = await decryptStandalone(row.encrypted_password, oldPassword, oldMeta);
              finalEncryptedPassword = encryptWithSession(plainText);
            } catch {
              // If individual entry decryption fails, skip it
              skipped++;
              continue;
            }
          }

          await insertVault({
            siteName: row.site_name,
            url: row.url,
            username: row.username,
            encryptedPassword: finalEncryptedPassword,
            category: row.category,
            notes: row.notes,
            tags: row.tags,
            strengthScore: row.strength_score,
            totpSecret: row.totp_secret,
            isNote: row.is_note ?? 0,
          });
          inserted++;
        }
      }

      Alert.alert(
        "Import Complete",
        skipped > 0
          ? `Successfully imported ${inserted} entries (${skipped} skipped).`
          : `Successfully imported ${inserted} entries.`,
        [{ text: "OK", onPress: () => navigation.navigate("MainTabs") }]
      );
    } catch {
      toast.show("Error during import process.", "error");
    } finally {
      setIsImporting(false);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={16} color={Colors.accent} />
            <Text style={styles.backText}>Cancel</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Import Backup</Text>
        <Text style={styles.subtitle}>
          You are importing an encrypted .pnb backup file.
        </Text>
        
        <View style={styles.fileBox}>
          <Ionicons name="document-lock" size={32} color={Colors.accent} />
          <Text style={styles.fileName}>{filePath.split('/').pop()}</Text>
        </View>

        {!needsPassword ? (
          <>
            <Text style={styles.infoText}>
              The backup will be decrypted using your current active session key.
            </Text>
            <Pressable
              style={[styles.primaryButton, isImporting && styles.disabledButton]}
              onPress={() => void onImport()}
              disabled={isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  <Ionicons name="lock-open" size={16} /> Decrypt & Import
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordTitle}>Enter Backup Password</Text>
            <Text style={styles.passwordSub}>
              This backup uses a different encryption salt. Please enter the master password that was active when this backup was created.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Master Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
              autoCapitalize="none"
              autoFocus
            />
            <Pressable
              style={[styles.primaryButton, (!passwordInput || isImporting) && styles.disabledButton]}
              onPress={() => void onImportWithPassword()}
              disabled={!passwordInput || isImporting}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color={Colors.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  <Ionicons name="key" size={16} /> Unlock Backup
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 },
  topBar: { marginBottom: 12 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 24 },
  fileBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  fileName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  infoText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  disabledButton: { opacity: 0.7 },
  passwordContainer: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  passwordTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  passwordSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 10,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
});
