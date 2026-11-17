import React from "react";
import { Tabs } from "expo-router";
import { colors } from "@constants/theme";
import { BottomNavigation } from "@/components/BottomNavigation";

export default function TabsLayout() {
  return (
    <Tabs
      detachInactiveScreens={false}
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
