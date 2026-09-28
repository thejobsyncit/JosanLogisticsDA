import React, { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useTrips";
import { useDutyStatusToggle } from "@/hooks/useDriverProfile";
import { DriverStatus } from "@/components/DriverStatus";
import { ShipmentCard } from "@/components/ShipmentCard";
import { TripCard } from "@/components/TripCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { initialsFromName } from "@utils/format";
import { SingaporeHeaderGraphic } from "@/components/dashboard/SingaporeHeaderGraphic";
import { JosanLogo } from "@/components/dashboard/JosanLogo";
import { StatTile } from "@/components/dashboard/StatTile";

/**
 * Dashboard — premium driver greeting + duty status, active shipment,
 * daily performance statistics grid, and today's trips preview.
 */
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const { data, isLoading, error, refresh } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const { status, loading: statusLoading, toggle } = useDutyStatusToggle(driver?.dutyStatus ?? "offline", () => {});

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (isLoading && !data) return <LoadingState message="Loading your dashboard…" />;
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />;

  const activeTrip = data?.activeTrip ?? null;
  const todayTrips = data?.todayTrips ?? [];
  const driverFirstName = driver?.name?.split(" ")[0] ?? "Tan";
  const driverInitials = initialsFromName(driver?.name ?? "Tan Wei");

  return (
    <View style={styles.flex}>
      {/* Subtle Vector Background Graphic for Header */}
      <SingaporeHeaderGraphic height={210} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header Bar */}
        <View style={styles.topBrandRow}>
          <JosanLogo size={28} />
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel="Driver Profile"
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <Text style={styles.avatarText}>{driverInitials}</Text>
          </Pressable>
        </View>

        {/* Greeting Banner */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>Good day, {driverFirstName}</Text>
          <Text style={styles.subGreeting}>Here's what's on your route today.</Text>
        </View>

        {/* Driver Status Card */}
        <DriverStatus status={status} onToggle={toggle} loading={statusLoading} />

        {/* Active Shipment Card */}
        {activeTrip ? (
          <ShipmentCard
            trip={activeTrip}
            onViewDetails={() => router.push({ pathname: "/shipment/[id]", params: { id: activeTrip.id } })}
            onNavigate={() => router.push({ pathname: "/tracking/[id]", params: { id: activeTrip.id } })}
          />
        ) : (
          <EmptyState icon="cube-outline" title="No active shipment" description="You're all caught up — new trips will show up here." />
        )}

        {/* Daily Performance 2x2 Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Daily Performance</Text>
          <View style={styles.statsGrid}>
            <StatTile
              label="Pending Pickups"
              value={data?.pendingPickups ?? 0}
              iconName="cube"
              iconBg="rgba(201, 106, 50, 0.15)"
              iconColor="#C96A32"
              tileBg="#FFF8F0"
              borderColor="#FCE8D5"
              onPress={() => router.push("/(tabs)/trips")}
            />

            <StatTile
              label="Pending Deliveries"
              value={data?.pendingDeliveries ?? 0}
              iconName="bus"
              iconBg="rgba(212, 175, 90, 0.2)"
              iconColor="#B48B28"
              tileBg="#FFFDF0"
              borderColor="#F9F1D8"
              onPress={() => router.push("/(tabs)/trips")}
            />

            <StatTile
              label="Completed Today"
              value={data?.completedDeliveries ?? 0}
              iconName="checkmark-circle"
              iconBg="rgba(22, 163, 74, 0.15)"
              iconColor="#16A34A"
              tileBg="#F0FDF4"
              borderColor="#DCFCE7"
              onPress={() => router.push("/(tabs)/trips")}
            />

            <StatTile
              label="Distance Today"
              value={`${(data?.distanceTodayKm ?? 0).toFixed(1)} km`}
              iconName="map"
              iconBg="rgba(212, 175, 90, 0.2)"
              iconColor="#B48B28"
              tileBg="#FAF5EC"
              borderColor="#F3E8D7"
              onPress={() => router.push("/(tabs)/trips")}
            />
          </View>
        </View>

        {/* Today's Trips Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Trips</Text>
          <Pressable onPress={() => router.push("/(tabs)/trips")} hitSlop={8}>
            <Text style={styles.sectionLink}>View All</Text>
          </Pressable>
        </View>

        {todayTrips.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No trips scheduled" description="Check back later for new assignments." />
        ) : (
          <View style={styles.tripList}>
            {todayTrips.slice(0, 4).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md + 2,
    paddingBottom: spacing.xxl,
    gap: spacing.md + 2,
  },
  topBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D4AF5A",
    borderWidth: 2,
    borderColor: "#E8D39A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.darkCharcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarPressed: {
    opacity: 0.8,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
  greetingSection: {
    gap: 2,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.darkCharcoal,
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  statsSection: {
    gap: 10,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkCharcoal,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  tripList: {
    gap: spacing.sm + 4,
  },
});
