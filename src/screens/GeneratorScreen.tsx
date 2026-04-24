import React from "react";
import * as Clipboard from "expo-clipboard";
import { StackScreenProps } from "@react-navigation/stack";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { getSetting, upsertSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";

type GeneratorScreenProps = StackScreenProps<RootStackParamList, "Generator">;

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
  const LOWER = "abcdefghijkmnopqrstuvwxyz";
  const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const NUM = "23456789";
  const SYM = "!@#$%^&*()-_=+[]{}";
  let pool = "";
  const mustHave: string[] = [];

  if (options.lowercase) {
    pool += LOWER;
    mustHave.push(randomChar(LOWER));
  }
  if (options.uppercase) {
    pool += UPPER;
    mustHave.push(randomChar(UPPER));
  }
  if (options.numbers) {
    pool += NUM;
    mustHave.push(randomChar(NUM));
  }
  if (options.symbols) {
    pool += SYM;
    mustHave.push(randomChar(SYM));
  }
  if (!pool) {
    pool = LOWER + UPPER + NUM;
  }

  const result: string[] = [...mustHave];
  while (result.length < options.length) {
    result.push(randomChar(pool));
  }
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("").slice(0, options.length);
}

export default function GeneratorScreen({ navigation }: GeneratorScreenProps): React.JSX.Element {
  const [length, setLength] = React.useState<number>(16);
  const [lowercase, setLowercase] = React.useState<boolean>(true);
  const [uppercase, setUppercase] = React.useState<boolean>(true);
  const [numbers, setNumbers] = React.useState<boolean>(true);
  const [symbols, setSymbols] = React.useState<boolean>(true);
  const [value, setValue] = React.useState<string>("");

  const regenerate = React.useCallback((): void => {
    setValue(generatePassword({ length, lowercase, uppercase, numbers, symbols }));
  }, [length, lowercase, uppercase, numbers, symbols]);

  React.useEffect(() => {
    regenerate();
  }, [regenerate]);

  const copyGenerated = async (): Promise<void> => {
    await Clipboard.setStringAsync(value);
    const ttl = Number((await getSetting("clipboard_clear_seconds")) ?? "30");
    const clearAfterMs = (Number.isFinite(ttl) ? Math.max(5, ttl) : 30) * 1000;
    setTimeout(() => {
      void Clipboard.setStringAsync("");
    }, clearAfterMs);
    Alert.alert("Copied", `Generated password copied. Clipboard auto-clears in ${Math.round(clearAfterMs / 1000)}s.`);
  };

  const useInAddFlow = async (): Promise<void> => {
    await upsertSetting("draft_generated_password", value);
    navigation.navigate("AddPassword");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Password Generator</Text>
        <Text style={styles.subtitle}>Generate secure passwords and send directly to add flow.</Text>

        <View style={styles.outputBox}>
          <Text style={styles.outputText}>{value}</Text>
        </View>

        <View style={styles.lengthRow}>
          <Text style={styles.label}>Length: {length}</Text>
          <View style={styles.lengthButtons}>
            {[12, 16, 20, 24].map((count) => (
              <Pressable
                key={count}
                style={[styles.chip, length === count ? styles.chipActive : null]}
                onPress={() => setLength(count)}
              >
                <Text style={[styles.chipText, length === count ? styles.chipTextActive : null]}>{count}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionList}>
          <ToggleRow label="Lowercase letters" value={lowercase} onPress={() => setLowercase((v) => !v)} />
          <ToggleRow label="Uppercase letters" value={uppercase} onPress={() => setUppercase((v) => !v)} />
          <ToggleRow label="Numbers" value={numbers} onPress={() => setNumbers((v) => !v)} />
          <ToggleRow label="Symbols" value={symbols} onPress={() => setSymbols((v) => !v)} />
        </View>

        <Pressable style={styles.primaryButton} onPress={regenerate}>
          <Text style={styles.primaryText}>Regenerate</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void copyGenerated()}>
          <Text style={styles.secondaryText}>Copy Password</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void useInAddFlow()}>
          <Text style={styles.secondaryText}>Use in Add Password</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable style={styles.toggleRow} onPress={onPress}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.togglePill, value ? styles.togglePillOn : null]}>
        <Text style={styles.togglePillText}>{value ? "ON" : "OFF"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B1020" },
  container: { flex: 1, padding: 16 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#8B94A8", fontSize: 13, marginBottom: 14 },
  outputBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 14,
    marginBottom: 12,
  },
  outputText: { color: "#DDE8FF", fontSize: 17, fontWeight: "700", letterSpacing: 0.4 },
  lengthRow: { marginBottom: 10 },
  label: { color: "#D2DCF0", fontSize: 13, fontWeight: "600", marginBottom: 6 },
  lengthButtons: { flexDirection: "row", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: { backgroundColor: "#5B8DEF", borderColor: "#5B8DEF" },
  chipText: { color: "#8B94A8", fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: "#FFFFFF" },
  optionList: { borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)", marginBottom: 14 },
  toggleRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: { color: "#D2DCF0", fontSize: 14 },
  togglePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(248,113,113,0.22)",
  },
  togglePillOn: { backgroundColor: "rgba(34,197,94,0.25)" },
  togglePillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  primaryButton: { borderRadius: 12, backgroundColor: "#5B8DEF", paddingVertical: 14, alignItems: "center", marginBottom: 10 },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryText: { color: "#D2DCF0", fontWeight: "700", fontSize: 14 },
});
