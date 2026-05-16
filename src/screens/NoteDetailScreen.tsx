import React, { useCallback, useState } from "react";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "@react-navigation/native";
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
import { deleteVault, getVaultById, updateVault } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { decryptWithSession, encryptWithSession, hasSessionKey } from "../security/crypto";
import { Colors } from "../theme/colors";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";

type NoteDetailScreenProps = StackScreenProps<RootStackParamList, "NoteDetail">;

export default function NoteDetailScreen({ route, navigation }: NoteDetailScreenProps): React.JSX.Element {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  // Note data
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const toast = useToast();

  const loadNote = useCallback(async (): Promise<void> => {
    try {
      if (!hasSessionKey()) {
        toast.show("Vault is locked.", "error");
        navigation.goBack();
        return;
      }
      setIsLoading(true);
      const row = await getVaultById(route.params.id);
      if (!row) {
        toast.show("Note not found", "error");
        navigation.goBack();
        return;
      }
      setTitle(row.site_name);
      setContent(decryptWithSession(row.encrypted_password));
      setCategory(row.category || "");
      setIsLoading(false);
    } catch {
      toast.show("Could not decrypt note.", "error");
      navigation.goBack();
    }
  }, [route.params.id, navigation, toast]);

  useFocusEffect(
    useCallback(() => {
      void loadNote();
    }, [loadNote])
  );

  const onSave = async () => {
    if (!title.trim()) {
      toast.show("Please enter a title.", "error");
      return;
    }
    if (!content.trim()) {
      toast.show("Please enter note content.", "error");
      return;
    }

    try {
      setIsSaving(true);
      await updateVault({
        id: route.params.id,
        siteName: title.trim(),
        url: null,
        username: "Note",
        encryptedPassword: encryptWithSession(content),
        category: category.trim() || null,
        notes: null,
        tags: null,
        strengthScore: null,
        totpSecret: null,
      });

      toast.show("Changes saved", "success");
      setIsEditing(false);
    } catch {
      toast.show("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to permanently delete this secure note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVault(route.params.id);
            toast.show("Note deleted", "success");
            navigation.goBack();
          },
        },
      ]
    );
  };

  const copyContent = async () => {
    await Clipboard.setStringAsync(content);
    toast.show("Note content copied", "success");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.topBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={Colors.accent} />
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              style={styles.topBtn}
              onPress={() => {
                if (isEditing) {
                  loadNote(); // reset
                }
                setIsEditing((v) => !v);
              }}
            >
              <Text style={styles.topBtnText}>
                {isEditing ? <><Ionicons name="close" size={14} /> Cancel</> : <><Ionicons name="pencil" size={14} /> Edit</>}
              </Text>
            </Pressable>
          </View>
        </View>

        {isEditing ? (
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Note title"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="Category"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Private notes..."
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        ) : (
          <View style={styles.viewMode}>
            <Text style={styles.viewTitle}>{title}</Text>
            {category ? <Text style={styles.viewCategory}>{category}</Text> : null}
            
            <View style={styles.contentCard}>
              <Text style={styles.viewContent}>{content}</Text>
              <Pressable style={styles.copyBtn} onPress={copyContent}>
                <Ionicons name="copy-outline" size={16} color={Colors.accent} />
              </Pressable>
            </View>
          </View>
        )}

        {isEditing ? (
          <Pressable
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
            onPress={() => void onSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>
                <Ionicons name="save" size={15} /> Save Changes
              </Text>
            )}
          </Pressable>
        ) : null}

        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}><Ionicons name="trash" size={14} /> Delete Note</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 6 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  topBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  topBtnText: { color: Colors.textAccent, fontWeight: "700", fontSize: 13 },
  form: { marginBottom: 24 },
  field: { marginBottom: 16 },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderInput,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  textArea: {
    minHeight: 180,
  },
  viewMode: { marginBottom: 30 },
  viewTitle: { color: Colors.textPrimary, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  viewCategory: { color: Colors.accentBright, fontSize: 13, fontWeight: "600", marginBottom: 16 },
  contentCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    position: "relative",
  },
  viewContent: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  copyBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 12,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.3)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.errorBg,
    marginTop: 20,
  },
  deleteButtonText: { color: "#FCA5A5", fontWeight: "700", fontSize: 14 },
});
