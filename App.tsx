import React from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { initializeDatabase } from "./src/database/db";

export default function App(): React.JSX.Element {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrap = async (): Promise<void> => {
      await initializeDatabase();

      if (isMounted) {
        setIsReady(true);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0B1020",
  },
});
