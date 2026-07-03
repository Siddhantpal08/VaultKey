import React from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator, CardStyleInterpolators } from "@react-navigation/stack";
import LockScreen from "../screens/LockScreen";
import MasterPasswordScreen from "../screens/MasterPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import AddPasswordScreen from "../screens/AddPasswordScreen";
import PasswordDetailScreen from "../screens/PasswordDetailScreen";
import GeneratorScreen from "../screens/GeneratorScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AuthenticatorScreen from "../screens/AuthenticatorScreen";
import FavouritesScreen from "../screens/FavouritesScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import NotesScreen from "../screens/NotesScreen";
import AddNoteScreen from "../screens/AddNoteScreen";
import NoteDetailScreen from "../screens/NoteDetailScreen";
import TrashScreen from "../screens/TrashScreen";
import AuditScreen from "../screens/AuditScreen";
import ImportPnbScreen from "../screens/ImportPnbScreen";
import QRScanScreen from "../screens/QRScanScreen";
import { getSetting } from "../database/db";
import { clearSessionKey } from "../security/crypto";
import { useShareIntent } from "expo-share-intent";
import * as Linking from "expo-linking";
import { useTheme } from "../theme/ThemeContext";

export type RootStackParamList = {
  Lock: undefined;
  MasterPassword: undefined;
  Home: { showPINSetup?: boolean } | undefined;
  AddPassword: { prefillUrl?: string; prefillSiteName?: string; prefillTotpSecret?: string } | undefined;
  PasswordDetail: { id: number };
  Generator: undefined;
  Settings: undefined;
  Authenticator: undefined;
  Favourites: undefined;
  ForgotPassword: undefined;
  Notes: undefined;
  AddNote: { initialTitle?: string; initialContent?: string; isFile?: boolean } | undefined;
  NoteDetail: { id: number };
  Trash: undefined;
  Audit: undefined;
  ImportPnb: { filePath: string };
  QRScan: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const backgroundAtRef = React.useRef<number | null>(null);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  React.useEffect(() => {
    if (hasShareIntent && navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route && route.name !== "Lock" && route.name !== "MasterPassword") {
        const file = shareIntent.files?.[0];
        const text = shareIntent.text ?? "";
        const sharedTitle = shareIntent.meta?.title ?? "";
        
        if (file) {
          const isPnb = (file.fileName ?? "").toLowerCase().endsWith(".pnb");
          
          if (isPnb) {
            navigationRef.navigate("ImportPnb", { filePath: file.path });
            resetShareIntent();
            return;
          }
          
          navigationRef.navigate("AddNote", { 
            initialTitle: file.fileName || "Shared File", 
            initialContent: file.path, 
            isFile: true 
          });
        } else if (isUrl(text)) {
          navigationRef.navigate("AddPassword", {
            prefillUrl: text,
            prefillSiteName: extractSiteName(text),
          });
        } else {
          navigationRef.navigate("AddNote", { 
            initialTitle: sharedTitle || "Shared Note", 
            initialContent: text, 
            isFile: false 
          });
        }
        resetShareIntent();
      }
    }
  }, [hasShareIntent, shareIntent]);

  React.useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.toLowerCase().endsWith(".pnb") || url.toLowerCase().includes(".pnb")) {
        if (navigationRef.isReady()) {
          const route = navigationRef.getCurrentRoute();
          if (route && route.name !== "Lock" && route.name !== "MasterPassword") {
            navigationRef.navigate("ImportPnb", { filePath: url });
          }
        }
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => {});

    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    const onAppStateChange = async (nextState: AppStateStatus): Promise<void> => {
      if (nextState === "background" || nextState === "inactive") {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (nextState !== "active") {
        return;
      }

      const autoLockEnabled = (await getSetting("auto_lock_background")) !== "false";
      if (!autoLockEnabled || backgroundAtRef.current === null) {
        return;
      }

      const timeoutSetting = await getSetting("lock_timeout_minutes");
      const timeoutMinutes = Number(timeoutSetting ?? "5");
      const elapsedMs = Date.now() - backgroundAtRef.current;
      const thresholdMs = Math.max(1, timeoutMinutes) * 60 * 1000;
      backgroundAtRef.current = null;

      if (elapsedMs < thresholdMs) {
        return;
      }

      if (navigationRef.isReady()) {
        const route = navigationRef.getCurrentRoute();
        if (route?.name !== "Lock") {
          clearSessionKey();
          navigationRef.reset({
            index: 0,
            routes: [{ name: "Lock" }],
          });
        }
      }
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      void onAppStateChange(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Lock"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.bg },
          cardStyleInterpolator: (Platform.OS === "android" && Number(Platform.Version) < 28)
            ? CardStyleInterpolators.forFadeFromBottomAndroid
            : CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen name="Lock" component={LockScreen} />
        <Stack.Screen name="MasterPassword" component={MasterPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Favourites" component={FavouritesScreen} />
        <Stack.Screen name="AddPassword" component={AddPasswordScreen} />
        <Stack.Screen name="PasswordDetail" component={PasswordDetailScreen} />
        <Stack.Screen name="Generator" component={GeneratorScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Authenticator" component={AuthenticatorScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
        <Stack.Screen name="AddNote" component={AddNoteScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        <Stack.Screen name="Trash" component={TrashScreen} />
        <Stack.Screen name="Audit" component={AuditScreen} />
        <Stack.Screen name="ImportPnb" component={ImportPnbScreen} />
        <Stack.Screen name="QRScan" component={QRScanScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Helpers
function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').split('.')[0] ?? hostname;
  } catch {
    return '';
  }
}
