import React from "react";
import { AppState, type AppStateStatus } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LockScreen from "../screens/LockScreen";
import MasterPasswordScreen from "../screens/MasterPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import AddPasswordScreen from "../screens/AddPasswordScreen";
import PasswordDetailScreen from "../screens/PasswordDetailScreen";
import GeneratorScreen from "../screens/GeneratorScreen";
import SettingsScreen from "../screens/SettingsScreen";
import FavouritesScreen from "../screens/FavouritesScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import NotesScreen from "../screens/NotesScreen";
import AddNoteScreen from "../screens/AddNoteScreen";
import NoteDetailScreen from "../screens/NoteDetailScreen";
import TrashScreen from "../screens/TrashScreen";
import AuditScreen from "../screens/AuditScreen";
import { getSetting } from "../database/db";
import { clearSessionKey } from "../security/crypto";
import { useShareIntent } from "expo-share-intent";

export type RootStackParamList = {
  Lock: undefined;
  MasterPassword: undefined;
  Home: { showPINSetup?: boolean } | undefined;
  AddPassword: undefined;
  PasswordDetail: { id: number };
  Generator: undefined;
  Settings: undefined;
  Favourites: undefined;
  ForgotPassword: undefined;
  Notes: undefined;
  AddNote: { initialTitle?: string; initialContent?: string; isFile?: boolean } | undefined;
  NoteDetail: { id: number };
  Trash: undefined;
  Audit: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  const backgroundAtRef = React.useRef<number | null>(null);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  React.useEffect(() => {
    if (hasShareIntent && navigationRef.isReady()) {
      const route = navigationRef.getCurrentRoute();
      if (route && route.name !== "Lock" && route.name !== "MasterPassword") {
        let initialTitle = shareIntent.meta?.title || "Shared Content";
        let initialContent = shareIntent.text || "";
        let isFile = false;
        
        if (shareIntent.files && shareIntent.files.length > 0) {
          initialContent = shareIntent.files[0].path;
          initialTitle = shareIntent.files[0].fileName || initialTitle;
          isFile = true;
        }
        
        navigationRef.navigate("AddNote", { initialTitle, initialContent, isFile });
        resetShareIntent();
      }
    }
  }, [hasShareIntent, shareIntent]);

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
          cardStyle: { backgroundColor: "#060B17" },
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              opacity: current.progress,
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width * 0.2, 0],
                  }),
                },
              ],
            },
          }),
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
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Notes" component={NotesScreen} />
        <Stack.Screen name="AddNote" component={AddNoteScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        <Stack.Screen name="Trash" component={TrashScreen} />
        <Stack.Screen name="Audit" component={AuditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
