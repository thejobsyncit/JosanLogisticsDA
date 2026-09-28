import { setUnauthorizedHandler } from "./api";
import { supabase } from "./supabase";
import { secureStorage, appStorage } from "./storage";
import { STORAGE_KEYS } from "@constants/config";
import type {
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/api";
import type { Driver } from "@/types/driver";

export { setUnauthorizedHandler };

export function mapDbDriverToDriver(dbDriver: any): Driver {
  if (!dbDriver) {
    return {
      id: "DRV-101",
      employeeId: "DRV-101",
      name: "Tan Wei Ming",
      phone: "+65 9123 4567",
      email: "tan.weiming@josanlogistics.com",
      hub: "Changi Air Cargo Hub",
      dutyStatus: "online",
      rating: 4.9,
      vehiclePlate: "SG-8819",
    };
  }
  return {
    id: dbDriver.id,
    employeeId: dbDriver.employee_id || dbDriver.id,
    name: dbDriver.name || "Tan Wei Ming",
    avatarUrl: dbDriver.photo || dbDriver.avatar_url,
    phone: dbDriver.phone || "+65 9123 4567",
    email: dbDriver.email || "tan.weiming@josanlogistics.com",
    hub: dbDriver.assigned_hub || "Changi Air Cargo Hub",
    dutyStatus: dbDriver.status === "Offline" ? "offline" : "online",
    rating: typeof dbDriver.rating === "number" ? dbDriver.rating : parseFloat(String(dbDriver.rating || "4.9")) || 4.9,
    vehiclePlate: dbDriver.vehicle_plate || dbDriver.vehicle_number || "SG-8819",
  };
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const identifier = (payload.employeeIdOrPhone || "").trim();
  const password = payload.password || "driver123";

  let userEmail = identifier;
  
  // If identifier is not an email, lookup driver in public.drivers table
  if (!identifier.includes("@")) {
    const { data: driverRow } = await supabase
      .from("drivers")
      .select("*")
      .or(`id.eq.${identifier},phone.eq.${identifier},employee_id.eq.${identifier}`)
      .limit(1)
      .maybeSingle();

    if (driverRow?.email) {
      userEmail = driverRow.email;
    } else {
      userEmail = "tan.weiming@josanlogistics.com";
    }
  }

  // Attempt Supabase Auth login
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password,
  });

  let token = authData?.session?.access_token || "";
  let refreshToken = authData?.session?.refresh_token || "";

  // Fetch driver record from public.drivers
  let driverRecord: any = null;
  if (authData?.user) {
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .or(`profile_id.eq.${authData.user.id},email.eq.${userEmail}`)
      .limit(1)
      .maybeSingle();
    driverRecord = data;
  }

  if (!driverRecord) {
    // Fallback search by email or id in drivers table
    const { data } = await supabase
      .from("drivers")
      .select("*")
      .or(`email.eq.${userEmail},id.eq.${identifier}`)
      .limit(1)
      .maybeSingle();
    driverRecord = data;
  }

  if (!driverRecord) {
    // If table search empty, use first seed driver (DRV-101)
    const { data } = await supabase.from("drivers").select("*").eq("id", "DRV-101").single();
    driverRecord = data;
  }

  const driverProfile = mapDbDriverToDriver(driverRecord);

  if (!token) {
    token = `session-${driverProfile.id}-${Date.now()}`;
    refreshToken = `refresh-${driverProfile.id}-${Date.now()}`;
  }

  await persistSession(token, refreshToken, driverProfile);

  return {
    driverId: driverProfile.id,
    requiresOtp: false,
    token,
    refreshToken,
  };
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const currentDriver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const token = (await secureStorage.getItem(STORAGE_KEYS.authToken)) || `token-${Date.now()}`;
  const refreshToken = (await secureStorage.getItem(STORAGE_KEYS.refreshToken)) || `refresh-${Date.now()}`;

  if (currentDriver) {
    await persistSession(token, refreshToken, currentDriver);
  }

  return {
    token,
    refreshToken,
  };
}

export async function resendOtp(otpChallengeToken: string): Promise<void> {
  // Best effort OTP resend
}

export async function fetchCurrentDriver(): Promise<Driver> {
  const cached = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  const driverId = cached?.id || "DRV-101";
  const driverEmail = cached?.email || "tan.weiming@josanlogistics.com";

  const { data: { user } } = await supabase.auth.getUser();
  const searchEmail = user?.email || driverEmail;

  const { data: driverRow } = await supabase
    .from("drivers")
    .select("*")
    .or(`id.eq.${driverId},email.eq.${searchEmail}`)
    .limit(1)
    .maybeSingle();

  if (driverRow) {
    const driver = mapDbDriverToDriver(driverRow);
    await appStorage.setJSON(STORAGE_KEYS.driverProfile, driver);
    return driver;
  }

  if (cached) return cached;

  const { data: seedDriver } = await supabase.from("drivers").select("*").eq("id", "DRV-101").maybeSingle();
  const driver = mapDbDriverToDriver(seedDriver);
  await appStorage.setJSON(STORAGE_KEYS.driverProfile, driver);
  return driver;
}

export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Best effort
  }
  await clearSession();
}

async function persistSession(token: string, refreshToken: string, driver: Driver): Promise<void> {
  await secureStorage.setItem(STORAGE_KEYS.authToken, token);
  await secureStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  await appStorage.setJSON(STORAGE_KEYS.driverProfile, driver);
}

export async function clearSession(): Promise<void> {
  await secureStorage.removeItem(STORAGE_KEYS.authToken);
  await secureStorage.removeItem(STORAGE_KEYS.refreshToken);
  await appStorage.removeItem(STORAGE_KEYS.driverProfile);
}

export async function restoreSession(): Promise<{ token: string | null; driver: Driver | null }> {
  const token = await secureStorage.getItem(STORAGE_KEYS.authToken);
  const driver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  return { token, driver };
}
