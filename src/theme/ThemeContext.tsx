import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName, StyleSheet } from "react-native";
import { darkColors, lightColors, ThemeColors } from "./colors";
import { getSetting, upsertSetting } from "../database/db";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextType = {
  colors: ThemeColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: darkColors,
  isDark: true,
  preference: "system",
  setPreference: async () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [preference, setPrefState] = useState<ThemePreference>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const load = async () => {
      const saved = await getSetting("theme_preference");
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPrefState(saved);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const isDark =
    preference === "dark" || (preference === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  const setPreference = async (pref: ThemePreference) => {
    setPrefState(pref);
    await upsertSetting("theme_preference", pref);
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  createStyles: (colors: ThemeColors) => T
): T {
  const { colors } = useTheme();
  return React.useMemo(() => StyleSheet.create(createStyles(colors)), [colors]);
}
