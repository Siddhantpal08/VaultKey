import React from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { StackScreenProps } from "@react-navigation/stack";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  clearSettingsExcept,
  clearVaults,
  getAllSettings,
  getSetting,
  getVaults,
  insertVault,
  updateVault,
  upsertSetting,
  type VaultRow,
} from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { createMasterMeta, decryptWithSession, encryptWithSession, hasSessionKey, setSessionFromMaster, verifyMasterPassword } from "../security/crypto";

type SettingsScreenProps = StackScreenProps<RootStackParamList, "Settings">;

type SettingsState = {
  biometricsEnabled: boolean;
  autoLockOnBackground: boolean;
  breachCheckEnabled: boolean;
  lockTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
  clipboardClearSeconds: number;
};

const KEYS = {
  biometricsEnabled: "biometrics_enabled",
  autoLockOnBackground: "auto_lock_background",
  breachCheckEnabled: "breach_check_enabled",
  lockTimeoutMinutes: "lock_timeout_minutes",
  maxFailedAttempts: "max_failed_attempts",
  lockoutMinutes: "lockout_minutes",
  clipboardClearSeconds: "clipboard_clear_seconds",
};
const MASTER_PASSWORD_KEY = "master_password";
const MASTER_PASSWORD_META_KEY = "master_password_meta";

function boolToString(value: boolean): string {
  return value ? "true" : "false";
}

function toMergeKey(siteName: string, username: string): string {
  return `${siteName.trim().toLowerCase()}::${username.trim().toLowerCase()}`;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps): React.JSX.Element {
  const [state, setState] = React.useState<SettingsState>({
    biometricsEnabled: true,
    autoLockOnBackground: true,
    breachCheckEnabled: false,
    lockTimeoutMinutes: 5,
    maxFailedAttempts: 5,
    lockoutMinutes: 10,
    clipboardClearSeconds: 30,
  });
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const [currentMaster, setCurrentMaster] = React.useState<string>("");
  const [newMaster, setNewMaster] = React.useState<string>("");
  const [confirmMaster, setConfirmMaster] = React.useState<string>("");
  const [changingMaster, setChangingMaster] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      const rows = await getAllSettings();
      if (!mounted) return;
      const map = new Map(rows.map((item) => [item.key, item.value]));
      setState({
        biometricsEnabled: (map.get(KEYS.biometricsEnabled) ?? "true") === "true",
        autoLockOnBackground: (map.get(KEYS.autoLockOnBackground) ?? "true") === "true",
        breachCheckEnabled: (map.get(KEYS.breachCheckEnabled) ?? "false") === "true",
        lockTimeoutMinutes: Number(map.get(KEYS.lockTimeoutMinutes) ?? "5"),
        maxFailedAttempts: Number(map.get(KEYS.maxFailedAttempts) ?? "5"),
        lockoutMinutes: Number(map.get(KEYS.lockoutMinutes) ?? "10"),
        clipboardClearSeconds: Number(map.get(KEYS.clipboardClearSeconds) ?? "30"),
      });
      setIsReady(true);
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = async (next: SettingsState): Promise<void> => {
    await upsertSetting(KEYS.biometricsEnabled, boolToString(next.biometricsEnabled));
    await upsertSetting(KEYS.autoLockOnBackground, boolToString(next.autoLockOnBackground));
    await upsertSetting(KEYS.breachCheckEnabled, boolToString(next.breachCheckEnabled));
    await upsertSetting(KEYS.lockTimeoutMinutes, String(next.lockTimeoutMinutes));
    await upsertSetting(KEYS.maxFailedAttempts, String(next.maxFailedAttempts));
    await upsertSetting(KEYS.lockoutMinutes, String(next.lockoutMinutes));
    await upsertSetting(KEYS.clipboardClearSeconds, String(next.clipboardClearSeconds));
  };

  const update = async (patch: Partial<SettingsState>): Promise<void> => {
    const next = { ...state, ...patch };
    setState(next);
    await persist(next);
  };

  const exportData = async (): Promise<void> => {
    try {
      const vaults = await getVaults();
      const settings = await getAllSettings();
      const payload = JSON.stringify(
        {
          schema: "vaultkey-export-v1",
          exportedAt: new Date().toISOString(),
          vaults,
          settings,
        },
        null,
        2,
      );
      const target = `${FileSystem.documentDirectory}vaultkey-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(target, payload);
      Alert.alert("Export complete", `Backup saved to:\n${target}`);
    } catch {
      Alert.alert("Export failed", "Unable to export right now.");
    }
  };

  const importData = async (mode: "merge" | "replace"): Promise<void> => {
    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (selected.canceled || selected.assets.length === 0) {
        return;
      }
      const file = selected.assets[0];
      const raw = await FileSystem.readAsStringAsync(file.uri);
      const parsed = JSON.parse(raw) as {
        settings?: Array<{ key: string; value: string }>;
        vaults?: Array<{
          site_name: string;
          url: string | null;
          username: string;
          encrypted_password: string;
          category: string | null;
          notes: string | null;
          tags: string | null;
          strength_score: number | null;
          totp_secret: string | null;
        }>;
      };

      if (mode === "replace") {
        // Keep master password to avoid accidental lockout during restore.
        await clearVaults();
        await clearSettingsExcept([MASTER_PASSWORD_KEY, MASTER_PASSWORD_META_KEY]);
      }

      if (parsed.settings) {
        for (const item of parsed.settings) {
          if (item.key === MASTER_PASSWORD_KEY || item.key === MASTER_PASSWORD_META_KEY) {
            continue;
          }
          await upsertSetting(item.key, String(item.value));
        }
      }
      if (parsed.vaults) {
        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        const existingRows = mode === "merge" ? await getVaults() : [];
        const existingByKey = new Map<string, VaultRow>();
        for (const row of existingRows) {
          existingByKey.set(toMergeKey(row.site_name, row.username), row);
        }

        for (const row of parsed.vaults) {
          if (!row.site_name?.trim() || !row.username?.trim() || !row.encrypted_password?.length) {
            skipped += 1;
            continue;
          }

          const key = toMergeKey(row.site_name, row.username);
          const existing = mode === "merge" ? existingByKey.get(key) : undefined;

          if (existing) {
            await updateVault({
              id: existing.id,
              siteName: row.site_name,
              url: row.url,
              username: row.username,
              encryptedPassword: row.encrypted_password,
              category: row.category,
              notes: row.notes,
              tags: row.tags,
              strengthScore: row.strength_score,
              totpSecret: row.totp_secret,
            });
            updated += 1;
            continue;
          }

          const insertedId = await insertVault({
            siteName: row.site_name,
            url: row.url,
            username: row.username,
            encryptedPassword: row.encrypted_password,
            category: row.category,
            notes: row.notes,
            tags: row.tags,
            strengthScore: row.strength_score,
            totpSecret: row.totp_secret,
          });
          inserted += 1;

          if (mode === "merge") {
            existingByKey.set(key, {
              id: insertedId,
              site_name: row.site_name,
              url: row.url,
              username: row.username,
              encrypted_password: row.encrypted_password,
              category: row.category,
              notes: row.notes,
              tags: row.tags,
              strength_score: row.strength_score,
              totp_secret: row.totp_secret,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }

        Alert.alert(
          "Import complete",
          mode === "replace"
            ? `Restored backup in replace mode.\nInserted: ${inserted}\nSkipped: ${skipped}`
            : `Merged backup.\nInserted: ${inserted}\nUpdated: ${updated}\nSkipped: ${skipped}`,
        );
        return;
      }
      Alert.alert("Import complete", "Settings import completed.");
    } catch {
      Alert.alert("Import failed", "Invalid or unreadable backup file.");
    }
  };

  const changeMasterPassword = async (): Promise<void> => {
    if (!currentMaster || !newMaster || !confirmMaster) {
      Alert.alert("Missing fields", "Fill current, new, and confirm password.");
      return;
    }
    if (newMaster.length < 8) {
      Alert.alert("Weak password", "New master password must be at least 8 characters.");
      return;
    }
    if (newMaster !== confirmMaster) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    try {
      setChangingMaster(true);
      const existingMeta = await getSetting(MASTER_PASSWORD_META_KEY);
      const existingLegacy = await getSetting(MASTER_PASSWORD_KEY);
      const matchesMeta = !!existingMeta && verifyMasterPassword(currentMaster, existingMeta);
      const matchesLegacy = !!existingLegacy && existingLegacy === currentMaster;
      if (!matchesMeta && !matchesLegacy) {
        Alert.alert("Incorrect password", "Current master password is incorrect.");
        return;
      }

      if (!hasSessionKey()) {
        if (existingMeta) {
          setSessionFromMaster(currentMaster, existingMeta);
        } else {
          Alert.alert("Session required", "Please unlock with master password and try again.");
          return;
        }
      }

      const nextMeta = createMasterMeta(newMaster);
      const rows = await getVaults();
      const decryptedRows = rows.map((row) => ({
        row,
        plainPassword: decryptWithSession(row.encrypted_password),
      }));

      setSessionFromMaster(newMaster, nextMeta);
      for (const item of decryptedRows) {
        await updateVault({
          id: item.row.id,
          siteName: item.row.site_name,
          url: item.row.url,
          username: item.row.username,
          encryptedPassword: encryptWithSession(item.plainPassword),
          category: item.row.category,
          notes: item.row.notes,
          tags: item.row.tags,
          strengthScore: item.row.strength_score,
          totpSecret: item.row.totp_secret,
        });
      }

      await upsertSetting(MASTER_PASSWORD_META_KEY, nextMeta);
      await upsertSetting(MASTER_PASSWORD_KEY, "");
      setSessionFromMaster(newMaster, nextMeta);
      setCurrentMaster("");
      setNewMaster("");
      setConfirmMaster("");
      Alert.alert("Updated", "Master password changed successfully.");
    } catch {
      Alert.alert("Update failed", "Could not rotate master password. Please try again.");
    } finally {
      setChangingMaster(false);
    }
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Security and backup preferences for your vault.</Text>

        <View style={styles.section}>
          <ToggleRow
            label="Enable biometrics"
            value={state.biometricsEnabled}
            onPress={() => void update({ biometricsEnabled: !state.biometricsEnabled })}
          />
          <ToggleRow
            label="Auto-lock on background"
            value={state.autoLockOnBackground}
            onPress={() => void update({ autoLockOnBackground: !state.autoLockOnBackground })}
          />
          <ToggleRow
            label="Breach check hints"
            value={state.breachCheckEnabled}
            onPress={() => void update({ breachCheckEnabled: !state.breachCheckEnabled })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Auto-lock timeout</Text>
          <View style={styles.timeoutRow}>
            {[1, 5, 10, 30].map((minute) => (
              <Pressable
                key={minute}
                onPress={() => void update({ lockTimeoutMinutes: minute })}
                style={[styles.chip, state.lockTimeoutMinutes === minute ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, state.lockTimeoutMinutes === minute ? styles.chipTextActive : null]}>
                  {minute}m
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Brute-force protection</Text>
          <Text style={styles.inlineLabel}>Max failed attempts</Text>
          <View style={styles.timeoutRow}>
            {[3, 5, 8, 10].map((count) => (
              <Pressable
                key={count}
                onPress={() => void update({ maxFailedAttempts: count })}
                style={[styles.chip, state.maxFailedAttempts === count ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, state.maxFailedAttempts === count ? styles.chipTextActive : null]}>
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.inlineLabel}>Lockout duration</Text>
          <View style={styles.timeoutRow}>
            {[1, 5, 10, 30].map((minute) => (
              <Pressable
                key={minute}
                onPress={() => void update({ lockoutMinutes: minute })}
                style={[styles.chip, state.lockoutMinutes === minute ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, state.lockoutMinutes === minute ? styles.chipTextActive : null]}>
                  {minute}m
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Clipboard safety</Text>
          <Text style={styles.inlineLabel}>Auto-clear copied secrets</Text>
          <View style={styles.timeoutRow}>
            {[15, 30, 60, 120].map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => void update({ clipboardClearSeconds: seconds })}
                style={[styles.chip, state.clipboardClearSeconds === seconds ? styles.chipActive : null]}
              >
                <Text style={[styles.chipText, state.clipboardClearSeconds === seconds ? styles.chipTextActive : null]}>
                  {seconds}s
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Change master password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentMaster}
            onChangeText={setCurrentMaster}
            placeholder="Current master password"
            placeholderTextColor="#7B859B"
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newMaster}
            onChangeText={setNewMaster}
            placeholder="New master password"
            placeholderTextColor="#7B859B"
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmMaster}
            onChangeText={setConfirmMaster}
            placeholder="Confirm new master password"
            placeholderTextColor="#7B859B"
          />
          <Pressable style={styles.primaryButton} onPress={() => void changeMasterPassword()} disabled={changingMaster}>
            <Text style={styles.primaryButtonText}>{changingMaster ? "Updating..." : "Update Master Password"}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Backup</Text>
          <Pressable style={styles.primaryButton} onPress={() => void exportData()}>
            <Text style={styles.primaryButtonText}>Export Backup JSON</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void importData("merge")}>
            <Text style={styles.secondaryButtonText}>Import (Merge)</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, styles.dangerButton]}
            onPress={() =>
              Alert.alert(
                "Replace existing vault?",
                "This will clear current vault entries and import from backup file.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Continue", style: "destructive", onPress: () => void importData("replace") },
                ],
              )
            }
          >
            <Text style={[styles.secondaryButtonText, styles.dangerButtonText]}>Import (Replace Existing)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={styles.toggleRow} onPress={onPress}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.togglePill, value ? styles.togglePillOn : null]}>
        <Text style={styles.togglePillText}>{value ? "ON" : "OFF"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B1020" },
  container: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  backText: { color: "#5B8DEF", fontSize: 13, fontWeight: "700" },
  subtitle: { color: "#8B94A8", fontSize: 13, marginBottom: 14, marginTop: 4 },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 12,
    padding: 10,
  },
  sectionLabel: { color: "#D2DCF0", fontWeight: "700", fontSize: 13, marginBottom: 8 },
  inlineLabel: { color: "#8B94A8", fontSize: 12, marginBottom: 6, marginTop: 4 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },
  toggleLabel: { color: "#D2DCF0", fontSize: 14 },
  togglePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(248,113,113,0.22)" },
  togglePillOn: { backgroundColor: "rgba(34,197,94,0.25)" },
  togglePillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  timeoutRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: "#5B8DEF", borderColor: "#5B8DEF" },
  chipText: { color: "#8B94A8", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#5B8DEF",
    marginBottom: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    marginBottom: 8,
  },
  secondaryButtonText: { color: "#D2DCF0", fontWeight: "700", fontSize: 14 },
  dangerButton: {
    borderColor: "rgba(248,113,113,0.6)",
    backgroundColor: "rgba(248,113,113,0.1)",
  },
  dangerButtonText: {
    color: "#FCA5A5",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: "#FFFFFF",
    marginBottom: 8,
  },
});
