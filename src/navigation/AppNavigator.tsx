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
import { getSetting } from "../database/db";
import { clearSessionKey } from "../security/crypto";

export type RootStackParamList = {
  Lock: undefined;
  MasterPassword: undefined;
  Home: undefined;
  AddPassword: undefined;
  PasswordDetail: { id: number };
  Generator: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function AppNavigator(): React.JSX.Element {
  const backgroundAtRef = React.useRef<number | null>(null);

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
          cardStyle: { backgroundColor: "#0B1020" },
        }}
      >
        <Stack.Screen name="Lock" component={LockScreen} />
        <Stack.Screen name="MasterPassword" component={MasterPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AddPassword" component={AddPasswordScreen} />
        <Stack.Screen name="PasswordDetail" component={PasswordDetailScreen} />
        <Stack.Screen name="Generator" component={GeneratorScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
