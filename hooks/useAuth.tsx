/**
 * Auth session context. Wraps services/auth.ts so screens/components consume
 * a simple `{ driver, isAuthenticated, login, logout, ... }` API and never
 * touch tokens or storage directly. Mounted once in app/_layout.tsx.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "@services/auth";
import * as driverService from "@services/driver";
import type { Driver } from "@/types/driver";
import type { LoginRequest, VerifyOtpRequest } from "@/types/api";

interface AuthContextValue {
  driver: Driver | null;
  isAuthenticated: boolean;
  /** True only during the initial session-restore on app launch. */
  isBootstrapping: boolean;
  pendingOtpToken: string | null;
  login: (payload: LoginRequest) => Promise<{ requiresOtp: boolean }>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  logout: () => Promise<void>;
  updateDutyStatus: (status: "online" | "offline" | "on_break") => Promise<void>;
  updateProfile: (updates: Partial<Driver>) => Promise<Driver>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [pendingOtpToken, setPendingOtpToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const restored = await authService.restoreSession();
      setToken(restored.token);
      setDriver(restored.driver);
      setIsBootstrapping(false);

      try {
        const freshDriver = await authService.fetchCurrentDriver();
        setDriver(freshDriver);
      } catch (err) {
        console.warn("Failed to fetch fresh driver profile on boot:", err);
      }
    })();
  }, []);

  useEffect(() => {
    authService.setUnauthorizedHandler(() => {
      setToken(null);
      setDriver(null);
    });
    return () => authService.setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const result = await authService.login(payload);
    if (result.requiresOtp && result.otpChallengeToken) {
      setPendingOtpToken(result.otpChallengeToken);
      return { requiresOtp: true };
    }
    if (result.token && result.refreshToken) {
      setToken(result.token);
      const freshDriver = await authService.fetchCurrentDriver();
      setDriver(freshDriver);
    }
    return { requiresOtp: false };
  }, []);

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!pendingOtpToken) throw new Error("No OTP challenge in progress.");
      const result = await authService.verifyOtp({ otpChallengeToken: pendingOtpToken, code } as VerifyOtpRequest);
      setToken(result.token);
      setPendingOtpToken(null);
      const freshDriver = await authService.fetchCurrentDriver();
      setDriver(freshDriver);
    },
    [pendingOtpToken]
  );

  const resendOtp = useCallback(async () => {
    if (!pendingOtpToken) return;
    await authService.resendOtp(pendingOtpToken);
  }, [pendingOtpToken]);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setDriver(null);
    setPendingOtpToken(null);
  }, []);

  const updateDutyStatus = useCallback(async (newStatus: "online" | "offline" | "on_break") => {
    try {
      await driverService.setDutyStatus(newStatus as any);
      setDriver((prev) => (prev ? { ...prev, dutyStatus: newStatus as any } : null));
    } catch (err: any) {
      console.warn("Failed to update status:", err.message);
      setDriver((prev) => (prev ? { ...prev, dutyStatus: newStatus as any } : null));
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Driver>) => {
    const updated = await driverService.updateProfile(updates);
    setDriver(updated);
    return updated;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      driver,
      isAuthenticated: !!token,
      isBootstrapping,
      pendingOtpToken,
      login,
      verifyOtp,
      resendOtp,
      logout,
      updateDutyStatus,
      updateProfile,
    }),
    [driver, token, isBootstrapping, pendingOtpToken, login, verifyOtp, resendOtp, logout, updateDutyStatus, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
