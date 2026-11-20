import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { JOSAN_ORANGE } from "./DeliveryBikeAnimation";
import { SportBikeAnimation } from "./SportBikeAnimation";

interface MotorcycleLoaderProps {
  text?: string;
}

/**
 * Compact sport-bike loader for the login screen.
 */
export function MotorcycleLoader({ text = "Signing in..." }: MotorcycleLoaderProps) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={text}>
      <SportBikeAnimation />

      <Text accessibilityLiveRegion="polite" style={styles.statusText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginVertical: 4,
  },
  statusText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: JOSAN_ORANGE,
    letterSpacing: 0.4,
    textAlign: "center",
  },
});

export default MotorcycleLoader;
