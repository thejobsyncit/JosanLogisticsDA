/**
 * Driver Login Audit & Security Monitoring Service
 * Josan Logistics Driver App
 *
 * Records authentication events (success, failure, rate limit, logout)
 * to Supabase driver_audit_logs table when available.
 *
 * SECURITY INVARIANT:
 * NEVER record passwords, tokens, API keys, or plaintext secrets.
 */
import { Platform } from "react-native";
import { supabase } from "./supabase";

export type AuditEventType =
  | "login_success"
  | "login_failure"
  | "login_rate_limited"
  | "account_inactive_rejected"
  | "account_not_found_rejected"
  | "session_expired"
  | "logout";

export interface LoginAuditPayload {
  event: AuditEventType;
  identifier?: string; // Driver email or ID (never credentials)
  driverId?: string;
  errorCategory?: string;
  errorMessage?: string; // Sanitized summary only
  metadata?: Record<string, any>;
}

export async function recordLoginAudit(payload: LoginAuditPayload): Promise<void> {
  const sanitizedIdentifier = payload.identifier
    ? payload.identifier.trim().toLowerCase()
    : undefined;

  const entry = {
    event_type: payload.event,
    identifier: sanitizedIdentifier,
    driver_id: payload.driverId || null,
    error_category: payload.errorCategory || null,
    error_summary: payload.errorMessage || null,
    platform: Platform.OS,
    created_at: new Date().toISOString(),
    metadata: {
      ...payload.metadata,
      platform: Platform.OS,
      app: "josan-driver-app",
      version: "1.0.0",
    },
  };

  try {
    // Attempt best-effort persistence to Supabase driver_audit_logs table
    const { error } = await supabase.from("driver_audit_logs").insert([entry]);
    if (error) {
      // Table may not yet be provisioned or RLS restricted — log non-sensitive telemetry info
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        console.log(`[Audit] ${entry.event_type} - ${entry.identifier || "unknown"} (status: ${entry.error_category || "ok"})`);
      }
    }
  } catch {
    // Best-effort: Logging must never crash the authentication flow
  }
}
