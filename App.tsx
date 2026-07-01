import "react-native-gesture-handler";
import "react-native-get-random-values";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Platform, StyleSheet, View, AppState, type AppStateStatus } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { initializeDatabase } from "./src/database/db";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "./src/components/Toast";
import { BlurView } from "expo-blur";
import * as ScreenCapture from "expo-screen-capture";
import { VKLogo } from "./src/components/VKLogo";

export default function App(): React.JSX.Element {
  const [isReady, setIsReady] = React.useState(false);
  const [isBackground, setIsBackground] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrap = async (): Promise<void> => {
      await initializeDatabase();

      if (isMounted) {
        setIsReady(true);
      }
    };

    void bootstrap();

    // Enable screen capture protection.
    // FLAG_SECURE on Android already hides the app in the recents switcher.
    // enableAppSwitcherProtectionAsync is iOS-only — calling it on Android crashes the app.
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        if (Platform.OS === "ios") {
          await ScreenCapture.enableAppSwitcherProtectionAsync(0.85);
        }
      } catch (err) {
        console.warn("Failed to enable screen protection:", err);
      }
    };
    void enableProtection();

    // Listen to AppState transitions to toggle JS-level blur overlay (Android only,
    // iOS gets native protection above).
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (Platform.OS === "android") {
        setIsBackground(nextState === "inactive" || nextState === "background");
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5B8DEF" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StatusBar style="light" />
        <AppNavigator />
        {isBackground && (
          <View style={styles.overlay}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <VKLogo />
          </View>
        )}
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1020",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(6, 11, 23, 0.4)",
  },
});
