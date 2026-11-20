import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { DeliveryBikeAnimation, JOSAN_ORANGE } from "./DeliveryBikeAnimation";

interface MotorcycleLoaderProps {
  text?: string;
}

/**
 * Compact Motorcycle Loader for Login Screen.
 * Shares the exact same delivery motorcycle animation asset as the splash screen.
 */
export function MotorcycleLoader({ text = "Signing in..." }: MotorcycleLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const textPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    textPulse.start();

    return () => {
      textPulse.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={text}>
      <DeliveryBikeAnimation scale={0.92} showRoad={true} showSpeedLines={true} />

      {/* Subtly Pulsing "Signing in..." Text */}
      <Animated.Text
        style={[
          styles.statusText,
          {
            opacity: pulseAnim,
          },
        ]}
      >
        {text}
      </Animated.Text>
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
