import type { GeoPoint } from "./location";

/**
 * The full trip lifecycle, matching the production Supabase database status values.
 */
export enum TripStatus {
  Assigned = "ASSIGNED",
  Accepted = "ACCEPTED",
  GoingToPickup = "GOING_TO_PICKUP",
  ArrivedAtPickup = "ARRIVED_AT_PICKUP",
  PickupCompleted = "PICKUP_COMPLETED",
  InTransit = "IN_TRANSIT",
  ArrivedAtDelivery = "ARRIVED_AT_DELIVERY",
  DeliveryCompleted = "DELIVERY_COMPLETED",
  Cancelled = "CANCELLED",
  Failed = "FAILED",
}

/** Ordered list used to render progress trackers. Terminal states are excluded. */
export const TRIP_STATUS_FLOW: TripStatus[] = [
  TripStatus.Assigned,
  TripStatus.Accepted,
  TripStatus.GoingToPickup,
  TripStatus.ArrivedAtPickup,
  TripStatus.PickupCompleted,
  TripStatus.InTransit,
  TripStatus.ArrivedAtDelivery,
  TripStatus.DeliveryCompleted,
];

export interface Address {
  label: string;
  line1: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  coordinates?: GeoPoint;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
}

export interface ShipmentItem {
  id: string;
  description: string;
  quantity: number;
  weightKg?: number;
}

export interface Shipment {
  id: string;
  reference: string;
  cargoDescription: string;
  weightKg: number;
  packageCount: number;
  items?: ShipmentItem[];
}

export interface ProofOfDelivery {
  signatureUri?: string;
  photoUri?: string;
  otpVerified: boolean;
  remarks?: string;
  deliveredAt?: string;
  deliveredLocation?: GeoPoint;
}

export interface Trip {
  id: string;
  reference: string;
  status: TripStatus;
  vehiclePlate?: string;
  scheduledWindow: { start: string; end: string };
  pickup: Address;
  delivery: Address;
  shipment: Shipment;
  distanceKm?: number;
  estimatedArrival?: string;
  pod?: ProofOfDelivery;
  createdAt: string;
  updatedAt: string;
}

export type TripListFilter = "today" | "upcoming" | "completed";

export interface FailedDeliveryReport {
  tripId: string;
  reason:
    | "customer_unavailable"
    | "wrong_address"
    | "customer_refused"
    | "damaged_shipment"
    | "access_restricted"
    | "other";
  notes?: string;
  photoUri?: string;
}

/** Maps a raw Supabase shipments record into the frontend Trip object. */
export function mapDbShipmentToTrip(raw: any): Trip {
  if (!raw) throw new Error("Invalid shipment record");
  const rawStatus = (raw.status || "ASSIGNED").toUpperCase();
  let status: TripStatus = TripStatus.Assigned;
  if (Object.values(TripStatus).includes(rawStatus as TripStatus)) {
    status = rawStatus as TripStatus;
  } else if (rawStatus === "ASSIGNED") status = TripStatus.Assigned;
  else if (rawStatus === "ACCEPTED") status = TripStatus.Accepted;
  else if (rawStatus === "GOING_TO_PICKUP") status = TripStatus.GoingToPickup;
  else if (rawStatus === "ARRIVED_AT_PICKUP") status = TripStatus.ArrivedAtPickup;
  else if (rawStatus === "PICKUP_COMPLETED") status = TripStatus.PickupCompleted;
  else if (rawStatus === "IN_TRANSIT") status = TripStatus.InTransit;
  else if (rawStatus === "ARRIVED_AT_DELIVERY") status = TripStatus.ArrivedAtDelivery;
  else if (rawStatus === "DELIVERY_COMPLETED") status = TripStatus.DeliveryCompleted;
  else if (rawStatus === "CANCELLED") status = TripStatus.Cancelled;

  const pickupLat = raw.coordinates?.origin?.[0] ?? 1.3521;
  const pickupLng = raw.coordinates?.origin?.[1] ?? 103.8200;
  const deliveryLat = raw.coordinates?.destination?.[0] ?? 1.3412;
  const deliveryLng = raw.coordinates?.destination?.[1] ?? 103.7712;

  return {
    id: raw.id,
    reference: raw.tracking_number || raw.id,
    status,
    vehiclePlate: raw.vehicle_plate || raw.vehicle || "SG-8819",
    scheduledWindow: {
      start: raw.scheduled_date || "Today",
      end: raw.time_slot || "09:00 AM - 05:00 PM",
    },
    pickup: {
      label: raw.sender || "Pickup Point",
      line1: raw.pickup_address || raw.sender_address || "Singapore Central Hub",
      postalCode: raw.pickup_postal_code || "048616",
      contactName: raw.sender || "Sender Contact",
      contactPhone: raw.sender_phone || "+65 6789 0123",
      coordinates: { latitude: pickupLat, longitude: pickupLng },
    },
    delivery: {
      label: raw.receiver || "Delivery Destination",
      line1: raw.delivery_address || raw.receiver_address || "Singapore Logistics Terminal",
      postalCode: raw.delivery_postal_code || "619114",
      contactName: raw.receiver || "Recipient Contact",
      contactPhone: raw.receiver_phone || "+65 9123 4567",
      coordinates: { latitude: deliveryLat, longitude: deliveryLng },
    },
    shipment: {
      id: raw.id,
      reference: raw.tracking_number || raw.id,
      cargoDescription: raw.package_description || raw.cargo_type || "General Freight Cargo",
      weightKg: typeof raw.weight === "number" ? raw.weight : parseInt(String(raw.weight || "500").replace(/[^0-9]/g, "")) || 500,
      packageCount: raw.pieces || 1,
    },
    distanceKm: 18.5,
    estimatedArrival: raw.estimated_delivery || "Today, 5:00 PM",
    pod: raw.pod
      ? {
          signatureUri: raw.pod.signature_url || raw.pod.signatureUri,
          photoUri: raw.pod.photo_url || raw.pod.photoUri,
          otpVerified: !!raw.pod.otpVerified,
          remarks: raw.pod.notes || raw.pod.remarks,
          deliveredAt: raw.pod.delivered_at || raw.pod.deliveredAt,
        }
      : undefined,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || new Date().toISOString(),
  };
}
