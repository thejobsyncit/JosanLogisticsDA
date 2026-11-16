import "react-native-gesture-handler";
import React, { useCallback, useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

// Ensure the native OS splash screen is dismissed as soon as the JS bundle
// mounts so the branded React Native splash screen (app/index.tsx) is shown
// and the app never freezes on the native placeholder splash screen.
SplashScreen.hideAsync().catch(() => {});

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
    } catch {}
    SplashScreen.hideAsync().catch(() => {});
    if (isBootstrapping) return;
    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === "(auth)";

    try {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace("/(auth)/login");
      } else if (isAuthenticated && inAuthGroup) {
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
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        {/* trip/shipment/pickup/delivery/tracking/pod/earnings/vehicle/schedule/documents/settings/help/exception all
            render their own in-screen <Header> so titles can be dynamic (trip
            reference, etc.) — no native header needed for any of them. */}
        <Stack.Screen name="trip/[id]" />
        <Stack.Screen name="shipment/[id]" />
        <Stack.Screen name="pickup/[id]" />
        <Stack.Screen name="delivery/[id]" />
        <Stack.Screen name="tracking/[id]" />
        <Stack.Screen name="pod/[id]" />
        <Stack.Screen name="delivery-confirmation/[id]" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="earnings" />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="help" />
        <Stack.Screen name="exception/[id]" />
      </Stack>
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
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
