import React, { useEffect, useMemo, useRef, useState } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import { useFocusEffect } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPINHash, getSetting } from "../database/db";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { hasSessionKey, restoreSessionKey } from "../security/crypto";
import { Colors } from "../theme/colors";
// @ts-ignore noble hashes resolution
import { sha256 } from "@noble/hashes/sha2.js";
import { VKLogo } from "../components/VKLogo";
import { Buffer } from "buffer";

type LockScreenProps = StackScreenProps<RootStackParamList, "Lock">;

const MAX_ATTEMPTS = 5;

function hashPIN(pin: string): string {
  const hash = sha256(Buffer.from(pin, "utf8"));
  return Buffer.from(hash).toString("base64");
}


export default function LockScreen({ navigation }: LockScreenProps): React.JSX.Element {
  const [attemptsLeft, setAttemptsLeft] = useState<number>(MAX_ATTEMPTS);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(true);
  const [biometricLabel, setBiometricLabel] = useState<string>("Biometric");
  const [pin, setPin] = useState<string>("");
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [maxAttempts, setMaxAttempts] = useState<number>(MAX_ATTEMPTS);
  const [lockoutMinutes, setLockoutMinutes] = useState<number>(10);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [storedPINHash, setStoredPINHash] = useState<string | null>(null);
  const [hasPIN, setHasPIN] = useState<boolean>(false);
  const [requireMasterOnUnlock, setRequireMasterOnUnlock] = useState<boolean>(false);

  // Tracks whether the automatic biometric prompt has already fired this mount
  const hasTriggeredBiometric = useRef<boolean>(false);

  // Pulse animation for the icon ring
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const checkBiometricSupport = React.useCallback(async (): Promise<void> => {
    const biometricEnabledSetting = await getSetting("biometrics_enabled");
    const biometricEnabled = biometricEnabledSetting !== "false";
    const maxAttemptsSetting = Number((await getSetting("max_failed_attempts")) ?? String(MAX_ATTEMPTS));
    const lockoutSetting = Number((await getSetting("lockout_minutes")) ?? "10");

    const pinHash = await getPINHash();
    setStoredPINHash(pinHash);
    setHasPIN(pinHash !== null);

    const requireMaster = (await getSetting("require_master_on_unlock")) === "true";
    setRequireMasterOnUnlock(requireMaster);

    // ─── No auto-bypass: always show PIN / biometric UI ─────────────────────
    // The session key is restored AFTER successful auth inside onAuthSuccess().
    // ─────────────────────────────────────────────────────────────────────────

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
    setIsBiometricEnabled(biometricEnabled);
    setIsBiometricAvailable(biometricEnabled && hasHardware && isEnrolled);
    const normalizedMaxAttempts = Number.isFinite(maxAttemptsSetting)
      ? Math.max(1, maxAttemptsSetting)
      : MAX_ATTEMPTS;
    setMaxAttempts(normalizedMaxAttempts);
    setLockoutMinutes(Number.isFinite(lockoutSetting) ? Math.max(1, lockoutSetting) : 10);
    setAttemptsLeft((current) => Math.min(current, normalizedMaxAttempts));
  }, [navigation]);

  useEffect(() => {
    void checkBiometricSupport();
  }, [checkBiometricSupport]);

  // Auto-trigger biometrics once availability is confirmed and only once per mount
  useEffect(() => {
    if (
      isBiometricAvailable &&
      !hasTriggeredBiometric.current &&
      !isAuthenticating &&
      attemptsLeft > 0 &&
      !lockedUntil
    ) {
      hasTriggeredBiometric.current = true;
      void handleBiometricUnlock();
    }
  // We only want this to fire once when biometric availability becomes true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBiometricAvailable]);

  useFocusEffect(
    React.useCallback(() => {
      void checkBiometricSupport();
    }, [checkBiometricSupport]),
  );

  useEffect(() => {
    if (!lockedUntil) {
      return;
    }
    const timer = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  const keypadRows = useMemo(
    () => [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["*", "0", "#"],
    ],
    [],
  );

  const onAuthSuccess = async (): Promise<void> => {
    // If master password is required every time, always re-authenticate
    if (requireMasterOnUnlock) {
      navigation.replace("MasterPassword");
      return;
    }
    // Restore the session key from SecureStore (Android Keystore / iOS Keychain).
    // This is instant and doesn't require re-running PBKDF2.
    if (!hasSessionKey()) {
      const restored = await restoreSessionKey();
      if (!restored) {
        // Key not cached yet (first install / vault reset) — fall back to master password
        navigation.replace("MasterPassword");
        return;
      }
    }
    navigation.replace("Home");
  };

  const consumeAttempt = (): void => {
    setAttemptsLeft((current) => {
      const next = Math.max(0, current - 1);
      if (next === 0) {
        setLockedUntil(Date.now() + lockoutMinutes * 60 * 1000);
      }
      return next;
    });
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
        fallbackLabel: "Use PIN",
      });

      if (result.success) {
        void onAuthSuccess();
        return;
      }

      const authError = result.error;
      if (authError !== "user_cancel" && authError !== "system_cancel") {
        consumeAttempt();
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const verifyPin = (candidatePin: string): void => {
    const candidateHash = hashPIN(candidatePin);

    if (!hasPIN || !storedPINHash) {
      navigation.navigate("MasterPassword");
      return;
    }

    if (candidateHash === storedPINHash) {
      void onAuthSuccess();
      return;
    }

    consumeAttempt();
    Alert.alert("Incorrect PIN", "Please try again or use your master password.");
  };

  const isCurrentlyLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleDigitPress = (digit: string): void => {
    if (pin.length >= 4 || attemptsLeft <= 0 || isCurrentlyLocked) {
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
      {/* Background blobs */}
      <View style={styles.backgroundLayer} pointerEvents="none">
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
          <VKLogo />
        </Animated.View>

        <Text style={styles.title}>VaultKey</Text>
        <Text style={styles.subtitle}>Your secure local vault</Text>

        {/* Require master password every time — shortcut banner */}
        {requireMasterOnUnlock ? (
          <Pressable
            style={styles.masterRequiredBanner}
            onPress={() => navigation.navigate("MasterPassword")}
          >
            <Ionicons name="key" size={14} color={Colors.accent} />
            <Text style={styles.masterRequiredText}>
              Master password required every unlock
            </Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.accent} />
          </Pressable>
        ) : null}

        {attemptsLeft < maxAttempts ? (
          <View style={styles.attemptBox}>
            <Text style={styles.attemptText}>
              Attempts remaining: <Text style={styles.attemptStrong}>{attemptsLeft}</Text>
            </Text>
          </View>
        ) : null}

        {attemptsLeft <= 0 || isCurrentlyLocked ? (
          <View style={styles.blockedContainer}>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                Too many attempts.
                {lockedUntil && Date.now() < lockedUntil
                  ? ` Try again in ${Math.ceil((lockedUntil - Date.now()) / 60000)} min.`
                  : " Please try again."}
              </Text>
            </View>
            <Pressable
              style={styles.resetButton}
              onPress={() => {
                if (!lockedUntil || Date.now() >= lockedUntil) {
                  setAttemptsLeft(maxAttempts);
                  setLockedUntil(null);
                }
              }}
            >
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
                <Ionicons
                  name={biometricLabel === "Face ID" ? "scan" : "finger-print"}
                  size={20}
                  color={Colors.textPrimary}
                />
                <Text style={styles.biometricButtonText}>
                  {isAuthenticating ? "Authenticating..." : `Unlock with ${biometricLabel}`}
                </Text>
              </Pressable>
            ) : isBiometricEnabled ? null : (
              <View style={styles.biometricOffBox}>
                <Text style={styles.biometricOffText}>Biometric unlock is disabled in settings.</Text>
              </View>
            )}

            <View style={styles.pinSection}>
              <Text style={styles.pinHint}>
                {hasPIN ? "Enter your PIN" : "No PIN set — use master password"}
              </Text>

              {hasPIN ? (
                <>
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
                              style={({ pressed }) => [
                                styles.keyButton,
                                isDisabled ? styles.keyButtonDisabled : null,
                                pressed && !isDisabled ? styles.keyButtonPressed : null,
                              ]}
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
                      <Text style={styles.deleteButtonText}>
                        <Ionicons name="backspace" size={14} /> Delete
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              ) : null}

              <Pressable
                style={styles.masterPasswordButton}
                onPress={() => navigation.navigate("MasterPassword")}
              >
                <Text style={styles.masterPasswordButtonText}>
                  {hasPIN ? "Use Master Password Instead" : "Unlock with Master Password"}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Watermark */}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>VaultKey</Text>
          <Text style={styles.watermarkText}>
            Created by <Text style={styles.watermarkHighlight}>Siddhant Pal</Text>
          </Text>
          <Text style={styles.watermarkSub}>Provided by Crevio Studio</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blobTop: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: Colors.blobBlue,
    opacity: 0.12,
  },
  blobBottom: {
    position: "absolute",
    right: -50,
    bottom: 200,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: Colors.blobPurple,
    opacity: 0.1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  logoWrap: {
    marginBottom: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 28,
  },
  attemptBox: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    backgroundColor: Colors.warningBg,
  },
  attemptText: { color: Colors.warning, fontSize: 12 },
  attemptStrong: { fontWeight: "700" },
  blockedContainer: { width: "100%", maxWidth: 360 },
  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: Colors.errorBg,
    marginBottom: 12,
  },
  errorText: { color: Colors.errorText, textAlign: "center", fontSize: 14 },
  resetButton: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  resetButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: "600" },
  biometricButton: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  biometricDisabled: { opacity: 0.5 },
  biometricButtonText: { color: Colors.textPrimary, fontSize: 15, fontWeight: "600" },
  biometricOffBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
    backgroundColor: "rgba(148,163,184,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  biometricOffText: { color: Colors.textSecondary, fontSize: 12, textAlign: "center" },
  pinSection: { width: "100%", maxWidth: 360 },
  pinHint: { color: Colors.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 16 },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 24,
  },
  pinDot: { width: 14, height: 14, borderRadius: 999 },
  pinDotActive: { backgroundColor: Colors.accent },
  pinDotInactive: { backgroundColor: "#1B2D4D", transform: [{ scale: 0.75 }] },
  keypad: { gap: 12 },
  keypadRow: { flexDirection: "row", justifyContent: "center", gap: 14 },
  keyButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyButtonPressed: { backgroundColor: Colors.accentBg },
  keyButtonDisabled: { backgroundColor: "transparent", borderColor: "transparent" },
  keyText: { color: Colors.textPrimary, fontSize: 24, fontWeight: "500" },
  keyTextDisabled: { color: "#1B2D4D" },
  deleteButton: { marginTop: 16, alignItems: "center", paddingVertical: 8 },
  deleteButtonText: { color: Colors.textSecondary, fontSize: 14 },
  masterPasswordButton: { marginTop: 8, alignItems: "center", paddingVertical: 12 },
  masterPasswordButtonText: { color: Colors.accent, fontSize: 14, fontWeight: "600" },
  masterRequiredBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accentBg,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
    width: "100%",
    maxWidth: 360,
  },
  masterRequiredText: {
    flex: 1,
    color: Colors.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  watermarkContainer: {
    alignItems: "center",
    marginTop: 36,
    opacity: 0.5,
  },
  watermarkText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  watermarkHighlight: {
    color: Colors.accent,
    fontWeight: "700",
  },
  watermarkSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
