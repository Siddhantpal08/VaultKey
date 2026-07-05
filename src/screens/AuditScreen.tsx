import React from "react";
import { StackScreenProps } from "@react-navigation/stack";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getVaults, type VaultRow } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { decryptWithSession, hasSessionKey } from "../security/crypto";

type AuditScreenProps = StackScreenProps<RootStackParamList, "Audit">;

type AuditIssue = {
  type: "weak" | "duplicate";
  vault: VaultRow;
  detail: string;
};

function computeLiveStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(5, score);
}


export default function AuditScreen({ navigation }: AuditScreenProps): React.JSX.Element {
  const [issues, setIssues] = React.useState<AuditIssue[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [totalPasswords, setTotalPasswords] = React.useState(0);

  const performAudit = React.useCallback(async () => {
    setIsLoading(true);
    const rows = await getVaults();
    setTotalPasswords(rows.length);

    if (!hasSessionKey()) {
      setIsLoading(false);
      return;
    }

    const foundIssues: AuditIssue[] = [];
    const passwordMap = new Map<string, VaultRow[]>();

    for (const row of rows) {
      if (!row.encrypted_password) continue;
      
      try {
        const plain = decryptWithSession(row.encrypted_password);
        
        // Compute strength live — never trust the potentially stale DB value
        const liveScore = computeLiveStrength(plain);
        
        // Flag as weak if short OR score is 2 or below ("password123" scores 2)
        if (plain.length < 8 || liveScore <= 2) {
          foundIssues.push({
            type: "weak",
            vault: row,
            detail: plain.length < 8 ? "Password is too short (< 8 chars)." : "Password is too weak.",
          });
        }

        // Group by plaintext to find duplicates
        const existing = passwordMap.get(plain) || [];
        existing.push(row);
        passwordMap.set(plain, existing);
      } catch (e) {
        // failed to decrypt — skip silently
      }
    }

    // Process duplicates
    for (const [, items] of passwordMap.entries()) {
      if (items.length > 1) {
        for (const item of items) {
          foundIssues.push({
            type: "duplicate",
            vault: item,
            detail: `Used in ${items.length} different accounts.`,
          });
        }
      }
    }

    // Sort: weak first, then duplicates
    foundIssues.sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === "weak" ? -1 : 1;
    });

    setIssues(foundIssues);
    setIsLoading(false);
  }, []);


  useFocusEffect(
    React.useCallback(() => {
      void performAudit();
    }, [performAudit])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.accent} />
          </Pressable>
          <Text style={styles.title}>Security Audit</Text>
        </View>

        <Text style={styles.subtitle}>
          Analyzed {totalPasswords} passwords.
        </Text>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={issues}
            keyExtractor={(item, index) => `${item.vault.id}-${index}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark" size={48} color={Colors.success} style={styles.emptyEmoji} />
                <Text style={styles.emptyTitle}>Looking Good!</Text>
                <Text style={styles.emptySubtitle}>No weak or duplicate passwords found.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("PasswordDetail", { id: item.vault.id })}
              >
                <View style={styles.iconBox}>
                  <Ionicons 
                    name={item.type === "weak" ? "warning" : "copy"} 
                    size={22} 
                    color={item.type === "weak" ? Colors.error : Colors.warning} 
                  />
                </View>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.vault.site_name}</Text>
                  <Text style={styles.cardMeta}>{item.detail}</Text>
                  <Text style={styles.badge}>
                    {item.type.toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardMain: { flex: 1 },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardMeta: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4 },
  badge: {
    alignSelf: "flex-start",
    color: Colors.textPrimary,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
  },
});
