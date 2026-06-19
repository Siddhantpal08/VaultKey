import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

/** Inline VK logo using pure RN primitives — no external image needed. */
export function VKLogo(): React.JSX.Element {
  return (
    <View style={logo.outer}>
      <View style={logo.ring} />
      <View style={logo.inner}>
        <Text style={logo.vk}>VK</Text>
        {/* small key-bit accent bar below */}
        <View style={logo.keyBar} />
      </View>
    </View>
  );
}

const logo = StyleSheet.create({
  outer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 2,
    borderColor: "rgba(91,141,239,0.25)",
  },
  inner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91,141,239,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(91,141,239,0.45)",
    gap: 2,
  },
  vk: {
    color: Colors.accent,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 2,
    lineHeight: 30,
  },
  keyBar: {
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.accentBright,
    opacity: 0.7,
  },
});
