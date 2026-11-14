import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, UrlTile, MapViewProps } from "react-native-maps";
import { config } from "@constants/config";
import { colors, spacing, typography } from "@constants/theme";

export { Marker, Polyline, PROVIDER_GOOGLE, UrlTile };

export interface SmartMapViewProps extends MapViewProps {
  useOneMapTiles?: boolean;
}

export default function SmartMapView({ useOneMapTiles, children, style, ...props }: SmartMapViewProps) {
  const hasKey = !!(
    config.googleMapsApiKey &&
    config.googleMapsApiKey !== "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
  );

  if (Platform.OS === "android" && !hasKey) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <View style={styles.fallbackContent}>
          <Text style={styles.fallbackIcon}>🗺️</Text>
          <Text style={styles.fallbackTitle}>Singapore Route Map</Text>
          <Text style={styles.fallbackSubtitle}>
            Live GPS route active · Use Start Navigation for turn-by-turn directions
          </Text>
        </View>
      </View>
    );
  }

  return (
    <MapView
      style={style}
      {...props}
      provider={hasKey ? props.provider : undefined}
    >
      {useOneMapTiles ? (
        <UrlTile
          urlTemplate="https://maps.onemap.gov.sg/maps/maptiles/3857/Default/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
        />
      ) : null}
      {children}
    </MapView>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: colors.softBeige,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  fallbackContent: {
    alignItems: "center",
    gap: 4,
  },
  fallbackIcon: {
    fontSize: 32,
  },
  fallbackTitle: {
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  fallbackSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});

