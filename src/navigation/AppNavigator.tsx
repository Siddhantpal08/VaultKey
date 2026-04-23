import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StyleSheet, Text, View } from "react-native";
import LockScreen from "../screens/LockScreen";

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

type PlaceholderScreenProps = {
  title: string;
};

function PlaceholderScreen({ title }: PlaceholderScreenProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Screen implementation pending</Text>
    </View>
  );
}

function MasterPasswordScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Master Password Screen" />;
}

function HomeScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Home Screen" />;
}

function AddPasswordScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Add Password Screen" />;
}

function PasswordDetailScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Password Detail Screen" />;
}

function GeneratorScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Generator Screen" />;
}

function SettingsScreen(): React.JSX.Element {
  return <PlaceholderScreen title="Settings Screen" />;
}

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1020",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#B5C0D0",
    textAlign: "center",
  },
});
