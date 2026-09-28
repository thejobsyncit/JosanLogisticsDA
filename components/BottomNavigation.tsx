import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing, typography } from "@constants/theme";

const ICONS: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  dashboard: { focused: "home", unfocused: "home-outline" },
  trips: { focused: "list", unfocused: "list-outline" },
  notifications: { focused: "notifications", unfocused: "notifications-outline" },
  profile: { focused: "person", unfocused: "person-outline" },
};

const LABELS: Record<string, string> = {
  dashboard: "Home",
  trips: "Trips",
  notifications: "Alerts",
  profile: "Profile",
};

export interface BottomNavigationProps {
  state: any;
  descriptors?: any;
  navigation: any;
}

/**
 * Custom bottom tab navigation bar — redesigned for Josan Logistics Driver App.
 */
export function BottomNavigation({ state, navigation }: BottomNavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const iconConfig = ICONS[route.name] ?? { focused: "ellipse", unfocused: "ellipse-outline" };
        const iconName = isFocused ? iconConfig.focused : iconConfig.unfocused;
        const label = LABELS[route.name] ?? route.name;
        const color = isFocused ? colors.primary : colors.textMuted;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            style={({ pressed }) => [styles.item, pressed && styles.pressedItem]}
            hitSlop={8}
          >
            {isFocused && <View style={styles.activeIndicator} />}
            <Ionicons name={iconName} size={22} color={color} style={styles.icon} />
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? colors.darkCharcoal : colors.textMuted,
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    borderTopWidth: 1.2,
    borderTopColor: "rgba(212, 175, 90, 0.3)",
    paddingTop: 8,
    shadowColor: colors.darkCharcoal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minWidth: 64,
    paddingVertical: 4,
    position: "relative",
  },
  pressedItem: {
    opacity: 0.8,
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 28,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  icon: {
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});

export default BottomNavigation;
