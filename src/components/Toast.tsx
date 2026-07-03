import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeColors } from "../theme/colors";
import { useStyles, useTheme } from "../theme/ThemeContext";

type ToastType = "success" | "error" | "info";

type ToastEntry = {
  id: number;
  message: string;
  type: ToastType;
  opacity: Animated.Value;
  translateY: Animated.Value;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { colors: Colors } = useTheme();
  const styles = useStyles(createStyles);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const show = useCallback((message: string, type: ToastType = "info"): void => {
    const id = ++_counter;
    const opacity = new Animated.Value(0);
    const translateY = new Animated.Value(24);

    setToasts((current) => [...current, { id, message, type, opacity, translateY }]);

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 2.2s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 24, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      });
      timeouts.current.delete(id);
    }, 2200);

    timeouts.current.set(id, timer);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              t.type === "success" && styles.success,
              t.type === "error" && styles.error,
              { opacity: t.opacity, transform: [{ translateY: t.translateY }] },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {t.type === "success" ? <Ionicons name="checkmark-circle" size={16} color={Colors.success} /> : 
               t.type === "error" ? <Ionicons name="close-circle" size={16} color={Colors.errorText} /> : 
               <Ionicons name="information-circle" size={16} color={Colors.accent} />}
              <Text style={styles.toastText}>
                {t.message}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const createStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    alignItems: "center",
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    backgroundColor: "rgba(30,40,65,0.96)",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    maxWidth: 340,
  },
  success: {
    borderColor: "rgba(34,197,94,0.5)",
    backgroundColor: "rgba(15,35,25,0.97)",
  },
  error: {
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: "rgba(35,15,15,0.97)",
  },
  toastText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
