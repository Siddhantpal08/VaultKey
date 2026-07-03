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
import { clearSettingsExcept, clearVaults, getVaults, insertVault, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { createMasterMeta, decryptWithSession, setSessionFromMaster } from "../security/crypto";
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
  const toast = useToast();

  const onImport = async () => {
    try {
      setIsImporting(true);
      
      // 1. Read encrypted file
      const encryptedPayload = await readAsStringAsync(filePath);
      
      // 2. Set temporary session with provided password
      // We don't have the original meta, so we just hash the password to act as key
      // If it fails to decrypt, it means wrong password.
      // Wait, decryptWithSession uses the global session key.
      // A better way: The .pnb export was encrypted with the session key active at that time.
      // That session key is derived from the master password and its meta.
      // We need a standalone decrypt that tries to derive the key, OR we enforce that
      // the .pnb can only be imported if the current master password matches.
      // If we just use the current session key, we don't even need to ask for the password if unlocked!
      // But let's assume they might be importing an old backup.
      // Actually, standard `setSessionFromMaster` requires the salt from `master_password_meta`.
      // The backup JSON itself contains the `settings` which includes `master_password_meta`.
      // However, we can't read `settings` until we decrypt. Catch-22.
      // This means the PNB must be encrypted with a key derived purely from the password (no random salt),
      // OR we just use the *current* session key and assume the user hasn't changed their master password.
      // Wait, in `SettingsScreen.tsx` `exportEncrypted` we used `encryptWithSession(payload)`.
      // This uses the current session key.
      // If we ask for the password here, we can't derive the session key without the meta.
      // If the app is already unlocked (which it is, since we are logged in to use Share Intent usually, 
      // or Share Intent forces unlock? Share intent happens when app is open or background).
      // If the user's current vault is locked, they go to Lock screen first.
      // Once unlocked, they have a session key.
      // Let's just try to decrypt with the CURRENT session key.
      
      try {
        const decryptedRaw = decryptWithSession(encryptedPayload);
        const parsed = JSON.parse(decryptedRaw);
        
        if (parsed.schema !== "vaultkey-export-v1") {
          throw new Error("Invalid schema");
        }
        
        // 3. Prompt for merge vs replace
        Alert.alert(
          "Import Encrypted Backup",
          `Found ${parsed.vaults?.length || 0} entries. Do you want to merge with your current vault or replace everything?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Merge", 
              onPress: () => processImport(parsed, "merge")
            },
            { 
              text: "Replace All", 
              style: "destructive",
              onPress: () => processImport(parsed, "replace")
            }
          ]
        );
      } catch (err) {
        toast.show("Decryption failed. Ensure your current master password matches the backup.", "error");
        setIsImporting(false);
      }
    } catch (err) {
      toast.show("Failed to read the backup file.", "error");
      setIsImporting(false);
    }
  };

  const processImport = async (parsed: any, mode: "merge" | "replace") => {
    try {
      if (mode === "replace") {
        await clearVaults();
        // Keep master password meta so we don't lock them out
        await clearSettingsExcept(["master_password", "master_password_meta", "pin_hash"]);
      }

      if (parsed.settings) {
        for (const item of parsed.settings) {
          if (item.key === "master_password" || item.key === "master_password_meta" || item.key === "pin_hash") continue;
          await upsertSetting(item.key, String(item.value));
        }
      }

      let inserted = 0;
      if (parsed.vaults) {
        for (const row of parsed.vaults) {
          if (!row.site_name || !row.username || !row.encrypted_password) continue;
          
          await insertVault({
            siteName: row.site_name,
            url: row.url,
            username: row.username,
            encryptedPassword: row.encrypted_password,
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
        `Successfully imported ${inserted} entries.`,
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
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

        <Text style={styles.infoText}>
          The backup will be decrypted using your current active session key. 
          If your master password has changed since this backup was made, decryption will fail.
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
});
