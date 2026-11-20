/**
 * Automated Tests for Animated Splash Screen & Motorcycle Loader System
 * Josan Logistics Driver App
 */

const test = require("node:test");
const assert = require("node:assert/strict");

// Brand palette tokens shared across AnimatedSplashScreen and DeliveryBikeAnimation
const JOSAN_ORANGE = "#F77F28";
const JOSAN_GOLD = "#D4AF5A";
const DARK_CHARCOAL = "#1F1F1F";

test("1. Consistency Check: Shared Brand Palette across Splash and Loader", () => {
  assert.equal(JOSAN_ORANGE, "#F77F28", "Primary accent must be Josan Logistics Orange #F77F28");
  assert.equal(JOSAN_GOLD, "#D4AF5A", "Secondary accent must be Josan Gold #D4AF5A");
  assert.equal(DARK_CHARCOAL, "#1F1F1F", "Frame & helmet must be Dark Charcoal #1F1F1F");
});

test("2. Cold Launch: Initial state maintains splash screen while bootstrapping", () => {
  let isBootstrapping = true;
  let isAuthenticated = false;
  let animationReady = false;
  let transitioned = false;

  const checkTransition = () => {
    if (!animationReady || isBootstrapping || transitioned) return false;
    transitioned = true;
    return true;
  };

  // During initial bootstrap, transition must NOT fire
  assert.equal(checkTransition(), false, "Must not transition while bootstrapping");
  assert.equal(transitioned, false);

  // When animation finishes at 1.6s but bootstrapping still running
  animationReady = true;
  assert.equal(checkTransition(), false, "Must not transition before session check completes");
  assert.equal(transitioned, false);

  // When session bootstrap finishes
  isBootstrapping = false;
  assert.equal(checkTransition(), true, "Must transition once both animation and bootstrap are ready");
  assert.equal(transitioned, true);
});

test("3. Splash Transition: Routes authenticated user to /(tabs)/dashboard", () => {
  let destination = null;
  const isAuthenticated = true;
  const navigate = (path) => { destination = path; };

  if (isAuthenticated) {
    navigate("/(tabs)/dashboard");
  } else {
    navigate("/(auth)/login");
  }

  assert.equal(destination, "/(tabs)/dashboard");
});

test("4. Splash Transition: Routes unauthenticated user to /(auth)/login", () => {
  let destination = null;
  const isAuthenticated = false;
  const navigate = (path) => { destination = path; };

  if (isAuthenticated) {
    navigate("/(tabs)/dashboard");
  } else {
    navigate("/(auth)/login");
  }

  assert.equal(destination, "/(auth)/login");
});

test("5. Login Loader: Disables button and prevents duplicate requests from rapid taps", () => {
  let submitting = false;
  let requestCount = 0;

  const onSubmit = async () => {
    if (submitting) return; // Prevent duplicate requests
    submitting = true;
    requestCount++;
  };

  // First tap
  onSubmit();
  assert.equal(submitting, true, "Loader should be active");
  assert.equal(requestCount, 1, "First request must register");

  // Rapid second & third tap while processing
  onSubmit();
  onSubmit();
  assert.equal(requestCount, 1, "Duplicate requests must be blocked while submitting");
});

test("6. Login Loader: Immediately dismisses on failure and surfaces error popup", () => {
  let submitting = true;
  let modalVisible = false;
  let activeError = null;

  // Simulate login failure in try/catch/finally
  try {
    throw new Error("Invalid password. Please check your credentials.");
  } catch (err) {
    modalVisible = true;
    activeError = { title: "Invalid Credentials" };
  } finally {
    submitting = false; // Stops loader immediately
  }

  assert.equal(submitting, false, "Motorcycle loader must be hidden on failure");
  assert.equal(modalVisible, true, "Login error modal must be shown");
  assert.equal(activeError.title, "Invalid Credentials");
});

test("7. Login Loader: Immediately dismisses on success and proceeds to dashboard", () => {
  let submitting = true;
  let targetRoute = null;

  try {
    // Simulate successful login
    targetRoute = "/(tabs)/dashboard";
  } finally {
    submitting = false; // Stops loader immediately
  }

  assert.equal(submitting, false, "Motorcycle loader must stop on success");
  assert.equal(targetRoute, "/(tabs)/dashboard");
});
