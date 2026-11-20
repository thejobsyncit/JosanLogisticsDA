import { setUnauthorizedHandler } from "./api";
import { supabase } from "./supabase";
import { secureStorage, appStorage } from "./storage";
import { recordLoginAudit } from "./audit";
import { STORAGE_KEYS } from "@constants/config";
import type {
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "@/types/api";
import type { Driver } from "@/types/driver";

export { setUnauthorizedHandler };

const AUTH_TIMEOUT_MS = 15000;

/**
 * Wraps an async promise with a strict timeout to guarantee the app
 * never hangs indefinitely on stalled network/server requests.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = AUTH_TIMEOUT_MS,
  timeoutMessage = "The request took too long to complete. Please check your connection and try again."
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function mapDbDriverToDriver(dbDriver: any): Driver {
  if (!dbDriver) {
    throw new Error("Driver account not found in database.");
  }
  return {
    id: dbDriver.id,
    employeeId: dbDriver.employee_id || dbDriver.id,
    name: dbDriver.name || "Driver",
    avatarUrl: dbDriver.photo || dbDriver.avatar_url,
    phone: dbDriver.phone || "",
    email: dbDriver.email || "",
    hub: dbDriver.assigned_hub || "Changi Air Cargo Hub",
    dutyStatus: dbDriver.status === "Offline" ? "offline" : "online",
    rating: typeof dbDriver.rating === "number" ? dbDriver.rating : parseFloat(String(dbDriver.rating || "4.9")) || 4.9,
    vehiclePlate: dbDriver.vehicle_plate || dbDriver.vehicle_number || "",
  };
}

/**
 * Validates driver account operational and administrative status.
 * Rejects inactive, blocked, suspended, or unapproved drivers.
 */
export function validateDriverStatus(status?: string | null): void {
  if (!status) return;
  const s = status.trim().toLowerCase();
  if (s === "inactive") {
    throw new Error("Your driver account is inactive. Please contact support.");
  }
  if (s === "blocked") {
    throw new Error("Your driver account has been blocked. Please contact support.");
  }
  if (s === "suspended") {
    throw new Error("Your driver account has been suspended. Please contact support.");
  }
  if (s === "pending" || s === "not approved" || s === "unapproved" || s === "pending_approval") {
    throw new Error("Your driver account is not approved yet. Please contact support.");
  }
}

/**
 * Authenticates driver against public.drivers database table.
 * Supports both Supabase Auth and direct database password verification.
 * Strictly verifies against public.drivers.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const email = (payload.email || payload.employeeIdOrPhone || "").trim();
  const password = payload.password || "";

  if (!email) {
    throw new Error("Please enter your email address.");
  }
  if (!password) {
    throw new Error("Please enter your password.");
  }

  return withTimeout(
    (async () => {
      // 1. Verify existence in public.drivers table (case-insensitive email match)
      let driverRecord: any = null;

      try {
        const { data, error } = await supabase
          .from("drivers")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        if (error) {
          // Check for rate limit or server errors from Supabase
          if (error.code === "429" || error.message.includes("429")) {
            throw new Error("Too many requests. Please wait a few moments before trying again.");
          }
        }
        driverRecord = data;

        // Fallback search by ID / phone / employee_id for backwards compatibility
        if (!driverRecord) {
          const { data: byAlt } = await supabase
            .from("drivers")
            .select("*")
            .or(`id.eq.${email},phone.eq.${email},employee_id.eq.${email}`)
            .maybeSingle();
          driverRecord = byAlt;
        }
      } catch (err: any) {
        await recordLoginAudit({
          event: "login_failure",
          identifier: email,
          errorCategory: "NETWORK_OR_SERVER_ERROR",
          errorMessage: err?.message,
        });
        throw new Error(err?.message || "Failed to query database. Check your connection.");
      }

      // Reject if driver is not in the database
      if (!driverRecord) {
        await logout();
        await recordLoginAudit({
          event: "account_not_found_rejected",
          identifier: email,
          errorCategory: "ACCOUNT_NOT_FOUND",
          errorMessage: "Driver account not found in database",
        });
        throw new Error("Driver account not found in database. Please contact your dispatch administrator.");
      }

      // 2. Validate driver account status (inactive, blocked, suspended)
      try {
        validateDriverStatus(driverRecord.status);
      } catch (statusErr: any) {
        await logout();
        await recordLoginAudit({
          event: "account_inactive_rejected",
          identifier: email,
          driverId: driverRecord.id,
          errorCategory: "ACCOUNT_INACTIVE",
          errorMessage: statusErr.message,
        });
        throw statusErr;
      }

      // 3. Verify Credentials
      let token = "";
      let refreshToken = "";

      // Attempt A: Supabase Auth sign-in
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: driverRecord.email || email,
          password,
        });

        if (authError) {
          if (authError.status === 429 || authError.message.includes("429") || authError.message.includes("rate limit")) {
            await recordLoginAudit({
              event: "login_rate_limited",
              identifier: email,
              driverId: driverRecord.id,
              errorCategory: "TOO_MANY_ATTEMPTS",
            });
            throw new Error("Too many login attempts. Please wait a few moments before trying again.");
          }
        }

        if (authData?.session) {
          token = authData.session.access_token;
          refreshToken = authData.session.refresh_token;

          // Link user_id if not yet set
          if (authData.user?.id && !driverRecord.user_id) {
            await supabase
              .from("drivers")
              .update({ user_id: authData.user.id })
              .eq("id", driverRecord.id);
          }
        }
      } catch (authErr: any) {
        if (authErr?.message?.includes("Too many login attempts") || authErr?.status === 429) {
          throw authErr;
        }
        // Otherwise proceed to database password verification
      }

      // Attempt B: Database table password check
      if (!token) {
        if (driverRecord.password) {
          if (driverRecord.password !== password) {
            await recordLoginAudit({
              event: "login_failure",
              identifier: email,
              driverId: driverRecord.id,
              errorCategory: "INVALID_CREDENTIALS",
              errorMessage: "Invalid password",
            });
            throw new Error("Invalid password. Please check your credentials.");
          }

          // Password matches database record! Try auto-provisioning into Supabase Auth
          try {
            const { data: signUpData } = await supabase.auth.signUp({
              email: driverRecord.email || email,
              password,
            });
            if (signUpData?.session) {
              token = signUpData.session.access_token;
              refreshToken = signUpData.session.refresh_token;
              if (signUpData.user?.id && !driverRecord.user_id) {
                await supabase
                  .from("drivers")
                  .update({ user_id: signUpData.user.id })
                  .eq("id", driverRecord.id);
              }
            }
          } catch {
            // Sign-up may be restricted; continue with authenticated session
          }
        } else {
          await recordLoginAudit({
            event: "login_failure",
            identifier: email,
            driverId: driverRecord.id,
            errorCategory: "INVALID_CREDENTIALS",
            errorMessage: "No password found on record",
          });
          throw new Error("Invalid credentials. Please check your email and password.");
        }
      }

      if (!token) {
        token = `session-${driverRecord.id}-${Date.now()}`;
        refreshToken = `refresh-${driverRecord.id}-${Date.now()}`;
      }

      // 4. Success: Persist session and driver profile
      const driverProfile = mapDbDriverToDriver(driverRecord);
      await persistSession(token, refreshToken, driverProfile);

      // Record successful login audit (strictly non-sensitive)
      await recordLoginAudit({
        event: "login_success",
        identifier: email,
        driverId: driverProfile.id,
      });

      return {
        driverId: driverProfile.id,
        requiresOtp: false,
        token,
        refreshToken,
      };
    })(),
    AUTH_TIMEOUT_MS,
    "The login request took too long to complete. Please check your network connection and try again."
  );
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

/**
 * Validates active driver session against public.drivers on app startup.
 * If driver is missing or inactive/blocked, logs out and rejects.
 */
export async function fetchCurrentDriver(): Promise<Driver> {
  return withTimeout(
    (async () => {
      const cached = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
      const { data: { user } } = await supabase.auth.getUser();

      let driverRecord: any = null;

      // 1. Try search by Supabase Auth user.id
      if (user?.id) {
        const { data: byUserId } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        driverRecord = byUserId;
      }

      // 2. Try search by email
      const searchEmail = user?.email || cached?.email;
      if (!driverRecord && searchEmail) {
        const { data: byEmail } = await supabase
          .from("drivers")
          .select("*")
          .ilike("email", searchEmail)
          .maybeSingle();

        if (byEmail) {
          if (user?.id && !byEmail.user_id) {
            await supabase.from("drivers").update({ user_id: user.id }).eq("id", byEmail.id);
          }
          driverRecord = byEmail;
        }
      }

      // 3. Try search by driver ID
      if (!driverRecord && cached?.id) {
        const { data: byId } = await supabase
          .from("drivers")
          .select("*")
          .eq("id", cached.id)
          .maybeSingle();

        driverRecord = byId;
      }

      if (!driverRecord) {
        await logout();
        await recordLoginAudit({
          event: "session_expired",
          identifier: searchEmail,
          errorCategory: "ACCOUNT_NOT_FOUND",
        });
        throw new Error("You are not registered as a driver. Please contact support.");
      }

      validateDriverStatus(driverRecord.status);

      const driver = mapDbDriverToDriver(driverRecord);
      await appStorage.setJSON(STORAGE_KEYS.driverProfile, driver);
      return driver;
    })(),
    AUTH_TIMEOUT_MS,
    "The session check timed out. Check your connection."
  );
}

export async function logout(): Promise<void> {
  const cached = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  if (cached?.id) {
    await recordLoginAudit({
      event: "logout",
      driverId: cached.id,
      identifier: cached.email,
    });
  }

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
  await appStorage.removeItem("assigned_vehicle_details");
}

export async function restoreSession(): Promise<{ token: string | null; driver: Driver | null }> {
  const token = await secureStorage.getItem(STORAGE_KEYS.authToken);
  const driver = await appStorage.getJSON<Driver>(STORAGE_KEYS.driverProfile);
  return { token, driver };
}
