import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colors } from "@constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { AnimatedSplashScreen } from "@/components/AnimatedSplashScreen";
import LoginScreen from "./(auth)/login";
import DashboardScreen from "./(tabs)/dashboard";

/**
 * Root Splash Screen Route.
 * Coordinates the premium logistics-themed motorcycle introduction animation
 * with the background session verification flow.
 */
export default function SplashScreenRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const router = useRouter();

  const [animationReady, setAnimationReady] = useState(false);
  const [transitioned, setTransitioned] = useState(false);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  // Hide Expo's static native splash immediately so our interactive animation takes over
  useEffect(() => {
    try {
      SplashScreen.hide();
    } catch { }
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  // When intro animation is complete AND session bootstrapping has finished, navigate smoothly
  useEffect(() => {
    if (!animationReady || isBootstrapping || transitioned) return;

    setTransitioned(true);

    // Smooth fade out into destination screen
    Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      try {
        if (isAuthenticated) {
          router.replace("/(tabs)/dashboard");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (err) {
        console.warn("Splash navigation redirect warning:", err);
      }
    });
  }, [animationReady, isBootstrapping, isAuthenticated, router, fadeOutAnim, transitioned]);

  // Fallback rendering once transitioned
  if (transitioned) {
    return isAuthenticated ? <DashboardScreen /> : <LoginScreen />;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeOutAnim }]}>
      <AnimatedSplashScreen onAnimationReady={() => setAnimationReady(true)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Warm off-white #FAF8F3
  },
});
