import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "../theme/colors";
import { useTheme, useStyles } from "../theme/ThemeContext";
import { upsertSetting } from "../database/db";
// @ts-ignore noble hashes resolution
import { sha256 } from "@noble/hashes/sha2.js";
import { Buffer } from "buffer";
import { useToast } from "./Toast";

interface SetupPINModalProps {
  visible: boolean;
  onComplete: () => void;
}

function hashPIN(pin: string): string {
  const hash = sha256(Buffer.from(pin, "utf8"));
  return Buffer.from(hash).toString("base64");
}

export function SetupPINModal({ visible, onComplete }: SetupPINModalProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleKeyPress = (key: string) => {
    if (step === "enter") {
      if (pin.length < 4) setPin(pin + key);
    } else {
      if (confirmPin.length < 4) setConfirmPin(confirmPin + key);
    }
  };

  const handleDelete = () => {
    if (step === "enter") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleNext = () => {
    if (step === "enter" && pin.length === 4) {
      setStep("confirm");
    }
  };

  const handleSave = async () => {
    if (pin !== confirmPin) {
      toast.show("PINs do not match. Try again.", "error");
      setPin("");
      setConfirmPin("");
      setStep("enter");
      return;
    }

    try {
      setIsSubmitting(true);
      const hashed = hashPIN(pin);
      await upsertSetting("pin_hash", hashed);
      toast.show("PIN set successfully!", "success");
      onComplete();
    } catch (e) {
      console.error(e);
      toast.show("Failed to save PIN.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentPin = step === "enter" ? pin : confirmPin;
  const isDone = step === "confirm" && confirmPin.length === 4;

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="keypad" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.title}>
              {step === "enter" ? "Set up a quick PIN" : "Confirm your PIN"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "enter" 
                ? "Use a 4-digit PIN for faster unlock." 
                : "Enter the same 4-digit PIN to confirm."}
            </Text>
          </View>

          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((i) => (
              <View 
                key={i} 
                style={[styles.dot, currentPin.length > i && styles.dotFilled]} 
              />
            ))}
          </View>

          <View style={styles.keypad}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, i) => (
              <View key={i} style={styles.row}>
                {row.map((key) => (
                  <Pressable 
                    key={key} 
                    style={styles.key} 
                    onPress={() => handleKeyPress(key)}
                  >
                    <Text style={styles.keyText}>{key}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
            <View style={styles.row}>
              <View style={styles.keyEmpty} />
              <Pressable style={styles.key} onPress={() => handleKeyPress("0")}>
                <Text style={styles.keyText}>0</Text>
              </Pressable>
              <Pressable style={styles.key} onPress={handleDelete}>
                <Ionicons name="backspace-outline" size={28} color={Colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            {step === "enter" ? (
              <Pressable 
                style={[styles.btnPrimary, pin.length < 4 && styles.btnDisabled]} 
                onPress={handleNext}
                disabled={pin.length < 4}
              >
                <Text style={styles.btnText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.btnPrimary, !isDone && styles.btnDisabled]} 
                onPress={() => void handleSave()}
                disabled={!isDone || isSubmitting}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.btnText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>Confirm</Text>
                )}
              </Pressable>
            )}
            
            <Pressable style={styles.btnSkip} onPress={handleSkip} disabled={isSubmitting}>
              <Text style={styles.btnSkipText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.bg,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.borderInput,
  },
  dotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  keypad: {
    gap: 16,
    marginBottom: 40,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    width: 76,
    height: 76,
  },
  keyText: {
    fontSize: 32,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  footer: {
    gap: 16,
    marginTop: "auto",
    paddingBottom: 20,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  btnSkip: {
    padding: 16,
    alignItems: "center",
  },
  btnSkipText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
});
