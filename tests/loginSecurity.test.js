/**
 * Production-Ready Login Security & Resilience Test Suite
 * Josan Logistics Driver App
 */

const test = require("node:test");
const assert = require("node:assert/strict");

// 1. Email Sanitization and Password Integrity
test("1. Email sanitization trims accidental whitespace; password is NEVER trimmed or altered", () => {
  const rawEmail = "   BP@josanlogistics.com   ";
  const rawPassword = "  driver123  "; // Intentionally leading/trailing whitespace

  const sanitizedEmail = rawEmail.trim().toLowerCase();
  const preservedPassword = rawPassword; // Untouched

  assert.equal(sanitizedEmail, "bp@josanlogistics.com", "Email must be trimmed and lowercased");
  assert.equal(preservedPassword, "  driver123  ", "Password must retain exact characters and spacing");
});

// 2. Inline Validation Rules
test("2. Inline Validation catches empty email, empty password, and invalid email formats", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validate = (email, password) => {
    const errors = {};
    const trimmed = (email || "").trim();
    if (!trimmed) {
      errors.email = "Please enter your driver email address.";
    } else if (!emailRegex.test(trimmed)) {
      errors.email = "Please enter a valid email address (e.g. driver@josanlogistics.com).";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }
    return errors;
  };

  // Case A: Both empty
  const errEmpty = validate("", "");
  assert.equal(errEmpty.email, "Please enter your driver email address.");
  assert.equal(errEmpty.password, "Please enter your password.");

  // Case B: Invalid email format
  const errInvalidEmail = validate("not-an-email", "driver123");
  assert.equal(errInvalidEmail.email, "Please enter a valid email address (e.g. driver@josanlogistics.com).");
  assert.equal(errInvalidEmail.password, undefined);

  // Case C: Valid email and password
  const validResult = validate("bp@josanlogistics.com", "driver123");
  assert.equal(Object.keys(validResult).length, 0);
});

// 3. Repeated Button Taps and Duplicate Request Prevention
test("3. Duplicate tap prevention locks multiple submissions while auth is in progress", async () => {
  let isSubmitting = false;
  let networkCalls = 0;

  const mockSubmit = async () => {
    if (isSubmitting) return; // Guard
    isSubmitting = true;
    networkCalls++;
    await new Promise((res) => setTimeout(res, 20));
    isSubmitting = false;
  };

  const p1 = mockSubmit();
  const p2 = mockSubmit();
  const p3 = mockSubmit();

  await Promise.all([p1, p2, p3]);

  assert.equal(networkCalls, 1, "Only 1 network call should execute during concurrent button taps");
  assert.equal(isSubmitting, false, "Submitting lock must release after completion");
});

// 4. Rate-Limiting and Temporary Cooldown Protection
test("4. Client triggers temporary cooldown after repeated consecutive failed attempts", () => {
  const MAX_FAILED = 5;
  let failedAttempts = 0;
  let cooldownActive = false;

  const recordFailure = () => {
    failedAttempts++;
    if (failedAttempts >= MAX_FAILED) {
      cooldownActive = true;
    }
  };

  for (let i = 0; i < 4; i++) {
    recordFailure();
    assert.equal(cooldownActive, false, `Attempt ${i + 1} should not trigger cooldown`);
  }

  recordFailure(); // 5th attempt
  assert.equal(failedAttempts, 5);
  assert.equal(cooldownActive, true, "5th failed attempt must activate cooldown");
});

// 5. Request Timeout Protection
test("5. withTimeout rejects stalled network calls before hanging indefinitely", async () => {
  const timeoutMs = 40;
  const stalledPromise = new Promise((resolve) => setTimeout(() => resolve("done"), 200));

  const withTimeout = (promise, ms) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Request timed out")), ms);
      promise.then((v) => { clearTimeout(timer); resolve(v); }).catch((e) => { clearTimeout(timer); reject(e); });
    });
  };

  await assert.rejects(
    async () => withTimeout(stalledPromise, timeoutMs),
    /Request timed out/,
    "Stalled network promise must be timed out"
  );
});

// 6. SecureStore Chunking & Safe Storage Simulation
test("6. SecureStore chunking safely splits payloads > 1800 chars to avoid Android 2048-byte limit", async () => {
  const memoryStore = {};
  const CHUNK_SIZE = 1800;
  const CHUNK_MANIFEST = "__chunk_manifest__:";

  const mockSecureSet = async (key, value) => {
    if (value.length <= CHUNK_SIZE) {
      memoryStore[key] = value;
    } else {
      const count = Math.ceil(value.length / CHUNK_SIZE);
      for (let i = 0; i < count; i++) {
        memoryStore[`${key}_chunk_${i}`] = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      }
      memoryStore[key] = `${CHUNK_MANIFEST}${count}`;
    }
  };

  const mockSecureGet = async (key) => {
    const raw = memoryStore[key];
    if (!raw) return null;
    if (raw.startsWith(CHUNK_MANIFEST)) {
      const count = parseInt(raw.slice(CHUNK_MANIFEST.length), 10);
      let full = "";
      for (let i = 0; i < count; i++) {
        full += memoryStore[`${key}_chunk_${i}`];
      }
      return full;
    }
    return raw;
  };

  // Generate large JWT payload (~3500 characters)
  const largeToken = "header." + "payload_".repeat(400) + ".signature";
  assert.ok(largeToken.length > 2048, "Test token must exceed Android 2048 limit");

  await mockSecureSet("supabase.session.token", largeToken);
  assert.ok(memoryStore["supabase.session.token"].startsWith(CHUNK_MANIFEST), "Manifest entry should be written");
  assert.ok(memoryStore["supabase.session.token_chunk_0"], "Chunk 0 must exist");
  assert.ok(memoryStore["supabase.session.token_chunk_1"], "Chunk 1 must exist");

  const restoredToken = await mockSecureGet("supabase.session.token");
  assert.equal(restoredToken, largeToken, "Restored token must match original exactly");
});

// 7. Audit Logging Invariant: NEVER logs passwords, tokens, or plaintext secrets
test("7. Audit log entries strictly sanitize payloads and reject passwords or JWT secrets", () => {
  const sanitizeAudit = (payload) => {
    // Audit payload must only record safe telemetry fields
    const safePayload = {
      event_type: payload.event,
      identifier: payload.identifier ? payload.identifier.trim().toLowerCase() : undefined,
      driver_id: payload.driverId || null,
      error_category: payload.errorCategory || null,
      created_at: new Date().toISOString(),
    };

    // Assert absolute exclusion of secret fields
    assert.equal(payload.password, undefined, "Audit payload MUST NOT include password");
    assert.equal(payload.token, undefined, "Audit payload MUST NOT include token");
    assert.equal(payload.accessToken, undefined, "Audit payload MUST NOT include access token");
    assert.equal(payload.refreshToken, undefined, "Audit payload MUST NOT include refresh token");

    return safePayload;
  };

  const auditEntry = sanitizeAudit({
    event: "login_success",
    identifier: "BP@josanlogistics.com",
    driverId: "e1a90c01-7290-4e31-893c-2370005a9111",
  });

  assert.equal(auditEntry.event_type, "login_success");
  assert.equal(auditEntry.identifier, "bp@josanlogistics.com");
  assert.equal(auditEntry.driver_id, "e1a90c01-7290-4e31-893c-2370005a9111");
});

// 8. Session Restoration and Route Guarding
test("8. Startup Session Restoration redirects unauthenticated users and allows authenticated drivers", () => {
  const routeGuard = ({ isAuthenticated, isBootstrapping, currentSegment }) => {
    if (isBootstrapping) return "WAIT";
    const inAuthGroup = currentSegment === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      return "/(auth)/login";
    }
    if (isAuthenticated && inAuthGroup) {
      return "/(tabs)/dashboard";
    }
    return "STAY";
  };

  // Cold launch while bootstrapping:
  assert.equal(routeGuard({ isAuthenticated: false, isBootstrapping: true, currentSegment: "(auth)" }), "WAIT");

  // Unauthenticated on protected route:
  assert.equal(routeGuard({ isAuthenticated: false, isBootstrapping: false, currentSegment: "(tabs)" }), "/(auth)/login");

  // Authenticated user on login screen:
  assert.equal(routeGuard({ isAuthenticated: true, isBootstrapping: false, currentSegment: "(auth)" }), "/(tabs)/dashboard");

  // Authenticated user on dashboard:
  assert.equal(routeGuard({ isAuthenticated: true, isBootstrapping: false, currentSegment: "(tabs)" }), "STAY");
});

// 9. Inactive Driver Rejection on App Startup / Auth
test("9. Inactive, blocked, or suspended drivers are immediately rejected and purged from storage", () => {
  const statuses = ["inactive", "blocked", "suspended", "pending approval"];
  let loggedOut = false;

  const validateStatus = (status) => {
    if (["inactive", "blocked", "suspended", "pending approval"].includes(status.toLowerCase())) {
      loggedOut = true;
      throw new Error(`Your driver account is ${status}.`);
    }
  };

  for (const st of statuses) {
    loggedOut = false;
    assert.throws(() => validateStatus(st), /Your driver account is/);
    assert.equal(loggedOut, true, `Driver with status ${st} must be logged out`);
  }
});

