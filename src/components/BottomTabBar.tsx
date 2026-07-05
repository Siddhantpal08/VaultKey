import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export type TabName = "Home" | "Notes" | "Generator" | "Authenticator";

type TabDefinition = {
  name: TabName;
  icon: string;
  label: string;
};

const TABS: TabDefinition[] = [
  { name: "Home", icon: "shield-checkmark", label: "Vault" },
  { name: "Notes", icon: "document-text", label: "Notes" },
  { name: "Generator", icon: "flash", label: "Generate" },
  { name: "Authenticator", icon: "timer-outline", label: "Auth" },
];

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.map((tabInfo, index) => {
          // Find the route in the navigator state that matches our expected tab name
          const routeIndex = state.routes.findIndex(r => r.name === tabInfo.name);
          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={tabInfo.name}
              style={styles.tabItem}
              onPress={onPress}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={tabInfo.icon as any}
                  size={20}
                  color={isFocused ? Colors.tabActive : Colors.tabInactive}
                  style={[styles.tabIcon, isFocused && styles.tabIconActive]}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tabInfo.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    position: "relative",
    paddingBottom: 0,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: Colors.tabBg,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBorder,
    paddingBottom: 24, // safe area
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    // No background, just clean icon
  },
  tabIcon: {
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4, // Android glow
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.tabInactive,
  },
  tabLabelActive: {
    color: Colors.tabActive,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
