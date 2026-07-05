import React, { useState } from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { insertVault } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { encryptWithSession, hasSessionKey } from "../security/crypto";
import { ThemeColors } from "../theme/colors";
import { useTheme, useStyles } from "../theme/ThemeContext";
import { useToast } from "../components/Toast";
import { Ionicons } from "@expo/vector-icons";

type AddNoteScreenProps = StackScreenProps<RootStackParamList, "AddNote">;

export default function AddNoteScreen({ navigation, route }: AddNoteScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const initialTitle = route.params?.initialTitle || "";
  const initialContent = route.params?.initialContent || "";
  const isFile = route.params?.isFile || false;

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(isFile ? "Loading file content..." : initialContent);
  const [category, setCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  React.useEffect(() => {
    if (isFile && initialContent) {
      const loadFile = async () => {
        try {
          const text = await FileSystem.readAsStringAsync(initialContent);
          setContent(text);
        } catch (e) {
          setContent("");
          toast.show("Failed to read file.", "error");
        }
      };
      void loadFile();
    }
  }, [isFile, initialContent]);

  const onSave = async () => {
    if (!title.trim()) {
      toast.show("Please enter a title.", "error");
      return;
    }
    if (!content.trim()) {
      toast.show("Please enter note content.", "error");
      return;
    }
    if (!hasSessionKey()) {
      toast.show("Vault is locked. Session missing.", "error");
      return;
    }

    try {
      setIsSaving(true);
      const encryptedContent = encryptWithSession(content);
      await insertVault({
        siteName: title.trim(),
        url: null,
        username: "Note",
        encryptedPassword: encryptedContent,
        category: category.trim() || null,
        notes: null,
        tags: null,
        strengthScore: null,
        totpSecret: null,
        isNote: 1,
      });

      toast.show("Note saved", "success");
      navigation.goBack();
    } catch {
      toast.show("Failed to save note.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={16} color={Colors.accent} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Secure Note</Text>
        <Text style={styles.subtitle}>Store private text encrypted in your vault.</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bank Account Details"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Private notes..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Finance"
              placeholderTextColor={Colors.textMuted}
              value={category}
              onChangeText={setCategory}
            />
          </View>
        </View>

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
              <Ionicons name="lock-closed" size={16} /> Save Secure Note
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
  topBar: { marginBottom: 8 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: Colors.accent, fontWeight: "700", fontSize: 14 },
  title: { color: Colors.textPrimary, fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 12, marginBottom: 18, lineHeight: 18 },
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
    minHeight: 120,
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
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
});
