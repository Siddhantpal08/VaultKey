import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

export type TabName = "Vault" | "Favourites" | "Generator" | "Settings";

type Tab = {
  name: TabName;
  icon: string;
  label: string;
};

const TABS: Tab[] = [
  { name: "Vault", icon: "🔐", label: "Vault" },
  { name: "Favourites", icon: "⭐", label: "Starred" },
  { name: "Generator", icon: "⚡", label: "Generate" },
  { name: "Settings", icon: "⚙", label: "Settings" },
];

type BottomTabBarProps = {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onAddPress: () => void;
};

export function BottomTabBar({ activeTab, onTabPress, onAddPress }: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.wrapper}>
      {/* Floating Add button — sits above the tab bar */}
      <Pressable style={styles.fab} onPress={onAddPress}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      <View style={styles.bar}>
        {TABS.map((tab) => {
          const isActive = tab.name === activeTab;
          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
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

const styles = StyleSheet.create({
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
    fontSize: 20,
    opacity: 0.45,
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
  fab: {
    position: "absolute",
    top: -24,
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 14,
    zIndex: 10,
  },
  fabIcon: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
  },
});
