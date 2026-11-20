/**
 * Centralized Login Error Classification & Message Mapping
 * Josan Logistics Driver App
 *
 * Provides safe, branded user-facing messages for all 9 authentication error scenarios.
 * Masks raw database errors, SQL syntax, stack traces, and internal tokens.
 */

export type LoginErrorCategory =
  | "ACCOUNT_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_INACTIVE"
  | "NETWORK_ERROR"
  | "REQUEST_TIMEOUT"
  | "SERVER_ERROR"
  | "TOO_MANY_ATTEMPTS"
  | "SESSION_EXPIRED"
  | "UNEXPECTED_ERROR";

export interface LoginErrorInfo {
  category: LoginErrorCategory;
  title: string;
  message: string;
  canRetry?: boolean;
}

export const LOGIN_ERROR_SCENARIOS: Record<LoginErrorCategory, LoginErrorInfo> = {
  ACCOUNT_NOT_FOUND: {
    category: "ACCOUNT_NOT_FOUND",
    title: "Account Not Found",
    message: "Driver account not found in database. Please contact your dispatch administrator.",
    canRetry: false,
  },
  INVALID_CREDENTIALS: {
    category: "INVALID_CREDENTIALS",
    title: "Invalid Credentials",
    message: "Incorrect email or password. Please check your credentials and try again.",
    canRetry: false,
  },
  ACCOUNT_INACTIVE: {
    category: "ACCOUNT_INACTIVE",
    title: "Account Inactive",
    message: "Your driver account is currently inactive. Please contact your dispatch administrator.",
    canRetry: false,
  },
  NETWORK_ERROR: {
    category: "NETWORK_ERROR",
    title: "Connection Problem",
    message: "Unable to connect to the server. Please check your internet connection and try again.",
    canRetry: true,
  },
  REQUEST_TIMEOUT: {
    category: "REQUEST_TIMEOUT",
    title: "Request Timeout",
    message: "The sign-in request took too long to complete. Please check your network connection and try again.",
    canRetry: true,
  },
  SERVER_ERROR: {
    category: "SERVER_ERROR",
    title: "Server Error",
    message: "Something went wrong on our server. Please try again later.",
    canRetry: true,
  },
  TOO_MANY_ATTEMPTS: {
    category: "TOO_MANY_ATTEMPTS",
    title: "Too Many Attempts",
    message: "Too many failed login attempts have been detected. Please wait a few moments before trying again.",
    canRetry: false,
  },
  SESSION_EXPIRED: {
    category: "SESSION_EXPIRED",
    title: "Session Expired",
    message: "Your driver session has expired. Please sign in again to continue.",
    canRetry: false,
  },
  UNEXPECTED_ERROR: {
    category: "UNEXPECTED_ERROR",
    title: "Login Failed",
    message: "Unable to sign in at the moment. Please try again.",
    canRetry: false,
  },
};

/**
 * Classifies any thrown login exception into a user-friendly, branded error dialog payload.
 * Masks raw database messages, stack traces, and internal API structures.
 */
export function classifyLoginError(error: any): LoginErrorInfo {
  if (!error) {
    return LOGIN_ERROR_SCENARIOS.UNEXPECTED_ERROR;
  }

  const raw = (error.message || error.error_description || String(error)).toLowerCase();
  const status = error.status || error.statusCode || error.code;

  // 1. Rate Limiting / Too Many Attempts (HTTP 429, over_request_rate_limit, cooldown)
  if (
    status === 429 ||
    raw.includes("429") ||
    raw.includes("too many requests") ||
    raw.includes("too many login attempts") ||
    raw.includes("rate limit") ||
    raw.includes("over_request_rate_limit") ||
    raw.includes("over_email_send_rate_limit") ||
    raw.includes("cooldown")
  ) {
    return LOGIN_ERROR_SCENARIOS.TOO_MANY_ATTEMPTS;
  }

  // 2. Request Timeout
  if (
    raw.includes("timeout") ||
    raw.includes("timed out") ||
    raw.includes("request took too long") ||
    raw.includes("econnaborted") ||
    raw.includes("abort")
  ) {
    return LOGIN_ERROR_SCENARIOS.REQUEST_TIMEOUT;
  }

  // 3. Session Expired
  if (
    raw.includes("session expired") ||
    raw.includes("jwt expired") ||
    raw.includes("token expired") ||
    raw.includes("session has expired") ||
    raw.includes("expired session") ||
    raw.includes("refresh_token_not_found")
  ) {
    return LOGIN_ERROR_SCENARIOS.SESSION_EXPIRED;
  }

  // 4. Account Inactive, Blocked, Suspended, or Pending
  if (
    raw.includes("inactive") ||
    raw.includes("blocked") ||
    raw.includes("suspended") ||
    raw.includes("pending approval") ||
    raw.includes("not approved") ||
    raw.includes("account disabled") ||
    raw.includes("disabled")
  ) {
    return LOGIN_ERROR_SCENARIOS.ACCOUNT_INACTIVE;
  }

  // 5. Driver Account Not Found in Database
  if (
    raw.includes("account not found") ||
    raw.includes("driver account not found") ||
    raw.includes("not registered as a driver") ||
    raw.includes("user not found") ||
    raw.includes("driver not found")
  ) {
    return LOGIN_ERROR_SCENARIOS.ACCOUNT_NOT_FOUND;
  }

  // 6. Incorrect Password / Invalid Credentials
  if (
    raw.includes("invalid password") ||
    raw.includes("invalid login credentials") ||
    raw.includes("invalid credentials") ||
    raw.includes("incorrect email or password") ||
    raw.includes("email or password is incorrect") ||
    raw.includes("invalid_grant") ||
    raw.includes("wrong password")
  ) {
    return LOGIN_ERROR_SCENARIOS.INVALID_CREDENTIALS;
  }

  // 7. Network / Connection Problem / Offline
  if (
    raw.includes("network") ||
    raw.includes("internet") ||
    raw.includes("connection") ||
    raw.includes("offline") ||
    raw.includes("failed to fetch") ||
    raw.includes("network request failed") ||
    raw.includes("econnrefused") ||
    raw.includes("enotfound") ||
    raw.includes("err_internet_disconnected")
  ) {
    return LOGIN_ERROR_SCENARIOS.NETWORK_ERROR;
  }

  // 8. Server Failure (5xx)
  if (
    (typeof status === "number" && status >= 500) ||
    raw.includes("500") ||
    raw.includes("502") ||
    raw.includes("503") ||
    raw.includes("504") ||
    raw.includes("internal server error") ||
    raw.includes("server error") ||
    raw.includes("database error")
  ) {
    return LOGIN_ERROR_SCENARIOS.SERVER_ERROR;
  }

  // 9. Fallback Unexpected Error
  return LOGIN_ERROR_SCENARIOS.UNEXPECTED_ERROR;
}
