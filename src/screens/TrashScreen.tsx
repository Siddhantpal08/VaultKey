import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDeletedItems, restoreVault, hardDeleteVault, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

type TrashScreenProps = StackScreenProps<RootStackParamList, "Trash">;

export default function TrashScreen({ navigation }: TrashScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [items, setItems] = React.useState<VaultRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<number | null>(null);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    const rows = await getDeletedItems();
    setItems(rows);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleRestore = async (id: number) => {
    await restoreVault(id);
    void loadData();
  };

  const handleDelete = (id: number) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget !== null) {
      await hardDeleteVault(deleteTarget);
      setDeleteTarget(null);
      void loadData();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.accent} />
          </Pressable>
          <Text style={styles.title}>Recently Deleted</Text>
        </View>

        <Text style={styles.subtitle}>
          Items here can be restored or permanently deleted.
        </Text>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="trash-outline" size={48} color={Colors.textMuted} style={styles.emptyEmoji} />
                <Text style={styles.emptyTitle}>Trash is empty</Text>
                <Text style={styles.emptySubtitle}>No recently deleted items found.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.site_name}</Text>
                  <Text style={styles.cardMeta}>
                    Deleted on {new Date(item.deleted_at!).toLocaleDateString()}
                  </Text>
                  <Text style={styles.badge}>
                    {item.is_note ? "Secure Note" : "Password"}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable style={styles.actionBtn} onPress={() => handleRestore(item.id)}>
                    <Ionicons name="refresh-outline" size={22} color={Colors.success} />
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash" size={22} color={Colors.error} />
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Themed Delete Confirmation Modal */}
      {deleteTarget !== null && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning" size={32} color={Colors.error} />
            </View>
            <Text style={styles.modalTitle}>Permanent Delete</Text>
            <Text style={styles.modalText}>
              Are you sure you want to permanently delete this item? It cannot be recovered.
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalDelete} onPress={() => void confirmDelete()}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backBtn: { marginRight: 12 },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 20, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { marginBottom: 12 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 14, textAlign: "center" },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  cardMain: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  badge: {
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
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { 
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderInput,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
    zIndex: 100,
  },
  modal: {
    backgroundColor: Colors.bg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  modalText: { color: Colors.textSecondary, fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 12, width: "100%" },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
  },
  modalCancelText: { color: Colors.textSecondary, fontWeight: "700" },
  modalDelete: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.error,
  },
  modalDeleteText: { color: "#FFFFFF", fontWeight: "700" },
});
