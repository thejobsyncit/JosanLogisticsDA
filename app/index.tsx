import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@constants/theme";
import { useAuth } from "@/hooks/useAuth";

/**
 * Branded splash screen component with fallback navigation redirect.
 */
export default function SplashScreenRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    if (isBootstrapping) return;
    if (isAuthenticated) {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  return (
    <View style={styles.container}>
      <View style={styles.markWrap}>
        <MaterialCommunityIcons name="truck-fast" size={44} color={colors.white} />
      </View>
      <Text style={styles.title}>JOSAN LOGISTICS</Text>
      <Text style={styles.tagline}>Moving Business Forward</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  markWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: colors.white,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: typography.bodySmall.fontSize,
    color: "rgba(255,255,255,0.7)",
  },
});
