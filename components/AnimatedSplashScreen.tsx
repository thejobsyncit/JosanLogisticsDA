import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, typography, spacing } from "@constants/theme";
import { DeliveryBikeAnimation, JOSAN_ORANGE, JOSAN_GOLD } from "./DeliveryBikeAnimation";

interface AnimatedSplashScreenProps {
  onAnimationReady?: () => void;
}

const { width } = Dimensions.get("window");

/**
 * Premium Logistics-Themed Animated Splash Screen.
 *
 * Sequence:
 * 1. Fade & gentle scale-in of the Josan Speed Wings logo badge (0 - 400ms).
 * 2. Delivery motorcycle enters smoothly from left with spinning wheels (200 - 900ms).
 * 3. Continuous wheel rotation, speed lines, suspension bobbing, and road motion.
 * 4. "Josan Logistics" brand name and "Delivering Every Mile" tagline smoothly fade in (500 - 1000ms).
 * 5. Calls `onAnimationReady` at ~1.6s for fluid transition into the app.
 */
export function AnimatedSplashScreen({ onAnimationReady }: AnimatedSplashScreenProps) {
  // 1. Logo entrance: opacity (0 -> 1) & scale (0.85 -> 1.0)
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  // 2. Motorcycle entrance: slide from left (translateX: -120 -> 0) & opacity (0 -> 1)
  const bikeTranslateX = useRef(new Animated.Value(-120)).current;
  const bikeOpacity = useRef(new Animated.Value(0)).current;

  // 3. Branding text entrance: opacity (0 -> 1) & translateY (12 -> 0)
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Coordinated Staggered Entrance Animation
    const entranceSequence = Animated.parallel([
      // Step 1: Logo Badge Fade & Scale
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),

      // Step 2: Motorcycle Glides in smoothly
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(bikeTranslateX, {
            toValue: 0,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bikeOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Step 3: Typography entrance
      Animated.sequence([
        Animated.delay(550),
        Animated.parallel([
          Animated.timing(brandOpacity, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(brandTranslateY, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entranceSequence.start();

    // Signal completion at 1600ms so startup is never delayed unnecessarily
    const timer = setTimeout(() => {
      onAnimationReady?.();
    }, 1600);

    return () => {
      entranceSequence.stop();
      clearTimeout(timer);
    };
  }, [bikeOpacity, bikeTranslateX, brandOpacity, brandTranslateY, logoOpacity, logoScale, onAnimationReady]);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrap}>
        {/* 1. Josan Speed Wings Badge */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.badgeCircle}>
            <Svg width={46} height={34} viewBox="0 0 42 32" fill="none">
              <Path d="M2 18 L 22 4 L 38 4 L 18 18 Z" fill={JOSAN_ORANGE} />
              <Path d="M8 24 L 25 12 L 36 12 L 19 24 Z" fill={JOSAN_GOLD} />
              <Path d="M14 29 L 27 20 L 34 20 L 21 29 Z" fill="#A94F22" />
            </Svg>
          </View>
        </Animated.View>

        {/* 2. Central Animated Delivery Motorcycle */}
        <Animated.View
          style={[
            styles.bikeArea,
            {
              opacity: bikeOpacity,
              transform: [{ translateX: bikeTranslateX }],
            },
          ]}
        >
          <DeliveryBikeAnimation scale={1.22} showRoad={true} showSpeedLines={true} />
        </Animated.View>

        {/* 3. Branding Typography */}
        <Animated.View
          style={[
            styles.brandWrap,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>JOSAN LOGISTICS</Text>
          <View style={styles.taglineWrap}>
            <View style={styles.taglineDash} />
            <Text style={styles.tagline}>Delivering Every Mile</Text>
            <View style={styles.taglineDash} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Clean warm off-white matching login screen
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    marginBottom: spacing.md,
    alignItems: "center",
  },
  badgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(247, 127, 40, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(247, 127, 40, 0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  bikeArea: {
    width: 270,
    height: 125,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  brandWrap: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 2,
    textAlign: "center",
  },
  taglineWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  taglineDash: {
    width: 14,
    height: 1.5,
    backgroundColor: JOSAN_GOLD,
    borderRadius: 1,
  },
  tagline: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "500",
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
});

export default AnimatedSplashScreen;

