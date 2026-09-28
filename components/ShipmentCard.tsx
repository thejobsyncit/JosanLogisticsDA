import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing, typography } from "@constants/theme";
import { StatusBadge } from "./StatusBadge";
import type { Trip } from "@/types/trip";
import { formatDistanceKm, formatTime, formatWeightKg } from "@utils/format";

interface ShipmentCardProps {
  trip: Trip;
  onViewDetails: () => void;
  onNavigate: () => void;
}

/** Featured "active shipment" card — premium redesign matching Singapore logistics standards. */
export function ShipmentCard({ trip, onViewDetails, onNavigate }: ShipmentCardProps) {
  const pickupAddress = trip.pickup.line1
    ? `${trip.pickup.line1}${trip.pickup.postalCode ? `, Singapore ${trip.pickup.postalCode}` : ""}`
    : "Singapore Central Hub";

  const deliveryAddress = trip.delivery.line1
    ? `${trip.delivery.line1}${trip.delivery.postalCode ? `, Singapore ${trip.delivery.postalCode}` : ""}`
    : "Singapore Logistics Terminal";

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View style={styles.boxIconCircle}>
            <Ionicons name="cube" size={20} color={colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Active Shipment</Text>
        </View>
        <StatusBadge status={trip.status} />
      </View>

      {/* Shipment Reference Code */}
      <Text style={styles.reference}>{trip.reference}</Text>

      {/* Main Body: Route + Metrics Grid */}
      <View style={styles.bodyGrid}>
        {/* Left Column: Route Visualizer */}
        <View style={styles.routeCol}>
          {/* Pickup Point */}
          <View style={styles.addressRow}>
            <View style={[styles.pinCircle, { backgroundColor: "rgba(201, 106, 50, 0.15)" }]}>
              <Ionicons name="location" size={16} color={colors.primary} />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {pickupAddress}
            </Text>
          </View>

          {/* Route Connecting Line */}
          <View style={styles.connectorLineWrap}>
            <View style={styles.verticalLine} />
          </View>

          {/* Delivery Point */}
          <View style={styles.addressRow}>
            <View style={[styles.pinCircle, { backgroundColor: "rgba(212, 175, 90, 0.25)" }]}>
              <Ionicons name="location" size={16} color="#B48B28" />
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {deliveryAddress}
            </Text>
          </View>
        </View>

        {/* Vertical Divider */}
        <View style={styles.dividerLine} />

        {/* Right Column: Key Metrics */}
        <View style={styles.metricsCol}>
          {/* Metric 1: Weight */}
          <View style={styles.metricItem}>
            <View style={styles.metricIconCircle}>
              <Ionicons name="scale-outline" size={16} color="#B48B28" />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricValue}>{formatWeightKg(trip.shipment.weightKg)}</Text>
            </View>
          </View>

          {/* Metric 2: Distance */}
          <View style={styles.metricItem}>
            <View style={styles.metricIconCircle}>
              <Ionicons name="map-outline" size={16} color="#B48B28" />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{formatDistanceKm(trip.distanceKm)}</Text>
            </View>
          </View>

          {/* Metric 3: ETA */}
          <View style={styles.metricItem}>
            <View style={styles.metricIconCircle}>
              <Ionicons name="time-outline" size={16} color="#B48B28" />
            </View>
            <View style={styles.metricTextWrap}>
              <Text style={styles.metricLabel}>ETA</Text>
              <Text style={styles.metricValue}>{formatTime(trip.estimatedArrival)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={onViewDetails}
          accessibilityRole="button"
          accessibilityLabel="View Details"
          style={({ pressed }) => [styles.viewBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="map-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.viewBtnText}>View Details</Text>
        </Pressable>

        <Pressable
          onPress={onNavigate}
          accessibilityRole="button"
          accessibilityLabel="Navigate"
          style={({ pressed }) => [styles.navigateBtn, pressed && styles.btnPressed]}
        >
          <Ionicons name="navigate" size={18} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.navigateBtnText}>Navigate</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.2,
    borderColor: "rgba(212, 175, 90, 0.35)",
    gap: spacing.md - 2,
    ...shadow.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  boxIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(201, 106, 50, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.darkCharcoal,
  },
  reference: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.darkCharcoal,
    letterSpacing: 0.3,
    marginTop: -2,
  },
  bodyGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  routeCol: {
    flex: 1.3,
    gap: 6,
    paddingRight: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  pinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkCharcoal,
    lineHeight: 18,
  },
  connectorLineWrap: {
    paddingLeft: 12,
    marginVertical: 1,
  },
  verticalLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.borderGold,
    borderRadius: 1,
  },
  dividerLine: {
    width: 1,
    height: "90%",
    backgroundColor: "rgba(212, 175, 90, 0.3)",
    marginHorizontal: 10,
  },
  metricsCol: {
    flex: 1,
    gap: 10,
    paddingLeft: 4,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(212, 175, 90, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricTextWrap: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.darkCharcoal,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm + 4,
    marginTop: 4,
  },
  viewBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFDF8",
    borderWidth: 1.5,
    borderColor: "#D4AF5A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    fontSize: typography.button.fontSize,
    fontWeight: "700",
    color: colors.primary,
  },
  navigateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  navigateBtnText: {
    fontSize: typography.button.fontSize,
    fontWeight: "700",
    color: colors.white,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

export default ShipmentCard;
