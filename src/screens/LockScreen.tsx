import React, { useEffect, useMemo, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RootStackParamList } from "../navigation/AppNavigator";

type LockScreenProps = StackScreenProps<RootStackParamList, "Lock">;

const MAX_ATTEMPTS = 5;
const DEMO_PIN = "1234";

export default function LockScreen({ navigation }: LockScreenProps): React.JSX.Element {
  const [attemptsLeft, setAttemptsLeft] = useState<number>(MAX_ATTEMPTS);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [biometricLabel, setBiometricLabel] = useState<string>("Biometric");
  const [pin, setPin] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  useEffect(() => {
    const checkBiometricSupport = async (): Promise<void> => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const primaryType = supported[0];

      let label = "Biometric";
      if (primaryType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
        label = "Face ID";
      } else if (primaryType === LocalAuthentication.AuthenticationType.FINGERPRINT) {
        label = "Fingerprint";
      } else if (primaryType === LocalAuthentication.AuthenticationType.IRIS) {
        label = "Iris";
      }

      setBiometricLabel(label);
      setIsBiometricAvailable(hasHardware && isEnrolled);
    };

    void checkBiometricSupport();
  }, []);

  const keypadRows = useMemo(
    () => [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["*", "0", "#"],
    ],
    [],
  );

  const onAuthSuccess = (): void => {
    navigation.replace("Home");
  };

  const consumeAttempt = (): void => {
    setAttemptsLeft((current) => Math.max(0, current - 1));
  };

  const handleBiometricUnlock = async (): Promise<void> => {
    if (attemptsLeft <= 0 || isAuthenticating) {
      return;
    }

    try {
      setIsAuthenticating(true);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock VaultKey",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Master Password",
      });

      if (result.success) {
        onAuthSuccess();
        return;
      }

      const authError = result.error;
      // Do not penalize explicit user cancellation.
      if (authError !== "user_cancel" && authError !== "system_cancel") {
        consumeAttempt();
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const verifyPin = (candidatePin: string): void => {
    if (candidatePin === DEMO_PIN) {
      onAuthSuccess();
      return;
    }

    consumeAttempt();
    Alert.alert("Incorrect PIN", "Please try again or use your master password.");
  };

  const handleDigitPress = (digit: string): void => {
    if (pin.length >= 4 || attemptsLeft <= 0) {
      return;
    }

    const newPin = `${pin}${digit}`;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        verifyPin(newPin);
        setPin("");
      }, 200);
    }
  };

  const handleBackspace = (): void => {
    setPin((current) => current.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundLayer}>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />
      </View>

      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconGlyph}>🔐</Text>
          </View>
          <View style={styles.iconRing} />
        </View>

        <Text style={styles.title}>VaultKey</Text>
        <Text style={styles.subtitle}>Premium Password Manager</Text>

        {attemptsLeft < MAX_ATTEMPTS ? (
          <View style={styles.attemptBox}>
            <Text style={styles.attemptText}>
              Attempts remaining: <Text style={styles.attemptStrong}>{attemptsLeft}</Text>
            </Text>
          </View>
        ) : null}

        {attemptsLeft <= 0 ? (
          <View style={styles.blockedContainer}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Too many attempts. Please try again later.</Text>
            </View>
            <Pressable style={styles.resetButton} onPress={() => setAttemptsLeft(MAX_ATTEMPTS)}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {isBiometricAvailable ? (
              <Pressable
                style={[styles.biometricButton, isAuthenticating ? styles.biometricDisabled : null]}
                onPress={() => void handleBiometricUnlock()}
                disabled={isAuthenticating}
              >
                <Text style={styles.biometricButtonText}>
                  {isAuthenticating ? "Authenticating..." : `Unlock with ${biometricLabel}`}
                </Text>
              </Pressable>
            ) : null}

            <View style={styles.pinSection}>
              <Text style={styles.pinHint}>Or enter your PIN (1234)</Text>

              <View style={styles.pinDots}>
                {[0, 1, 2, 3].map((dot) => (
                  <View
                    key={dot}
                    style={[styles.pinDot, dot < pin.length ? styles.pinDotActive : styles.pinDotInactive]}
                  />
                ))}
              </View>

              <View style={styles.keypad}>
                {keypadRows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.keypadRow}>
                    {row.map((digit) => {
                      const isDisabled = digit === "*" || digit === "#";
                      return (
                        <Pressable
                          key={digit}
                          style={[styles.keyButton, isDisabled ? styles.keyButtonDisabled : null]}
                          onPress={() => handleDigitPress(digit)}
                          disabled={isDisabled}
                        >
                          <Text style={[styles.keyText, isDisabled ? styles.keyTextDisabled : null]}>
                            {digit}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>

              {pin.length > 0 ? (
                <Pressable style={styles.deleteButton} onPress={handleBackspace}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1020",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  blobTop: {
    position: "absolute",
    top: 70,
    left: 20,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: "#5B8DEF",
    opacity: 0.35,
  },
  blobBottom: {
    position: "absolute",
    right: 20,
    bottom: 180,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "#3A71BA",
    opacity: 0.2,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrapper: {
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91,141,239,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  iconGlyph: {
    fontSize: 40,
  },
  iconRing: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(91,141,239,0.3)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    color: "#8B94A8",
    fontSize: 13,
    marginBottom: 24,
    textAlign: "center",
  },
  attemptBox: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.5)",
    backgroundColor: "rgba(245,158,11,0.2)",
  },
  attemptText: {
    color: "#FBBF24",
    fontSize: 12,
  },
  attemptStrong: {
    fontWeight: "700",
  },
  blockedContainer: {
    width: "100%",
    maxWidth: 360,
  },
  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: "rgba(239,68,68,0.2)",
    marginBottom: 12,
  },
  errorText: {
    color: "#F87171",
    textAlign: "center",
    fontSize: 14,
  },
  resetButton: {
    backgroundColor: "#5B8DEF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  biometricButton: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  biometricDisabled: {
    opacity: 0.6,
  },
  biometricButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  pinSection: {
    width: "100%",
    maxWidth: 360,
  },
  pinHint: {
    color: "#8B94A8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 22,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  pinDotActive: {
    backgroundColor: "#5B8DEF",
  },
  pinDotInactive: {
    backgroundColor: "#1B2D4D",
    transform: [{ scale: 0.75 }],
  },
  keypad: {
    gap: 10,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  keyButton: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyButtonDisabled: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
  },
  keyTextDisabled: {
    color: "#1B2D4D",
  },
  deleteButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: "#8B94A8",
    fontSize: 14,
  },
});
