import { supabase } from "./supabase";
import { appStorage } from "./storage";
import { STORAGE_KEYS } from "@constants/config";
import type { AppNotification, NotificationCategory } from "@/types/notification";
import type { Driver } from "@/types/driver";

export async function getNotifications(category: NotificationCategory | "all" = "all"): Promise<AppNotification[]> {
  try {
    const cachedDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
    const driverId = cachedDriver?.id || "DRV-101";

    const { data: rows } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${driverId},user_id.eq.all,role.eq.driver`)
      .order("created_at", { ascending: false });

    const notifications: AppNotification[] = (rows || []).map((n) => ({
      id: n.id,
      category: n.type === "trip" ? "trips" : "system",
      title: n.title || "Notification",
      body: n.message || "",
      createdAt: n.created_at || new Date().toISOString(),
      read: !!n.read,
      relatedTripId: n.shipment_id || undefined,
    }));

    if (category === "all") return notifications;
    return notifications.filter((n) => n.category === category);
  } catch (error) {
    console.warn("Failed to fetch notifications from Supabase", error);
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  } catch (error) {
    console.warn("Failed to mark notification read", error);
  }
}
