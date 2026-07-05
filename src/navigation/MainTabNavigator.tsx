import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "../components/BottomTabBar";
import { useTheme } from "../theme/ThemeContext";

import HomeScreen from "../screens/HomeScreen";
import NotesScreen from "../screens/NotesScreen";
import GeneratorScreen from "../screens/GeneratorScreen";
import AuthenticatorScreen from "../screens/AuthenticatorScreen";

export type MainTabParamList = {
  Home: { showPINSetup?: boolean } | undefined;
  Notes: undefined;
  Generator: undefined;
  Authenticator: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator(): React.JSX.Element {
  const { colors: Colors } = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.bg },
      }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Generator" component={GeneratorScreen} />
      <Tab.Screen name="Authenticator" component={AuthenticatorScreen} />
    </Tab.Navigator>
  );
}
