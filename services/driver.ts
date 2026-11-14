import { supabase } from "./supabase";
import { appStorage } from "./storage";
import { STORAGE_KEYS } from "@constants/config";
import type { DutyStatus, DriverPerformance, DriverDocument, Driver } from "@/types/driver";

export async function setDutyStatus(status: DutyStatus | "online" | "offline" | "on_break"): Promise<any> {
  try {
    const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
    const driverId = cachedDriver?.id || "DRV-101";
    const driverEmail = cachedDriver?.email || "tan.weiming@josanlogistics.com";

    const dbStatus = status === "offline" ? "Offline" : status === "on_break" ? "On Break" : "Available";

    const { error } = await supabase
      .from("drivers")
      .update({ status: dbStatus })
      .or(`id.eq.${driverId},email.eq.${driverEmail}`);

    if (error) {
      console.warn("Supabase setDutyStatus error:", error.message);
    }

    if (cachedDriver) {
      const updated: Driver = { ...cachedDriver, dutyStatus: status === "offline" ? "offline" : "online" };
      await appStorage.setJSON(STORAGE_KEYS.driverProfile, updated);
    }

    return { success: true, status };
  } catch (error) {
    console.warn("Failed to set duty status on Supabase", error);
    return { status };
  }
}

export async function getEarnings(): Promise<{ todayEarnings: number; weekEarnings: number; monthEarnings: number; recentEarnings: any[] }> {
  return {
    todayEarnings: 125.0,
    weekEarnings: 680.0,
    monthEarnings: 2450.0,
    recentEarnings: [
      { id: "e1", amount: 45.0, description: "Freight Delivery JOS-88190-SG fare", earned_at: new Date().toISOString() },
      { id: "e2", amount: 80.0, description: "Freight Delivery JOS-44021-SG fare", earned_at: new Date().toISOString() },
    ],
  };
}

export async function getVehicle(): Promise<any> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";
  const driverEmail = cachedDriver?.email || "tan.weiming@josanlogistics.com";

  const { data: driverRow } = await supabase
    .from("drivers")
    .select("*")
    .or(`id.eq.${driverId},email.eq.${driverEmail}`)
    .maybeSingle();

  const savedDetails = await appStorage.getJSON<any>("assigned_vehicle_details");

  if (savedDetails?.deleted) {
    return null;
  }

  const vehiclePlate =
    savedDetails?.vehiclePlate !== undefined
      ? savedDetails.vehiclePlate
      : driverRow?.vehicle_plate ||
        driverRow?.vehicle_number ||
        driverRow?.vehicle_id ||
        cachedDriver?.vehiclePlate ||
        "SG-8819";

  if (!vehiclePlate) {
    return null;
  }

  return {
    vehiclePlate,
    vehicleType: savedDetails?.vehicleType || driverRow?.vehicle_type || "Josan EV Express Cargo Truck",
    capacityKg: savedDetails?.capacityKg !== undefined ? savedDetails.capacityKg : 14000,
    odometerKm: savedDetails?.odometerKm !== undefined ? savedDetails.odometerKm : 45200,
    insuranceExpiry: savedDetails?.insuranceExpiry || "2027-04-30",
    inspectionExpiry: savedDetails?.inspectionExpiry || "2027-01-15",
    status: savedDetails?.status || "operational",
  };
}

export async function saveVehicleDetails(details: {
  vehiclePlate: string;
  vehicleType: string;
  capacityKg?: number;
  odometerKm?: number;
  insuranceExpiry?: string;
  inspectionExpiry?: string;
  status?: string;
}): Promise<any> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";
  const driverEmail = cachedDriver?.email || "tan.weiming@josanlogistics.com";

  try {
    const { error } = await supabase
      .from("drivers")
      .update({
        vehicle_plate: details.vehiclePlate,
        vehicle_id: details.vehiclePlate,
        vehicle_number: details.vehiclePlate,
        vehicle_type: details.vehicleType,
      })
      .or(`id.eq.${driverId},email.eq.${driverEmail}`);

    if (error) {
      console.warn("Supabase vehicle update error:", error.message);
    }

    await supabase
      .from("shipments")
      .update({
        vehicle_plate: details.vehiclePlate,
        vehicle: details.vehiclePlate,
        vehicle_type: details.vehicleType,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", driverId);
  } catch (e) {
    console.warn("Supabase vehicle update warning:", e);
  }

  const fullDetails = {
    ...details,
    deleted: false,
  };

  await appStorage.setJSON("assigned_vehicle_details", fullDetails);

  if (cachedDriver) {
    await appStorage.setJSON(STORAGE_KEYS.driverProfile, {
      ...cachedDriver,
      vehiclePlate: details.vehiclePlate,
    });
  }

  return fullDetails;
}

export async function deleteVehicleDetails(): Promise<void> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";
  const driverEmail = cachedDriver?.email || "tan.weiming@josanlogistics.com";

  try {
    const { error } = await supabase
      .from("drivers")
      .update({
        vehicle_plate: null,
        vehicle_id: null,
        vehicle_number: null,
        vehicle_type: null,
      })
      .or(`id.eq.${driverId},email.eq.${driverEmail}`);

    if (error) {
      console.warn("Supabase vehicle delete error:", error.message);
    }

    await supabase
      .from("shipments")
      .update({
        vehicle_plate: null,
        vehicle: null,
        vehicle_type: null,
        updated_at: new Date().toISOString(),
      })
      .eq("driver_id", driverId);
  } catch (e) {
    console.warn("Supabase vehicle delete warning:", e);
  }

  await appStorage.setJSON("assigned_vehicle_details", { deleted: true, vehiclePlate: "", vehicleType: "" });

  if (cachedDriver) {
    await appStorage.setJSON(STORAGE_KEYS.driverProfile, {
      ...cachedDriver,
      vehiclePlate: "",
    });
  }
}


export async function getSchedule(): Promise<any[]> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";

  const { data: shipments } = await supabase
    .from("shipments")
    .select("*")
    .or(`driver_id.eq.${driverId},driver_id.is.null`)
    .limit(5);

  return (shipments || []).map((s) => ({
    id: s.id,
    reference: s.tracking_number || s.id,
    pickup_label: s.pickup_address || s.sender || "Changi Logistics Hub",
    delivery_label: s.delivery_address || s.receiver || "Jurong Terminal",
    scheduled_start: s.scheduled_date || new Date().toISOString(),
    status: (s.status || "ASSIGNED").toLowerCase(),
  }));
}

export async function getPerformance(): Promise<DriverPerformance> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";

  const { data: driverRow } = await supabase.from("drivers").select("*").eq("id", driverId).maybeSingle();

  const ratingNum = typeof driverRow?.rating === "number" ? driverRow.rating : parseFloat(driverRow?.rating || "4.9") || 4.9;

  return {
    overallScore: 98,
    rating: ratingNum,
    onTimeDeliveryPct: parseFloat(String(driverRow?.on_time_rate || "99.5").replace(/[^0-9.]/g, "")) || 99.5,
    successfulDeliveryPct: 99.8,
    safetyScorePct: 99.0,
  };
}

export async function getDocuments(): Promise<DriverDocument[]> {
  return [
    {
      id: "doc-1",
      title: "Class 4 Commercial Driver License (Singapore)",
      type: "license",
      status: "valid",
      expiresAt: "2028-12-31",
    },
    {
      id: "doc-2",
      title: "Commercial Vehicle Comprehensive Insurance",
      type: "insurance",
      status: "valid",
      expiresAt: "2027-06-30",
    },
    {
      id: "doc-3",
      title: "LTA Heavy Vehicle Road Worthiness Permit",
      type: "vehicle_registration",
      status: "valid",
      expiresAt: "2027-04-15",
    },
  ];
}

export async function updateProfile(partialDriver: Partial<Driver>): Promise<Driver> {
  const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cachedDriver?.id || "DRV-101";
  const driverEmail = cachedDriver?.email || "tan.weiming@josanlogistics.com";

  let resolvedAvatarUrl = partialDriver.avatarUrl;
  if (resolvedAvatarUrl && !resolvedAvatarUrl.startsWith("http")) {
    try {
      const fileName = `avatars/${driverId}_${Date.now()}.jpg`;
      const response = await fetch(resolvedAvatarUrl);
      const blob = await response.blob();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("proof-of-delivery")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });
      if (!uploadError && uploadData?.path) {
        const { data: publicUrlData } = supabase.storage.from("proof-of-delivery").getPublicUrl(uploadData.path);
        if (publicUrlData?.publicUrl) {
          resolvedAvatarUrl = publicUrlData.publicUrl;
        }
      }
    } catch {
      // Keep local URI if storage upload is unavailable
    }
  }

  // Note: public.drivers does NOT have an updated_at column in the Supabase schema
  const updateData: any = {};
  if (partialDriver.name) updateData.name = partialDriver.name;
  if (partialDriver.phone) updateData.phone = partialDriver.phone;
  if (partialDriver.email) updateData.email = partialDriver.email;
  if (partialDriver.hub) updateData.assigned_hub = partialDriver.hub;
  if (resolvedAvatarUrl !== undefined) {
    updateData.photo = resolvedAvatarUrl;
  }
  if (partialDriver.vehiclePlate !== undefined) {
    const plateVal = partialDriver.vehiclePlate || null;
    updateData.vehicle_plate = plateVal;
    updateData.vehicle_number = plateVal;
    updateData.vehicle_id = plateVal;
  }

  let updatedDriverRow: any = null;
  if (Object.keys(updateData).length > 0) {
    const { data, error: driverError } = await supabase
      .from("drivers")
      .update(updateData)
      .eq("id", driverId)
      .select()
      .maybeSingle();

    if (driverError) {
      console.warn("Supabase driver update error:", driverError.message);
    } else if (data) {
      updatedDriverRow = data;
    } else {
      const { data: byEmailData } = await supabase
        .from("drivers")
        .update(updateData)
        .eq("email", driverEmail)
        .select()
        .maybeSingle();
      updatedDriverRow = byEmailData;
    }
  }

  // Update public.profiles if user name/phone/email/avatarUrl changed
  if (partialDriver.name || partialDriver.phone || partialDriver.email || resolvedAvatarUrl !== undefined) {
    await supabase
      .from("profiles")
      .update({
        ...(partialDriver.name ? { name: partialDriver.name } : {}),
        ...(partialDriver.phone ? { phone: partialDriver.phone } : {}),
        ...(partialDriver.email ? { email: partialDriver.email } : {}),
        ...(resolvedAvatarUrl !== undefined ? { avatar_url: resolvedAvatarUrl } : {}),
      })
      .eq("email", driverEmail);
  }

  // Update public.shipments for trips assigned to this driver
  const shipmentUpdates: any = {};
  if (partialDriver.name) shipmentUpdates.driver_name = partialDriver.name;
  if (partialDriver.phone) shipmentUpdates.driver_phone = partialDriver.phone;
  if (partialDriver.vehiclePlate !== undefined) {
    shipmentUpdates.vehicle_plate = partialDriver.vehiclePlate || null;
    shipmentUpdates.vehicle = partialDriver.vehiclePlate || null;
  }
  if (Object.keys(shipmentUpdates).length > 0) {
    shipmentUpdates.updated_at = new Date().toISOString();
    await supabase
      .from("shipments")
      .update(shipmentUpdates)
      .eq("driver_id", driverId);
  }

  if (partialDriver.vehiclePlate !== undefined) {
    const savedVehicle = await appStorage.getJSON<any>("assigned_vehicle_details");
    if (savedVehicle) {
      await appStorage.setJSON("assigned_vehicle_details", {
        ...savedVehicle,
        vehiclePlate: partialDriver.vehiclePlate,
        deleted: !partialDriver.vehiclePlate,
      });
    }
  }

  const merged: Driver = {
    ...(cachedDriver || ({} as Driver)),
    ...partialDriver,
    ...(resolvedAvatarUrl !== undefined ? { avatarUrl: resolvedAvatarUrl } : {}),
    vehiclePlate:
      partialDriver.vehiclePlate !== undefined
        ? partialDriver.vehiclePlate
        : updatedDriverRow?.vehicle_plate ||
          updatedDriverRow?.vehicle_number ||
          cachedDriver?.vehiclePlate ||
          "SG-8819",
  };

  await appStorage.setJSON(STORAGE_KEYS.driverProfile, merged);
  return merged;
}

