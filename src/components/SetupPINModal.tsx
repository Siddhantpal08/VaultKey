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
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../theme/colors";
import { upsertSetting } from "../database/db";
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="keypad" size={24} color={Colors.accent} />
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
                <Ionicons name="backspace-outline" size={24} color={Colors.textPrimary} />
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderInput,
  },
  dotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  keypad: {
    gap: 12,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.bgInput,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {
    width: 70,
    height: 70,
  },
  keyText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  footer: {
    gap: 16,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnSkip: {
    padding: 16,
    alignItems: "center",
  },
  btnSkipText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
});
