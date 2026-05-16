import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../theme/colors";
import { getDatabase } from "../database/db";
import { clearSessionKey } from "../security/crypto";
import { useToast } from "../components/Toast";

type Props = StackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props): React.JSX.Element {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleReset = async (): Promise<void> => {
    if (confirmText !== "RESET VAULT") {
      toast.show("Type RESET VAULT to confirm.", "error");
      return;
    }

    try {
      setIsDeleting(true);
      const db = await getDatabase();

      // Delete all user data
      await db.runAsync("DELETE FROM vaults");
      await db.runAsync("DELETE FROM settings");

      // Clear secure store
      await SecureStore.deleteItemAsync("session_key_cache"); // Just in case

      // Clear runtime memory
      clearSessionKey();

      toast.show("Vault completely reset.", "success");

      // Navigate back to Lock screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Lock" }],
      });
    } catch (e) {
      console.error("Reset error:", e);
      toast.show("Failed to reset vault.", "error");
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={48} color={Colors.error} />
          </View>

          <Text style={styles.title}>Reset Vault</Text>

          <Text style={styles.warningText}>
            Because your vault is end-to-end encrypted locally, there is absolutely no way to recover your master password.
          </Text>

          <Text style={styles.warningText}>
            If you have lost your master password, your only option is to <Text style={styles.boldError}>permanently delete</Text> all your saved passwords and start fresh.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Type "RESET VAULT" to confirm</Text>
            <TextInput
              style={styles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="RESET VAULT"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <Pressable
            style={[styles.dangerBtn, (confirmText !== "RESET VAULT" || isDeleting) && styles.dangerBtnDisabled]}
            onPress={() => void handleReset()}
            disabled={confirmText !== "RESET VAULT" || isDeleting}
          >
            <Text style={styles.dangerBtnText}>
              {isDeleting ? "Deleting..." : "Permanently Delete Everything"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  boldError: {
    color: Colors.error,
    fontWeight: "bold",
  },
  inputContainer: {
    marginTop: 32,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.error,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dangerBtn: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  dangerBtnDisabled: {
    opacity: 0.5,
  },
  dangerBtnText: {
    color: Colors.errorText,
    fontSize: 16,
    fontWeight: "600",
  },
});
