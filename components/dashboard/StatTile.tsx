import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@constants/theme";

interface StatTileProps {
  label: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  tileBg: string;
  borderColor: string;
  onPress?: () => void;
}

export function StatTile({
  label,
  value,
  iconName,
  iconBg,
  iconColor,
  tileBg,
  borderColor,
  onPress,
}: StatTileProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: tileBg, borderColor },
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>

      <View style={styles.valueWrap}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    gap: 10,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  valueWrap: {
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.darkCharcoal,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
});

export default StatTile;
