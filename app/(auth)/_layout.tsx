import React from "react";
import { View } from "react-native";
import { Slot } from "expo-router";
import { colors } from "@constants/theme";

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Slot />
    </View>
  );
}
