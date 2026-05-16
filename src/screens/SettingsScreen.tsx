import React from "react";
import * as DocumentPicker from "expo-document-picker";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore expo-file-system legacy typed exports
import { documentDirectory, writeAsStringAsync, readAsStringAsync } from "expo-file-system/legacy";
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
import {
  clearSettingsExcept,
  clearVaults,
  getAllSettings,
  getPINHash,
  getSetting,
  getVaults,
  insertVault,
  setPINHash,
  updateVault,
  upsertSetting,
  type VaultRow,
} from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import {
  createMasterMeta,
  decryptWithSession,
  encryptWithSession,
  hasSessionKey,
  setSessionFromMaster,
  verifyMasterPassword,
} from "../security/crypto";
import { createHash } from "react-native-quick-crypto";
import { Buffer } from "buffer";
import { Colors } from "../theme/colors";
import { BottomTabBar } from "../components/BottomTabBar";
import { useToast } from "../components/Toast";

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

function hashPIN(pin: string): string {
  return createHash("sha256")
    .update(Buffer.from(pin, "utf8"))
    .digest("base64") as string;
}

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

  // Master password change
  const [currentMaster, setCurrentMaster] = React.useState<string>("");
  const [newMaster, setNewMaster] = React.useState<string>("");
  const [confirmMaster, setConfirmMaster] = React.useState<string>("");
  const [changingMaster, setChangingMaster] = React.useState<boolean>(false);

  // PIN management
  const [hasPIN, setHasPIN] = React.useState<boolean>(false);
  const [newPIN, setNewPIN] = React.useState<string>("");
  const [confirmPIN, setConfirmPIN] = React.useState<string>("");
  const [savingPIN, setSavingPIN] = React.useState<boolean>(false);

  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    const load = async (): Promise<void> => {
      const rows = await getAllSettings();
      const pinHash = await getPINHash();
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
      setHasPIN(pinHash !== null);
      setIsReady(true);
    };
    void load();
    return () => { mounted = false; };
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

  const savePIN = async (): Promise<void> => {
    if (newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
      toast.show("PIN must be exactly 4 digits.", "error");
      return;
    }
    if (newPIN !== confirmPIN) {
      toast.show("PINs do not match.", "error");
      return;
    }
    try {
      setSavingPIN(true);
      await setPINHash(hashPIN(newPIN));
      setHasPIN(true);
      setNewPIN("");
      setConfirmPIN("");
      toast.show("PIN saved successfully ✓", "success");
    } catch {
      toast.show("Could not save PIN.", "error");
    } finally {
      setSavingPIN(false);
    }
  };

  const clearPIN = async (): Promise<void> => {
    Alert.alert("Remove PIN", "You'll need to use your master password to unlock.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await setPINHash(null);
          setHasPIN(false);
          toast.show("PIN removed", "info");
        },
      },
    ]);
  };

  const exportData = async (): Promise<void> => {
    try {
      const vaults = await getVaults();
      const settings = await getAllSettings();
      const payload = JSON.stringify(
        { schema: "vaultkey-export-v1", exportedAt: new Date().toISOString(), vaults, settings },
        null, 2,
      );
      const target = `${documentDirectory ?? ""}vaultkey-export-${Date.now()}.json`;
      await writeAsStringAsync(target, payload);
      Alert.alert(
        "Export complete",
        `⚠️ The export includes encrypted passwords — they can only be decrypted with your master password.\n\nSaved to:\n${target}`,
      );
    } catch {
      toast.show("Export failed.", "error");
    }
  };

  const importData = async (mode: "merge" | "replace"): Promise<void> => {
    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (selected.canceled || selected.assets.length === 0) return;
      const file = selected.assets[0];
      if (!file) return;
      const raw = await readAsStringAsync(file.uri);
      const parsed = JSON.parse(raw) as {
        settings?: Array<{ key: string; value: string }>;
        vaults?: Array<{
          site_name: string; url: string | null; username: string;
          encrypted_password: string; category: string | null; notes: string | null;
          tags: string | null; strength_score: number | null; totp_secret: string | null;
        }>;
      };

      if (mode === "replace") {
        await clearVaults();
        await clearSettingsExcept([MASTER_PASSWORD_KEY, MASTER_PASSWORD_META_KEY]);
      }

      if (parsed.settings) {
        for (const item of parsed.settings) {
          if (item.key === MASTER_PASSWORD_KEY || item.key === MASTER_PASSWORD_META_KEY) continue;
          await upsertSetting(item.key, String(item.value));
        }
      }

      if (parsed.vaults) {
        let inserted = 0, updated = 0, skipped = 0;
        const existingRows = mode === "merge" ? await getVaults() : [];
        const existingByKey = new Map<string, VaultRow>();
        for (const row of existingRows) {
          existingByKey.set(toMergeKey(row.site_name, row.username), row);
        }

        for (const row of parsed.vaults) {
          if (!row.site_name?.trim() || !row.username?.trim() || !row.encrypted_password?.length) {
            skipped += 1; continue;
          }
          const key = toMergeKey(row.site_name, row.username);
          const existing = mode === "merge" ? existingByKey.get(key) : undefined;

          if (existing) {
            await updateVault({
              id: existing.id, siteName: row.site_name, url: row.url,
              username: row.username, encryptedPassword: row.encrypted_password,
              category: row.category, notes: row.notes, tags: row.tags,
              strengthScore: row.strength_score, totpSecret: row.totp_secret,
            });
            updated += 1;
          } else {
            const insertedId = await insertVault({
              siteName: row.site_name, url: row.url, username: row.username,
              encryptedPassword: row.encrypted_password, category: row.category,
              notes: row.notes, tags: row.tags, strengthScore: row.strength_score,
              totpSecret: row.totp_secret,
            });
            inserted += 1;
            if (mode === "merge") {
              existingByKey.set(key, {
                id: insertedId, site_name: row.site_name, url: row.url,
                username: row.username, encrypted_password: row.encrypted_password,
                category: row.category, notes: row.notes, tags: row.tags,
                strength_score: row.strength_score, totp_secret: row.totp_secret,
                favourite: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              });
            }
          }
        }

        Alert.alert(
          "Import complete",
          mode === "replace"
            ? `Replace import done.\nInserted: ${inserted}\nSkipped: ${skipped}`
            : `Merge import done.\nInserted: ${inserted}\nUpdated: ${updated}\nSkipped: ${skipped}`,
        );
        return;
      }
      toast.show("Import completed.", "success");
    } catch {
      toast.show("Invalid or unreadable backup file.", "error");
    }
  };

  const changeMasterPassword = async (): Promise<void> => {
    if (!currentMaster || !newMaster || !confirmMaster) {
      toast.show("Fill all three fields.", "error"); return;
    }
    if (newMaster.length < 8) {
      toast.show("New password must be at least 8 characters.", "error"); return;
    }
    if (newMaster !== confirmMaster) {
      toast.show("New passwords do not match.", "error"); return;
    }

    try {
      setChangingMaster(true);
      const existingMeta = await getSetting(MASTER_PASSWORD_META_KEY);
      const existingLegacy = await getSetting(MASTER_PASSWORD_KEY);
      const matchesMeta = !!existingMeta && verifyMasterPassword(currentMaster, existingMeta);
      const matchesLegacy = !!existingLegacy && existingLegacy === currentMaster;
      if (!matchesMeta && !matchesLegacy) {
        toast.show("Current master password is incorrect.", "error"); return;
      }

      if (!hasSessionKey()) {
        if (existingMeta) setSessionFromMaster(currentMaster, existingMeta);
        else { toast.show("Please unlock with master password first.", "error"); return; }
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
          id: item.row.id, siteName: item.row.site_name, url: item.row.url,
          username: item.row.username, encryptedPassword: encryptWithSession(item.plainPassword),
          category: item.row.category, notes: item.row.notes, tags: item.row.tags,
          strengthScore: item.row.strength_score, totpSecret: item.row.totp_secret,
        });
      }

      await upsertSetting(MASTER_PASSWORD_META_KEY, nextMeta);
      await upsertSetting(MASTER_PASSWORD_KEY, "");
      setSessionFromMaster(newMaster, nextMeta);
      setCurrentMaster(""); setNewMaster(""); setConfirmMaster("");
      toast.show("Master password changed ✓", "success");
    } catch {
      toast.show("Could not rotate master password.", "error");
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
        <Text style={styles.title}>⚙ Settings</Text>
        <Text style={styles.subtitle}>Security and backup preferences for your vault.</Text>

        {/* Security toggles */}
        <SectionCard title="🔒 Security">
          <ToggleRow
            label="Enable biometrics"
            sub="Face ID / Fingerprint unlock"
            value={state.biometricsEnabled}
            onPress={() => void update({ biometricsEnabled: !state.biometricsEnabled })}
          />
          <ToggleRow
            label="Auto-lock on background"
            sub="Lock when app leaves foreground"
            value={state.autoLockOnBackground}
            onPress={() => void update({ autoLockOnBackground: !state.autoLockOnBackground })}
          />
          <ToggleRow
            label="Breach check hints"
            sub="Visual weak-password warnings"
            value={state.breachCheckEnabled}
            onPress={() => void update({ breachCheckEnabled: !state.breachCheckEnabled })}
            last
          />
        </SectionCard>

        {/* Auto-lock timeout */}
        <SectionCard title="⏱ Auto-lock Timeout">
          <Text style={styles.inlineLabel}>Lock after being in background for</Text>
          <View style={styles.chipRow}>
            {[1, 5, 10, 30].map((minute) => (
              <Pressable
                key={minute}
                onPress={() => void update({ lockTimeoutMinutes: minute })}
                style={[styles.chip, state.lockTimeoutMinutes === minute && styles.chipActive]}
              >
                <Text style={[styles.chipText, state.lockTimeoutMinutes === minute && styles.chipTextActive]}>
                  {minute}m
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Brute-force */}
        <SectionCard title="🛡 Brute-force Protection">
          <Text style={styles.inlineLabel}>Max failed PIN attempts</Text>
          <View style={styles.chipRow}>
            {[3, 5, 8, 10].map((count) => (
              <Pressable
                key={count}
                onPress={() => void update({ maxFailedAttempts: count })}
                style={[styles.chip, state.maxFailedAttempts === count && styles.chipActive]}
              >
                <Text style={[styles.chipText, state.maxFailedAttempts === count && styles.chipTextActive]}>
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.inlineLabel, { marginTop: 10 }]}>Lockout duration</Text>
          <View style={styles.chipRow}>
            {[1, 5, 10, 30].map((minute) => (
              <Pressable
                key={minute}
                onPress={() => void update({ lockoutMinutes: minute })}
                style={[styles.chip, state.lockoutMinutes === minute && styles.chipActive]}
              >
                <Text style={[styles.chipText, state.lockoutMinutes === minute && styles.chipTextActive]}>
                  {minute}m
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Clipboard */}
        <SectionCard title="📋 Clipboard Safety">
          <Text style={styles.inlineLabel}>Auto-clear copied secrets after</Text>
          <View style={styles.chipRow}>
            {[15, 30, 60, 120].map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => void update({ clipboardClearSeconds: seconds })}
                style={[styles.chip, state.clipboardClearSeconds === seconds && styles.chipActive]}
              >
                <Text style={[styles.chipText, state.clipboardClearSeconds === seconds && styles.chipTextActive]}>
                  {seconds}s
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* PIN management */}
        <SectionCard title={hasPIN ? "🔢 Change PIN" : "🔢 Set Lock PIN"}>
          <Text style={styles.inlineLabel}>
            {hasPIN ? "Set a new 4-digit PIN:" : "Create a 4-digit PIN for quick lock screen access:"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="New 4-digit PIN"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            value={newPIN}
            onChangeText={setNewPIN}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Confirm PIN"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            value={confirmPIN}
            onChangeText={setConfirmPIN}
          />
          <Pressable
            style={[styles.primaryButton, savingPIN && styles.disabledButton]}
            onPress={() => void savePIN()}
            disabled={savingPIN}
          >
            <Text style={styles.primaryButtonText}>
              {savingPIN ? "Saving..." : hasPIN ? "Update PIN" : "Save PIN"}
            </Text>
          </Pressable>
          {hasPIN ? (
            <Pressable style={[styles.dangerButton, { marginTop: 8 }]} onPress={() => void clearPIN()}>
              <Text style={styles.dangerButtonText}>Remove PIN</Text>
            </Pressable>
          ) : null}
        </SectionCard>

        {/* Change master password */}
        <SectionCard title="🗝 Change Master Password">
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentMaster}
            onChangeText={setCurrentMaster}
            placeholder="Current master password"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            secureTextEntry
            value={newMaster}
            onChangeText={setNewMaster}
            placeholder="New master password"
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            secureTextEntry
            value={confirmMaster}
            onChangeText={setConfirmMaster}
            placeholder="Confirm new master password"
            placeholderTextColor={Colors.textMuted}
          />
          <Pressable
            style={[styles.primaryButton, changingMaster && styles.disabledButton]}
            onPress={() => void changeMasterPassword()}
            disabled={changingMaster}
          >
            <Text style={styles.primaryButtonText}>
              {changingMaster ? "Rotating..." : "Update Master Password"}
            </Text>
          </Pressable>
        </SectionCard>

        {/* Backup */}
        <SectionCard title="💾 Backup">
          <Text style={styles.backupNote}>
            ⚠️ Exports include encrypted passwords. They require the same master password to decrypt on import.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void exportData()}>
            <Text style={styles.primaryButtonText}>Export Backup JSON</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, { marginTop: 8 }]} onPress={() => void importData("merge")}>
            <Text style={styles.secondaryButtonText}>Import (Merge)</Text>
          </Pressable>
          <Pressable
            style={[styles.dangerButton, { marginTop: 8 }]}
            onPress={() =>
              Alert.alert(
                "Replace existing vault?",
                "This clears all current vault entries.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Replace", style: "destructive", onPress: () => void importData("replace") },
                ],
              )
            }
          >
            <Text style={styles.dangerButtonText}>Import (Replace All)</Text>
          </Pressable>
        </SectionCard>
      </ScrollView>

      <BottomTabBar
        activeTab="Settings"
        onTabPress={(tab) => {
          if (tab === "Vault") navigation.navigate("Home");
          else if (tab === "Favourites") navigation.navigate("Favourites");
          else if (tab === "Generator") navigation.navigate("Generator");
        }}
        onAddPress={() => navigation.navigate("AddPassword")}
      />
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={sStyles.card}>
      <Text style={sStyles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onPress,
  last,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onPress: () => void;
  last?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      style={[sStyles.toggleRow, !last && sStyles.toggleRowBorder]}
      onPress={onPress}
    >
      <View style={{ flex: 1 }}>
        <Text style={sStyles.toggleLabel}>{label}</Text>
        {sub ? <Text style={sStyles.toggleSub}>{sub}</Text> : null}
      </View>
      <View style={[sStyles.pill, value && sStyles.pillOn]}>
        <Text style={sStyles.pillText}>{value ? "ON" : "OFF"}</Text>
      </View>
    </Pressable>
  );
}

const sStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    marginBottom: 12,
    padding: 14,
  },
  cardTitle: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 12 },
  toggleRow: { paddingVertical: 11, flexDirection: "row", alignItems: "center" },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleLabel: { color: Colors.textAccent, fontSize: 14 },
  toggleSub: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  pillOn: { backgroundColor: Colors.successBg, borderColor: "rgba(34,197,94,0.3)" },
  pillText: { color: Colors.textPrimary, fontSize: 11, fontWeight: "700" },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 14, marginTop: 2 },
  inlineLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: Colors.textPrimary },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.accent,
    marginTop: 10,
  },
  primaryButtonText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  secondaryButtonText: { color: Colors.textAccent, fontWeight: "700", fontSize: 14 },
  dangerButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.5)",
    backgroundColor: Colors.errorBg,
  },
  dangerButtonText: { color: "#FCA5A5", fontWeight: "700", fontSize: 14 },
  disabledButton: { opacity: 0.7 },
  backupNote: {
    color: Colors.warning,
    fontSize: 12,
    backgroundColor: Colors.warningBg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    lineHeight: 17,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
});
