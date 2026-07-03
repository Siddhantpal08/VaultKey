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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getNotes, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { BottomTabBar } from "../components/BottomTabBar";
import { Ionicons } from "@expo/vector-icons";

type NotesScreenProps = StackScreenProps<RootStackParamList, "Notes">;

export default function NotesScreen({ navigation }: NotesScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [notes, setNotes] = React.useState<VaultRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const loadNotes = React.useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const rows = await getNotes();
    setNotes(rows);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadNotes();
    }, [loadNotes])
  );

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (v) =>
        v.site_name.toLowerCase().includes(q) ||
        (v.category ?? "").toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Secure Notes</Text>
            <Text style={styles.subtitle}>{notes.length} notes safely stored</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Ionicons name="document-text" size={32} color={Colors.accent} />
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
          placeholder="Search notes..."
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
                <Ionicons name="document-text" size={48} color={Colors.accent} style={styles.emptyEmoji} />
                <Text style={styles.emptyTitle}>No notes found</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the + button to create a secure note.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("NoteDetail", { id: item.id })}
              >
                <View style={styles.cardRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="document" size={24} color={Colors.bg} />
                  </View>
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle}>{item.site_name}</Text>
                    <Text style={styles.cardMeta}>
                      {new Date(item.updated_at).toLocaleDateString()}
                    </Text>
                    {item.category ? (
                      <Text style={styles.categoryBadge}>{item.category}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </Pressable>
            )}
          />
        )}
      </View>

      <BottomTabBar
        activeTab="Notes"
        onTabPress={(tab) => {
          if (tab === "Vault") navigation.navigate("Home");
          else if (tab === "Generator") navigation.navigate("Generator");
          else if (tab === "Auth") navigation.navigate("Authenticator");
        }}
      />

      {/* Page-specific FAB */}
      <Pressable 
        style={styles.pageFab}
        onPress={() => navigation.navigate("AddNote")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
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
  emptyEmoji: { marginBottom: 12 },
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
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
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
  pageFab: {
    position: "absolute",
    bottom: 90,
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
});
