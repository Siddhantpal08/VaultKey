import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../theme/colors";

type StrengthMeterProps = {
  score: number; // 0–5
  showLabel?: boolean;
};

const LABELS = ["None", "Weak", "Fair", "Good", "Strong", "Very Strong"];

export function StrengthMeter({ score, showLabel = true }: StrengthMeterProps): React.JSX.Element {
  return (
    <View>
      <View style={styles.bars}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor:
                  index < score
                    ? Colors.strength[Math.min(score - 1, 4)]
                    : Colors.strengthDim,
              },
            ]}
          />
        ))}
      </View>
      {showLabel ? (
        <Text
          style={[
            styles.label,
            {
              color:
                score > 0
                  ? Colors.strength[Math.min(score - 1, 4)]
                  : Colors.textMuted,
            },
          ]}
        >
          {LABELS[score] ?? "None"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
});
