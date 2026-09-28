import * as Location from "expo-location";
import { supabase } from "./supabase";
import { appStorage } from "./storage";
import { STORAGE_KEYS } from "@constants/config";
import type { GeoPoint, RouteEstimate, TrackedLocation } from "@/types/location";
import type { Driver } from "@/types/driver";
import { distanceBetweenKm } from "@/utils/format";

export type PermissionState = "granted" | "denied" | "undetermined";

export async function requestForegroundPermission(): Promise<PermissionState> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status as PermissionState;
}

export async function getForegroundPermissionStatus(): Promise<PermissionState> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status as PermissionState;
}

export async function getCurrentLocation(): Promise<TrackedLocation> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    heading: position.coords.heading,
    speedKph: position.coords.speed != null ? position.coords.speed * 3.6 : null,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
}

/**
 * Subscribes to live location updates (e.g. for the Live Tracking screen).
 * Returns an unsubscribe function — always call it on unmount.
 */
export async function watchLocation(
  onUpdate: (location: TrackedLocation) => void,
  intervalMs = 5000
): Promise<() => void> {
  const subscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: intervalMs, distanceInterval: 15 },
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading,
        speedKph: position.coords.speed != null ? position.coords.speed * 3.6 : null,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    }
  );
  return () => subscription.remove();
}

/**
 * Reports the driver's current position to Supabase driver_locations table.
 * Trigger `trigger_update_driver_location` automatically updates current_latitude/longitude on `drivers` table.
 */
export async function reportLocation(tripId: string, location: TrackedLocation): Promise<void> {
  try {
    const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
    const driverId = cachedDriver?.id || "DRV-101";

    await supabase.from("driver_locations").insert({
      driver_id: driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 5.0,
      recorded_at: new Date(location.timestamp || Date.now()).toISOString(),
    });

    // Also update shipment's current coordinates if tripId is provided
    if (tripId) {
      await supabase
        .from("shipments")
        .update({
          coordinates: {
            origin: [1.3521, 103.8200],
            current: [location.latitude, location.longitude],
            destination: [1.3412, 103.7712],
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", tripId);
    }
  } catch (error) {
    console.warn("[location] failed to report location to Supabase", error);
  }
}

export async function estimateRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteEstimate> {
  const distanceKm = distanceBetweenKm(origin, destination);
  const assumedAvgSpeedKph = 35;
  return { distanceKm, durationMinutes: (distanceKm / assumedAvgSpeedKph) * 60 };
}
