import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getVaults, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenProps = StackScreenProps<RootStackParamList, "Home">;
type SortMode = "recent" | "name" | "strength";

export default function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [vaults, setVaults] = React.useState<VaultRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [sortMode, setSortMode] = React.useState<SortMode>("recent");

  const loadVaults = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const rows = await getVaults();
    setVaults(rows);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadVaults();
    }, [loadVaults]),
  );

  const categories = React.useMemo(() => {
    const values = Array.from(new Set(vaults.map((entry) => entry.category).filter(Boolean) as string[]));
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

  const totalWeak = React.useMemo(
    () => vaults.filter((item) => (item.strength_score ?? 0) < 3).length,
    [vaults],
  );

  const renderSortButton = (mode: SortMode, label: string): React.JSX.Element => (
    <Pressable
      key={mode}
      style={[styles.sortChip, sortMode === mode ? styles.sortChipActive : null]}
      onPress={() => setSortMode(mode)}
    >
      <Text style={[styles.sortChipText, sortMode === mode ? styles.sortChipTextActive : null]}>{label}</Text>
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
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.iconButtonText}>⚙</Text>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsMain}>
            Security Check: <Text style={styles.statsStrong}>{totalWeak}</Text> weak password(s)
          </Text>
          <Text style={styles.statsSub}>Tip: Open Generator to replace weak passwords quickly.</Text>
          <Pressable style={styles.inlineButton} onPress={() => navigation.navigate("Generator")}>
            <Text style={styles.inlineButtonText}>Open Generator</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search by site, username, URL, tags..."
          placeholderTextColor="#7B859B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        <FlatList
          data={[
            { key: "all", value: null as string | null, label: `All (${vaults.length})` },
            ...categories.map((category) => ({
              key: category,
              value: category,
              label: `${category} (${vaults.filter((item) => item.category === category).length})`,
            })),
          ]}
          horizontal
          keyExtractor={(item) => item.key}
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

        <View style={styles.sortRow}>
          {renderSortButton("recent", "Recent")}
          {renderSortButton("name", "Name")}
          {renderSortButton("strength", "Strength")}
        </View>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#5B8DEF" />
          </View>
        ) : (
          <FlatList
            data={filteredVaults}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No passwords found</Text>
                <Text style={styles.emptySubtitle}>Try a new filter or add your first password.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("PasswordDetail", { id: item.id })}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle}>{item.site_name}</Text>
                    <Text style={styles.cardMeta}>{item.username}</Text>
                    {item.url ? <Text style={styles.cardMetaAlt}>{item.url}</Text> : null}
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.categoryBadge}>{item.category ?? "General"}</Text>
                    <Text style={styles.strengthText}>
                      Strength: {item.strength_score !== null ? `${item.strength_score}/5` : "N/A"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}

        <Pressable style={styles.addButton} onPress={() => navigation.navigate("AddPassword")}>
          <Text style={styles.addButtonText}>+ Add Password</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8B94A8",
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  iconButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(91,141,239,0.5)",
    backgroundColor: "rgba(91,141,239,0.16)",
    padding: 12,
    marginBottom: 12,
  },
  statsMain: {
    color: "#E7EEFF",
    fontSize: 13,
  },
  statsStrong: {
    fontWeight: "700",
  },
  statsSub: {
    marginTop: 4,
    color: "#A5B4D6",
    fontSize: 12,
  },
  inlineButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  inlineButtonText: {
    color: "#BED3FF",
    fontSize: 12,
    fontWeight: "700",
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryList: {
    gap: 8,
    paddingVertical: 8,
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  categoryChipActive: {
    backgroundColor: "#5B8DEF",
    borderColor: "#5B8DEF",
  },
  categoryChipText: {
    color: "#8B94A8",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  sortChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortChipActive: {
    backgroundColor: "rgba(91,141,239,0.28)",
    borderColor: "#5B8DEF",
  },
  sortChipText: {
    color: "#8B94A8",
    fontSize: 12,
    fontWeight: "600",
  },
  sortChipTextActive: {
    color: "#DCE8FF",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 18,
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#8B94A8",
    fontSize: 13,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  cardMeta: {
    color: "#9CA9C6",
    fontSize: 13,
  },
  cardMetaAlt: {
    color: "#7683A2",
    fontSize: 12,
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  categoryBadge: {
    color: "#D7E5FF",
    backgroundColor: "rgba(91,141,239,0.2)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
  },
  strengthText: {
    color: "#A8B5CF",
    fontSize: 11,
  },
  addButton: {
    borderRadius: 12,
    backgroundColor: "#5B8DEF",
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
