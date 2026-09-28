import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "@constants/theme";
import type { DutyStatus } from "@/types/driver";

interface DriverStatusProps {
  status: DutyStatus;
  onToggle: () => void;
  loading?: boolean;
}

/** Duty-status card on the Dashboard — driver goes online/offline from here. */
export function DriverStatus({ status, onToggle, loading }: DriverStatusProps) {
  const isOnline = status === "online";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statusCol}>
          <Text style={styles.label}>YOUR STATUS</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.dot, { backgroundColor: isOnline ? colors.success : colors.textSecondary }]} />
            <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.textSecondary }]}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.iconCircle}>
            <Ionicons name="bus-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>Stay connected, keep moving!</Text>
        </View>
      </View>

      <Pressable
        onPress={onToggle}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={isOnline ? "Go Offline" : "Go Online"}
        style={({ pressed }) => [
          styles.button,
          isOnline ? styles.offlineButton : styles.onlineButton,
          pressed && !loading && styles.buttonPressed,
          loading && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons name="bus" size={18} color={colors.white} style={styles.btnIconLeft} />
            <Text style={styles.buttonText}>{isOnline ? "Go Offline" : "Go Online"}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} style={styles.btnIconRight} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFDF8",
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1.2,
    borderColor: "#E8D39A",
    gap: spacing.md - 2,
    ...shadow.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusCol: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "50%",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212, 175, 90, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 90, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
    lineHeight: 14,
    flexShrink: 1,
  },
  button: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    width: "100%",
  },
  onlineButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  offlineButton: {
    backgroundColor: "#A94F22",
    shadowColor: "#A94F22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  btnIconLeft: {
    marginRight: 8,
  },
  btnIconRight: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: typography.button.fontSize,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 0.3,
  },
});

export default DriverStatus;
