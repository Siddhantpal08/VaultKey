import React, { useState, useEffect, useCallback } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVaults, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../theme/colors";
import { SiteIcon } from "../components/SiteIcon";
import { BottomTabBar } from "../components/BottomTabBar";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";
import { generateTOTP } from "../security/totp";
import * as Clipboard from "expo-clipboard";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { insertVault } from "../database/db";
import { encryptWithSession, hasSessionKey } from "../security/crypto";

type AuthenticatorScreenProps = StackScreenProps<RootStackParamList, "Authenticator">;

export default function AuthenticatorScreen({ navigation }: AuthenticatorScreenProps): React.JSX.Element {
  const { colors: Colors, isDark } = useTheme();
  const styles = useStyles(createStyles);
  const toast = useToast();
  
  const [entries, setEntries] = useState<VaultRow[]>([]);
  const [tick, setTick] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showManual, setShowManual] = useState(false);
  
  const [manualForm, setManualForm] = useState({ name: "", username: "", secret: "" });

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const all = await getVaults();
      setEntries(all.filter(v => v.totp_secret && v.totp_secret.trim().length > 0));
    };
    void load();
  }, []));

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddManual = async () => {
    if (!manualForm.name.trim() || !manualForm.secret.trim()) {
      toast.show("Name and Secret are required", "error");
      return;
    }
    if (!hasSessionKey()) {
      toast.show("Vault is locked", "error");
      return;
    }
    
    // Clean secret (remove spaces)
    const cleanSecret = manualForm.secret.replace(/\s+/g, "").toUpperCase();
    
    try {
      await insertVault({
        siteName: manualForm.name.trim(),
        username: manualForm.username.trim(),
        encryptedPassword: encryptWithSession(""), // Empty password for 2FA-only entries
        totpSecret: cleanSecret,
        url: null,
        category: null,
        notes: null,
        tags: null,
        strengthScore: 0,
      });
      toast.show("Authenticator added", "success");
      setShowManual(false);
      setManualForm({ name: "", username: "", secret: "" });
      // Reload
      const all = await getVaults();
      setEntries(all.filter(v => v.totp_secret && v.totp_secret.trim().length > 0));
    } catch (e) {
      toast.show("Failed to add", "error");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Authenticator</Text>
            <Text style={styles.subtitle}>{entries.length} 2FA codes</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.headerBtn, pressed && styles.headerBtnPressed]}
            onPress={() => navigation.navigate("Settings")}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={22} color={Colors.accent} />
          </Pressable>
        </View>

        <FlatList
          data={entries}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="timer-outline" size={48} color={Colors.accent} style={styles.emptyEmoji} />
              <Text style={styles.emptyTitle}>No 2FA accounts yet</Text>
              <Text style={styles.emptySubtitle}>
                Add a TOTP secret or scan a QR code to generate 2FA codes here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TOTPCard key={item.id} row={item} tick={tick} />
          )}
        />
        
      </View>

      {/* Options Modal */}
      {showOptions && (
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOptions(false)} />
          <View style={styles.optionsSheet}>
            <View style={styles.sheetKnob} />
            <Text style={styles.sheetTitle}>Add Authenticator</Text>
            
            <Pressable 
              style={styles.sheetBtn} 
              onPress={() => {
                setShowOptions(false);
                navigation.navigate("QRScan");
              }}
            >
              <View style={styles.sheetIconBox}><Ionicons name="qr-code" size={20} color={Colors.accent} /></View>
              <Text style={styles.sheetBtnText}>Scan a QR Code</Text>
            </Pressable>
            
            <Pressable 
              style={styles.sheetBtn} 
              onPress={() => {
                setShowOptions(false);
                setShowManual(true);
              }}
            >
              <View style={styles.sheetIconBox}><Ionicons name="keypad" size={20} color={Colors.accent} /></View>
              <Text style={styles.sheetBtnText}>Enter Setup Key Manually</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Manual Entry Modal */}
      {showManual && (
        <View style={styles.overlay}>
          <View style={styles.manualModal}>
            <Text style={styles.manualTitle}>Manual Entry</Text>
            <Text style={styles.manualSub}>Add a 2FA code using a setup key.</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Account Name *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Google"
                placeholderTextColor={Colors.textMuted}
                value={manualForm.name}
                onChangeText={v => setManualForm(f => ({ ...f, name: v }))}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Username (optional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="alice@example.com"
                placeholderTextColor={Colors.textMuted}
                value={manualForm.username}
                onChangeText={v => setManualForm(f => ({ ...f, username: v }))}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Secret Key *</Text>
              <TextInput 
                style={styles.input} 
                placeholder="JBSWY3DPEHPK3PXP"
                placeholderTextColor={Colors.textMuted}
                value={manualForm.secret}
                onChangeText={v => setManualForm(f => ({ ...f, secret: v }))}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowManual(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={() => void handleAddManual()}>
                <Text style={styles.modalSaveText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <BottomTabBar
        activeTab="Auth"
        onTabPress={(tab) => {
          if (tab === "Vault") navigation.navigate("Home");
          else if (tab === "Notes") navigation.navigate("Notes");
          else if (tab === "Generator") navigation.navigate("Generator");
        }}
      />

      {/* Floating Action Button */}
      <Pressable 
        style={styles.fab} 
        onPress={() => setShowOptions(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

function TOTPCard({ row, tick }: { row: VaultRow; tick: number }): React.JSX.Element | null {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const result = generateTOTP(row.totp_secret!);
  const toast = useToast();
  if (!result) return null;

  const progress = result.secondsLeft / 30;
  
  const handleCopy = async () => {
    await Clipboard.setStringAsync(result.code);
    toast.show("Code copied to clipboard", "success");
  };

  return (
    <Pressable style={styles.card} onPress={() => void handleCopy()}>
      <View style={styles.cardRow}>
        <SiteIcon siteName={row.site_name} size={46} />
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{row.site_name}</Text>
          <Text style={styles.cardMeta}>{row.username}</Text>
        </View>
      </View>
      
      <View style={styles.codeRow}>
        <Text style={styles.codeText}>
          {result.code.substring(0, 3)} {result.code.substring(3)}
        </Text>
        <View style={styles.progressWrap}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress * 100}%`, backgroundColor: result.secondsLeft <= 5 ? Colors.error : Colors.accent }
            ]} 
          />
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: "700" },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91,141,239,0.12)",
    borderWidth: 1,
    borderColor: "rgba(91,141,239,0.25)",
  },
  headerBtnPressed: { backgroundColor: "rgba(91,141,239,0.25)" },
  listContent: { paddingBottom: 100, gap: 12 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 16,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  cardMain: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardMeta: { color: Colors.textSecondary, fontSize: 13 },
  codeRow: { alignItems: "center", backgroundColor: Colors.bgInput, borderRadius: 8, padding: 12 },
  codeText: { 
    color: Colors.accent, 
    fontSize: 32, 
    fontWeight: "700", 
    letterSpacing: 4,
    fontVariant: ["tabular-nums"]
  },
  progressWrap: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginTop: 8,
    width: "100%",
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
    zIndex: 100,
  },
  optionsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetKnob: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 20 },
  sheetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  sheetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "600" },
  manualModal: {
    backgroundColor: Colors.bg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  manualTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  manualSub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { color: Colors.textAccent, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 10 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: "700" },
  modalSave: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  modalSaveText: { color: Colors.bg, fontWeight: "700" },
});
