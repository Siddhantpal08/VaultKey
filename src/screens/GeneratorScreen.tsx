import React from "react";
import * as Clipboard from "expo-clipboard";
import { StackScreenProps } from "@react-navigation/stack";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { getSetting, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { Colors } from "../theme/colors";
import { BottomTabBar } from "../components/BottomTabBar";
import { useToast } from "../components/Toast";

type GeneratorScreenProps = StackScreenProps<RootStackParamList, "Generator">;

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUM = "23456789";
const SYM = "!@#$%^&*()-_=+[]{}";

function randomChar(source: string): string {
  return source[Math.floor(Math.random() * source.length)] ?? "";
}

function generatePassword(options: {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let pool = "";
  const mustHave: string[] = [];
  if (options.lowercase) { pool += LOWER; mustHave.push(randomChar(LOWER)); }
  if (options.uppercase) { pool += UPPER; mustHave.push(randomChar(UPPER)); }
  if (options.numbers) { pool += NUM; mustHave.push(randomChar(NUM)); }
  if (options.symbols) { pool += SYM; mustHave.push(randomChar(SYM)); }
  if (!pool) { pool = LOWER + UPPER + NUM; }

  const result: string[] = [...mustHave];
  while (result.length < options.length) {
    result.push(randomChar(pool));
  }
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j] as string, result[i] as string];
  }
  return result.join("").slice(0, options.length);
}

/** Rough entropy-based crack estimate */
function estimateCrackTime(password: string): string {
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/\d/.test(password)) poolSize += 10;
  if (/[^A-Za-z0-9]/.test(password)) poolSize += 32;
  if (poolSize === 0) return "instant";
  const combinations = Math.pow(poolSize, password.length);
  const guessesPerSec = 1e12; // 1 trillion/s offline attack
  const seconds = combinations / guessesPerSec;
  if (seconds < 60) return "< 1 minute";
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 3.15e9) return `${Math.round(seconds / 31536000)} years`;
  return `${(seconds / 3.15e9).toExponential(1)} billion years`;
}

export default function GeneratorScreen({ navigation }: GeneratorScreenProps): React.JSX.Element {
  const [length, setLength] = React.useState<number>(16);
  const [lowercase, setLowercase] = React.useState<boolean>(true);
  const [uppercase, setUppercase] = React.useState<boolean>(true);
  const [numbers, setNumbers] = React.useState<boolean>(true);
  const [symbols, setSymbols] = React.useState<boolean>(true);
  const [value, setValue] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);
  const toast = useToast();

  const regenerate = React.useCallback((): void => {
    const next = generatePassword({ length, lowercase, uppercase, numbers, symbols });
    setValue(next);
    setHistory((prev) => [next, ...prev.filter((v) => v !== next)].slice(0, 5));
  }, [length, lowercase, uppercase, numbers, symbols]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  const copyGenerated = async (): Promise<void> => {
    await Clipboard.setStringAsync(value);
    const ttl = Number((await getSetting("clipboard_clear_seconds")) ?? "30");
    const clearAfterMs = (Number.isFinite(ttl) ? Math.max(5, ttl) : 30) * 1000;
    setTimeout(() => { void Clipboard.setStringAsync(""); }, clearAfterMs);
    toast.show(`Copied — clears in ${Math.round(clearAfterMs / 1000)}s`, "success");
  };

  const useInAddFlow = async (): Promise<void> => {
    await upsertSetting("draft_generated_password", value);
    navigation.navigate("AddPassword");
  };

  const crackTime = React.useMemo(() => estimateCrackTime(value), [value]);

  const LENGTH_OPTIONS = [8, 12, 16, 20, 24, 32];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>⚡ Generator</Text>
        <Text style={styles.subtitle}>Create cryptographically strong passwords instantly.</Text>

        {/* Output card */}
        <View style={styles.outputCard}>
          <Text style={styles.outputText}>{value}</Text>
          <View style={styles.outputMeta}>
            <Text style={styles.entropyText}>🕒 Crack time: {crackTime}</Text>
            <Text style={styles.lengthBadge}>{value.length} chars</Text>
          </View>
        </View>

        {/* Length */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Password Length</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {LENGTH_OPTIONS.map((count) => (
              <Pressable
                key={count}
                style={[styles.chip, length === count && styles.chipActive]}
                onPress={() => setLength(count)}
              >
                <Text style={[styles.chipText, length === count && styles.chipTextActive]}>{count}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Options */}
        <View style={styles.optionCard}>
          <ToggleRow label="Lowercase letters" sub="a–z" value={lowercase} onPress={() => setLowercase((v) => !v)} />
          <ToggleRow label="Uppercase letters" sub="A–Z" value={uppercase} onPress={() => setUppercase((v) => !v)} />
          <ToggleRow label="Numbers" sub="0–9" value={numbers} onPress={() => setNumbers((v) => !v)} />
          <ToggleRow label="Symbols" sub="!@#..." value={symbols} onPress={() => setSymbols((v) => !v)} last />
        </View>

        {/* Actions */}
        <Pressable style={styles.primaryButton} onPress={regenerate}>
          <Text style={styles.primaryText}>🔄 Regenerate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void copyGenerated()}>
          <Text style={styles.secondaryText}>📋 Copy Password</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void useInAddFlow()}>
          <Text style={styles.secondaryText}>➕ Use in Add Password</Text>
        </Pressable>

        {/* History */}
        {history.length > 1 ? (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>Recent</Text>
            {history.slice(1).map((pw, idx) => (
              <Pressable
                key={idx}
                style={styles.historyRow}
                onPress={async () => {
                  await Clipboard.setStringAsync(pw);
                  toast.show("Copied from history", "success");
                }}
              >
                <Text style={styles.historyText} numberOfLines={1}>{pw}</Text>
                <Text style={styles.historyAction}>Copy</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <BottomTabBar
        activeTab="Generator"
        onTabPress={(tab) => {
          if (tab === "Vault") navigation.navigate("Home");
          else if (tab === "Favourites") navigation.navigate("Favourites");
          else if (tab === "Settings") navigation.navigate("Settings");
        }}
        onAddPress={() => navigation.navigate("AddPassword")}
      />
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onPress,
  last,
}: {
  label: string;
  sub: string;
  value: boolean;
  onPress: () => void;
  last?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      style={[styles.toggleRow, !last && styles.toggleRowBorder]}
      onPress={onPress}
    >
      <View>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <View style={[styles.togglePill, value && styles.togglePillOn]}>
        <Text style={styles.togglePillText}>{value ? "ON" : "OFF"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, marginBottom: 14 },
  outputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.accentBg,
    padding: 16,
    marginBottom: 14,
  },
  outputText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
    marginBottom: 10,
  },
  outputMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entropyText: { color: Colors.textSecondary, fontSize: 12 },
  lengthBadge: {
    color: Colors.accentBright,
    backgroundColor: Colors.accentDim,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  section: { marginBottom: 14 },
  historySection: { marginTop: 14 },
  sectionLabel: { color: Colors.textAccent, fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.bgCard,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { color: Colors.textSecondary, fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: Colors.textPrimary },
  optionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    marginBottom: 14,
    overflow: "hidden",
  },
  toggleRow: { paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  toggleLabel: { color: Colors.textAccent, fontSize: 14 },
  toggleSub: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  togglePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  togglePillOn: { backgroundColor: Colors.successBg, borderColor: "rgba(34,197,94,0.3)" },
  togglePillText: { color: Colors.textPrimary, fontSize: 11, fontWeight: "700" },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: Colors.bgCard,
  },
  secondaryText: { color: Colors.textAccent, fontWeight: "700", fontSize: 14 },
  historyRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  historyText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  historyAction: { color: Colors.accent, fontSize: 12, fontWeight: "700" },
});
