import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StackScreenProps } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { upsertSetting } from "../database/db";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";

type OnboardingScreenProps = StackScreenProps<RootStackParamList, "Onboarding">;

type Slide = {
  id: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  body: string;
  bullets?: string[];
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    icon: "shield-checkmark",
    iconColor: "#5B8DEF",
    iconBg: "rgba(91,141,239,0.15)",
    title: "Welcome to VaultKey",
    subtitle: "Your offline, zero-trust password manager",
    body: "VaultKey stores everything locally on your device. No servers, no cloud, no accounts. Your data never leaves your phone.",
    bullets: [
      "100% offline — works without internet",
      "Open-source & auditable",
      "AES-256-GCM encryption",
    ],
  },
  {
    id: "master",
    icon: "key",
    iconColor: "#F59E0B",
    iconBg: "rgba(245,158,11,0.15)",
    title: "Master Password",
    subtitle: "The key to your entire vault",
    body: "Your master password is used to derive your encryption key using PBKDF2. It is never stored — only you know it.",
    bullets: [
      "Use 12+ chars with mixed case, numbers & symbols",
      "There is NO password reset — remember it",
      "Write it down and store it somewhere safe",
    ],
  },
  {
    id: "vault",
    icon: "layers",
    iconColor: "#22C55E",
    iconBg: "rgba(34,197,94,0.15)",
    title: "What Can You Store?",
    subtitle: "Passwords, notes and 2FA in one place",
    body: "Everything is encrypted with your session key before touching storage. Even if someone copies your phone files, they can't read anything.",
    bullets: [
      "Password entries with TOTP / 2FA codes",
      "Encrypted secure notes",
      "Favourites, categories & security audit",
    ],
  },
  {
    id: "backup",
    icon: "cloud-upload",
    iconColor: "#8B5CF6",
    iconBg: "rgba(139,92,246,0.15)",
    title: "Backups Are Critical",
    subtitle: "Protect against uninstalls & phone loss",
    body: "Because VaultKey has no cloud sync, you MUST enable auto-backup. Uninstalling the app without a backup means permanent data loss.",
    bullets: [
      "Auto-backup saves an encrypted .pnb file",
      "The backup requires your master password to import",
      "Enable it right after setting your password",
    ],
  },
  {
    id: "security",
    icon: "finger-print",
    iconColor: "#EF4444",
    iconBg: "rgba(239,68,68,0.15)",
    title: "Lock & Security",
    subtitle: "Biometric, PIN & auto-lock",
    body: "VaultKey auto-locks when you put the app in the background. Unlock instantly with biometrics or a 4-digit PIN — no need to retype your master password.",
    bullets: [
      "Set a PIN in Settings → Security",
      "Biometric unlock (fingerprint / face ID)",
      "Configurable auto-lock timeout",
    ],
  },
  {
    id: "ready",
    icon: "rocket",
    iconColor: "#5B8DEF",
    iconBg: "rgba(91,141,239,0.15)",
    title: "You're All Set!",
    subtitle: "Let's secure your digital life",
    body: "Set your master password to create your vault. Remember: write it down. No password = no access. That's the point.",
    bullets: [],
  },
];

export default function OnboardingScreen({ navigation }: OnboardingScreenProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const finish = async () => {
    await upsertSetting("onboarding_completed", "true");
    navigation.replace("MasterPassword");
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Skip button */}
      {!isLast && (
        <Pressable style={styles.skipBtn} onPress={() => void finish()}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Slide list */}
      <Animated.FlatList
        ref={flatListRef as any}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        renderItem={({ item }) => (
          <ScrollView style={{ flex: 1, width }} contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            {/* Icon hero */}
            <View style={[styles.iconHero, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={52} color={item.iconColor} />
            </View>

            {/* Badge */}
            <View style={[styles.badge, { backgroundColor: item.iconBg }]}>
              <Text style={[styles.badgeText, { color: item.iconColor }]}>
                {currentIndex + 1} of {SLIDES.length}
              </Text>
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>

            {item.bullets && item.bullets.length > 0 && (
              <View style={styles.bulletList}>
                {item.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={16} color={item.iconColor} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { opacity, width: dotWidth }]}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        {isLast ? (
          <Pressable style={styles.primaryBtn} onPress={() => void finish()}>
            <Ionicons name="shield-checkmark" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Create My Vault</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryBtn} onPress={goNext}>
            <Text style={styles.primaryBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: Colors.bg,
    },
    skipBtn: {
      position: "absolute",
      top: 56,
      right: 20,
      zIndex: 10,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    skipText: {
      color: Colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    slide: {
      flexGrow: 1,
      paddingHorizontal: 28,
      paddingTop: 60,
      paddingBottom: 120, // Add bottom padding to account for the absolute footer
      alignItems: "center",
    },
    iconHero: {
      width: 110,
      height: 110,
      borderRadius: 30,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },
    badge: {
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 4,
      marginBottom: 20,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    slideTitle: {
      color: Colors.textPrimary,
      fontSize: 26,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    slideSubtitle: {
      color: Colors.accent,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 16,
    },
    slideBody: {
      color: Colors.textSecondary,
      fontSize: 15,
      textAlign: "center",
      lineHeight: 23,
      marginBottom: 24,
    },
    bulletList: {
      width: "100%",
      gap: 10,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: Colors.bgCard,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    bulletIcon: {
      marginTop: 1,
    },
    bulletText: {
      flex: 1,
      color: Colors.textPrimary,
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 20,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 24,
      paddingTop: 16,
      gap: 20,
      alignItems: "center",
    },
    dots: {
      flexDirection: "row",
      gap: 6,
      alignItems: "center",
    },
    dot: {
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.accent,
    },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: Colors.accent,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      width: "100%",
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 12,
    },
    primaryBtnText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "700",
    },
  });
