import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFavourites, toggleFavourite, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { SiteIcon } from "../components/SiteIcon";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";

type FavouritesScreenProps = StackScreenProps<RootStackParamList, "Favourites">;

export default function FavouritesScreen({ navigation }: FavouritesScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [vaults, setVaults] = React.useState<VaultRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const toast = useToast();

  const loadFavourites = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const rows = await getFavourites();
    setVaults(rows);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadFavourites();
    }, [loadFavourites]),
  );

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vaults;
    return vaults.filter(
      (v) =>
        v.site_name.toLowerCase().includes(q) ||
        v.username.toLowerCase().includes(q) ||
        (v.tags ?? "").toLowerCase().includes(q),
    );
  }, [vaults, searchQuery]);

  const handleUnstar = async (item: VaultRow): Promise<void> => {
    await toggleFavourite(item.id, 0);
    setVaults((current) => current.filter((v) => v.id !== item.id));
    toast.show("Removed from starred", "info");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Starred</Text>
            <Text style={styles.subtitle}>{vaults.length} favourites</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="star" size={28} color={Colors.star} />
            <Pressable
              style={({ pressed }) => [styles.reloadBtn, pressed && styles.reloadBtnPressed]}
              onPress={() => navigation.navigate("Settings")}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={22} color={Colors.accent} />
            </Pressable>
          </View>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Search starred..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="star" size={48} color={Colors.star} style={styles.emptyEmoji} />
                <Text style={styles.emptyTitle}>No starred entries</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the star on any password card to add it here.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("PasswordDetail", { id: item.id })}
              >
                <View style={styles.cardRow}>
                  <SiteIcon siteName={item.site_name} size={46} />
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle}>{item.site_name}</Text>
                    <Text style={styles.cardMeta}>{item.username}</Text>
                    {item.category ? (
                      <Text style={styles.categoryBadge}>{item.category}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.starButton}
                    onPress={() => void handleUnstar(item)}
                    hitSlop={12}
                  >
                    <Ionicons name="star" size={20} color={Colors.star} />
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgInput,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 20, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 14,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardMain: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardMeta: { color: Colors.textSecondary, fontSize: 13 },
  categoryBadge: {
    marginTop: 4,
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
  starButton: { padding: 4 },
});
