import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVaults, toggleFavourite, getSetting, upsertSetting, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { MainTabParamList } from "../navigation/MainTabNavigator";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { SiteIcon } from "../components/SiteIcon";
import { BottomTabBar } from "../components/BottomTabBar";
import { useToast } from "../components/Toast";
import { SetupPINModal } from "../components/SetupPINModal";
import { Ionicons } from "@expo/vector-icons";

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Home">,
  StackScreenProps<RootStackParamList>
>;
type SortMode = "recent" | "name" | "strength";

function StrengthRing({ score }: { score: number }): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const color = score > 0 ? Colors.strength[Math.min(score - 1, 4)] : Colors.strengthDim;
  return (
    <View style={[styles.strengthRing, { borderColor: color }]}>
      <Text style={[styles.strengthRingText, { color }]}>{score}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation, route }: HomeScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [vaults, setVaults] = React.useState<VaultRow[]>([]);
  const [showPINSetup, setShowPINSetup] = React.useState(!!(route.params as any)?.showPINSetup);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [sortMode, setSortMode] = React.useState<SortMode>("recent");
  const [showAutoBackupPrompt, setShowAutoBackupPrompt] = React.useState<boolean>(false);
  // Guard: only show the backup prompt once per app session (not on every screen focus)
  const hasCheckedBackupPrompt = React.useRef(false);
  const toast = useToast();


  const loadVaults = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const rows = await getVaults();
    setVaults(rows);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const checkPrompt = async () => {
        // Only check once per session AND not while the PIN setup modal is still active
        if (hasCheckedBackupPrompt.current) return;
        if (showPINSetup) return;
        hasCheckedBackupPrompt.current = true;
        try {
          const prompted = await getSetting("auto_backup_prompted_v2");
          const autoBackupDir = await getSetting("auto_backup_uri");
          if (prompted !== "true" && !autoBackupDir && mounted) {
            setShowAutoBackupPrompt(true);
          }
        } catch (e) {
          // ignore
        }
      };
      void checkPrompt();
      return () => { mounted = false; };
    }, [showPINSetup])
  );


  useFocusEffect(
    React.useCallback(() => {
      void loadVaults();
    }, [loadVaults]),
  );

  const categories = React.useMemo(() => {
    const values = Array.from(new Set(vaults.map((e) => e.category).filter(Boolean) as string[]));
    return values.sort((a, b) => a.localeCompare(b));
  }, [vaults]);

  const filteredVaults = React.useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const filtered = vaults.filter((entry) => {
      const matchesSearch =
        normalized.length === 0 ||
        entry.site_name.toLowerCase().includes(normalized) ||
        entry.username.toLowerCase().includes(normalized) ||
        (entry.url ?? "").toLowerCase().includes(normalized) ||
        (entry.tags ?? "").toLowerCase().includes(normalized);
      const matchesCategory = selectedCategory === null || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortMode === "name") {
      return [...filtered].sort((a, b) => a.site_name.localeCompare(b.site_name));
    }
    if (sortMode === "strength") {
      return [...filtered].sort((a, b) => (b.strength_score ?? 0) - (a.strength_score ?? 0));
    }
    return [...filtered].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [vaults, searchQuery, selectedCategory, sortMode]);

  // Health stats
  const totalWeak = React.useMemo(
    () => vaults.filter((v) => (v.strength_score ?? 0) < 3).length,
    [vaults],
  );
  const totalStrong = React.useMemo(
    () => vaults.filter((v) => (v.strength_score ?? 0) >= 4).length,
    [vaults],
  );
  const healthPercent = vaults.length > 0 ? Math.round((totalStrong / vaults.length) * 100) : 0;

  const handleToggleFavourite = async (item: VaultRow): Promise<void> => {
    const newVal = item.favourite === 1 ? 0 : 1;
    await toggleFavourite(item.id, newVal as 0 | 1);
    setVaults((current) =>
      current.map((v) => (v.id === item.id ? { ...v, favourite: newVal } : v)),
    );
    toast.show(newVal === 1 ? "Added to starred" : "Removed from starred", newVal === 1 ? "success" : "info");
  };

  const renderSortButton = (mode: SortMode, label: string): React.JSX.Element => (
    <Pressable
      key={mode}
      style={[styles.sortChip, sortMode === mode ? styles.sortChipActive : null]}
      onPress={() => setSortMode(mode)}
    >
      <Text style={[styles.sortChipText, sortMode === mode ? styles.sortChipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Vault</Text>
            <Text style={styles.subtitle}>{vaults.length} saved credentials</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Pressable
              style={({ pressed }) => [styles.reloadBtn, pressed && styles.reloadBtnPressed]}
              onPress={() => void loadVaults()}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={20} color={Colors.accent} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.reloadBtn, pressed && styles.reloadBtnPressed]}
              onPress={() => navigation.navigate("Settings")}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* Health dashboard */}
        {vaults.length > 0 ? (
          <View style={styles.healthCard}>
            <View style={styles.healthLeft}>
              <Text style={styles.healthTitle}>Security Health</Text>
              <Text style={styles.healthSub}>
                {totalStrong}/{vaults.length} strong passwords
              </Text>
              {totalWeak > 0 ? (
                <Pressable
                  style={styles.healthAction}
                  onPress={() => (navigation as any).navigate("Generator")}
                >
                  <Text style={styles.healthActionText}>
                    <Ionicons name="warning" size={12} color={Colors.warning} /> {totalWeak} weak — fix now
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.healthGood}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} /> All passwords are strong!
                </Text>
              )}
            </View>
            <View style={styles.healthRingWrap}>
              <View
                style={[
                  styles.healthRing,
                  {
                    borderColor:
                      healthPercent >= 80
                        ? Colors.success
                        : healthPercent >= 50
                          ? Colors.warning
                          : Colors.error,
                  },
                ]}
              >
                <Text style={styles.healthPercent}>{healthPercent}%</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyHero}>
            <Ionicons name="lock-closed" size={40} color={Colors.accent} style={styles.emptyHeroEmoji} />
            <Text style={styles.emptyHeroTitle}>Start building your vault</Text>
            <Text style={styles.emptyHeroSub}>
              All passwords are encrypted on-device. Nothing leaves your phone.
            </Text>
            <Pressable
              style={styles.emptyHeroCTA}
              onPress={() => navigation.navigate("AddPassword")}
            >
              <Text style={styles.emptyHeroCTAText}>
                <Ionicons name="add" size={14} color={Colors.textPrimary} /> Add your first password
              </Text>
            </Pressable>
          </View>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Search by site, username, URL, tags..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        {/* Category chips */}
        <FlatList
          data={[
            { key: "all", value: null as string | null, label: "All" },
            ...categories.map((category) => ({
              key: category,
              value: category,
              label: `${category} (${vaults.filter((item) => item.category === category).length})`,
            })),
          ]}
          horizontal
          keyExtractor={(item) => item.key}
          style={{ flexGrow: 0, maxHeight: 45, minHeight: 45 }}
          contentContainerStyle={styles.categoryList}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.categoryChip, selectedCategory === item.value ? styles.categoryChipActive : null]}
              onPress={() => setSelectedCategory(item.value)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.value ? styles.categoryChipTextActive : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* Sort */}
        <View style={styles.sortRow}>
          {renderSortButton("recent", "Recent")}
          {renderSortButton("name", "A–Z")}
          {renderSortButton("strength", "Strength")}
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={filteredVaults}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              vaults.length > 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No matches</Text>
                  <Text style={styles.emptySubtitle}>Try a different search or filter.</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate("PasswordDetail", { id: item.id })}
              >
                <View style={styles.cardRow}>
                  <SiteIcon siteName={item.site_name} size={46} />
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle}>{item.site_name}</Text>
                    <Text style={styles.cardMeta}>{item.username}</Text>
                    {item.url ? (
                      <Text style={styles.cardMetaAlt} numberOfLines={1}>
                        {item.url}
                      </Text>
                    ) : null}
                    {item.category ? (
                      <Text style={styles.categoryBadge}>{item.category}</Text>
                    ) : null}
                  </View>
                  <View style={styles.cardRight}>
                    <Pressable
                      onPress={() => void handleToggleFavourite(item)}
                      hitSlop={10}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={item.favourite ? "star" : "star-outline"}
                        size={18}
                        color={item.favourite ? Colors.star : Colors.textMuted}
                      />
                    </Pressable>
                    <StrengthRing score={item.strength_score ?? 0} />
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      {/* Page-specific FAB */}

      <Pressable 
        style={styles.pageFab}
        onPress={() => navigation.navigate("AddPassword")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <SetupPINModal 
        visible={showPINSetup} 
        onComplete={() => setShowPINSetup(false)} 
      />

      <Modal
        visible={showAutoBackupPrompt}
        transparent
        animationType="none"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="cloud-upload" size={48} color={Colors.accent} style={{ alignSelf: "center", marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Enable Auto Backup?</Text>
            <Text style={styles.modalText}>
              Keep your data completely safe. Automatically save an encrypted backup to your device whenever you make changes, so you never lose your vault even if the app is uninstalled.
            </Text>
            <Pressable
              style={[styles.primaryButton, { marginTop: 24 }]}
              onPress={() => {
                setShowAutoBackupPrompt(false);
                void upsertSetting("auto_backup_prompted_v2", "true");
                navigation.navigate("Settings", { scrollTo: "backup" });
              }}
            >
              <Text style={styles.primaryButtonText}>Enable Now</Text>
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setShowAutoBackupPrompt(false);
                // Permanently mark as seen so it doesn't re-appear on next launch
                void upsertSetting("auto_backup_prompted_v2", "true");
              }}
            >
              <Text style={styles.cancelButtonText}>Not Right Now</Text>
            </Pressable>
            <Pressable
              style={[styles.cancelButton, { marginTop: 0 }]}
              onPress={() => {
                setShowAutoBackupPrompt(false);
                void upsertSetting("auto_backup_prompted_v2", "true");

              }}
            >
              <Text style={[styles.cancelButtonText, { fontSize: 12, opacity: 0.7 }]}>Don't Ask Again</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91,141,239,0.12)",
    borderWidth: 1,
    borderColor: "rgba(91,141,239,0.25)",
  },
  reloadBtnPressed: { backgroundColor: "rgba(91,141,239,0.25)" },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: "700" },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  healthCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentBg,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  healthLeft: { flex: 1 },
  healthTitle: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 2 },
  healthSub: { color: Colors.textAccent, fontSize: 12, marginBottom: 6 },
  healthAction: { alignSelf: "flex-start" },
  healthActionText: { color: Colors.warning, fontSize: 12, fontWeight: "700" },
  healthGood: { color: Colors.success, fontSize: 12, fontWeight: "700" },
  healthRingWrap: { alignItems: "center", justifyContent: "center" },
  healthRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  healthPercent: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  emptyHero: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 24,
    marginBottom: 12,
  },
  emptyHeroEmoji: { marginBottom: 10 },
  emptyHeroTitle: { color: Colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 6 },
  emptyHeroSub: { color: Colors.textSecondary, fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 14 },
  emptyHeroCTA: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  emptyHeroCTAText: { color: Colors.textPrimary, fontWeight: "700", fontSize: 14 },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgInput,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  categoryList: { gap: 8, paddingVertical: 6, alignItems: "center" },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  categoryChipTextActive: { color: Colors.textPrimary },
  sortRow: { flexDirection: "row", gap: 8, marginVertical: 8, alignItems: "center" },
  sortChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortChipActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accent },
  sortChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  sortChipTextActive: { color: Colors.textAccent },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 16, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 30 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 14,
  },
  cardPressed: { backgroundColor: Colors.bgCardHover },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMain: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardMeta: { color: Colors.textSecondary, fontSize: 13 },
  cardMetaAlt: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  categoryBadge: {
    marginTop: 5,
    alignSelf: "flex-start",
    color: Colors.accentBright,
    backgroundColor: Colors.accentDim,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
  },
  cardRight: { alignItems: "center", gap: 8 },
  starBtn: { padding: 2 },
  strengthRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  strengthRingText: { fontSize: 11, fontWeight: "700" },
  pageFab: {
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 14,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.bg,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    marginTop: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  }
});
