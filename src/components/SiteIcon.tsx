import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { siteColor } from "../theme/colors";

type SiteIconProps = {
  siteName: string;
  size?: number;
  fontSize?: number;
};

/** Letter-avatar component with deterministic color from site name. */
export function SiteIcon({ siteName, size = 44, fontSize = 18 }: SiteIconProps): React.JSX.Element {
  const letter = siteName.trim().charAt(0).toUpperCase() || "?";
  const bg = siteColor(siteName);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg + "33", // ~20% opacity fill
          borderColor: bg + "80",     // ~50% opacity border
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize, color: bg }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  letter: {
    fontWeight: "700",
    textAlign: "center",
  },
});
