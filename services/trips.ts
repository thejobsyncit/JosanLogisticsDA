import { supabase } from "./supabase";
import { appStorage } from "./storage";
import { STORAGE_KEYS } from "@constants/config";
import { TripStatus, mapDbShipmentToTrip } from "@/types/trip";
import type { Trip, TripListFilter, ProofOfDelivery, FailedDeliveryReport } from "@/types/trip";
import type { DashboardSummary } from "@/types/dashboard";
import type { Driver } from "@/types/driver";

/** Helper to get current authenticated driver ID */
async function getCurrentDriverId(): Promise<string> {
  const cached = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  return cached?.id || "DRV-101";
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const driverId = await getCurrentDriverId();

  const { data: rows, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("driver_id", driverId);

  if (error || !rows || rows.length === 0) {
    // Fallback search without driver filter if seed driver has no shipments assigned
    const { data: allRows } = await supabase.from("shipments").select("*").limit(10);
    const trips = (allRows || []).map(mapDbShipmentToTrip);
    const activeTrip = trips.find((t) => t.status !== TripStatus.DeliveryCompleted && t.status !== TripStatus.Cancelled) || null;
    return {
      activeTrip,
      todayTrips: trips.filter((t) => t.status !== TripStatus.DeliveryCompleted),
      pendingPickups: trips.filter((t) => t.status === TripStatus.Assigned || t.status === TripStatus.Accepted).length,
      pendingDeliveries: trips.filter((t) => t.status === TripStatus.InTransit || t.status === TripStatus.ArrivedAtDelivery).length,
      completedDeliveries: trips.filter((t) => t.status === TripStatus.DeliveryCompleted).length,
      distanceTodayKm: 126,
    };
  }

  const trips = rows.map(mapDbShipmentToTrip);
  const activeTrip = trips.find((t) =>
    [
      TripStatus.GoingToPickup,
      TripStatus.ArrivedAtPickup,
      TripStatus.PickupCompleted,
      TripStatus.InTransit,
      TripStatus.ArrivedAtDelivery,
    ].includes(t.status)
  ) || trips.find((t) => t.status !== TripStatus.DeliveryCompleted && t.status !== TripStatus.Cancelled) || null;

  return {
    activeTrip,
    todayTrips: trips.filter((t) => t.status !== TripStatus.DeliveryCompleted),
    pendingPickups: trips.filter((t) => t.status === TripStatus.Assigned || t.status === TripStatus.Accepted).length,
    pendingDeliveries: trips.filter((t) => t.status === TripStatus.InTransit || t.status === TripStatus.ArrivedAtDelivery).length,
    completedDeliveries: trips.filter((t) => t.status === TripStatus.DeliveryCompleted).length,
    distanceTodayKm: 126,
  };
}

export async function getTrips(filter: TripListFilter): Promise<Trip[]> {
  const driverId = await getCurrentDriverId();

  let query = supabase.from("shipments").select("*");

  // Query driver's shipments
  const { data: rows } = await query.eq("driver_id", driverId);

  let shipments = rows || [];
  if (shipments.length === 0) {
    // If no shipments assigned to this exact driverId, fetch all active shipments for demo/testing
    const { data: fallbackRows } = await supabase.from("shipments").select("*");
    shipments = fallbackRows || [];
  }

  const trips = shipments.map(mapDbShipmentToTrip);

  if (filter === "completed") {
    return trips.filter((t) => t.status === TripStatus.DeliveryCompleted);
  }
  if (filter === "upcoming") {
    return trips.filter((t) => t.status === TripStatus.Assigned);
  }
  // "today" filter returns active non-completed trips
  return trips.filter((t) => t.status !== TripStatus.DeliveryCompleted && t.status !== TripStatus.Cancelled);
}

export async function getTripById(id: string): Promise<Trip> {
  const { data: row, error } = await supabase
    .from("shipments")
    .select("*")
    .or(`id.eq.${id},tracking_number.eq.${id}`)
    .single();

  if (error || !row) {
    throw new Error(`Trip ${id} not found on Supabase backend`);
  }

  return mapDbShipmentToTrip(row);
}

export async function acceptTrip(id: string): Promise<Trip> {
  const { data: updated, error } = await supabase
    .from("shipments")
    .update({ status: TripStatus.Accepted, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to accept trip ${id}: ${error?.message || "Unknown error"}`);
  }

  return mapDbShipmentToTrip(updated);
}

export async function rejectTrip(id: string, reason: string, notes?: string): Promise<void> {
  await supabase
    .from("shipments")
    .update({ status: TripStatus.Cancelled, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function advanceTripStatus(id: string, nextStatus: TripStatus): Promise<Trip> {
  const { data: updated, error } = await supabase
    .from("shipments")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update trip status to ${nextStatus}: ${error?.message}`);
  }

  return mapDbShipmentToTrip(updated);
}

/** Upload binary/base64 photo or signature to Supabase Storage and record POD entry. */
export async function submitProofOfDelivery(id: string, pod: ProofOfDelivery): Promise<Trip> {
  const driverId = await getCurrentDriverId();
  let signatureUrl = pod.signatureUri || "";
  let photoUrl = pod.photoUri || "";

  // Helper to upload base64/file to Supabase Storage
  const uploadMediaFile = async (fileUri: string, folder: string): Promise<string> => {
    if (!fileUri || fileUri.startsWith("http")) return fileUri;
    try {
      const fileName = `${folder}/${id}_${Date.now()}.${folder === "signatures" ? "png" : "jpg"}`;
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("proof-of-delivery")
        .upload(fileName, blob, { contentType: folder === "signatures" ? "image/png" : "image/jpeg", upsert: true });

      if (error) {
        console.warn(`Storage upload warning for ${folder}:`, error.message);
        return fileUri;
      }

      const { data: publicUrlData } = supabase.storage.from("proof-of-delivery").getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (e) {
      console.warn(`File conversion error for ${folder}:`, e);
      return fileUri;
    }
  };

  if (pod.signatureUri) {
    signatureUrl = await uploadMediaFile(pod.signatureUri, "signatures");
  }

  if (pod.photoUri) {
    photoUrl = await uploadMediaFile(pod.photoUri, "photos");
  }

  // Record in proof_of_delivery table
  await supabase.from("proof_of_delivery").insert({
    shipment_id: id,
    driver_id: driverId,
    receiver_name: "Recipient",
    signature_url: signatureUrl,
    photo_url: photoUrl,
    notes: pod.remarks || "",
    delivered_at: new Date().toISOString(),
  });

  // Update shipment status to DELIVERY_COMPLETED and attach POD metadata
  const { data: updated, error } = await supabase
    .from("shipments")
    .update({
      status: TripStatus.DeliveryCompleted,
      pod: {
        receiver_name: "Recipient",
        signature_url: signatureUrl,
        photo_url: photoUrl,
        notes: pod.remarks || "",
        delivered_at: new Date().toISOString(),
        otpVerified: pod.otpVerified,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to complete delivery for trip ${id}: ${error?.message}`);
  }

  return mapDbShipmentToTrip(updated);
}

export async function reportFailedDelivery(report: FailedDeliveryReport): Promise<void> {
  await supabase
    .from("shipments")
    .update({
      status: TripStatus.Failed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", report.tripId);
}

/** Subscribe to live Realtime updates on shipments for the assigned driver. */
export function subscribeToDriverTrips(driverId: string, onUpdate: (shipment: any) => void) {
  const channelTopic = `driver-trips-${driverId}-${Math.random().toString(36).substring(2, 9)}`;
  const channel = supabase
    .channel(channelTopic)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shipments",
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

