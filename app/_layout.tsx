import "react-native-gesture-handler";
import React, { useCallback, useEffect } from "react";
import { Dimensions, StatusBar as RNStatusBar, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { colors } from "@constants/theme";

SplashScreen.hideAsync().catch(() => { });

const win = Dimensions.get("window");
const fallbackInitialMetrics = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: win.width || 360, height: win.height || 800 },
  insets: { top: RNStatusBar.currentHeight || 28, right: 0, bottom: 16, left: 0 },
};

/**
 * Redirects between the (auth) group and the (tabs) group based on session
 * state. This is the single source of truth for "protected routes" — screens
 * never need to check auth themselves.
 */
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    try {
      SplashScreen.hide();
    } catch { }
    SplashScreen.hideAsync().catch(() => { });
    if (isBootstrapping) return;

    const inAuthGroup = segments[0] === "(auth)";

    try {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (isAuthenticated && (inAuthGroup || !segments[0])) {
        router.replace("/(tabs)/dashboard");
      }
    } catch (err) {
      console.warn("Navigation redirect warning:", err);
    }
  }, [isAuthenticated, isBootstrapping, router, segments]);

  return <>{children}</>;
}

function AppShell() {
  return (
    <RouteGuard>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Slot />
      </View>
    </RouteGuard>
  );
}

export default function RootLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    try {
      SplashScreen.hide();
    } catch { }
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  const onLayout = useCallback(() => {
    try {
      SplashScreen.hide();
    } catch { }
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
      <SafeAreaProvider initialMetrics={fallbackInitialMetrics}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
