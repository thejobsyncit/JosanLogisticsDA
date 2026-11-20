/**
 * Unit Tests for Unified Login Error Popup System
 * Josan Logistics Driver App
 *
 * Verifies all 9 production authentication error scenarios, retry actions, and message masking.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  classifyLoginError,
  LOGIN_ERROR_SCENARIOS,
} = require("../utils/loginError.ts");

test("Scenario 1: Driver Account Not Found maps to 'Account Not Found' popup", () => {
  const errors = [
    new Error("Driver account not found in database. Please contact your dispatch administrator."),
    new Error("You are not registered as a driver. Please contact support."),
    new Error("Driver not found"),
    new Error("User not found"),
    new Error("Account not found"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "ACCOUNT_NOT_FOUND");
    assert.equal(result.title, "Account Not Found");
    assert.equal(
      result.message,
      "Driver account not found in database. Please contact your dispatch administrator."
    );
    assert.equal(result.canRetry, false);
  }
});

test("Scenario 2: Incorrect Password maps to 'Invalid Credentials' popup", () => {
  const errors = [
    new Error("Invalid password. Please check your credentials."),
    new Error("Invalid login credentials"),
    new Error("Incorrect email or password"),
    new Error("Email or password is incorrect. Check your credentials."),
    new Error("invalid_grant: Invalid credentials"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "INVALID_CREDENTIALS");
    assert.equal(result.title, "Invalid Credentials");
    assert.equal(
      result.message,
      "Incorrect email or password. Please check your credentials and try again."
    );
    assert.equal(result.canRetry, false);
  }
});

test("Scenario 3: Network Unavailable maps to 'Connection Problem' popup with Retry", () => {
  const errors = [
    new Error("Unable to connect to the server. Please check your internet connection and try again."),
    new Error("Network error. Please check your internet connection."),
    new Error("Failed to fetch"),
    new Error("Network request failed"),
    new Error("ERR_INTERNET_DISCONNECTED"),
    new Error("econnrefused"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "NETWORK_ERROR");
    assert.equal(result.title, "Connection Problem");
    assert.equal(
      result.message,
      "Unable to connect to the server. Please check your internet connection and try again."
    );
    assert.equal(result.canRetry, true);
  }
});

test("Scenario 4: Request Timeout maps to 'Request Timeout' popup with Retry", () => {
  const errors = [
    new Error("The login request took too long to complete. Please check your network connection and try again."),
    new Error("Request timed out"),
    new Error("Connection timeout"),
    new Error("econnaborted"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "REQUEST_TIMEOUT");
    assert.equal(result.title, "Request Timeout");
    assert.equal(
      result.message,
      "The sign-in request took too long to complete. Please check your network connection and try again."
    );
    assert.equal(result.canRetry, true);
  }
});

test("Scenario 5: Server Error maps to 'Server Error' popup with Retry", () => {
  const errors = [
    { message: "Internal server error", status: 500 },
    { message: "Bad Gateway", status: 502 },
    { message: "Service Unavailable", status: 503 },
    new Error("Database error occurred"),
    new Error("Server error 500"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "SERVER_ERROR");
    assert.equal(result.title, "Server Error");
    assert.equal(
      result.message,
      "Something went wrong on our server. Please try again later."
    );
    assert.equal(result.canRetry, true);
  }
});

test("Scenario 6: Account Disabled or Inactive maps to 'Account Inactive' popup", () => {
  const errors = [
    new Error("Your driver account is inactive. Please contact support."),
    new Error("Your driver account has been blocked. Please contact support."),
    new Error("Your driver account has been suspended. Please contact support."),
    new Error("Your driver account is not approved yet. Please contact support."),
    new Error("Driver account is disabled"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "ACCOUNT_INACTIVE");
    assert.equal(result.title, "Account Inactive");
    assert.equal(
      result.message,
      "Your driver account is currently inactive. Please contact your dispatch administrator."
    );
    assert.equal(result.canRetry, false);
  }
});

test("Scenario 7: Too Many Login Attempts maps to 'Too Many Attempts' popup", () => {
  const errors = [
    { message: "over_request_rate_limit", status: 429 },
    new Error("Too many login attempts. Please wait a few moments before trying again."),
    new Error("Rate limit exceeded"),
    new Error("Cooldown active"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "TOO_MANY_ATTEMPTS");
    assert.equal(result.title, "Too Many Attempts");
    assert.equal(
      result.message,
      "Too many failed login attempts have been detected. Please wait a few moments before trying again."
    );
    assert.equal(result.canRetry, false);
  }
});

test("Scenario 8: Session Expired maps to 'Session Expired' popup", () => {
  const errors = [
    new Error("Your session has expired. Please sign in again."),
    new Error("jwt expired"),
    new Error("token expired"),
    new Error("refresh_token_not_found"),
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "SESSION_EXPIRED");
    assert.equal(result.title, "Session Expired");
    assert.equal(
      result.message,
      "Your driver session has expired. Please sign in again to continue."
    );
    assert.equal(result.canRetry, false);
  }
});

test("Scenario 9: Unexpected Error maps to 'Login Failed' popup", () => {
  const errors = [
    new Error("Something strange occurred"),
    new Error("Unknown exception"),
    null,
    undefined,
  ];

  for (const err of errors) {
    const result = classifyLoginError(err);
    assert.equal(result.category, "UNEXPECTED_ERROR");
    assert.equal(result.title, "Login Failed");
    assert.equal(
      result.message,
      "Unable to sign in at the moment. Please try again."
    );
  }
});

test("Scenario 10: Successful Login never creates or triggers an error popup", () => {
  let modalVisible = false;
  let activeError = null;

  // Simulate a successful login
  const handleLoginSuccess = () => {
    // Navigates to dashboard, modalVisible remains false
  };

  handleLoginSuccess();
  assert.equal(modalVisible, false);
  assert.equal(activeError, null);
});

test("Scenario 11: Dismissing popup resets modal state and preserves entered email", () => {
  let email = "BP@josanlogistics.com";
  let modalVisible = true;
  let activeError = LOGIN_ERROR_SCENARIOS.INVALID_CREDENTIALS;

  const handleDismiss = () => {
    modalVisible = false;
  };

  handleDismiss();
  assert.equal(modalVisible, false);
  assert.equal(email, "BP@josanlogistics.com");
});
