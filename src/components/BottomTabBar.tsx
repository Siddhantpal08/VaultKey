import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";

export type TabName = "Vault" | "Notes" | "Generator" | "Auth";

type Tab = {
  name: TabName;
  icon: string;
  label: string;
};

const TABS: Tab[] = [
  { name: "Vault", icon: "shield-checkmark", label: "Vault" },
  { name: "Notes", icon: "document-text", label: "Notes" },
  { name: "Generator", icon: "flash", label: "Generate" },
  { name: "Auth", icon: "timer-outline", label: "Auth" },
];

type BottomTabBarProps = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
};

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.slice(0, 2).map((tab) => {
          const isActive = tab.name === activeTab;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? Colors.tabActive : Colors.tabInactive}
                  style={[styles.tabIcon, isActive && styles.tabIconActive]}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
        {TABS.slice(2, 4).map((tab) => {
          const isActive = tab.name === activeTab;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={isActive ? Colors.tabActive : Colors.tabInactive}
                  style={[styles.tabIcon, isActive && styles.tabIconActive]}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
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
    gap: 3,
  },
  iconWrap: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: Colors.accentBg,
  },
  tabIcon: {
    opacity: 0.8,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.tabInactive,
  },
  tabLabelActive: {
    color: Colors.tabActive,
  },
});
