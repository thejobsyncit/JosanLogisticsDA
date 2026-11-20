import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { ApiRequestError } from "@/types/api";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/PrimaryButton";
import { LoginErrorModal } from "@/components/LoginErrorModal";
import { MotorcycleLoader } from "@/components/MotorcycleLoader";
import { classifyLoginError, LoginErrorInfo, LOGIN_ERROR_SCENARIOS } from "@/utils/loginError";

const MAX_FAILED_ATTEMPTS_BEFORE_COOLDOWN = 5;
const COOLDOWN_DURATION_SECONDS = 30;

/** Driver Login screen — secure email & password via Supabase Auth */
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  // Rate-limiting / Temporary Cooldown state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unified Error Modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [activeError, setActiveError] = useState<LoginErrorInfo | null>(null);

  // Cooldown countdown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (cooldownSeconds === 0 && failedAttempts >= MAX_FAILED_ATTEMPTS_BEFORE_COOLDOWN) {
      setFailedAttempts(0);
    }
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, [cooldownSeconds, failedAttempts]);

  const validate = () => {
    const errors: Record<string, string> = {};
    const trimmed = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!trimmed) {
      errors.email = "Please enter your driver email address.";
    } else if (!emailPattern.test(trimmed)) {
      errors.email = "Please enter a valid email address (e.g. driver@josanlogistics.com).";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async () => {
    if (submitLockRef.current || submitting) return;

    // Check temporary cooldown lock
    if (cooldownSeconds > 0) {
      setActiveError({
        category: "TOO_MANY_ATTEMPTS",
        title: "Too Many Attempts",
        message: `Too many failed login attempts. Please wait ${cooldownSeconds} seconds before trying again.`,
        canRetry: false,
      });
      setErrorModalVisible(true);
      return;
    }

    if (!validate()) return;

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      // Email is trimmed and lowercased; password is NOT trimmed or altered
      const sanitizedEmail = email.trim().toLowerCase();
      const result = await login({ email: sanitizedEmail, password });

      // Reset failure counter on success
      setFailedAttempts(0);

      if (result.requiresOtp) {
        router.push("/(auth)/otp");
      }
    } catch (err: any) {
      if (err instanceof ApiRequestError && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
      }

      const classified = classifyLoginError(err);
      setActiveError(classified);
      setErrorModalVisible(true);

      // Track failed attempts for client-side cooldown protection
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (classified.category === "TOO_MANY_ATTEMPTS" || nextFailures >= MAX_FAILED_ATTEMPTS_BEFORE_COOLDOWN) {
        setCooldownSeconds(COOLDOWN_DURATION_SECONDS);
      }
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  const handleDismissError = () => {
    setErrorModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.markWrap}>
          <MaterialCommunityIcons name="truck-fast" size={36} color={colors.white} />
        </View>
        <Text style={styles.title}>JOSAN LOGISTICS</Text>
        <Text style={styles.subtitle}>Sign in with your driver email</Text>

        <View style={styles.form}>
          <TextField
            label="Driver Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="driver@josanlogistics.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            error={fieldErrors.email}
            returnKeyType="next"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            error={fieldErrors.password}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            rightAccessory={
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            }
          />

          {/* Animated Motorcycle Delivery Motion Loader */}
          {submitting ? (
            <View style={styles.loaderArea}>
              <MotorcycleLoader text="Signing in..." />
            </View>
          ) : null}

          {/* Cooldown notification */}
          {cooldownSeconds > 0 ? (
            <Text style={styles.cooldownNotice}>
              Please wait {cooldownSeconds}s before attempting to sign in again.
            </Text>
          ) : null}

          <PrimaryButton
            label={cooldownSeconds > 0 ? `Wait (${cooldownSeconds}s)` : "Sign In"}
            onPress={onSubmit}
            disabled={submitting || cooldownSeconds > 0}
            loading={false}
            style={styles.submit}
          />
        </View>

        <Text style={styles.footer}>Having trouble signing in? Contact your dispatch supervisor.</Text>
      </ScrollView>

      {/* Unified Josan Logistics Error Popup System with Retry Support */}
      <LoginErrorModal
        visible={errorModalVisible}
        error={activeError}
        onDismiss={handleDismissError}
        onRetry={onSubmit}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  markWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  form: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  loaderArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  cooldownNotice: {
    fontSize: typography.caption.fontSize,
    color: colors.error,
    textAlign: "center",
    marginVertical: spacing.xs,
  },
  footer: {
    marginTop: spacing.xxl,
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: "center",
  },
});
